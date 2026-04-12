/**
 * Structural Analysis Evaluation on the SOCO Dataset (PAN@FIRE 2014)
 *
 * The SOCO (SOurce COde re-use) dataset is a publicly available benchmark
 * originally used in the PAN@FIRE 2014 shared task. It is used here to provide
 * a **direct comparison** against Dolos (Maertens et al., 2022/2023), which
 * evaluated its Winnowing algorithm on the same dataset.
 *
 * Dataset composition:
 *   - Java: 259 files → 33,411 pairwise combinations (84 positive, 33,327 negative)
 *   - C:    79 files  →  3,081 pairwise combinations (26 positive,  3,055 negative)
 *
 * Labels are file-level (expert-annotated): a pair is labeled 1 if both files
 * are involved in plagiarism with each other, and 0 otherwise.
 *
 * Primary metric: ROC-AUC (same as Dolos evaluation in JCAL 2022/2023 paper).
 *
 * Sampling strategy:
 *   - Java: All 84 positive pairs + stratified reservoir-sample of 2,000 negatives.
 *     Running all 33k pairs exceeds test timeout; stratified sampling preserves
 *     all ground-truth positives and is statistically robust for AUC estimation.
 *   - C: Full dataset (3,081 pairs) — manageable within time budget.
 *
 * Winnowing config: k=23, w=17 (production system defaults).
 *
 * Prerequisites:
 *   The SOCO pairs JSONL files must be present under backend-ts/evaluation-results/.
 *   Run semantic-service/prepare_soco_dataset.py if they are missing.
 *
 * Usage (from backend-ts/):
 *   npx vitest run tests/evaluate-soco.test.ts --no-coverage --reporter=verbose
 */

import { describe, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// -- Constants -----------------------------------------------------------------

const PRODUCTION_K = 23
const PRODUCTION_W = 17

/** All Java positives (84) + this many randomly sampled Java negatives. */
const JAVA_NEGATIVE_SAMPLE_SIZE = 2000

/** Reproducible random seed for the negative sample. */
const RANDOM_SEED = 42

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(
  decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"))
)
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const JAVA_PAIRS_FILE = path.join(RESULT_DIR, "soco_java_pairs.jsonl")
const C_PAIRS_FILE = path.join(RESULT_DIR, "soco_c_pairs.jsonl")
const OUTPUT_FILE = path.join(RESULT_DIR, "soco-evaluation-results.json")

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

// -- Seeded pseudo-random (LCG) ------------------------------------------------

function createSeededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = Math.imul(1664525, s) + 1013904223
    return (s >>> 0) / 0xffffffff
  }
}

// -- Data Loading with Stratified Sampling -------------------------------------

/**
 * Loads all positive pairs and reservoir-samples up to maxNegatives negative
 * pairs from the JSONL file. Uses a seeded RNG so results are reproducible.
 */
function loadSocoStratified(filePath: string, maxNegatives: number): SocoPair[] {
  const positives: SocoPair[] = []
  const rng = createSeededRng(RANDOM_SEED)

  const reservoir: SocoPair[] = []
  let negativesSeen = 0

  const raw = fs.readFileSync(filePath, "utf-8")

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue

    const obj = JSON.parse(line) as SocoPair

    if (obj.label === 1) {
      positives.push(obj)
    } else {
      negativesSeen++
      if (reservoir.length < maxNegatives) {
        reservoir.push(obj)
      } else {
        const replaceIndex = Math.floor(rng() * negativesSeen)
        if (replaceIndex < maxNegatives) {
          reservoir[replaceIndex] = obj
        }
      }
    }
  }

  return [...positives, ...reservoir]
}

/** Loads all pairs from the JSONL file without any sampling. */
function loadSocoAll(filePath: string): SocoPair[] {
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
    `    ${label} (n=${scores.length}): ` +
    `mean=${mean.toFixed(4)}, median=${median.toFixed(4)}, ` +
    `min=${sorted[0].toFixed(4)}, max=${sorted[sorted.length - 1].toFixed(4)}`
  )
}

function logMetrics(label: string, predictions: PredictionResult[]): void {
  if (predictions.length === 0) {
    console.log(`  ${label}: No pairs`)
    return
  }

  const positiveCount = predictions.filter(p => p.label === 1).length
  const metrics = findBestF1Threshold(predictions)
  const auc = computeRocAuc(predictions)

  console.log(`\n  ${label} (n=${predictions.length}, pos=${positiveCount}):`)
  console.log(`    Best Threshold : ${metrics.threshold.toFixed(4)}`)
  console.log(`    Accuracy       : ${pct(metrics.accuracy)}`)
  console.log(`    Precision      : ${pct(metrics.precision)}`)
  console.log(`    Recall         : ${pct(metrics.recall)}`)
  console.log(`    F1-Score       : ${pct(metrics.f1Score)}`)
  console.log(`    ROC-AUC        : ${auc.toFixed(4)}`)
  console.log(`    TP/FP/TN/FN    : ${metrics.tp}/${metrics.fp}/${metrics.tn}/${metrics.fn}`)
}

// -- Core Evaluation -----------------------------------------------------------

async function computeSimilarity(
  code1: string,
  code2: string,
  language: "java" | "c" | "python",
  k: number,
  w: number
): Promise<number> {
  const detector = new PlagiarismDetector({
    language,
    kgramLength: k,
    kgramsInWindow: w,
    minFragmentLength: 2,
  })

  const extension = language === "java" ? "java" : language === "c" ? "c" : "py"
  const file1 = new File(`FileA.${extension}`, code1)
  const file2 = new File(`FileB.${extension}`, code2)

  const report = await detector.analyze([file1, file2])
  const pairs = report.getPairs()

  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

async function evaluatePairs(
  pairs: SocoPair[],
  language: "java" | "c" | "python",
  k: number,
  w: number
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = []
  let processed = 0
  let errors = 0

  for (const pair of pairs) {
    try {
      const similarityScore = await computeSimilarity(pair.text1, pair.text2, language, k, w)
      results.push({ f1: pair.f1, f2: pair.f2, label: pair.label, score: similarityScore })
    } catch {
      errors++
      results.push({ f1: pair.f1, f2: pair.f2, label: pair.label, score: 0 })
    }

    processed++
    if (processed % 100 === 0) {
      process.stdout.write(`\r    [${language.toUpperCase()}] ${processed}/${pairs.length} processed (${errors} errors)`)
    }
  }

  process.stdout.write(`\r    [${language.toUpperCase()}] ${processed}/${pairs.length} processed (${errors} errors)\n`)

  return results
}

// -- Test ----------------------------------------------------------------------

describe("SOCO Dataset Evaluation — Structural Analysis vs Dolos Baseline", () => {
  it(
    "evaluates Winnowing (k=23, w=17) on SOCO Java and C — comparison with Dolos",
    async () => {
      if (!fs.existsSync(JAVA_PAIRS_FILE) || !fs.existsSync(C_PAIRS_FILE)) {
        throw new Error(
          "SOCO pairs not found. Run: python semantic-service/prepare_soco_dataset.py"
        )
      }

      console.log("\n" + "=".repeat(70))
      console.log("  STRUCTURAL ANALYSIS EVALUATION -- SOCO DATASET (PAN@FIRE 2014)")
      console.log("  Comparison with Dolos (Maertens et al., JCAL 2022/2023)")
      console.log(`  Config: k=${PRODUCTION_K}, w=${PRODUCTION_W} (Production Defaults)`)
      console.log("=".repeat(70))

      // -- Load datasets -------------------------------------------------------
      console.log("\n  Loading Java pairs (stratified: all positives + 2k negatives) ...")
      const javaPairs = loadSocoStratified(JAVA_PAIRS_FILE, JAVA_NEGATIVE_SAMPLE_SIZE)
      const javaPositiveCount = javaPairs.filter(p => p.label === 1).length
      const javaNegativeCount = javaPairs.filter(p => p.label === 0).length

      console.log(`  Java sample: ${javaPairs.length} pairs (${javaPositiveCount} pos, ${javaNegativeCount} neg)`)
      console.log(`  [Full Java dataset: 33,411 pairs -- 84 positives preserved 100%]`)

      console.log("\n  Loading C pairs (full dataset) ...")
      const cPairs = loadSocoAll(C_PAIRS_FILE)
      const cPositiveCount = cPairs.filter(p => p.label === 1).length
      const cNegativeCount = cPairs.filter(p => p.label === 0).length

      console.log(`  C full:   ${cPairs.length} pairs (${cPositiveCount} pos, ${cNegativeCount} neg)`)

      // -- Java evaluation -----------------------------------------------------
      console.log(`\n${"-".repeat(70)}`)
      console.log(`  JAVA EVALUATION (n=${javaPairs.length})`)
      console.log("-".repeat(70))
      console.log("  Scoring pairs ...")

      const javaPredictions = await evaluatePairs(javaPairs, "java", PRODUCTION_K, PRODUCTION_W)
      const javaAuc = computeRocAuc(javaPredictions)

      logMetrics("Java -- Plagiarism vs Innocent", javaPredictions)

      console.log("\n  Score Distributions:")
      logScoreDistribution(javaPredictions.filter(p => p.label === 1).map(p => p.score), "Plagiarism pairs")
      logScoreDistribution(javaPredictions.filter(p => p.label === 0).map(p => p.score), "Innocent pairs")

      // -- C evaluation --------------------------------------------------------
      console.log(`\n${"-".repeat(70)}`)
      console.log(`  C EVALUATION (n=${cPairs.length})`)
      console.log("-".repeat(70))
      console.log("  Scoring pairs ...")

      const cPredictions = await evaluatePairs(cPairs, "c", PRODUCTION_K, PRODUCTION_W)
      const cAuc = computeRocAuc(cPredictions)

      logMetrics("C -- Plagiarism vs Innocent", cPredictions)

      console.log("\n  Score Distributions:")
      logScoreDistribution(cPredictions.filter(p => p.label === 1).map(p => p.score), "Plagiarism pairs")
      logScoreDistribution(cPredictions.filter(p => p.label === 0).map(p => p.score), "Innocent pairs")

      // -- Summary -------------------------------------------------------------
      console.log("\n" + "=".repeat(70))
      console.log("  SUMMARY")
      console.log("=".repeat(70))
      console.log(`  Java ROC-AUC  : ${javaAuc.toFixed(4)}`)
      console.log(`  C ROC-AUC     : ${cAuc.toFixed(4)}`)
      console.log(`\n  Dolos (JCAL 2023) reported AUC ~0.97 on SOCO Java.`)
      console.log("=".repeat(70))

      // -- Persist results -----------------------------------------------------
      fs.mkdirSync(RESULT_DIR, { recursive: true })
      fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(
          {
            config: { k: PRODUCTION_K, w: PRODUCTION_W, label: "Production k=23, w=17" },
            javaSampleInfo: {
              totalPairsInDataset: 33411,
              totalPositives: 84,
              positivesIncluded: javaPositiveCount,
              negativesIncluded: javaNegativeCount,
            },
            java: { rocAuc: javaAuc, predictions: javaPredictions },
            cFullDataset: {
              totalPairs: cPairs.length,
              positives: cPositiveCount,
              negatives: cNegativeCount,
            },
            c: { rocAuc: cAuc, predictions: cPredictions },
          },
          null,
          2
        )
      )

      console.log(`\n  Full results saved --> ${OUTPUT_FILE}`)
    },
    900_000
  )
})
