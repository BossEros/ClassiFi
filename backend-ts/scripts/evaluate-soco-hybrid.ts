/**
 * SOCO Java Hybrid Evaluation Script — Structural, Semantic & Hybrid
 *
 * Evaluates all three ClassiFi analysis modes against the SOCO Java dataset.
 * To keep semantic API calls tractable, evaluates all 84 positive (plagiarised)
 * pairs plus a deterministic sample of 2,000 negative pairs.
 *
 * Structural scores are reused from the pre-computed full-dataset results
 * (soco-evaluation-results-full.json) to avoid re-running Winnowing on all
 * 33,411 pairs. Only semantic (GraphCodeBERT) calls are made for the sample.
 *
 * Full structural results (33,411 pairs, ROC-AUC 0.991) remain untouched in:
 *   soco-evaluation-results-full.json
 *
 * This script produces the 3-mode comparison for hybrid effectiveness analysis:
 *   soco-evaluation-results-hybrid.json
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/evaluate-soco-hybrid.ts
 *
 * Prerequisites:
 *   soco_java_pairs.jsonl must exist in evaluation-results/
 *   soco-evaluation-results-full.json must exist (run evaluate-soco-full.ts first)
 *
 * Citation:
 *   Flores, E. et al. (2014). "Overview of SOCO Track on Detection of Source Code Re-use."
 *   PAN at FIRE 2014. Kolkata, India.
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { computeRankingMetricsAtK, type RankingMetricsAtK } from "./shared/ranking-metrics.js"

// -- Constants -----------------------------------------------------------------

const PRODUCTION_K = 23
const PRODUCTION_W = 17
const STRUCTURAL_WEIGHT = 0.7
const SEMANTIC_WEIGHT = 0.3
const SEMANTIC_SERVICE_URL = "http://159.65.128.153:8002"
const SEMANTIC_CONCURRENCY_LIMIT = 4
const SEMANTIC_TIMEOUT_MS = 30_000

/** Number of negative pairs to sample. All positive pairs are always included. */
const NEGATIVE_SAMPLE_COUNT = 2000

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const JAVA_PAIRS_FILE = path.join(RESULT_DIR, "soco_java_pairs.jsonl")
const STRUCTURAL_RESULTS_FILE = path.join(RESULT_DIR, "soco-evaluation-results-full.json")
const OUTPUT_FILE = path.join(RESULT_DIR, "soco-evaluation-results-hybrid.json")

// -- Types ---------------------------------------------------------------------

type ScoreMode = "structural" | "semantic" | "hybrid"

interface SocoPair {
  f1: string
  f2: string
  label: number
  text1: string
  text2: string
}

interface FullStructuralResults {
  predictions: Array<{
    f1: string
    f2: string
    label: number
    score: number
  }>
}

interface PairResult {
  f1: string
  f2: string
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

// -- Semaphore -----------------------------------------------------------------

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
      this.queue.shift()!()
    } else {
      this.available++
    }
  }
}

const semanticSemaphore = new Semaphore(SEMANTIC_CONCURRENCY_LIMIT)

// -- Data Loading --------------------------------------------------------------

function loadAllPairs(filePath: string): SocoPair[] {
  const pairs: SocoPair[] = []
  const raw = fs.readFileSync(filePath, "utf-8")

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    pairs.push(JSON.parse(line) as SocoPair)
  }

  return pairs
}

/**
 * Builds a lookup map from pair key ("f1|f2") to pre-computed structural score,
 * sourced from the full-dataset Winnowing results file.
 */
function loadStructuralScoreMap(filePath: string): Map<string, number> {
  const raw = fs.readFileSync(filePath, "utf-8")
  const data = JSON.parse(raw) as FullStructuralResults
  const scoreMap = new Map<string, number>()

  for (const pred of data.predictions) {
    scoreMap.set(`${pred.f1}|${pred.f2}`, pred.score)
  }

  return scoreMap
}

/**
 * Selects the evaluation subset: all positive pairs + a deterministic sample
 * of NEGATIVE_SAMPLE_COUNT negative pairs (sorted by filename for reproducibility).
 */
function selectSamplePairs(allPairs: SocoPair[]): SocoPair[] {
  const positivePairs = allPairs.filter(p => p.label === 1)
  const negativePairs = allPairs.filter(p => p.label === 0)

  const sampledNegatives = [...negativePairs]
    .sort((a, b) => a.f1.localeCompare(b.f1) || a.f2.localeCompare(b.f2))
    .slice(0, NEGATIVE_SAMPLE_COUNT)

  return [...positivePairs, ...sampledNegatives]
}

// -- Semantic Scoring ----------------------------------------------------------

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

function computeHybridScore(structuralScore: number, semanticScore: number): number {
  return STRUCTURAL_WEIGHT * structuralScore + SEMANTIC_WEIGHT * semanticScore
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

async function evaluateSampledPairs(
  sampledPairs: SocoPair[],
  structuralScoreMap: Map<string, number>,
): Promise<PairResult[]> {
  const results: PairResult[] = []
  let processed = 0
  let semanticErrors = 0
  const startTime = Date.now()

  const semanticAvailable = await checkSemanticServiceHealth()

  if (!semanticAvailable) {
    console.log("  WARNING: Semantic service unreachable — semantic scores will be 0.0")
  }

  for (const pair of sampledPairs) {
    const structuralScore = structuralScoreMap.get(`${pair.f1}|${pair.f2}`) ?? 0.0
    let semanticScore = 0.0

    if (semanticAvailable) {
      semanticScore = await computeSemanticScore(pair.text1, pair.text2).catch(() => {
        semanticErrors++
        return 0.0
      })
    }

    results.push({
      f1: pair.f1,
      f2: pair.f2,
      label: pair.label as 0 | 1,
      structuralScore,
      semanticScore,
      hybridScore: computeHybridScore(structuralScore, semanticScore),
    })

    processed++

    if (processed % 50 === 0 || processed === sampledPairs.length) {
      const elapsedMs = Date.now() - startTime
      const pairsPerSec = processed / (elapsedMs / 1000)
      const remaining = sampledPairs.length - processed
      const etaSec = Math.round(remaining / pairsPerSec)
      process.stdout.write(
        `\r  [SOCO-HYBRID] ${processed}/${sampledPairs.length} (${semanticErrors} semantic errors) — ` +
        `${pairsPerSec.toFixed(1)} pairs/s — ETA: ${etaSec}s  `
      )
    }
  }

  process.stdout.write(
    `\r  [SOCO-HYBRID] ${processed}/${sampledPairs.length} (${semanticErrors} semantic errors) — done.                  \n`
  )

  return results
}

// -- Metrics -------------------------------------------------------------------

function getScore(result: PairResult, mode: ScoreMode): number {
  if (mode === "structural") return result.structuralScore
  if (mode === "semantic") return result.semanticScore

  return result.hybridScore
}

function classifyAtThreshold(
  results: PairResult[],
  mode: ScoreMode,
  threshold: number,
): ClassificationMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0

  for (const r of results) {
    const predicted = getScore(r, mode) >= threshold ? 1 : 0
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
  const uniqueScores = [...new Set(results.map(r => getScore(r, mode)))].sort((a, b) => a - b)
  let bestMetrics: ClassificationMetrics | null = null

  for (const threshold of uniqueScores) {
    const metrics = classifyAtThreshold(results, mode, threshold)
    if (!bestMetrics || metrics.f1Score > bestMetrics.f1Score) bestMetrics = metrics
  }

  return bestMetrics ?? classifyAtThreshold(results, mode, 0.5)
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
    const s = modeSummaries[mode]
    console.log(
      `  ${mode.padEnd(12)} ${s.rocAuc.toFixed(4).padEnd(8)} ` +
      `${pct(s.bestThresholdMetrics.f1Score).padEnd(8)} ` +
      `${s.bestThresholdMetrics.threshold.toFixed(4).padEnd(9)} ` +
      `${pct(s.precisionAt5.precision).padEnd(7)} ` +
      `${pct(s.recallAt10.recall)}`
    )
  }
}

// -- Main ----------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70))
  console.log("  SOCO JAVA HYBRID EVALUATION")
  console.log("  PAN-FIRE 2014 — All 84 positives + 2,000 sampled negatives")
  console.log(`  Config: k=${PRODUCTION_K}, w=${PRODUCTION_W}`)
  console.log(`  Hybrid weights: structural=${STRUCTURAL_WEIGHT}, semantic=${SEMANTIC_WEIGHT}`)
  console.log("=".repeat(70))

  if (!fs.existsSync(JAVA_PAIRS_FILE)) {
    console.error(`\n  ERROR: SOCO Java pairs file not found at: ${JAVA_PAIRS_FILE}`)
    console.error("  Run: python semantic-service/prepare_soco_dataset.py")
    process.exit(1)
  }

  if (!fs.existsSync(STRUCTURAL_RESULTS_FILE)) {
    console.error(`\n  ERROR: Full structural results not found at: ${STRUCTURAL_RESULTS_FILE}`)
    console.error("  Run: npx tsx scripts/evaluate-soco-full.ts")
    process.exit(1)
  }

  console.log("\n  Loading SOCO Java pairs (reading ~280MB JSONL) ...")
  const allPairs = loadAllPairs(JAVA_PAIRS_FILE)
  console.log(`  Loaded ${allPairs.length} total pairs.`)

  console.log("  Loading pre-computed structural scores ...")
  const structuralScoreMap = loadStructuralScoreMap(STRUCTURAL_RESULTS_FILE)
  console.log(`  Loaded ${structuralScoreMap.size} structural scores.`)

  const sampledPairs = selectSamplePairs(allPairs)
  const positiveCount = sampledPairs.filter(p => p.label === 1).length
  const negativeCount = sampledPairs.filter(p => p.label === 0).length

  console.log(`\n  Sampled: ${sampledPairs.length} pairs (${positiveCount} positive, ${negativeCount} negative)`)

  const missingStructuralCount = sampledPairs.filter(p => !structuralScoreMap.has(`${p.f1}|${p.f2}`)).length

  if (missingStructuralCount > 0) {
    console.log(`  WARNING: ${missingStructuralCount} sampled pairs have no structural score — will use 0.0`)
  }

  console.log(`\n  Scoring semantic & computing hybrid for ${sampledPairs.length} pairs ...`)
  console.log("  (Using pre-computed structural scores from soco-evaluation-results-full.json)")

  const wallStart = Date.now()
  const results = await evaluateSampledPairs(sampledPairs, structuralScoreMap)
  const wallElapsedSec = ((Date.now() - wallStart) / 1000).toFixed(1)

  const modes: ScoreMode[] = ["structural", "semantic", "hybrid"]
  const modeSummaries = {} as Record<ScoreMode, ModeEvaluationSummary>

  for (const mode of modes) {
    const rocAuc = computeRocAuc(results, mode)
    const bestThresholdMetrics = findBestF1Threshold(results, mode)
    const precisionAt5 = computeRankingMetricsAtK(results, r => getScore(r, mode), r => r.label === 1, 5)
    const recallAt10 = computeRankingMetricsAtK(results, r => getScore(r, mode), r => r.label === 1, 10)

    modeSummaries[mode] = { rocAuc, bestThresholdMetrics, precisionAt5, recallAt10 }

    console.log("\n" + "-".repeat(70))
    console.log(`  ${mode.toUpperCase()} MODE`)
    console.log("-".repeat(70))
    console.log(`  ROC-AUC        : ${rocAuc.toFixed(4)}`)
    console.log(`  Best Threshold : ${bestThresholdMetrics.threshold.toFixed(4)}`)
    console.log(`  Precision      : ${pct(bestThresholdMetrics.precision)}`)
    console.log(`  Recall         : ${pct(bestThresholdMetrics.recall)}`)
    console.log(`  F1-Score       : ${pct(bestThresholdMetrics.f1Score)}`)
    console.log(`  Accuracy       : ${pct(bestThresholdMetrics.accuracy)}`)
    console.log(`  TP/FP/TN/FN    : ${bestThresholdMetrics.tp}/${bestThresholdMetrics.fp}/${bestThresholdMetrics.tn}/${bestThresholdMetrics.fn}`)
    console.log(
      `  Precision@5    : ${pct(precisionAt5.precision)} ` +
      `(${precisionAt5.relevantItemsInTopK}/${precisionAt5.evaluatedItems} relevant in top 5)`
    )
    console.log(
      `  Recall@10      : ${pct(recallAt10.recall)} ` +
      `(${recallAt10.relevantItemsInTopK}/${recallAt10.totalRelevantItems} retrieved in top 10)`
    )

    console.log("\n  Score Distributions:")
    logScoreDistribution(results.filter(r => r.label === 1).map(r => getScore(r, mode)), "Plagiarised")
    logScoreDistribution(results.filter(r => r.label === 0).map(r => getScore(r, mode)), "Non-plagiarised")
  }

  printModeComparisonSummary(modeSummaries)

  console.log(`\n${"=".repeat(70)}`)
  console.log(`  Wall time: ${wallElapsedSec}s`)
  console.log("=".repeat(70))

  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        note: `SOCO Java hybrid evaluation — all ${positiveCount} positives + ${negativeCount} sampled negatives.`,
        citation: "Flores, E. et al. (2014). Overview of SOCO Track on Detection of Source Code Re-use. PAN at FIRE 2014.",
        config: {
          k: PRODUCTION_K,
          w: PRODUCTION_W,
          structuralWeight: STRUCTURAL_WEIGHT,
          semanticWeight: SEMANTIC_WEIGHT,
        },
        datasetInfo: {
          source: "https://pan.webis.de/fire14/pan14-web/",
          totalPairs: sampledPairs.length,
          positives: positiveCount,
          negatives: negativeCount,
          language: "java",
          negativeSampleCount: NEGATIVE_SAMPLE_COUNT,
          fullDatasetPairs: allPairs.length,
          structuralScoresSource: "soco-evaluation-results-full.json",
        },
        wallTimeSeconds: parseFloat(wallElapsedSec),
        modes: modeSummaries,
        results,
      },
      null,
      2,
    ),
    "utf-8",
  )

  console.log(`\n  Results saved to: ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
