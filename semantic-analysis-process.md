# Semantic Analysis Process — ClassiFi

This document explains the end-to-end process of **semantic analysis** in ClassiFi, powered by a fine-tuned **GraphCodeBERT** model. Semantic analysis complements the structural analysis (Winnowing) by understanding the _meaning_ of code rather than its textual structure.

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SEMANTIC ANALYSIS PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ TRIGGER  │───>│ BACKEND (Node.js)│───>│ SEMANTIC SERVICE (Python)    │   │
│  │          │    │ Plagiarism Module │    │ GraphCodeBERT Inference      │   │
│  └──────────┘    └────────┬─────────┘    └──────────────┬───────────────┘   │
│                           │                             │                   │
│                           │  HTTP POST /similarity      │                   │
│                           │  { code1, code2 }           │                   │
│                           │ ─────────────────────────>  │                   │
│                           │                             │                   │
│                           │  { score: 0.0–1.0 }        │                   │
│                           │ <─────────────────────────  │                   │
│                           │                             │                   │
│                  ┌────────▼─────────┐                                       │
│                  │  HYBRID SCORING  │                                       │
│                  │  70% structural  │                                       │
│                  │  30% semantic    │                                       │
│                  └────────┬─────────┘                                       │
│                           │                                                 │
│                  ┌────────▼─────────┐                                       │
│                  │   PERSIST TO DB  │                                       │
│                  │ similarity_results│                                       │
│                  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Process

### Step 1 — Trigger

Semantic analysis is triggered as part of the larger plagiarism analysis pipeline. It can be triggered in two ways:

| Trigger | How |
|---|---|
| **Manual** | Teacher clicks "Analyze" → `POST /api/v1/plagiarism/analyze/assignment/:assignmentId` |
| **Automatic** | After a new submission, a 45-second debounce timer fires, and the auto-analysis service invokes the same pipeline |

The entry point in the backend is:

```
PlagiarismController → PlagiarismService.analyzeAssignmentSubmissions()
```

### Step 2 — Structural Analysis Runs First

Before semantic analysis begins, the **structural analysis** (Winnowing) runs and produces:
- A list of submission **pairs** (every unique combination of two submissions)
- A **structural similarity score** for each pair (token-overlap-based)

This is important because semantic analysis operates on the **same pairs** that structural analysis produced.

### Step 3 — Compute Semantic Scores (Backend)

The backend's `PlagiarismService.computeSemanticScores()` takes the pairs and sends them to the semantic service.

```
┌─────────────────────────────────────────────────────────────┐
│  PlagiarismService.computeSemanticScores(pairs, language)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CHECK LANGUAGE                                          │
│     └─ If language ≠ "python" → return empty scores         │
│        (GraphCodeBERT is only trained on Python)            │
│                                                             │
│  2. BUILD REQUEST QUEUE                                     │
│     └─ For each pair, extract:                              │
│        • key: "{submission1Id}-{submission2Id}"              │
│        • leftContent: raw source code of submission 1       │
│        • rightContent: raw source code of submission 2      │
│                                                             │
│  3. CONCURRENT PROCESSING (Worker Pool)                     │
│     └─ Max concurrent requests: 2 (configurable)            │
│     └─ Each worker picks the next pair from the queue       │
│     └─ Calls SemanticSimilarityClient.getSemanticScore()    │
│                                                             │
│  4. RETURN Map<pairKey, score>                              │
└─────────────────────────────────────────────────────────────┘
```

**Key detail**: Non-Python submissions skip semantic analysis entirely — they get a semantic score of `0`.

### Step 4 — HTTP Request to Semantic Service

The `SemanticSimilarityClient` makes a resilient HTTP call to the Python-based semantic service:

```
┌───────────────────────────────────────────────────────────────┐
│  SemanticSimilarityClient.getSemanticScore(code1, code2)      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  POST http://localhost:8002/similarity                         │
│  Body: { "code1": "<source code>", "code2": "<source code>" } │
│  Timeout: 10 seconds                                          │
│                                                               │
│  RETRY POLICY:                                                │
│  ├─ Max retries: 1 (so up to 2 total attempts)               │
│  ├─ Retryable: HTTP 408, 429, 5xx                            │
│  └─ Non-retryable: 4xx (except 408/429)                      │
│                                                               │
│  FALLBACK:                                                    │
│  └─ On ANY failure (timeout, error, invalid response) → 0.0  │
│     Semantic failure NEVER blocks the analysis pipeline.      │
│                                                               │
│  RESPONSE: { "score": 0.8234 }                                │
│  └─ Clamped to [0.0, 1.0]                                    │
└───────────────────────────────────────────────────────────────┘
```

### Step 5 — GraphCodeBERT Inference (Semantic Service)

This is the core of semantic analysis. The Python service (`semantic-service/`) receives the code pair and runs GraphCodeBERT inference:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Predictor.compute_similarity(code1, code2)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  STEP A — Encode Code 1                                     │     │
│  │  ┌──────────┐    ┌──────────────┐    ┌───────────────────┐  │     │
│  │  │ Raw Code │───>│ Tokenizer    │───>│ GraphCodeBERT     │  │     │
│  │  │ (Python) │    │ (RoBERTa)    │    │ Encoder           │  │     │
│  │  └──────────┘    │ max 512 tok  │    │ (12 layers)       │  │     │
│  │                  └──────────────┘    └───────┬───────────┘  │     │
│  │                                              │              │     │
│  │                                     CLS token embedding     │     │
│  │                                     [1 × 768] = vec1       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  STEP B — Encode Code 2                                     │     │
│  │  (Same process as above)                                    │     │
│  │                                     CLS token embedding     │     │
│  │                                     [1 × 768] = vec2       │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  STEP C — Cosine Similarity                                 │     │
│  │                                                             │     │
│  │  score = cosine_similarity(vec1, vec2)                      │     │
│  │        = (vec1 · vec2) / (‖vec1‖ × ‖vec2‖)                 │     │
│  │                                                             │     │
│  │  Clamp: max(0.0, score)  →  negative values become 0.0     │     │
│  │  Round: 4 decimal places →  e.g. 0.8234                    │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  RETURN: 0.8234                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### How GraphCodeBERT Understands Code

GraphCodeBERT is a **pre-trained model by Microsoft** specifically designed for code understanding. Unlike simple text similarity, it:

1. **Understands code semantics** — It was pre-trained on code + data flow graphs, so it understands variable dependencies, control flow patterns, and code structure beyond raw text
2. **Fine-tuned for plagiarism detection** — The model was further trained on the Karnalim dataset of known plagiarism cases using Python code pairs
3. **Produces embeddings** — Each code snippet is condensed into a 768-dimensional vector that captures its semantic meaning

| Property | Value |
|---|---|
| Base model | `microsoft/graphcodebert-base` |
| Architecture | RoBERTa (12 layers, 768 hidden, 12 heads) |
| Tokenizer | RoBERTa BPE tokenizer |
| Max tokens per snippet | 512 |
| Embedding size | 768 dimensions |
| Fine-tuning dataset | Karnalim plagiarism dataset |
| Similarity metric | Cosine similarity |
| Output range | [0.0, 1.0] |

### Step 6 — Hybrid Score Calculation (Backend)

Once the backend receives the semantic score, it combines it with the structural score:

```
┌─────────────────────────────────────────────────────────────┐
│  calculateHybridSimilarityScore(structural, semantic)        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  hybridScore = (0.70 × structuralScore)                     │
│              + (0.30 × semanticScore)                        │
│                                                             │
│  Clamped to [0.0, 1.0]                                      │
│                                                             │
│  Example:                                                   │
│  ├─ Structural (Winnowing): 0.85                             │
│  ├─ Semantic (GCBERT):     0.72                             │
│  └─ Hybrid: (0.7 × 0.85) + (0.3 × 0.72) = 0.811           │
│                                                             │
│  FLAGGING:                                                  │
│  └─ If hybridScore ≥ 0.50 → isSuspicious = true            │
└─────────────────────────────────────────────────────────────┘
```

**Why 70/30?** Structural analysis (Winnowing) is more reliable for detecting direct copy-paste and token-level matches. Semantic analysis catches cases where code is _rewritten_ but functionally identical — padding with a lighter weight prevents false positives from the ML model.

### Step 7 — Database Persistence

All three scores are persisted in the `similarity_results` table:

```
┌─────────────────────────────────────────────────────────────┐
│  similarity_results table                                    │
├──────────────────┬──────────┬────────────────────────────────┤
│ Column           │ Type     │ Description                    │
├──────────────────┼──────────┼────────────────────────────────┤
│ id               │ serial   │ Primary key                    │
│ report_id        │ integer  │ FK → similarity_reports        │
│ submission1_id   │ integer  │ FK → submissions (lower ID)    │
│ submission2_id   │ integer  │ FK → submissions (higher ID)   │
│ structural_score │ numeric  │ Structural token-overlap score │
│ semantic_score   │ numeric  │ GraphCodeBERT cosine score     │
│ hybrid_score     │ numeric  │ Weighted combination           │
│ is_flagged       │ boolean  │ true if hybrid ≥ 0.50          │
│ overlap          │ integer  │ Total overlapping tokens       │
│ longest_fragment │ integer  │ Longest contiguous match       │
│ analyzed_at      │ timestamp│ When analysis was performed    │
└──────────────────┴──────────┴────────────────────────────────┘
```

### Step 8 — Frontend Display

The frontend fetches and displays all three scores for each submission pair, allowing teachers to see:
- **Structural score** — How similar the code looks at a token level
- **Semantic score** — How similar the code is _in meaning_ (ML-based)
- **Hybrid score** — The combined verdict used for flagging

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                              │
│  ┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │ Teacher clicks   │  │ PlagiarismService    │  │ Result Display    │  │
│  │ "Analyze"        │──│ .analyzeAssignment() │──│ structural_score  │  │
│  │                  │  │                      │  │ semantic_score    │  │
│  │                  │  │                      │  │ hybrid_score      │  │
│  └─────────────────┘  └──────────┬───────────┘  └───────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │ POST /api/v1/plagiarism/analyze/
                                   │      assignment/:id
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js / Fastify)                        │
│                                                                         │
│  ┌────────────────────────┐                                             │
│  │ PlagiarismController   │                                             │
│  └───────────┬────────────┘                                             │
│              ▼                                                          │
│  ┌────────────────────────┐    ┌─────────────────────────────────┐      │
│  │ PlagiarismService      │    │ Auto-Analysis Service           │      │
│  │                        │    │ (debounce 45s, reconcile 3min)  │      │
│  │ 1. Run Winnowing       │    └─────────────────────────────────┘      │
│  │ 2. computeSemanticScr. │                                             │
│  │ 3. calculateHybrid()   │                                             │
│  │ 4. persistReport()     │                                             │
│  └───────────┬────────────┘                                             │
│              │                                                          │
│  ┌───────────▼────────────┐    ┌─────────────────────────────────┐      │
│  │ SemanticSimilarity     │───>│ POST http://localhost:8002      │      │
│  │ Client                 │<───│      /similarity                │      │
│  │ (retry, timeout,       │    │                                 │      │
│  │  fallback to 0)        │    │ Body: { code1, code2 }         │      │
│  └────────────────────────┘    │ Resp: { score: 0.8234 }        │      │
│                                └─────────────────────────────────┘      │
│              │                                                          │
│  ┌───────────▼────────────┐                                             │
│  │ PlagiarismPersistence  │                                             │
│  │ Service                │                                             │
│  │ → INSERT INTO          │                                             │
│  │   similarity_results   │                                             │
│  └────────────────────────┘                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │  HTTP POST /similarity
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SEMANTIC SERVICE (Python / FastAPI)                    │
│                                                                         │
│  ┌────────────────────────┐                                             │
│  │ /similarity endpoint   │                                             │
│  └───────────┬────────────┘                                             │
│              ▼                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ Predictor.compute_similarity(code1, code2)                     │     │
│  │                                                                │     │
│  │  code1 ──> Tokenize ──> GraphCodeBERT Encoder ──> vec1 (768d) │     │
│  │  code2 ──> Tokenize ──> GraphCodeBERT Encoder ──> vec2 (768d) │     │
│  │                                                                │     │
│  │  score = cosine_similarity(vec1, vec2)                         │     │
│  │  return clamp(score, 0.0, 1.0)                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  Model: microsoft/graphcodebert-base (fine-tuned on Karnalim dataset)   │
│  Runtime: CPU-only PyTorch, single Uvicorn worker                       │
│  Docker: python:3.11-slim with pre-cached tokenizer                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Differences: Structural vs. Semantic Analysis

| Aspect | Structural (Winnowing) | Semantic (GraphCodeBERT) |
|---|---|---|
| **What it detects** | Token-level overlap, copy-paste, renamed variables | _Meaning_-level similarity, rewritten code |
| **How it works** | Tokenize → suffix tree matching → overlap ratio | Encode → embedding space → cosine distance |
| **Strengths** | Fast, reliable for direct copying | Catches paraphrased/restructured plagiarism |
| **Weaknesses** | Fooled by rewriting/restructuring | May false-positive on coincidentally similar logic |
| **Language support** | Multiple (Python, Java, C, etc.) | Python only (model limitation) |
| **Weight in hybrid** | 70% | 30% |
| **Failure impact** | Blocks analysis | Graceful fallback to 0 (never blocks) |

---

## Configuration Reference

| Environment Variable | Default | Purpose |
|---|---|---|
| `SEMANTIC_SERVICE_URL` | `http://localhost:8002` | URL of the Python semantic service |
| `SEMANTIC_SIMILARITY_TIMEOUT_MS` | `10000` | Request timeout per pair |
| `SEMANTIC_SIMILARITY_MAX_RETRIES` | `1` | Max retry attempts on failure |
| `SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS` | `2` | Parallel requests to semantic service |
| `PLAGIARISM_STRUCTURAL_WEIGHT` | `0.7` | Structural score weight in hybrid |
| `PLAGIARISM_SEMANTIC_WEIGHT` | `0.3` | Semantic score weight in hybrid |
| `PLAGIARISM_HYBRID_THRESHOLD` | `0.5` | Threshold for flagging as suspicious |

---

## Summary

1. **Trigger** → Manual or auto (45s debounce after submission)
2. **Structural first** → Structural analysis (Winnowing) runs and produces pairs with structural scores
3. **Semantic scoring** → Backend sends each pair's source code to the Python semantic service via HTTP
4. **GraphCodeBERT inference** → Each snippet is tokenized (max 512 tokens), encoded to a 768-dim vector, and cosine similarity is computed between the two vectors
5. **Hybrid combination** → `0.70 × structural + 0.30 × semantic`, flagged if ≥ 0.50
6. **Persist** → All three scores stored in `similarity_results` table
7. **Display** → Frontend shows structural, semantic, and hybrid scores to the teacher
