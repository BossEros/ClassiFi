/**
 * Python Plagiarism Dataset Evaluation Script — Structural, Semantic & Hybrid
 *
 * Evaluates all three ClassiFi analysis modes against the Kaggle Python
 * plagiarism dataset (Khani, 2024) — 174 student submissions with 293
 * labeled pairs (100 positive, 193 negative).
 *
 * Dataset source: https://www.kaggle.com/datasets/ehsankhani/student-code-similarity-and-plagiarism-labels
 * GitHub mirror:  https://github.com/ehsankhani/cheating_detector
 *
 * Scoring modes:
 *   Structural  — Winnowing fingerprinting (k=23, w=17)
 *   Semantic    — GraphCodeBERT cosine similarity (via VPS HTTP)
 *   Hybrid      — Weighted combination (structural=0.7, semantic=0.3)
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/evaluate-python-dataset.ts
 *
 * Prerequisites:
 *   Dataset must be cloned at:
 *   backend-ts/evaluation-results/python-plagiarism-dataset/
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"
import { computeRankingMetricsAtK, type RankingMetricsAtK } from "./shared/ranking-metrics.js"

// -- Constants -----------------------------------------------------------------

const PRODUCTION_K = 23
const PRODUCTION_W = 17
const STRUCTURAL_WEIGHT = 0.7
const SEMANTIC_WEIGHT = 0.3
const SEMANTIC_SERVICE_URL = "http://159.65.128.153:8002"
const SEMANTIC_CONCURRENCY_LIMIT = 2
const SEMANTIC_TIMEOUT_MS = 10_000

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const DATASET_DIR = path.join(RESULT_DIR, "python-plagiarism-dataset", "DataSet")
const CSV_FILE = path.join(DATASET_DIR, "cheating_dataset.csv")
const OUTPUT_FILE = path.join(RESULT_DIR, "python-evaluation-results.json")

// -- Types ---------------------------------------------------------------------

type ScoreMode = "structural" | "semantic" | "hybrid"

interface LabeledPair {
  file1: string
  file2: string
  label: 0 | 1
}

interface PairResult {
  file1: string
  file2: string
  label: 0 | 1
  structuralScore: number
  semanticScore: number
  hybridScore: number
}

interface ClassificationMetrics {
  threshold: number
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  tp: number
  fp: number
  tn: number
  fn: number
}

interface ModeEvaluationSummary {
  rocAuc: number
  bestThresholdMetrics: ClassificationMetrics
  precisionAt5: RankingMetricsAtK
  recallAt10: RankingMetricsAtK
}

// -- Semaphore (limit concurrent HTTP calls to the semantic VPS) ---------------

class Semaphore {
  private available: number
  private readonly queue: Array<() => void> = []

  constructor(concurrency: number) {
    this.available = concurrency
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--
      return
    }
    return new Promise(resolve => this.queue.push(resolve))
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      next()
    } else {
      this.available++
    }
  }
}

const semanticSemaphore = new Semaphore(SEMANTIC_CONCURRENCY_LIMIT)

// -- CSV Parsing ---------------------------------------------------------------

function loadLabeledPairs(): LabeledPair[] {
  const raw = fs.readFileSync(CSV_FILE, "utf-8")
  const lines = raw.trim().split("\n")
  const pairs: LabeledPair[] = []

  // Skip header: File_1,File_2,Label
  for (let i = 1; i < lines.length; i++) {
    const [file1, file2, labelStr] = lines[i].trim().split(",")
    const label = parseInt(labelStr, 10) as 0 | 1

    pairs.push({ file1, file2, label })
  }

  return pairs
}

// -- Structural Scoring --------------------------------------------------------

async function computeStructuralScore(code1: string, code2: string): Promise<number> {
  const detector = new PlagiarismDetector({
    language: "python",
    kgramLength: PRODUCTION_K,
    kgramsInWindow: PRODUCTION_W,
    minFragmentLength: 2,
  })

  const report = await detector.analyze([new File("FileA.py", code1), new File("FileB.py", code2)])
  const pairs = report.getPairs()

  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

// -- Semantic Scoring (GraphCodeBERT via VPS HTTP) ----------------------------

async function computeSemanticScore(code1: string, code2: string): Promise<number> {
  await semanticSemaphore.acquire()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SEMANTIC_TIMEOUT_MS)

    const response = await fetch(`${SEMANTIC_SERVICE_URL}/similarity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code1, code2 }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Semantic service HTTP ${response.status}`)
    }

    const data = await response.json() as { score: number }

    return data.score
  } finally {
    semanticSemaphore.release()
  }
}

// -- Hybrid Score -------------------------------------------------------------

function computeHybridScore(structural: number, semantic: number): number {
  return STRUCTURAL_WEIGHT * structural + SEMANTIC_WEIGHT * semantic
}

// -- Metrics -------------------------------------------------------------------

function classifyAtThreshold(
  results: PairResult[],
  mode: ScoreMode,
  threshold: number,
): ClassificationMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0

  for (const r of results) {
    const score = getScore(r, mode)
    const predicted = score >= threshold ? 1 : 0

    if (predicted === 1 && r.label === 1) tp++
    else if (predicted === 1 && r.label === 0) fp++
    else if (predicted === 0 && r.label === 0) tn++
    else fn++
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const accuracy = (tp + tn) / results.length

  return { threshold, accuracy, precision, recall, f1Score, tp, fp, tn, fn }
}

function findBestF1Threshold(results: PairResult[], mode: ScoreMode): ClassificationMetrics {
  const scores = results.map(r => getScore(r, mode))
  const uniqueScores = [...new Set(scores)].sort((a, b) => a - b)
  let bestMetric: ClassificationMetrics | null = null

  for (const threshold of uniqueScores) {
    const metrics = classifyAtThreshold(results, mode, threshold)

    if (!bestMetric || metrics.f1Score > bestMetric.f1Score) {
      bestMetric = metrics
    }
  }

  return bestMetric ?? classifyAtThreshold(results, mode, 0.5)
}

function computeRocAuc(results: PairResult[], mode: ScoreMode): number {
  const positiveCount = results.filter(r => r.label === 1).length
  const negativeCount = results.length - positiveCount

  if (positiveCount === 0 || negativeCount === 0) return 0.5

  const sorted = [...results].sort((a, b) => getScore(b, mode) - getScore(a, mode))
  let truePositives = 0
  let auc = 0

  for (const r of sorted) {
    if (r.label === 1) {
      truePositives++
    } else {
      auc += truePositives
    }
  }

  return auc / (positiveCount * negativeCount)
}

function getScore(result: PairResult, mode: ScoreMode): number {
  if (mode === "structural") return result.structuralScore
  if (mode === "semantic") return result.semanticScore

  return result.hybridScore
}

function pct(value: number): string {
  return (value * 100).toFixed(2) + "%"
}

function logScoreDistribution(scores: number[], label: string): void {
  if (scores.length === 0) return

  const sorted = [...scores].sort((a, b) => a - b)
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
  const median = sorted[Math.floor(sorted.length / 2)]

  console.log(
    `    ${label} (n=${scores.length}): ` +
    `mean=${mean.toFixed(4)}, median=${median.toFixed(4)}, ` +
    `min=${sorted[0].toFixed(4)}, max=${sorted[sorted.length - 1].toFixed(4)}`
  )
}

function printModeComparisonSummary(modeSummaries: Record<ScoreMode, ModeEvaluationSummary>): void {
  console.log("\n" + "=".repeat(70))
  console.log("  MODE COMPARISON SUMMARY")
  console.log("=".repeat(70))
  console.log("  Mode         ROC-AUC  Best F1  Threshold  P@5     R@10")

  for (const mode of ["structural", "semantic", "hybrid"] as const) {
    const modeSummary = modeSummaries[mode]
    const modeLabel = mode.padEnd(12)
    const rocAucLabel = modeSummary.rocAuc.toFixed(4).padEnd(8)
    const f1Label = pct(modeSummary.bestThresholdMetrics.f1Score).padEnd(8)
    const thresholdLabel = modeSummary.bestThresholdMetrics.threshold.toFixed(4).padEnd(9)
    const precisionAt5Label = pct(modeSummary.precisionAt5.precision).padEnd(7)
    const recallAt10Label = pct(modeSummary.recallAt10.recall)

    console.log(
      `  ${modeLabel} ${rocAucLabel} ${f1Label} ${thresholdLabel} ${precisionAt5Label} ${recallAt10Label}`
    )
  }
}

// -- VPS Health Check ----------------------------------------------------------

async function checkSemanticServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SEMANTIC_SERVICE_URL}/health`, { signal: AbortSignal.timeout(5000) })

    return response.ok
  } catch {
    return false
  }
}

// -- Core Evaluation -----------------------------------------------------------

async function evaluateAllPairs(pairs: LabeledPair[]): Promise<PairResult[]> {
  const results: PairResult[] = []
  let processed = 0
  let errors = 0
  const startTime = Date.now()
  const semanticAvailable = await checkSemanticServiceHealth()

  if (!semanticAvailable) {
    console.log("  WARNING: Semantic service unreachable — semantic scores will be 0.0")
  }

  for (const pair of pairs) {
    const file1Path = path.join(DATASET_DIR, pair.file1)
    const file2Path = path.join(DATASET_DIR, pair.file2)

    if (!fs.existsSync(file1Path) || !fs.existsSync(file2Path)) {
      errors++
      results.push({
        file1: pair.file1, file2: pair.file2, label: pair.label,
        structuralScore: 0, semanticScore: 0, hybridScore: 0,
      })
      processed++
      continue
    }

    const code1 = fs.readFileSync(file1Path, "utf-8")
    const code2 = fs.readFileSync(file2Path, "utf-8")

    try {
      const structuralPromise = computeStructuralScore(code1, code2)
      const semanticPromise = semanticAvailable
        ? computeSemanticScore(code1, code2).catch(() => 0.0)
        : Promise.resolve(0.0)

      const [structuralScore, semanticScore] = await Promise.all([structuralPromise, semanticPromise])

      results.push({
        file1: pair.file1,
        file2: pair.file2,
        label: pair.label,
        structuralScore,
        semanticScore,
        hybridScore: computeHybridScore(structuralScore, semanticScore),
      })
    } catch {
      errors++
      results.push({
        file1: pair.file1, file2: pair.file2, label: pair.label,
        structuralScore: 0, semanticScore: 0, hybridScore: 0,
      })
    }

    processed++

    if (processed % 25 === 0 || processed === pairs.length) {
      const elapsedMs = Date.now() - startTime
      const pairsPerSec = processed / (elapsedMs / 1000)
      const remaining = pairs.length - processed
      const etaSec = Math.round(remaining / pairsPerSec)
      process.stdout.write(
        `\r  [PYTHON] ${processed}/${pairs.length} (${errors} errors) — ${pairsPerSec.toFixed(1)} pairs/s — ETA: ${etaSec}s  `
      )
    }
  }

  process.stdout.write(
    `\r  [PYTHON] ${processed}/${pairs.length} (${errors} errors) — done.                          \n`
  )

  return results
}

// -- Main ----------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70))
  console.log("  PYTHON PLAGIARISM DATASET EVALUATION")
  console.log("  Kaggle: Student Code Similarity & Plagiarism Labels (Khani, 2024)")
  console.log(`  Config: k=${PRODUCTION_K}, w=${PRODUCTION_W} (Production Defaults)`)
  console.log(`  Weights: structural=${STRUCTURAL_WEIGHT}, semantic=${SEMANTIC_WEIGHT}`)
  console.log("=".repeat(70))

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`\n  ERROR: ${CSV_FILE} not found.`)
    console.error("  Clone: git clone https://github.com/ehsankhani/cheating_detector.git")
    console.error("         into backend-ts/evaluation-results/python-plagiarism-dataset/")
    process.exit(1)
  }

  console.log("\n  Loading labeled pairs from CSV ...")
  const pairs = loadLabeledPairs()
  const positiveCount = pairs.filter(p => p.label === 1).length
  const negativeCount = pairs.filter(p => p.label === 0).length

  console.log(`  Loaded ${pairs.length} pairs (${positiveCount} positive, ${negativeCount} negative)`)
  console.log(`\n  Scoring all pairs ...`)

  const wallStart = Date.now()
  const results = await evaluateAllPairs(pairs)
  const wallElapsedSec = ((Date.now() - wallStart) / 1000).toFixed(1)

  // -- Print results for each mode ---
  const modes: ScoreMode[] = ["structural", "semantic", "hybrid"]
  const modeSummaries = {} as Record<ScoreMode, ModeEvaluationSummary>

  for (const mode of modes) {
    const auc = computeRocAuc(results, mode)
    const bestThresholdMetrics = findBestF1Threshold(results, mode)
    const precisionAt5 = computeRankingMetricsAtK(results, result => getScore(result, mode), result => result.label === 1, 5)
    const recallAt10 = computeRankingMetricsAtK(results, result => getScore(result, mode), result => result.label === 1, 10)

    modeSummaries[mode] = {
      rocAuc: auc,
      bestThresholdMetrics,
      precisionAt5,
      recallAt10,
    }

    console.log("\n" + "-".repeat(70))
    console.log(`  ${mode.toUpperCase()} MODE`)
    console.log("-".repeat(70))
    console.log(`  ROC-AUC        : ${auc.toFixed(4)}`)
    console.log(`  Best Threshold : ${bestThresholdMetrics.threshold.toFixed(4)}`)
    console.log(`  Precision      : ${pct(bestThresholdMetrics.precision)}`)
    console.log(`  Recall         : ${pct(bestThresholdMetrics.recall)}`)
    console.log(`  F1-Score       : ${pct(bestThresholdMetrics.f1Score)}`)
    console.log(`  Accuracy       : ${pct(bestThresholdMetrics.accuracy)}`)
    console.log(`  TP/FP/TN/FN    : ${bestThresholdMetrics.tp}/${bestThresholdMetrics.fp}/${bestThresholdMetrics.tn}/${bestThresholdMetrics.fn}`)
    console.log(
      `  Precision@5    : ${pct(precisionAt5.precision)} ` +
      `(${precisionAt5.relevantItemsInTopK}/${precisionAt5.evaluatedItems} relevant top-ranked pairs)`
    )
    console.log(
      `  Recall@10      : ${pct(recallAt10.recall)} ` +
      `(${recallAt10.relevantItemsInTopK}/${recallAt10.totalRelevantItems} total relevant pairs surfaced)`
    )

    console.log("\n  Score Distributions:")
    logScoreDistribution(results.filter(r => r.label === 1).map(r => getScore(r, mode)), "Plagiarized")
    logScoreDistribution(results.filter(r => r.label === 0).map(r => getScore(r, mode)), "Non-plagiarized")
  }

  printModeComparisonSummary(modeSummaries)

  console.log("\n" + "=".repeat(70))
  console.log(`  Wall time: ${wallElapsedSec}s`)
  console.log("=".repeat(70))

  // -- Save results ---
  const outputData: Record<string, unknown> = {
    note: "Python plagiarism dataset evaluation — 293 labeled pairs (Khani, 2024).",
    config: { k: PRODUCTION_K, w: PRODUCTION_W, structuralWeight: STRUCTURAL_WEIGHT, semanticWeight: SEMANTIC_WEIGHT },
    datasetInfo: {
      source: "https://www.kaggle.com/datasets/ehsankhani/student-code-similarity-and-plagiarism-labels",
      totalPairs: pairs.length,
      positives: positiveCount,
      negatives: negativeCount,
      language: "python",
    },
    wallTimeSeconds: parseFloat(wallElapsedSec),
    modes: modeSummaries,
    results,
  }

  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2))

  console.log(`\n  Results saved to: ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
