/**
 * Structural Analysis Parameter Sweep + Evaluation
 *
 * Phase 1: Sweeps (k-gram, window) combos on VALIDATION set to find optimal config.
 * Phase 2: Evaluates best config on TEST set, saves per-pair scores for hybrid analysis.
 *
 * Usage (from backend-ts/):
 *   npx vitest run tests/evaluate-structural-sweep.test.ts --no-coverage
 */

import { describe, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPT_DIR = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")))
const DATASET_DIR = path.resolve(SCRIPT_DIR, "../../validation-training")
const DATA_JSONL = path.join(DATASET_DIR, "data.jsonl")
const TEST_FILE = path.join(DATASET_DIR, "test.txt")
const VALID_FILE = path.join(DATASET_DIR, "valid.txt")
const OUTPUT_DIR = path.resolve(SCRIPT_DIR, "../../evaluation-results")

// ── Types ─────────────────────────────────────────────────────────────────────

interface FunctionEntry {
  idx: string
  func: string
  lang: string
}

interface PairEntry {
  id1: string
  id2: string
  label: number
  lang: string
}

interface PredictionResult {
  id1: string
  id2: string
  label: number
  score: number
  lang: string
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

interface SweepResult {
  kgramLength: number
  windowSize: number
  bestThreshold: number
  bestF1: number
  rocAuc: number
  avgPrecision: number
  accuracy: number
  precision: number
  recall: number
}

// ── Data Loading ──────────────────────────────────────────────────────────────

/**
 * Loads all functions from data.jsonl into a lookup map.
 *
 * @returns Map of function ID to function entry.
 */
function loadFunctions(): Map<string, FunctionEntry> {
  const raw = fs.readFileSync(DATA_JSONL, "utf-8")
  const map = new Map<string, FunctionEntry>()

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    const obj = JSON.parse(line) as { idx: string; func: string; lang?: string }
    map.set(String(obj.idx), {
      idx: String(obj.idx),
      func: obj.func,
      lang: obj.lang ?? "unknown",
    })
  }

  return map
}

/**
 * Loads pairs from a split file (test.txt or valid.txt).
 *
 * @param filePath - Path to the split file.
 * @returns Array of pair entries.
 */
function loadPairs(filePath: string): PairEntry[] {
  const raw = fs.readFileSync(filePath, "utf-8")
  const pairs: PairEntry[] = []

  for (const line of raw.split("\n")) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 3) continue
    pairs.push({ id1: parts[0], id2: parts[1], label: parseInt(parts[2], 10), lang: parts[3] ?? "python" })
  }

  return pairs
}

/**
 * Maps language name to file extension.
 *
 * @param lang - Language name.
 * @returns File extension string.
 */
function getExtension(lang: string): string {
  switch (lang) {
    case "python": return "py"
    case "java": return "java"
    case "c": return "c"
    default: return "txt"
  }
}

// ── Similarity Computation ────────────────────────────────────────────────────

/**
 * Computes structural similarity for a single code pair with given Winnowing parameters.
 *
 * @param func1 - Source code of function 1.
 * @param func2 - Source code of function 2.
 * @param lang - Programming language.
 * @param kgramLength - K-gram length for Winnowing.
 * @param windowSize - Window size for Winnowing.
 * @returns Similarity score (0.0–1.0).
 */
async function computeSimilarity(
  func1: string, func2: string, lang: string,
  kgramLength: number, windowSize: number,
): Promise<number> {
  const detector = new PlagiarismDetector({
    language: lang as "python" | "java" | "c",
    kgramLength,
    kgramsInWindow: windowSize,
    minFragmentLength: 2,
  })

  const file1 = new File("file1." + getExtension(lang), func1)
  const file2 = new File("file2." + getExtension(lang), func2)
  const report = await detector.analyze([file1, file2])
  const pairs = report.getPairs()

  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

/**
 * Evaluates all pairs with a given Winnowing configuration.
 *
 * @param pairs - Array of pair entries.
 * @param functions - Function lookup map.
 * @param kgramLength - K-gram length.
 * @param windowSize - Window size.
 * @returns Array of prediction results with per-pair scores.
 */
async function evaluatePairs(
  pairs: PairEntry[], functions: Map<string, FunctionEntry>,
  kgramLength: number, windowSize: number,
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = []
  let skipped = 0
  let errors = 0
  const startTime = Date.now()

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]
    const func1 = functions.get(pair.id1)
    const func2 = functions.get(pair.id2)

    if (!func1 || !func2) { skipped++; continue }

    try {
      const score = await computeSimilarity(func1.func, func2.func, pair.lang, kgramLength, windowSize)
      results.push({ id1: pair.id1, id2: pair.id2, label: pair.label, score, lang: pair.lang })
    } catch {
      errors++
      results.push({ id1: pair.id1, id2: pair.id2, label: pair.label, score: 0.0, lang: pair.lang })
    }

    if ((i + 1) % 100 === 0 || i === pairs.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      process.stdout.write(`\r    [k=${kgramLength}, w=${windowSize}] ${i + 1}/${pairs.length} (${elapsed}s, ${errors}err, ${skipped}skip)`)
    }
  }

  console.log("")
  return results
}

// ── Metrics ───────────────────────────────────────────────────────────────────

/**
 * Computes classification metrics at a given threshold.
 *
 * @param results - Array of prediction results.
 * @param threshold - Decision threshold.
 * @returns Classification metrics.
 */
function computeMetrics(results: PredictionResult[], threshold: number): ClassificationMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0

  for (const r of results) {
    const predicted = r.score >= threshold ? 1 : 0
    if (predicted === 1 && r.label === 1) tp++
    else if (predicted === 1 && r.label === 0) fp++
    else if (predicted === 0 && r.label === 0) tn++
    else fn++
  }

  const accuracy = (tp + tn) / results.length
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  return { threshold, accuracy, precision, recall, f1Score, tp, fp, tn, fn }
}

/**
 * Finds the best F1 threshold and returns metrics at that point.
 *
 * @param results - Array of prediction results.
 * @returns Best classification metrics.
 */
function findBestThreshold(results: PredictionResult[]): ClassificationMetrics {
  let bestMetrics = computeMetrics(results, 0.05)

  for (let t = 0.01; t <= 0.95; t += 0.01) {
    const m = computeMetrics(results, t)
    if (m.f1Score > bestMetrics.f1Score) bestMetrics = m
  }

  return bestMetrics
}

/**
 * Computes ROC AUC using the trapezoidal rule.
 *
 * @param results - Array of prediction results.
 * @returns ROC AUC value.
 */
function computeRocAuc(results: PredictionResult[]): number {
  const thresholds = Array.from({ length: 201 }, (_, i) => i / 200)
  const totalPositives = results.filter(r => r.label === 1).length
  const totalNegatives = results.filter(r => r.label === 0).length
  const points: Array<{ fpr: number; tpr: number }> = []

  for (const t of thresholds) {
    const m = computeMetrics(results, t)
    const tpr = totalPositives > 0 ? m.tp / totalPositives : 0
    const fpr = totalNegatives > 0 ? m.fp / totalNegatives : 0
    points.push({ fpr, tpr })
  }

  points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr)

  let auc = 0
  for (let i = 1; i < points.length; i++) {
    auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2
  }

  return auc
}

/**
 * Computes Average Precision (area under PR curve).
 *
 * @param results - Array of prediction results.
 * @returns Average Precision value.
 */
function computeAvgPrecision(results: PredictionResult[]): number {
  const sorted = [...results].sort((a, b) => b.score - a.score)
  const totalPositives = results.filter(r => r.label === 1).length
  if (totalPositives === 0) return 0

  let cumulativeTp = 0
  let avgPrecision = 0

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) {
      cumulativeTp++
      avgPrecision += cumulativeTp / (i + 1)
    }
  }

  return avgPrecision / totalPositives
}

// ── Parameter Sweep ───────────────────────────────────────────────────────────

/** Candidate k-gram lengths to sweep. */
const K_CANDIDATES = [5, 8, 10, 13, 15, 20, 23]

/** Candidate window sizes to sweep. */
const W_CANDIDATES = [3, 5, 8, 10, 13, 17]

/**
 * Runs parameter sweep on validation set.
 *
 * @param validPairs - Validation pair entries.
 * @param functions - Function lookup map.
 * @returns Sorted array of sweep results (best first).
 */
async function runParameterSweep(
  validPairs: PairEntry[], functions: Map<string, FunctionEntry>,
): Promise<SweepResult[]> {
  const sweepResults: SweepResult[] = []
  const totalConfigs = K_CANDIDATES.length * W_CANDIDATES.length

  console.log(`\n${"═".repeat(70)}`)
  console.log(`  PARAMETER SWEEP — ${totalConfigs} configurations on ${validPairs.length} validation pairs`)
  console.log(`${"═".repeat(70)}\n`)

  let configNum = 0

  for (const k of K_CANDIDATES) {
    for (const w of W_CANDIDATES) {
      configNum++
      console.log(`  [${configNum}/${totalConfigs}] k=${k}, window=${w}`)

      const results = await evaluatePairs(validPairs, functions, k, w)
      const best = findBestThreshold(results)
      const rocAuc = computeRocAuc(results)
      const avgPrec = computeAvgPrecision(results)

      sweepResults.push({
        kgramLength: k,
        windowSize: w,
        bestThreshold: best.threshold,
        bestF1: best.f1Score,
        rocAuc,
        avgPrecision: avgPrec,
        accuracy: best.accuracy,
        precision: best.precision,
        recall: best.recall,
      })
    }
  }

  // Sort by best F1 descending
  sweepResults.sort((a, b) => b.bestF1 - a.bestF1)

  return sweepResults
}

// ── Output ────────────────────────────────────────────────────────────────────

/**
 * Prints the sweep results as a ranked table.
 *
 * @param results - Sorted sweep results.
 */
function printSweepTable(results: SweepResult[]): void {
  console.log("\n╔═══════╦═══════╦══════════╦══════════╦══════════╦══════════╦══════════╦══════════╦══════════╗")
  console.log("║ Rank  ║  k/w  ║  Thresh. ║    F1    ║   Acc.   ║  Prec.   ║  Recall  ║ ROC-AUC  ║ Avg Prec ║")
  console.log("╠═══════╬═══════╬══════════╬══════════╬══════════╬══════════╬══════════╬══════════╬══════════╣")

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    console.log(
      `║ ${String(i + 1).padStart(4)}  ` +
      `║ ${String(r.kgramLength).padStart(2)}/${String(r.windowSize).padStart(2)} ` +
      `║   ${r.bestThreshold.toFixed(2)}   ` +
      `║ ${(r.bestF1 * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(r.accuracy * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(r.precision * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(r.recall * 100).toFixed(2).padStart(6)}% ` +
      `║  ${r.rocAuc.toFixed(4)}  ` +
      `║  ${r.avgPrecision.toFixed(4)}  ║`
    )
  }

  console.log("╚═══════╩═══════╩══════════╩══════════╩══════════╩══════════╩══════════╩══════════╩══════════╝")
}

/**
 * Prints a threshold sweep for a specific result set.
 *
 * @param results - Prediction results for a single config.
 * @param label - Label for the sweep (e.g. "TEST SET").
 */
function printThresholdSweep(results: PredictionResult[], label: string): void {
  const thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50,
                      0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]

  console.log(`\n  ${label} — THRESHOLD SWEEP:`)
  console.log("  ╔══════════╦══════════╦══════════╦══════════╦══════════╦═══════╦═══════╦═══════╗")
  console.log("  ║ Thresh.  ║ Accuracy ║ Precis.  ║ Recall   ║ F1-Score ║  TP   ║  FP   ║  FN   ║")
  console.log("  ╠══════════╬══════════╬══════════╬══════════╬══════════╬═══════╬═══════╬═══════╣")

  for (const t of thresholds) {
    const m = computeMetrics(results, t)
    console.log(
      `  ║  ${t.toFixed(2)}   ║ ${(m.accuracy * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(m.precision * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(m.recall * 100).toFixed(2).padStart(6)}% ` +
      `║ ${(m.f1Score * 100).toFixed(2).padStart(6)}% ` +
      `║ ${String(m.tp).padStart(5)} ║ ${String(m.fp).padStart(5)} ║ ${String(m.fn).padStart(5)} ║`
    )
  }

  console.log("  ╚══════════╩══════════╩══════════╩══════════╩══════════╩═══════╩═══════╩═══════╝")
}

/**
 * Prints score distribution histogram.
 *
 * @param results - Prediction results.
 */
function printScoreDistribution(results: PredictionResult[]): void {
  const cloneScores = results.filter(r => r.label === 1).map(r => r.score)
  const nonCloneScores = results.filter(r => r.label === 0).map(r => r.score)

  console.log("\n  SCORE DISTRIBUTION:")

  for (const [label, scores] of [["CLONES", cloneScores], ["NON-CLONES", nonCloneScores]] as const) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    const sorted = [...scores].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    console.log(`\n  ${label} (n=${scores.length}): Mean=${avg.toFixed(4)}, Median=${median.toFixed(4)}, Min=${sorted[0].toFixed(4)}, Max=${sorted[sorted.length - 1].toFixed(4)}`)

    for (let i = 0; i < 10; i++) {
      const lo = i / 10
      const hi = (i + 1) / 10
      const count = scores.filter(s => s >= lo && (i === 9 ? s <= hi : s < hi)).length
      const bar = "█".repeat(Math.round((count / scores.length) * 50))
      console.log(`  [${lo.toFixed(1)}-${hi.toFixed(1)}) ${String(count).padStart(5)} ${bar}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  ClassiFi — Winnowing Parameter Sweep + Evaluation              ║")
  console.log("║  Sweep (k, window) on VALIDATION → evaluate best on TEST       ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")

  // Verify dataset files
  for (const file of [DATA_JSONL, TEST_FILE, VALID_FILE]) {
    if (!fs.existsSync(file)) throw new Error(`Dataset file not found: ${file}`)
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Load functions
  console.log("\n  Loading functions from data.jsonl...")
  const functions = loadFunctions()
  console.log(`  Loaded ${functions.size} functions`)

  const validPairs = loadPairs(VALID_FILE)
  const testPairs = loadPairs(TEST_FILE)
  console.log(`  Validation: ${validPairs.length} pairs, Test: ${testPairs.length} pairs`)

  // ── Phase 1: Parameter Sweep on Validation ────────────────────────────────
  const sweepResults = await runParameterSweep(validPairs, functions)
  printSweepTable(sweepResults)

  const bestConfig = sweepResults[0]
  console.log(`\n  ★ BEST CONFIG: k=${bestConfig.kgramLength}, window=${bestConfig.windowSize}`)
  console.log(`    → F1=${(bestConfig.bestF1 * 100).toFixed(2)}% at threshold=${bestConfig.bestThreshold.toFixed(2)}`)
  console.log(`    → ROC-AUC=${bestConfig.rocAuc.toFixed(4)}, Avg Precision=${bestConfig.avgPrecision.toFixed(4)}`)

  // ── Phase 2: Evaluate Best Config on Test Set ─────────────────────────────
  console.log(`\n${"═".repeat(70)}`)
  console.log(`  EVALUATING BEST CONFIG ON TEST SET`)
  console.log(`  k=${bestConfig.kgramLength}, window=${bestConfig.windowSize}`)
  console.log(`${"═".repeat(70)}`)

  const testResults = await evaluatePairs(testPairs, functions, bestConfig.kgramLength, bestConfig.windowSize)

  // Apply the optimal threshold selected from validation
  const testMetrics = computeMetrics(testResults, bestConfig.bestThreshold)
  const testRocAuc = computeRocAuc(testResults)
  const testAvgPrecision = computeAvgPrecision(testResults)

  printThresholdSweep(testResults, "TEST SET")
  printScoreDistribution(testResults)

  // ── Also evaluate with production config (k=23, w=17) for comparison ──
  console.log(`\n${"═".repeat(70)}`)
  console.log(`  PRODUCTION CONFIG COMPARISON (k=23, w=17)`)
  console.log(`${"═".repeat(70)}`)

  const prodTestResults = await evaluatePairs(testPairs, functions, 23, 17)
  const prodBest = findBestThreshold(prodTestResults)
  const prodRocAuc = computeRocAuc(prodTestResults)
  const prodAvgPrecision = computeAvgPrecision(prodTestResults)

  // ── Summary Table ─────────────────────────────────────────────────────────
  console.log("\n\n" + "▓".repeat(70))
  console.log("▓  FINAL COMPARISON")
  console.log("▓".repeat(70))

  const bestTestBest = findBestThreshold(testResults)

  console.log("\n  ┌──────────────┬──────────────────────┬──────────────────────┐")
  console.log("  │    Metric    │  Production (k=23,w=17) │ Best Sweep Config   │")
  console.log("  ├──────────────┼──────────────────────┼──────────────────────┤")
  console.log(`  │ Config       │         k=23, w=17   │     k=${String(bestConfig.kgramLength).padStart(2)}, w=${String(bestConfig.windowSize).padStart(2)}     │`)
  console.log(`  │ Threshold    │            ${prodBest.threshold.toFixed(2)}      │            ${bestTestBest.threshold.toFixed(2)}      │`)
  console.log(`  │ Accuracy     │         ${(prodBest.accuracy * 100).toFixed(2).padStart(6)}%    │         ${(bestTestBest.accuracy * 100).toFixed(2).padStart(6)}%    │`)
  console.log(`  │ Precision    │         ${(prodBest.precision * 100).toFixed(2).padStart(6)}%    │         ${(bestTestBest.precision * 100).toFixed(2).padStart(6)}%    │`)
  console.log(`  │ Recall       │         ${(prodBest.recall * 100).toFixed(2).padStart(6)}%    │         ${(bestTestBest.recall * 100).toFixed(2).padStart(6)}%    │`)
  console.log(`  │ F1-Score     │         ${(prodBest.f1Score * 100).toFixed(2).padStart(6)}%    │         ${(bestTestBest.f1Score * 100).toFixed(2).padStart(6)}%    │`)
  console.log(`  │ ROC-AUC      │         ${prodRocAuc.toFixed(4).padStart(7)}     │         ${testRocAuc.toFixed(4).padStart(7)}     │`)
  console.log(`  │ Avg Prec.    │         ${prodAvgPrecision.toFixed(4).padStart(7)}     │         ${testAvgPrecision.toFixed(4).padStart(7)}     │`)
  console.log("  └──────────────┴──────────────────────┴──────────────────────┘")

  // ── Save all per-pair scores to JSON for hybrid analysis ──────────────────
  const outputPath = path.join(OUTPUT_DIR, "structural-sweep-results.json")
  const outputData = {
    sweepResults,
    bestConfig: {
      kgramLength: bestConfig.kgramLength,
      windowSize: bestConfig.windowSize,
      bestThreshold: bestConfig.bestThreshold,
    },
    productionConfig: {
      kgramLength: 23,
      windowSize: 17,
      test: { metrics: prodBest, rocAuc: prodRocAuc, avgPrecision: prodAvgPrecision },
    },
    bestConfigTest: {
      metrics: testMetrics,
      bestF1Metrics: bestTestBest,
      rocAuc: testRocAuc,
      avgPrecision: testAvgPrecision,
    },
    // Per-pair scores for hybrid computation with semantic model
    perPairScores: {
      validation: (await evaluatePairs(validPairs, functions, bestConfig.kgramLength, bestConfig.windowSize))
        .map(r => ({ id1: r.id1, id2: r.id2, label: r.label, structuralScore: r.score, lang: r.lang })),
      test: testResults
        .map(r => ({ id1: r.id1, id2: r.id2, label: r.label, structuralScore: r.score, lang: r.lang })),
    },
  }

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
  console.log(`\n  Results saved to: ${outputPath}`)
}

// ── Vitest entry point ────────────────────────────────────────────────────────
describe("Structural Analysis Parameter Sweep", () => {
  it("sweeps (k, window) on validation, evaluates best on test", { timeout: 1_800_000 }, async () => {
    await main()
  })
})
