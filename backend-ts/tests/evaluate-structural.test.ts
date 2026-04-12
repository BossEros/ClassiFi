/**
 * Structural Analysis Evaluation Script
 *
 * Evaluates ClassiFi's Winnowing engine against the same dataset used
 * for the GraphCodeBERT semantic model, producing classification metrics
 * (Accuracy, Precision, Recall, F1, ROC-AUC) for a proper ablation study.
 *
 * Usage (from backend-ts/):
 *   npx vitest run tests/evaluate-structural.test.ts --no-coverage
 */

import { describe, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// ── Configuration ─────────────────────────────────────────────────────────────

const SCRIPT_DIR = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")))
const DATASET_DIR = path.resolve(SCRIPT_DIR, "../../validation-training")
const DATA_JSONL = path.join(DATASET_DIR, "data.jsonl")
const TEST_FILE = path.join(DATASET_DIR, "test.txt")
const VALID_FILE = path.join(DATASET_DIR, "valid.txt")

/** Default Winnowing parameters (same as production) */
const KGRAM_LENGTH = 23
const KGRAMS_IN_WINDOW = 17

// ── Data Loading ──────────────────────────────────────────────────────────────

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

    pairs.push({
      id1: parts[0],
      id2: parts[1],
      label: parseInt(parts[2], 10),
      lang: parts[3] ?? "python",
    })
  }

  return pairs
}

// ── Winnowing Evaluation ──────────────────────────────────────────────────────

/**
 * Runs the Winnowing detector on a single pair and returns the similarity score.
 *
 * @param func1 - Source code of function 1.
 * @param func2 - Source code of function 2.
 * @param lang - Programming language.
 * @returns Structural similarity score (0.0 – 1.0).
 */
async function getStructuralSimilarity(
  func1: string,
  func2: string,
  lang: string,
): Promise<number> {
  const detector = new PlagiarismDetector({
    language: lang as "python" | "java" | "c",
    kgramLength: KGRAM_LENGTH,
    kgramsInWindow: KGRAMS_IN_WINDOW,
    minFragmentLength: 2,
  })

  const file1 = new File("file1." + getExtension(lang), func1)
  const file2 = new File("file2." + getExtension(lang), func2)

  const report = await detector.analyze([file1, file2])
  const pairs = report.getPairs()

  if (pairs.length === 0) return 0.0

  return pairs[0].similarity
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

// ── Metrics Computation ───────────────────────────────────────────────────────

interface PredictionResult {
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
  truePositives: number
  falsePositives: number
  trueNegatives: number
  falseNegatives: number
}

/**
 * Computes classification metrics at a given threshold.
 *
 * @param results - Array of prediction results.
 * @param threshold - Decision threshold for positive classification.
 * @returns Classification metrics object.
 */
function computeMetrics(results: PredictionResult[], threshold: number): ClassificationMetrics {
  let truePositives = 0
  let falsePositives = 0
  let trueNegatives = 0
  let falseNegatives = 0

  for (const result of results) {
    const predicted = result.score >= threshold ? 1 : 0

    if (predicted === 1 && result.label === 1) truePositives++
    else if (predicted === 1 && result.label === 0) falsePositives++
    else if (predicted === 0 && result.label === 0) trueNegatives++
    else falseNegatives++
  }

  const accuracy = (truePositives + trueNegatives) / results.length
  const precision = truePositives + falsePositives > 0
    ? truePositives / (truePositives + falsePositives) : 0
  const recall = truePositives + falseNegatives > 0
    ? truePositives / (truePositives + falseNegatives) : 0
  const f1Score = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall) : 0

  return {
    threshold,
    accuracy,
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
  }
}

/**
 * Computes the ROC AUC using the trapezoidal rule.
 *
 * @param results - Array of prediction results.
 * @returns ROC AUC value.
 */
function computeRocAuc(results: PredictionResult[]): number {
  const thresholds = Array.from({ length: 201 }, (_, i) => i / 200)
  const points: Array<{ fpr: number; tpr: number }> = []

  for (const threshold of thresholds) {
    const metrics = computeMetrics(results, threshold)
    const totalPositives = results.filter(r => r.label === 1).length
    const totalNegatives = results.filter(r => r.label === 0).length

    const tpr = totalPositives > 0 ? metrics.truePositives / totalPositives : 0
    const fpr = totalNegatives > 0 ? metrics.falsePositives / totalNegatives : 0

    points.push({ fpr, tpr })
  }

  // Sort by FPR ascending for trapezoidal integration
  points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr)

  let auc = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].fpr - points[i - 1].fpr
    const avgY = (points[i].tpr + points[i - 1].tpr) / 2
    auc += dx * avgY
  }

  return auc
}

/**
 * Computes Average Precision (area under PR curve).
 *
 * @param results - Array of prediction results.
 * @returns Average Precision value.
 */
function computeAveragePrecision(results: PredictionResult[]): number {
  // Sort by score descending
  const sorted = [...results].sort((a, b) => b.score - a.score)

  let cumulativeTp = 0
  let avgPrecision = 0
  const totalPositives = results.filter(r => r.label === 1).length

  if (totalPositives === 0) return 0

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) {
      cumulativeTp++
      const precision = cumulativeTp / (i + 1)
      avgPrecision += precision
    }
  }

  return avgPrecision / totalPositives
}

// ── Per-Language Breakdown ────────────────────────────────────────────────────

/**
 * Prints metrics broken down by programming language.
 *
 * @param results - Array of prediction results.
 * @param threshold - Decision threshold.
 */
function printLanguageBreakdown(results: PredictionResult[], threshold: number): void {
  const languages = [...new Set(results.map(r => r.lang))]

  console.log("\n╔══════════════════════════════════════════════════════════════╗")
  console.log("║              PER-LANGUAGE BREAKDOWN                        ║")
  console.log("╠══════════════════════════════════════════════════════════════╣")

  for (const lang of languages.sort()) {
    const langResults = results.filter(r => r.lang === lang)
    const metrics = computeMetrics(langResults, threshold)
    const clones = langResults.filter(r => r.label === 1).length
    const nonClones = langResults.filter(r => r.label === 0).length

    console.log(`\n  Language: ${lang.toUpperCase()}`)
    console.log(`  Pairs: ${langResults.length} (clones: ${clones}, non-clones: ${nonClones})`)
    console.log(`  Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`)
    console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`)
    console.log(`  Recall:    ${(metrics.recall * 100).toFixed(2)}%`)
    console.log(`  F1-Score:  ${(metrics.f1Score * 100).toFixed(2)}%`)
    console.log(`  TP=${metrics.truePositives} FP=${metrics.falsePositives} TN=${metrics.trueNegatives} FN=${metrics.falseNegatives}`)
  }

  console.log("\n╚══════════════════════════════════════════════════════════════╝")
}

// ── Score Distribution ───────────────────────────────────────────────────────

/**
 * Prints a histogram-style distribution of scores for clones vs non-clones.
 *
 * @param results - Array of prediction results.
 */
function printScoreDistribution(results: PredictionResult[]): void {
  const cloneScores = results.filter(r => r.label === 1).map(r => r.score)
  const nonCloneScores = results.filter(r => r.label === 0).map(r => r.score)

  const buckets = 10

  console.log("\n╔══════════════════════════════════════════════════════════════╗")
  console.log("║              SCORE DISTRIBUTION                            ║")
  console.log("╠══════════════════════════════════════════════════════════════╣")

  for (const [label, scores] of [["CLONES", cloneScores], ["NON-CLONES", nonCloneScores]] as const) {
    console.log(`\n  ${label} (n=${scores.length}):`)

    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    const sorted = [...scores].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    console.log(`  Mean: ${avg.toFixed(4)}, Median: ${median.toFixed(4)}, Min: ${sorted[0].toFixed(4)}, Max: ${sorted[sorted.length - 1].toFixed(4)}`)

    for (let i = 0; i < buckets; i++) {
      const lo = i / buckets
      const hi = (i + 1) / buckets
      const count = scores.filter(s => s >= lo && (i === buckets - 1 ? s <= hi : s < hi)).length
      const bar = "█".repeat(Math.round((count / scores.length) * 50))
      console.log(`  [${lo.toFixed(1)}-${hi.toFixed(1)}) ${String(count).padStart(5)} ${bar}`)
    }
  }

  console.log("\n╚══════════════════════════════════════════════════════════════╝")
}

// ── Threshold Sweep ──────────────────────────────────────────────────────────

/**
 * Prints metrics at multiple thresholds to help find the optimal point.
 *
 * @param results - Array of prediction results.
 */
function printThresholdSweep(results: PredictionResult[]): void {
  const thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50,
                      0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95]

  console.log("\n╔══════════════════════════════════════════════════════════════════════════════╗")
  console.log("║                         THRESHOLD SWEEP                                     ║")
  console.log("╠══════════╦══════════╦══════════╦══════════╦══════════╦═══════╦═══════╦═══════╣")
  console.log("║ Thresh.  ║ Accuracy ║ Precis.  ║ Recall   ║ F1-Score ║  TP   ║  FP   ║  FN   ║")
  console.log("╠══════════╬══════════╬══════════╬══════════╬══════════╬═══════╬═══════╬═══════╣")

  let bestF1 = 0
  let bestThreshold = 0

  for (const t of thresholds) {
    const m = computeMetrics(results, t)

    if (m.f1Score > bestF1) {
      bestF1 = m.f1Score
      bestThreshold = t
    }

    console.log(
      `║  ${t.toFixed(2)}   ║ ${(m.accuracy * 100).toFixed(2).padStart(6)}%` +
      ` ║ ${(m.precision * 100).toFixed(2).padStart(6)}%` +
      ` ║ ${(m.recall * 100).toFixed(2).padStart(6)}%` +
      ` ║ ${(m.f1Score * 100).toFixed(2).padStart(6)}%` +
      ` ║ ${String(m.truePositives).padStart(5)}` +
      ` ║ ${String(m.falsePositives).padStart(5)}` +
      ` ║ ${String(m.falseNegatives).padStart(5)} ║`
    )
  }

  console.log("╚══════════╩══════════╩══════════╩══════════╩══════════╩═══════╩═══════╩═══════╝")
  console.log(`\n  >> Best F1-Score: ${(bestF1 * 100).toFixed(2)}% at threshold = ${bestThreshold.toFixed(2)}`)

  return
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function evaluateSplit(splitName: string, splitPath: string, functions: Map<string, FunctionEntry>): Promise<PredictionResult[]> {
  const pairs = loadPairs(splitPath)
  const results: PredictionResult[] = []
  let skipped = 0
  let errors = 0

  console.log(`\n${"=".repeat(70)}`)
  console.log(`  Evaluating: ${splitName} (${pairs.length} pairs)`)
  console.log(`${"=".repeat(70)}\n`)

  const startTime = Date.now()

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]
    const func1 = functions.get(pair.id1)
    const func2 = functions.get(pair.id2)

    if (!func1 || !func2) {
      skipped++
      continue
    }

    try {
      const score = await getStructuralSimilarity(func1.func, func2.func, pair.lang)
      results.push({ label: pair.label, score, lang: pair.lang })
    } catch {
      errors++
      results.push({ label: pair.label, score: 0.0, lang: pair.lang })
    }

    // Progress indicator every 50 pairs
    if ((i + 1) % 50 === 0 || i === pairs.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const pairPerSec = ((i + 1) / ((Date.now() - startTime) / 1000)).toFixed(1)
      process.stdout.write(`\r  Progress: ${i + 1}/${pairs.length} (${elapsed}s, ${pairPerSec} pairs/s, ${errors} errors, ${skipped} skipped)`)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n  Completed in ${totalTime}s — ${results.length} scored, ${skipped} skipped, ${errors} errors`)

  return results
}

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗")
  console.log("║    ClassiFi — Structural Analysis (Winnowing) Evaluation    ║")
  console.log("║    k-gram: 23, window: 17, AST tokenization via Tree-Sitter║")
  console.log("╚══════════════════════════════════════════════════════════════╝")

  // Verify dataset files exist
  for (const file of [DATA_JSONL, TEST_FILE, VALID_FILE]) {
    if (!fs.existsSync(file)) {
      throw new Error(`Dataset file not found: ${file}`)
    }
  }

  // Load functions
  console.log("\n  Loading functions from data.jsonl...")
  const functions = loadFunctions()
  console.log(`  Loaded ${functions.size} functions`)

  // ── Evaluate Validation Set ─────────────────────────────────────────────
  const validResults = await evaluateSplit("VALIDATION SET", VALID_FILE, functions)

  // ── Evaluate Test Set ───────────────────────────────────────────────────
  const testResults = await evaluateSplit("TEST SET", TEST_FILE, functions)

  // ── Results for Validation ──────────────────────────────────────────────
  console.log("\n\n" + "▓".repeat(70))
  console.log("▓  VALIDATION SET RESULTS")
  console.log("▓".repeat(70))

  printThresholdSweep(validResults)
  printScoreDistribution(validResults)
  printLanguageBreakdown(validResults, 0.50) // default threshold

  const validRocAuc = computeRocAuc(validResults)
  const validAvgPrecision = computeAveragePrecision(validResults)
  console.log(`\n  ROC-AUC:           ${validRocAuc.toFixed(4)}`)
  console.log(`  Average Precision: ${validAvgPrecision.toFixed(4)}`)

  // ── Results for Test ────────────────────────────────────────────────────
  console.log("\n\n" + "▓".repeat(70))
  console.log("▓  TEST SET RESULTS")
  console.log("▓".repeat(70))

  printThresholdSweep(testResults)
  printScoreDistribution(testResults)
  printLanguageBreakdown(testResults, 0.50) // default threshold

  const testRocAuc = computeRocAuc(testResults)
  const testAvgPrecision = computeAveragePrecision(testResults)
  console.log(`\n  ROC-AUC:           ${testRocAuc.toFixed(4)}`)
  console.log(`  Average Precision: ${testAvgPrecision.toFixed(4)}`)

  // ── Comparison Summary ──────────────────────────────────────────────────
  // Find the best threshold from validation and apply it to test
  let bestF1 = 0
  let bestThreshold = 0
  for (let t = 0.05; t <= 0.95; t += 0.05) {
    const m = computeMetrics(validResults, t)
    if (m.f1Score > bestF1) {
      bestF1 = m.f1Score
      bestThreshold = t
    }
  }

  const validBest = computeMetrics(validResults, bestThreshold)
  const testAtBest = computeMetrics(testResults, bestThreshold)

  console.log("\n\n" + "▓".repeat(70))
  console.log("▓  SUMMARY — OPTIMAL THRESHOLD FROM VALIDATION")
  console.log("▓".repeat(70))
  console.log(`\n  Optimal Threshold: ${bestThreshold.toFixed(2)} (selected by best F1 on validation)`)
  console.log("")
  console.log("  ┌────────────┬────────────┬────────────┐")
  console.log("  │   Metric   │ Validation │    Test    │")
  console.log("  ├────────────┼────────────┼────────────┤")
  console.log(`  │ Accuracy   │ ${(validBest.accuracy * 100).toFixed(2).padStart(8)}% │ ${(testAtBest.accuracy * 100).toFixed(2).padStart(8)}% │`)
  console.log(`  │ Precision  │ ${(validBest.precision * 100).toFixed(2).padStart(8)}% │ ${(testAtBest.precision * 100).toFixed(2).padStart(8)}% │`)
  console.log(`  │ Recall     │ ${(validBest.recall * 100).toFixed(2).padStart(8)}% │ ${(testAtBest.recall * 100).toFixed(2).padStart(8)}% │`)
  console.log(`  │ F1-Score   │ ${(validBest.f1Score * 100).toFixed(2).padStart(8)}% │ ${(testAtBest.f1Score * 100).toFixed(2).padStart(8)}% │`)
  console.log(`  │ ROC-AUC    │ ${validRocAuc.toFixed(4).padStart(9)} │ ${testRocAuc.toFixed(4).padStart(9)} │`)
  console.log(`  │ Avg Prec.  │ ${validAvgPrecision.toFixed(4).padStart(9)} │ ${testAvgPrecision.toFixed(4).padStart(9)} │`)
  console.log("  └────────────┴────────────┴────────────┘")

  // ── Save raw scores to JSON for further analysis ────────────────────────
  const outputPath = path.resolve(SCRIPT_DIR, "../structural-evaluation-results.json")
  const outputData = {
    config: { kgramLength: KGRAM_LENGTH, kgramsInWindow: KGRAMS_IN_WINDOW },
    optimalThreshold: bestThreshold,
    validation: {
      metrics: validBest,
      rocAuc: validRocAuc,
      averagePrecision: validAvgPrecision,
      scores: validResults,
    },
    test: {
      metrics: testAtBest,
      rocAuc: testRocAuc,
      averagePrecision: testAvgPrecision,
      scores: testResults,
    },
  }
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
  console.log(`\n  Raw results saved to: ${outputPath}`)
}

// ── Vitest entry point ────────────────────────────────────────────────────────
describe("Structural Analysis Evaluation", () => {
  it("evaluates Winnowing engine on validation + test sets", { timeout: 600_000 }, async () => {
    await main()
  })
})
