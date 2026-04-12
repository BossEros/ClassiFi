/**
 * Structural Analysis Evaluation on *Real* Type 1/2 Clone Pairs
 * (Extracted from CodeXGLUE BigCloneBench — Java functions only)
 *
 * Clone pairs are classified as T1/T2 by normalized token similarity,
 * using the same method BigCloneBench uses internally:
 *   - T1: sequence_similarity(t1_norm(f1), t1_norm(f2)) >= 0.90
 *   - T2: sequence_similarity(t2_norm(f1), t2_norm(f2)) >= 0.90
 *
 * Usage (from backend-ts/):
 *   npx vitest run tests/evaluate-real-t12.test.ts --no-coverage --reporter=verbose
 */

import { describe, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPT_DIR = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const FUNCTIONS_FILE = path.join(RESULT_DIR, "real_t12_dataset.jsonl")
const PAIRS_FILE     = path.join(RESULT_DIR, "real_t12_test.txt")

// ── Types ─────────────────────────────────────────────────────────────────────

interface FunctionEntry { idx: string; func: string }
interface PairEntry { id1: string; id2: string; label: number; cloneType: string }
interface PredictionResult { id1: string; id2: string; label: number; score: number; cloneType: string }

interface ClassificationMetrics {
  threshold: number; accuracy: number; precision: number; recall: number
  f1Score: number; tp: number; fp: number; tn: number; fn: number
}

// ── Data Loading ──────────────────────────────────────────────────────────────

function loadFunctions(): Map<string, FunctionEntry> {
  const raw = fs.readFileSync(FUNCTIONS_FILE, "utf-8")
  const map = new Map<string, FunctionEntry>()
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    const obj = JSON.parse(line)
    map.set(String(obj.idx), { idx: String(obj.idx), func: obj.func })
  }
  return map
}

function loadPairs(): PairEntry[] {
  const raw = fs.readFileSync(PAIRS_FILE, "utf-8")
  const pairs: PairEntry[] = []
  for (const line of raw.split("\n")) {
    const parts = line.trim().split(/\t/)
    if (parts.length < 4) continue
    pairs.push({ id1: parts[0], id2: parts[1], label: parseInt(parts[2], 10), cloneType: parts[3] })
  }
  return pairs
}

/** Self-comparison pairs (id1 === id2) are valid T1 clones (literally identical source).
 *  We track them separately so the paper can report both inclusive and exclusive metrics. */
function isSelfPair(pair: PairEntry): boolean { return pair.id1 === pair.id2 }

// ── Metrics ───────────────────────────────────────────────────────────────────

function classifyAtThreshold(predictions: PredictionResult[], threshold: number): ClassificationMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0
  for (const p of predictions) {
    const predicted = p.score >= threshold ? 1 : 0
    if (predicted === 1 && p.label === 1) tp++
    else if (predicted === 1 && p.label === 0) fp++
    else if (predicted === 0 && p.label === 0) tn++
    else fn++
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall    = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score   = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
  const accuracy  = (tp + tn) / predictions.length
  return { threshold, accuracy, precision, recall, f1Score, tp, fp, tn, fn }
}

function findBestThreshold(predictions: PredictionResult[]): ClassificationMetrics {
  const scores = [...new Set(predictions.map(p => p.score))].sort((a, b) => a - b)
  let best: ClassificationMetrics | null = null
  for (const t of scores) {
    const m = classifyAtThreshold(predictions, t)
    if (!best || m.f1Score > best.f1Score) best = m
  }
  return best ?? classifyAtThreshold(predictions, 0.5)
}

function computeRocAuc(predictions: PredictionResult[]): number {
  const sorted = [...predictions].sort((a, b) => b.score - a.score)
  const positives = predictions.filter(p => p.label === 1).length
  const negatives = predictions.length - positives
  if (positives === 0 || negatives === 0) return 0.5
  let truePos = 0, auc = 0
  for (const p of sorted) {
    if (p.label === 1) truePos++
    else auc += truePos   // count positive-negative pairs where positive has higher score
  }
  return auc / (positives * negatives)
}

function pct(n: number) { return (n * 100).toFixed(2) + "%" }

// ── Core evaluation ───────────────────────────────────────────────────────────

async function computeSimilarity(code1: string, code2: string, k: number, w: number): Promise<number> {
  const detector = new PlagiarismDetector({
    language: "java",
    kgramLength: k,
    kgramsInWindow: w,
    minFragmentLength: 2,
  })
  const file1 = new File("CodeA.java", code1)
  const file2 = new File("CodeB.java", code2)
  const report = await detector.analyze([file1, file2])
  const pairs = report.getPairs()
  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

interface Config { k: number; w: number; label: string }

async function evaluatePairs(
  pairs: PairEntry[],
  functionMap: Map<string, FunctionEntry>,
  config: Config
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = []
  let done = 0
  let errors = 0

  for (const pair of pairs) {
    const f1 = functionMap.get(pair.id1)
    const f2 = functionMap.get(pair.id2)
    if (!f1 || !f2) { done++; continue }

    try {
      const score = await computeSimilarity(f1.func, f2.func, config.k, config.w)
      results.push({ id1: pair.id1, id2: pair.id2, label: pair.label, score, cloneType: pair.cloneType })
    } catch {
      errors++
      results.push({ id1: pair.id1, id2: pair.id2, label: pair.label, score: 0, cloneType: pair.cloneType })
    }

    done++
    if (done % 200 === 0) {
      process.stdout.write(`\r    ${done}/${pairs.length} (${errors} errors)`)
    }
  }
  process.stdout.write(`\r    ${done}/${pairs.length} (${errors} errors)\n`)
  return results
}

function printMetrics(label: string, predictions: PredictionResult[]): void {
  if (predictions.length === 0) { console.log(`  ${label}: No pairs`); return }
  const m = findBestThreshold(predictions)
  const auc = computeRocAuc(predictions)
  console.log(`\n  ${label}:`)
  console.log(`    Best Threshold: ${m.threshold.toFixed(2)}`)
  console.log(`    Accuracy:  ${pct(m.accuracy)}`)
  console.log(`    Precision: ${pct(m.precision)}`)
  console.log(`    Recall:    ${pct(m.recall)}`)
  console.log(`    F1-Score:  ${pct(m.f1Score)}`)
  console.log(`    ROC-AUC:   ${auc.toFixed(4)}`)
  console.log(`    TP/FP/TN/FN: ${m.tp}/${m.fp}/${m.tn}/${m.fn}`)
}

function scoreDistribution(scores: number[], label: string): void {
  if (scores.length === 0) return
  const sorted = [...scores].sort((a, b) => a - b)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const p25 = sorted[Math.floor(sorted.length * 0.25)]
  const p75 = sorted[Math.floor(sorted.length * 0.75)]
  console.log(`    ${label}: mean=${mean.toFixed(4)}, median=${median.toFixed(4)}, min=${sorted[0].toFixed(4)}, max=${sorted[sorted.length-1].toFixed(4)}, P25=${p25.toFixed(4)}, P75=${p75.toFixed(4)}`)
}

// ── Test ──────────────────────────────────────────────────────────────────────

describe("Real Type 1/2 Clone Evaluation (CodeXGLUE BigCloneBench)", () => {
  it("evaluates Winnowing on real T1/T2 clone pairs from BigCloneBench", async () => {
    const functionMap = loadFunctions()
    const pairs       = loadPairs()

    const t1Pairs     = pairs.filter(p => p.cloneType === "T1")
    const t2Pairs     = pairs.filter(p => p.cloneType === "T2")
    const nonPairs    = pairs.filter(p => p.cloneType === "NON")
    const selfPairCount = pairs.filter(isSelfPair).length

    console.log("\n" + "═".repeat(70))
    console.log("  STRUCTURAL ANALYSIS — REAL T1/T2 CLONE EVALUATION")
    console.log("  Source: CodeXGLUE BigCloneBench (Java)")
    console.log("═".repeat(70))
    console.log(`  Functions loaded: ${functionMap.size}`)
    console.log(`  Total pairs:       ${pairs.length}`)
    console.log(`    T1 clone pairs:  ${t1Pairs.length} (self-comparisons: ${t1Pairs.filter(isSelfPair).length})`)
    console.log(`    T2 clone pairs:  ${t2Pairs.length} (self-comparisons: ${t2Pairs.filter(isSelfPair).length})`)
    console.log(`    Non-clone pairs: ${nonPairs.length}`)
    console.log(`  NOTE: Self-comparison pairs (id1==id2) are truly identical files (valid T1 clones).`)
    console.log(`        Results reported both inclusive and exclusive of self-pairs.`)

    const configs: Config[] = [
      { k: 13, w: 10, label: "k=13, w=10 (Best Sweep)" },
      { k: 23, w: 17, label: "k=23, w=17 (Production)" },
    ]

    const allConfigResults: Record<string, PredictionResult[]> = {}

    for (const config of configs) {
      console.log("\n" + "─".repeat(70))
      console.log(`  CONFIG: ${config.label}`)
      console.log("─".repeat(70))

      const predictions = await evaluatePairs(pairs, functionMap, config)
      allConfigResults[config.label] = predictions

      const t1Preds  = predictions.filter(p => p.cloneType === "T1")
      const t2Preds  = predictions.filter(p => p.cloneType === "T2")
      const nonPreds = predictions.filter(p => p.cloneType === "NON")

      // Distinct-only: exclude self-comparison pairs from clone sets
      const t1Distinct  = t1Preds.filter(p => p.id1 !== p.id2)
      const t2Distinct  = t2Preds.filter(p => p.id1 !== p.id2)

      // Overall (T1 + T2 vs NON)
      const overallPreds = [...t1Preds, ...t2Preds, ...nonPreds]
      const overallDistinct = [...t1Distinct, ...t2Distinct, ...nonPreds]

      printMetrics("OVERALL — ALL (T1+T2 vs NON)", overallPreds)
      printMetrics("OVERALL — DISTINCT ONLY (excludes self-pairs)", overallDistinct)
      printMetrics("TYPE 1 — ALL (incl. identical sources)", [...t1Preds, ...nonPreds])
      printMetrics("TYPE 1 — DISTINCT (near-identical, not exact copy)", [...t1Distinct, ...nonPreds])
      printMetrics("TYPE 2 — ALL", [...t2Preds, ...nonPreds])
      printMetrics("TYPE 2 — DISTINCT", [...t2Distinct, ...nonPreds])

      console.log("\n  Score distributions:")
      scoreDistribution(t1Preds.map(p => p.score),  "T1 clones")
      scoreDistribution(t2Preds.map(p => p.score),  "T2 clones")
      scoreDistribution(nonPreds.map(p => p.score), "Non-clones")
    }

    // Save results
    fs.mkdirSync(RESULT_DIR, { recursive: true })
    const outputPath = path.join(RESULT_DIR, "real-t12-evaluation-results.json")
    fs.writeFileSync(outputPath, JSON.stringify({ configs: allConfigResults }, null, 2))
    console.log(`\n  Results saved to: ${outputPath}`)
  }, 600_000)
})
