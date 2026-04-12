/**
 * Full SOCO Java Evaluation Script
 *
 * Runs Winnowing (k=23, w=17) against the COMPLETE SOCO Java dataset
 * (33,411 pairs — all 84 positives + all 33,327 negatives) without any
 * sampling. Intended for definitive thesis-quality results.
 *
 * Unlike the Vitest version, this standalone script has no timeout.
 * Estimated runtime: ~10-15 minutes.
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/evaluate-soco-full.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// -- Constants -----------------------------------------------------------------

const PRODUCTION_K = 23
const PRODUCTION_W = 17

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const JAVA_PAIRS_FILE = path.join(RESULT_DIR, "soco_java_pairs.jsonl")
const OUTPUT_FILE = path.join(RESULT_DIR, "soco-evaluation-results-full.json")

// -- Types ---------------------------------------------------------------------

interface SocoPair {
  f1: string
  f2: string
  label: number
  text1: string
  text2: string
  language: string
}

interface PredictionResult {
  f1: string
  f2: string
  label: number
  score: number
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

// -- Metrics -------------------------------------------------------------------

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
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const accuracy = (tp + tn) / predictions.length

  return { threshold, accuracy, precision, recall, f1Score, tp, fp, tn, fn }
}

function findBestF1Threshold(predictions: PredictionResult[]): ClassificationMetrics {
  const uniqueScores = [...new Set(predictions.map(p => p.score))].sort((a, b) => a - b)
  let bestMetric: ClassificationMetrics | null = null

  for (const threshold of uniqueScores) {
    const metrics = classifyAtThreshold(predictions, threshold)
    if (!bestMetric || metrics.f1Score > bestMetric.f1Score) {
      bestMetric = metrics
    }
  }

  return bestMetric ?? classifyAtThreshold(predictions, 0.5)
}

function computeRocAuc(predictions: PredictionResult[]): number {
  const positiveCount = predictions.filter(p => p.label === 1).length
  const negativeCount = predictions.length - positiveCount

  if (positiveCount === 0 || negativeCount === 0) return 0.5

  const sorted = [...predictions].sort((a, b) => b.score - a.score)
  let truePositives = 0
  let auc = 0

  for (const p of sorted) {
    if (p.label === 1) {
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
    `  ${label} (n=${scores.length}): ` +
    `mean=${mean.toFixed(4)}, median=${median.toFixed(4)}, ` +
    `min=${sorted[0].toFixed(4)}, max=${sorted[sorted.length - 1].toFixed(4)}`
  )
}

// -- Core Evaluation -----------------------------------------------------------

async function computeSimilarity(code1: string, code2: string, k: number, w: number): Promise<number> {
  const detector = new PlagiarismDetector({
    language: "java",
    kgramLength: k,
    kgramsInWindow: w,
    minFragmentLength: 2,
  })

  const report = await detector.analyze([new File("FileA.java", code1), new File("FileB.java", code2)])
  const pairs = report.getPairs()

  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

async function evaluateAllPairs(pairs: SocoPair[]): Promise<PredictionResult[]> {
  const results: PredictionResult[] = []
  let processed = 0
  let errors = 0
  const startTime = Date.now()

  for (const pair of pairs) {
    try {
      const score = await computeSimilarity(pair.text1, pair.text2, PRODUCTION_K, PRODUCTION_W)
      results.push({ f1: pair.f1, f2: pair.f2, label: pair.label, score })
    } catch {
      errors++
      results.push({ f1: pair.f1, f2: pair.f2, label: pair.label, score: 0 })
    }

    processed++

    if (processed % 500 === 0) {
      const elapsedMs = Date.now() - startTime
      const pairsPerSec = processed / (elapsedMs / 1000)
      const remaining = pairs.length - processed
      const etaSec = Math.round(remaining / pairsPerSec)
      const etaMin = Math.floor(etaSec / 60)
      const etaSecRem = etaSec % 60
      process.stdout.write(
        `\r  [JAVA] ${processed}/${pairs.length} (${errors} errors) — ${pairsPerSec.toFixed(1)} pairs/s — ETA: ${etaMin}m${etaSecRem}s  `
      )
    }
  }

  process.stdout.write(`\r  [JAVA] ${processed}/${pairs.length} (${errors} errors) — done.                          \n`)

  return results
}

// -- Main ----------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70))
  console.log("  FULL SOCO JAVA EVALUATION — NO SAMPLING")
  console.log("  ClassiFi Structural Analysis vs Dolos Baseline (JCAL 2023)")
  console.log(`  Config: k=${PRODUCTION_K}, w=${PRODUCTION_W} (Production Defaults)`)
  console.log("=".repeat(70))

  if (!fs.existsSync(JAVA_PAIRS_FILE)) {
    console.error(`\n  ERROR: ${JAVA_PAIRS_FILE} not found.`)
    console.error("  Run: python semantic-service/prepare_soco_dataset.py")
    process.exit(1)
  }

  console.log("\n  Loading full Java dataset (this reads ~280MB) ...")
  const javaPairs = loadAllPairs(JAVA_PAIRS_FILE)
  const positiveCount = javaPairs.filter(p => p.label === 1).length
  const negativeCount = javaPairs.filter(p => p.label === 0).length

  console.log(`  Loaded ${javaPairs.length} pairs (${positiveCount} positive, ${negativeCount} negative)`)
  console.log(`\n  Scoring all pairs (estimated ~10-15 minutes) ...`)

  const wallStart = Date.now()
  const predictions = await evaluateAllPairs(javaPairs)
  const wallElapsedSec = ((Date.now() - wallStart) / 1000).toFixed(1)

  const auc = computeRocAuc(predictions)
  const metrics = findBestF1Threshold(predictions)

  console.log("\n" + "=".repeat(70))
  console.log("  RESULTS — Full SOCO Java (33,411 pairs)")
  console.log("=".repeat(70))
  console.log(`  ROC-AUC        : ${auc.toFixed(4)}`)
  console.log(`  Best Threshold : ${metrics.threshold.toFixed(4)}`)
  console.log(`  Precision      : ${pct(metrics.precision)}`)
  console.log(`  Recall         : ${pct(metrics.recall)}`)
  console.log(`  F1-Score       : ${pct(metrics.f1Score)}`)
  console.log(`  Accuracy       : ${pct(metrics.accuracy)}`)
  console.log(`  TP/FP/TN/FN    : ${metrics.tp}/${metrics.fp}/${metrics.tn}/${metrics.fn}`)
  console.log(`  Wall time      : ${wallElapsedSec}s`)
  console.log(`\n  Dolos (JCAL 2023) reported AUC ~0.97 on SOCO Java.`)
  console.log(`  ClassiFi full-dataset AUC: ${auc.toFixed(4)}`)
  console.log("=".repeat(70))

  console.log("\n  Score Distributions:")
  logScoreDistribution(predictions.filter(p => p.label === 1).map(p => p.score), "Plagiarism pairs")
  logScoreDistribution(predictions.filter(p => p.label === 0).map(p => p.score), "Innocent pairs")

  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(
      {
        note: "Full SOCO Java evaluation — no sampling. All 33,411 pairs.",
        config: { k: PRODUCTION_K, w: PRODUCTION_W },
        datasetInfo: { totalPairs: javaPairs.length, positives: positiveCount, negatives: negativeCount },
        rocAuc: auc,
        bestThresholdMetrics: metrics,
        wallTimeSeconds: parseFloat(wallElapsedSec),
        predictions,
      },
      null,
      2
    )
  )

  console.log(`\n  Results saved to: ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
