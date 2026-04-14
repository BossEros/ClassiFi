/**
 * IR-Plag Comprehensive Metrics Analysis Script
 *
 * Reads the existing ir-plag-evaluation-results.json (460 pairs with
 * structural, semantic, and hybrid scores) and computes ALL metrics
 * needed for the thesis:
 *
 * Per mode (Structural / Semantic / Hybrid):
 *   - ROC-AUC (threshold-free ranking quality)
 *   - F1 @ optimal threshold
 *   - Precision / Recall @ optimal threshold
 *   - MCC (Matthews Correlation Coefficient) @ optimal threshold
 *   - MAP (Mean Average Precision) — canonical IR-Plag metric
 *   - Detection rate by plagiarism type (Type 1–4) at multiple thresholds
 *   - Precision@5 / Recall@10 (decision-support ranking metrics)
 *
 * Cross-mode:
 *   - Unified comparison table (Type × Structural Mean × Semantic Mean × Hybrid Mean)
 *   - Hybrid vs Structural-only improvement deltas
 *   - Cohen's d effect size (hybrid vs structural)
 *   - Wilcoxon signed-rank test (statistical significance)
 *   - MAP per task (7 IR-Plag cases) for consistency analysis
 *   - Separation ratio (mean plagiarized / mean non-plagiarized)
 *
 * Plagiarism Type Mapping (Faidhi & Robinson → Standard Code Clone Types):
 *   Type 1 (Cosmetic)   → L1: whitespace/comment changes
 *   Type 2 (Renaming)   → L2: identifier renaming
 *   Type 3 (Structural) → L3 + L4 + L5: statement reordering, code additions, control flow changes
 *   Type 4 (Semantic)   → L6: algorithmic/logic changes
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/analyze-ir-plag-metrics.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { computeRankingMetricsAtK } from "./shared/ranking-metrics.js"

// -- Paths & Constants ---------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const INPUT_FILE = path.join(RESULT_DIR, "ir-plag-evaluation-results.json")
const OUTPUT_FILE = path.join(RESULT_DIR, "ir-plag-comprehensive-metrics.json")

const PLAGIARISM_TYPES = ["Type 1", "Type 2", "Type 3", "Type 4"] as const
const DETECTION_THRESHOLDS = [0.25, 0.30, 0.40, 0.50, 0.54, 0.75]

/**
 * Maps Faidhi & Robinson plagiarism levels (L1–L6) to standard code clone types (Type 1–4).
 *
 * Type 1 (Cosmetic)   → L1: whitespace/comment changes only
 * Type 2 (Renaming)   → L2: identifier renaming
 * Type 3 (Structural) → L3 + L4 + L5: statement reordering, code additions, control flow changes
 * Type 4 (Semantic)   → L6: algorithmic/logic changes
 */
const FR_LEVEL_TO_TYPE: Record<string, PlagiarismType> = {
  L1: "Type 1",
  L2: "Type 2",
  L3: "Type 3",
  L4: "Type 3",
  L5: "Type 3",
  L6: "Type 4",
}

const TYPE_DESCRIPTIONS: Record<PlagiarismType, string> = {
  "Type 1": "Cosmetic (whitespace/comments)",
  "Type 2": "Renaming (identifiers)",
  "Type 3": "Structural (reorder/additions/control flow)",
  "Type 4": "Semantic (algorithmic changes)",
}

type PlagiarismType = (typeof PLAGIARISM_TYPES)[number]
type PlagiarismLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
type ScoreMode = "structural" | "semantic" | "hybrid"

// -- Types ---------------------------------------------------------------------

interface PairResult {
  case: string
  file: string
  level: PlagiarismLevel | "non-plagiarized"
  label: 1 | 0
  structuralScore: number
  semanticScore: number
  hybridScore: number
}

interface InputData {
  config: {
    k: number
    w: number
    structuralWeight: number
    semanticWeight: number
  }
  dataset: string
  totalPairs: number
  wallTimeSeconds: number
  results: PairResult[]
}

interface ThresholdMetrics {
  threshold: number
  tp: number
  fp: number
  tn: number
  fn: number
  precision: number
  recall: number
  f1Score: number
  accuracy: number
}

interface LevelMetrics {
  level: string
  count: number
  meanScore: number
  minScore: number
  maxScore: number
  stdDev: number
  detectionRates: Record<string, number>
}

interface ModeMetrics {
  mode: ScoreMode
  rocAuc: number
  bestThreshold: ThresholdMetrics
  mcc: number
  map: number
  mapPerType: Record<string, number>
  mapPerTask: Record<string, number>
  precisionAt5: number
  recallAt10: number
  levelBreakdown: LevelMetrics[]
  scoreDistribution: {
    positives: { mean: number; median: number; min: number; max: number; stdDev: number }
    negatives: { mean: number; median: number; min: number; max: number; stdDev: number }
  }
  separationRatio: number
}

// -- Score Accessor ------------------------------------------------------------

function getScore(result: PairResult, mode: ScoreMode): number {
  if (mode === "structural") return result.structuralScore
  if (mode === "semantic") return result.semanticScore
  return result.hybridScore
}

// -- Statistical Helpers -------------------------------------------------------

function computeStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0
  const sumSquaredDiffs = values.reduce((sum, v) => sum + (v - mean) ** 2, 0)
  return Math.sqrt(sumSquaredDiffs / (values.length - 1))
}

function computeDistributionStats(values: number[]) {
  if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  return {
    mean: round(mean, 6),
    median: round(median, 6),
    min: round(sorted[0], 6),
    max: round(sorted[sorted.length - 1], 6),
    stdDev: round(computeStdDev(values, mean), 6),
  }
}

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

// -- Mean Average Precision (MAP) — Canonical IR-Plag Metric -------------------

/**
 * Computes Average Precision for a single query (sorted by descending score).
 * AP = (1/R) × Σ(Precision@k × rel(k)) where R = total relevant items.
 */
function computeAveragePrecision(items: PairResult[], mode: ScoreMode): number {
  const sorted = [...items].sort((a, b) => getScore(b, mode) - getScore(a, mode))
  const totalRelevant = sorted.filter(r => r.label === 1).length

  if (totalRelevant === 0) return 0

  let relevantSoFar = 0
  let sumPrecision = 0

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) {
      relevantSoFar++
      sumPrecision += relevantSoFar / (i + 1)
    }
  }

  return sumPrecision / totalRelevant
}

/**
 * Computes MAP (Mean Average Precision) across all tasks in the dataset.
 * Groups by case, computes AP per case, then averages.
 */
function computeMAP(results: PairResult[], mode: ScoreMode): number {
  const caseGroups = groupByCase(results)
  const averagePrecisions: number[] = []

  for (const caseResults of Object.values(caseGroups)) {
    averagePrecisions.push(computeAveragePrecision(caseResults, mode))
  }

  return averagePrecisions.length > 0
    ? averagePrecisions.reduce((sum, ap) => sum + ap, 0) / averagePrecisions.length
    : 0
}

/**
 * Computes MAP per plagiarism type — filters to pairs of a given type + non-plagiarized,
 * then computes MAP across tasks for that subset.
 */
function computeMAPPerType(results: PairResult[], mode: ScoreMode): Record<string, number> {
  const mapPerType: Record<string, number> = {}

  for (const type of PLAGIARISM_TYPES) {
    const filteredResults = results.filter(r => {
      if (r.level === "non-plagiarized") return true
      return FR_LEVEL_TO_TYPE[r.level] === type
    })

    mapPerType[type] = computeMAP(filteredResults, mode)
  }

  mapPerType["Overall"] = computeMAP(results, mode)

  return mapPerType
}

/**
 * Computes MAP per task (case) for a given mode.
 */
function computeMAPPerTask(results: PairResult[], mode: ScoreMode): Record<string, number> {
  const caseGroups = groupByCase(results)
  const mapPerTask: Record<string, number> = {}

  for (const [caseName, caseResults] of Object.entries(caseGroups)) {
    mapPerTask[caseName] = computeAveragePrecision(caseResults, mode)
  }

  return mapPerTask
}

function groupByCase(results: PairResult[]): Record<string, PairResult[]> {
  const groups: Record<string, PairResult[]> = {}

  for (const r of results) {
    if (!groups[r.case]) groups[r.case] = []
    groups[r.case].push(r)
  }

  return groups
}

// -- Matthews Correlation Coefficient (MCC) ------------------------------------

/**
 * MCC uses all four confusion matrix values and is considered more informative
 * than F1 for imbalanced datasets. Range: [-1, +1], where +1 = perfect.
 */
function computeMCC(tp: number, fp: number, tn: number, fn: number): number {
  const numerator = (tp * tn) - (fp * fn)
  const denominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))

  return denominator === 0 ? 0 : numerator / denominator
}

// -- Cohen's d Effect Size -----------------------------------------------------

/**
 * Computes Cohen's d between two paired score distributions.
 * Uses pooled standard deviation. Interpretation:
 *   |d| < 0.2  = negligible
 *   0.2–0.5    = small
 *   0.5–0.8    = medium
 *   > 0.8      = large
 */
function computeCohensD(scoresA: number[], scoresB: number[]): number {
  const meanA = scoresA.reduce((s, v) => s + v, 0) / scoresA.length
  const meanB = scoresB.reduce((s, v) => s + v, 0) / scoresB.length
  const varA = scoresA.reduce((s, v) => s + (v - meanA) ** 2, 0) / (scoresA.length - 1)
  const varB = scoresB.reduce((s, v) => s + (v - meanB) ** 2, 0) / (scoresB.length - 1)
  const pooledStdDev = Math.sqrt((varA + varB) / 2)

  return pooledStdDev === 0 ? 0 : (meanB - meanA) / pooledStdDev
}

function interpretCohensD(d: number): string {
  const abs = Math.abs(d)
  if (abs < 0.2) return "negligible"
  if (abs < 0.5) return "small"
  if (abs < 0.8) return "medium"
  return "large"
}

// -- Wilcoxon Signed-Rank Test (Statistical Significance) ----------------------

interface WilcoxonResult {
  testStatistic: number
  zScore: number
  pValue: number
  isSignificant: boolean
  sampleSize: number
}

/**
 * Wilcoxon signed-rank test for paired samples (hybrid vs structural scores).
 * Non-parametric alternative to paired t-test. Uses normal approximation for n > 20.
 */
function wilcoxonSignedRankTest(scoresA: number[], scoresB: number[]): WilcoxonResult {
  const differences = scoresA.map((a, i) => scoresB[i] - a).filter(d => d !== 0)
  const n = differences.length

  if (n === 0) {
    return { testStatistic: 0, zScore: 0, pValue: 1, isSignificant: false, sampleSize: 0 }
  }

  // Rank the absolute differences
  const ranked = differences
    .map((d, i) => ({ index: i, absDiff: Math.abs(d), sign: d > 0 ? 1 : -1 }))
    .sort((a, b) => a.absDiff - b.absDiff)

  // Assign ranks with tie handling (average rank)
  const ranks = new Array<number>(ranked.length)
  let i = 0

  while (i < ranked.length) {
    let j = i
    while (j < ranked.length && ranked[j].absDiff === ranked[i].absDiff) j++
    const avgRank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) ranks[k] = avgRank
    i = j
  }

  // Compute W+ (sum of ranks for positive differences)
  let wPlus = 0

  for (let idx = 0; idx < ranked.length; idx++) {
    if (ranked[idx].sign > 0) wPlus += ranks[idx]
  }

  const wMinus = (n * (n + 1)) / 2 - wPlus
  const testStatistic = Math.min(wPlus, wMinus)

  // Normal approximation (valid for n > 20; we have 460 pairs)
  const meanW = (n * (n + 1)) / 4
  const stdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const zScore = stdW === 0 ? 0 : (testStatistic - meanW) / stdW

  // Two-tailed p-value using normal approximation
  const pValue = 2 * normalCDF(-Math.abs(zScore))

  return { testStatistic, zScore, pValue, isSignificant: pValue < 0.05, sampleSize: n }
}

/**
 * Standard normal CDF approximation (Abramowitz & Stegun).
 */
function normalCDF(z: number): number {
  if (z < -8) return 0
  if (z > 8) return 1

  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1.0 + sign * y)
}

// -- ROC-AUC (Wilcoxon-Mann-Whitney statistic) ---------------------------------

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

// -- Threshold-based Classification -------------------------------------------

function classifyAtThreshold(results: PairResult[], mode: ScoreMode, threshold: number): ThresholdMetrics {
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
  const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
  const accuracy = (tp + tn) / results.length

  return {
    threshold: round(threshold, 6),
    tp, fp, tn, fn,
    precision: round(precision, 6),
    recall: round(recall, 6),
    f1Score: round(f1Score, 6),
    accuracy: round(accuracy, 6),
  }
}

function findBestF1Threshold(results: PairResult[], mode: ScoreMode): ThresholdMetrics {
  const scores = results.map(r => getScore(r, mode)).sort((a, b) => a - b)
  const candidates = [...new Set(scores)]

  let bestMetrics: ThresholdMetrics | null = null

  for (const threshold of candidates) {
    const metrics = classifyAtThreshold(results, mode, threshold)

    if (!bestMetrics || metrics.f1Score > bestMetrics.f1Score) {
      bestMetrics = metrics
    }
  }

  return bestMetrics ?? classifyAtThreshold(results, mode, 0.5)
}

// -- Per-Type Detection Rate ---------------------------------------------------

/**
 * Groups results by standard plagiarism type (Type 1–4) plus non-plagiarized,
 * aggregating L3+L4+L5 into Type 3.
 */
function computeTypeMetrics(results: PairResult[], mode: ScoreMode): LevelMetrics[] {
  const allTypes: Array<PlagiarismType | "Non-Plagiarized"> = [...PLAGIARISM_TYPES, "Non-Plagiarized"]
  const typeMetrics: LevelMetrics[] = []

  for (const type of allTypes) {
    const typeResults = type === "Non-Plagiarized"
      ? results.filter(r => r.level === "non-plagiarized")
      : results.filter(r => r.level !== "non-plagiarized" && FR_LEVEL_TO_TYPE[r.level] === type)

    if (typeResults.length === 0) continue

    const scores = typeResults.map(r => getScore(r, mode))
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length

    const detectionRates: Record<string, number> = {}
    for (const threshold of DETECTION_THRESHOLDS) {
      const detectedCount = typeResults.filter(r => getScore(r, mode) >= threshold).length
      detectionRates[`@${threshold}`] = round(detectedCount / typeResults.length, 4)
    }

    typeMetrics.push({
      level: type,
      count: typeResults.length,
      meanScore: round(mean, 4),
      minScore: round(Math.min(...scores), 4),
      maxScore: round(Math.max(...scores), 4),
      stdDev: round(computeStdDev(scores, mean), 4),
      detectionRates,
    })
  }

  return typeMetrics
}

// -- Full Mode Metrics ---------------------------------------------------------

function computeModeMetrics(results: PairResult[], mode: ScoreMode): ModeMetrics {
  const rocAuc = computeRocAuc(results, mode)
  const bestThreshold = findBestF1Threshold(results, mode)
  const levelBreakdown = computeTypeMetrics(results, mode)

  const bt = bestThreshold
  const mcc = computeMCC(bt.tp, bt.fp, bt.tn, bt.fn)
  const map = computeMAP(results, mode)
  const mapPerType = computeMAPPerType(results, mode)
  const mapPerTask = computeMAPPerTask(results, mode)

  const precisionAt5 = computeRankingMetricsAtK(
    results, r => getScore(r, mode), r => r.label === 1, 5,
  )
  const recallAt10 = computeRankingMetricsAtK(
    results, r => getScore(r, mode), r => r.label === 1, 10,
  )

  const positiveScores = results.filter(r => r.label === 1).map(r => getScore(r, mode))
  const negativeScores = results.filter(r => r.label === 0).map(r => getScore(r, mode))
  const posMean = positiveScores.reduce((s, v) => s + v, 0) / positiveScores.length
  const negMean = negativeScores.reduce((s, v) => s + v, 0) / negativeScores.length
  const separationRatio = negMean > 0 ? posMean / negMean : 0

  return {
    mode,
    rocAuc: round(rocAuc, 6),
    bestThreshold,
    mcc: round(mcc, 6),
    map: round(map, 6),
    mapPerType: Object.fromEntries(Object.entries(mapPerType).map(([k, v]) => [k, round(v, 6)])),
    mapPerTask: Object.fromEntries(Object.entries(mapPerTask).map(([k, v]) => [k, round(v, 6)])),
    precisionAt5: round(precisionAt5.precision, 4),
    recallAt10: round(recallAt10.recall, 4),
    levelBreakdown,
    scoreDistribution: {
      positives: computeDistributionStats(positiveScores),
      negatives: computeDistributionStats(negativeScores),
    },
    separationRatio: round(separationRatio, 4),
  }
}

// -- Console Formatting --------------------------------------------------------

const SEPARATOR = "─".repeat(94)
const DOUBLE_SEP = "═".repeat(94)

function printHeader(results: PairResult[], config: InputData["config"]): void {
  const positives = results.filter(r => r.label === 1).length
  const negatives = results.filter(r => r.label === 0).length

  console.log(`\n${DOUBLE_SEP}`)
  console.log("  IR-PLAG COMPREHENSIVE METRICS — THESIS EVALUATION REPORT")
  console.log("  ClassiFi  |  Winnowing k=23,w=17  |  GraphCodeBERT  |  Hybrid 0.7/0.3")
  console.log(DOUBLE_SEP)
  console.log(`  Dataset    : IR-Plag (Karnalim, 2020)`)
  console.log(`  Total Pairs: ${results.length}  |  ${positives} plagiarized (Type 1–4)  |  ${negatives} non-plagiarized`)
  console.log(`  Hybrid     : ${config.structuralWeight} × structural + ${config.semanticWeight} × semantic`)
}

function printModeSection(metrics: ModeMetrics): void {
  const modeLabels: Record<ScoreMode, string> = {
    structural: "STRUCTURAL (Winnowing)",
    semantic: "SEMANTIC (GraphCodeBERT)",
    hybrid: "HYBRID (0.7 × Structural + 0.3 × Semantic)",
  }

  console.log(`\n${DOUBLE_SEP}`)
  console.log(`  ${modeLabels[metrics.mode]}`)
  console.log(DOUBLE_SEP)

  // Primary metrics
  console.log(`\n  Primary Metrics`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  ROC-AUC              : ${metrics.rocAuc.toFixed(4)}`)
  console.log(`  MAP (overall)        : ${metrics.map.toFixed(4)}`)
  console.log(`  F1 @ optimal         : ${(metrics.bestThreshold.f1Score * 100).toFixed(2)}%  (threshold = ${metrics.bestThreshold.threshold.toFixed(4)})`)
  console.log(`  MCC @ optimal        : ${metrics.mcc.toFixed(4)}`)
  console.log(`  Precision @ optimal  : ${(metrics.bestThreshold.precision * 100).toFixed(2)}%`)
  console.log(`  Recall @ optimal     : ${(metrics.bestThreshold.recall * 100).toFixed(2)}%`)
  console.log(`  Accuracy @ optimal   : ${(metrics.bestThreshold.accuracy * 100).toFixed(2)}%`)
  console.log(`  Precision@5          : ${(metrics.precisionAt5 * 100).toFixed(2)}%`)
  console.log(`  Recall@10            : ${(metrics.recallAt10 * 100).toFixed(2)}%`)
  console.log(`  Separation Ratio     : ${metrics.separationRatio.toFixed(4)}  (plagiarized mean / non-plagiarized mean)`)

  // MAP per plagiarism type
  console.log(`\n  MAP by Plagiarism Type`)
  console.log(`  ${SEPARATOR}`)
  for (const type of PLAGIARISM_TYPES) {
    console.log(`  ${type.padEnd(18)} : ${metrics.mapPerType[type].toFixed(4)}`)
  }

  // MAP per task
  console.log(`\n  MAP by Task (Case)`)
  console.log(`  ${SEPARATOR}`)
  const taskNames = Object.keys(metrics.mapPerTask).sort()
  for (const task of taskNames) {
    console.log(`  ${task.padEnd(18)} : ${metrics.mapPerTask[task].toFixed(4)}`)
  }
  const taskValues = Object.values(metrics.mapPerTask)
  const taskMean = taskValues.reduce((s, v) => s + v, 0) / taskValues.length
  const taskStdDev = computeStdDev(taskValues, taskMean)
  console.log(`  ${"Mean ± σ".padEnd(18)} : ${taskMean.toFixed(4)} ± ${taskStdDev.toFixed(4)}`)

  // Confusion matrix
  const bt = metrics.bestThreshold
  console.log(`\n  Confusion Matrix @ threshold ${bt.threshold.toFixed(4)}`)
  console.log(`  ${SEPARATOR}`)
  console.log(`                    Predicted +    Predicted −`)
  console.log(`  Actual +          TP = ${String(bt.tp).padStart(4)}     FN = ${String(bt.fn).padStart(4)}`)
  console.log(`  Actual −          FP = ${String(bt.fp).padStart(4)}     TN = ${String(bt.tn).padStart(4)}`)

  // Score distribution
  const pos = metrics.scoreDistribution.positives
  const neg = metrics.scoreDistribution.negatives
  console.log(`\n  Score Distribution`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  Plagiarized (n=${pos.mean > 0 ? bt.tp + bt.fn : 0}):     mean=${pos.mean.toFixed(4)}, median=${pos.median.toFixed(4)}, min=${pos.min.toFixed(4)}, max=${pos.max.toFixed(4)}, σ=${pos.stdDev.toFixed(4)}`)
  console.log(`  Non-Plagiarized (n=${neg.mean > 0 || neg.min === 0 ? bt.tn + bt.fp : 0}): mean=${neg.mean.toFixed(4)}, median=${neg.median.toFixed(4)}, min=${neg.min.toFixed(4)}, max=${neg.max.toFixed(4)}, σ=${neg.stdDev.toFixed(4)}`)

  // Detection rate by type
  const thresholdHeaders = DETECTION_THRESHOLDS.map(t => `@${t}`).join("  ")
  console.log(`\n  Detection Rate by Plagiarism Type`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  ${"Type".padEnd(18)} ${"N".padStart(4)} ${"Mean".padStart(7)} ${"σ".padStart(7)} ${"Min".padStart(7)} ${"Max".padStart(7)}  ${thresholdHeaders}`)
  console.log(`  ${SEPARATOR}`)

  for (const lm of metrics.levelBreakdown) {
    const rates = DETECTION_THRESHOLDS.map(t => {
      const rate = lm.detectionRates[`@${t}`]
      return `${(rate * 100).toFixed(0).padStart(4)}%`
    }).join("  ")

    console.log(
      `  ${lm.level.padEnd(18)} ${String(lm.count).padStart(4)} ` +
      `${lm.meanScore.toFixed(3).padStart(7)} ${lm.stdDev.toFixed(3).padStart(7)} ` +
      `${lm.minScore.toFixed(3).padStart(7)} ${lm.maxScore.toFixed(3).padStart(7)}  ${rates}`,
    )
  }
}

function printUnifiedComparisonTable(allMetrics: Record<ScoreMode, ModeMetrics>): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  UNIFIED COMPARISON TABLE — Mean Similarity Score by Plagiarism Type")
  console.log(DOUBLE_SEP)
  console.log(`  ${"Type".padEnd(18)} ${"Structural".padStart(12)} ${"Semantic".padStart(12)} ${"Hybrid".padStart(12)} ${"Δ Hybrid-Struct".padStart(16)}`)
  console.log(`  ${SEPARATOR}`)

  for (const type of PLAGIARISM_TYPES) {
    const structType = allMetrics.structural.levelBreakdown.find(l => l.level === type)
    const semType = allMetrics.semantic.levelBreakdown.find(l => l.level === type)
    const hybType = allMetrics.hybrid.levelBreakdown.find(l => l.level === type)

    if (!structType || !semType || !hybType) continue

    const delta = hybType.meanScore - structType.meanScore
    const deltaStr = delta >= 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)
    const typeLabel = `${type} (n=${structType.count})`

    console.log(
      `  ${typeLabel.padEnd(18)} ${structType.meanScore.toFixed(3).padStart(12)} ` +
      `${semType.meanScore.toFixed(3).padStart(12)} ${hybType.meanScore.toFixed(3).padStart(12)} ` +
      `${deltaStr.padStart(16)}`,
    )
  }

  // Non-plagiarized row (false positive indicator)
  const structNp = allMetrics.structural.levelBreakdown.find(l => l.level === "Non-Plagiarized")
  const semNp = allMetrics.semantic.levelBreakdown.find(l => l.level === "Non-Plagiarized")
  const hybNp = allMetrics.hybrid.levelBreakdown.find(l => l.level === "Non-Plagiarized")

  if (structNp && semNp && hybNp) {
    console.log(`  ${SEPARATOR}`)
    const delta = hybNp.meanScore - structNp.meanScore
    const deltaStr = delta >= 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)
    console.log(
      `  ${"Non-Plagiarized".padEnd(18)} ${structNp.meanScore.toFixed(3).padStart(12)} ` +
      `${semNp.meanScore.toFixed(3).padStart(12)} ${hybNp.meanScore.toFixed(3).padStart(12)} ` +
      `${deltaStr.padStart(16)}`,
    )
  }
}

function printModeComparisonSummary(allMetrics: Record<ScoreMode, ModeMetrics>): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  MODE COMPARISON SUMMARY")
  console.log(DOUBLE_SEP)
  console.log(
    `  ${"Mode".padEnd(14)} ${"ROC-AUC".padStart(9)} ${"MAP".padStart(8)} ${"F1".padStart(8)} ${"MCC".padStart(8)} ` +
    `${"Precision".padStart(10)} ${"Recall".padStart(8)} ${"P@5".padStart(6)} ${"R@10".padStart(6)} ${"Sep.Ratio".padStart(10)}`,
  )
  console.log(`  ${SEPARATOR}`)

  for (const mode of ["structural", "semantic", "hybrid"] as ScoreMode[]) {
    const m = allMetrics[mode]
    console.log(
      `  ${mode.padEnd(14)} ${m.rocAuc.toFixed(4).padStart(9)} ` +
      `${m.map.toFixed(4).padStart(8)} ` +
      `${(m.bestThreshold.f1Score * 100).toFixed(2).padStart(7)}% ` +
      `${m.mcc.toFixed(4).padStart(8)} ` +
      `${(m.bestThreshold.precision * 100).toFixed(2).padStart(9)}% ` +
      `${(m.bestThreshold.recall * 100).toFixed(2).padStart(7)}% ` +
      `${(m.precisionAt5 * 100).toFixed(0).padStart(4)}%  ` +
      `${(m.recallAt10 * 100).toFixed(1).padStart(5)}% ` +
      `${m.separationRatio.toFixed(4).padStart(10)}`,
    )
  }

  // MAP per type comparison
  console.log(`\n  MAP by Plagiarism Type — Mode Comparison`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  ${"Type".padEnd(18)} ${"Structural".padStart(12)} ${"Semantic".padStart(12)} ${"Hybrid".padStart(12)}`)
  console.log(`  ${SEPARATOR}`)

  for (const type of [...PLAGIARISM_TYPES, "Overall"] as string[]) {
    console.log(
      `  ${type.padEnd(18)} ${allMetrics.structural.mapPerType[type].toFixed(4).padStart(12)} ` +
      `${allMetrics.semantic.mapPerType[type].toFixed(4).padStart(12)} ` +
      `${allMetrics.hybrid.mapPerType[type].toFixed(4).padStart(12)}`,
    )
  }
}

function printHybridVsStructuralComparison(
  structural: ModeMetrics,
  hybrid: ModeMetrics,
): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  HYBRID vs STRUCTURAL-ONLY IMPROVEMENT")
  console.log(DOUBLE_SEP)
  console.log(`  ${"Metric".padEnd(22)} ${"Structural".padStart(12)} ${"Hybrid".padStart(12)} ${"Δ Improvement".padStart(14)}`)
  console.log(`  ${SEPARATOR}`)

  const rows = [
    ["ROC-AUC", structural.rocAuc, hybrid.rocAuc],
    ["MAP", structural.map, hybrid.map],
    ["F1 @ optimal", structural.bestThreshold.f1Score, hybrid.bestThreshold.f1Score],
    ["MCC @ optimal", structural.mcc, hybrid.mcc],
    ["Precision @ optimal", structural.bestThreshold.precision, hybrid.bestThreshold.precision],
    ["Recall @ optimal", structural.bestThreshold.recall, hybrid.bestThreshold.recall],
    ["Precision@5", structural.precisionAt5, hybrid.precisionAt5],
    ["Recall@10", structural.recallAt10, hybrid.recallAt10],
    ["Separation Ratio", structural.separationRatio, hybrid.separationRatio],
  ] as const

  for (const [label, structVal, hybVal] of rows) {
    const delta = hybVal - structVal
    const formatAsPercent = !["MAP", "MCC @ optimal", "Separation Ratio"].includes(label)
    const formatVal = (v: number) => formatAsPercent ? `${(v * 100).toFixed(2)}%` : v.toFixed(4)
    const deltaStr = formatAsPercent
      ? (delta >= 0 ? `+${(delta * 100).toFixed(2)}%` : `${(delta * 100).toFixed(2)}%`)
      : (delta >= 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4))

    console.log(
      `  ${label.padEnd(22)} ${formatVal(structVal).padStart(12)} ` +
      `${formatVal(hybVal).padStart(12)} ${deltaStr.padStart(14)}`,
    )
  }

  // Detection rate comparison at threshold 0.5
  console.log(`\n  Detection Rate @ 0.5 threshold — Type Comparison`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  ${"Type".padEnd(10)} ${"Structural".padStart(12)} ${"Hybrid".padStart(12)} ${"Δ".padStart(10)}`)
  console.log(`  ${SEPARATOR}`)

  for (const type of PLAGIARISM_TYPES) {
    const sType = structural.levelBreakdown.find(l => l.level === type)
    const hType = hybrid.levelBreakdown.find(l => l.level === type)
    if (!sType || !hType) continue

    const sRate = sType.detectionRates["@0.5"]
    const hRate = hType.detectionRates["@0.5"]
    const delta = hRate - sRate
    const deltaStr = delta >= 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`

    console.log(
      `  ${type.padEnd(10)} ${(sRate * 100).toFixed(1).padStart(11)}% ` +
      `${(hRate * 100).toFixed(1).padStart(11)}% ${deltaStr.padStart(10)}`,
    )
  }
}

function printStatisticalAnalysis(results: PairResult[]): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  STATISTICAL SIGNIFICANCE & EFFECT SIZE ANALYSIS")
  console.log(DOUBLE_SEP)

  const structuralScores = results.map(r => r.structuralScore)
  const hybridScores = results.map(r => r.hybridScore)
  const semanticScores = results.map(r => r.semanticScore)

  // Hybrid vs Structural
  console.log(`\n  Hybrid vs Structural (paired, n=${results.length})`)
  console.log(`  ${SEPARATOR}`)

  const wilcoxonHS = wilcoxonSignedRankTest(structuralScores, hybridScores)
  console.log(`  Wilcoxon signed-rank W     : ${wilcoxonHS.testStatistic.toFixed(1)}`)
  console.log(`  z-score                    : ${wilcoxonHS.zScore.toFixed(4)}`)
  console.log(`  p-value                    : ${wilcoxonHS.pValue < 0.0001 ? wilcoxonHS.pValue.toExponential(4) : wilcoxonHS.pValue.toFixed(6)}`)
  console.log(`  Significant (α=0.05)?      : ${wilcoxonHS.isSignificant ? "YES ✓" : "NO"}`)

  const cohenHS = computeCohensD(structuralScores, hybridScores)
  console.log(`  Cohen's d                  : ${cohenHS.toFixed(4)}  (${interpretCohensD(cohenHS)})`)

  // Hybrid vs Semantic
  console.log(`\n  Hybrid vs Semantic (paired, n=${results.length})`)
  console.log(`  ${SEPARATOR}`)

  const wilcoxonHSem = wilcoxonSignedRankTest(semanticScores, hybridScores)
  console.log(`  Wilcoxon signed-rank W     : ${wilcoxonHSem.testStatistic.toFixed(1)}`)
  console.log(`  z-score                    : ${wilcoxonHSem.zScore.toFixed(4)}`)
  console.log(`  p-value                    : ${wilcoxonHSem.pValue < 0.0001 ? wilcoxonHSem.pValue.toExponential(4) : wilcoxonHSem.pValue.toFixed(6)}`)
  console.log(`  Significant (α=0.05)?      : ${wilcoxonHSem.isSignificant ? "YES ✓" : "NO"}`)

  const cohenHSem = computeCohensD(semanticScores, hybridScores)
  console.log(`  Cohen's d                  : ${cohenHSem.toFixed(4)}  (${interpretCohensD(cohenHSem)})`)

  // Per-type Cohen's d (Hybrid vs Structural) — where the real story is
  console.log(`\n  Cohen's d per Type — Hybrid vs Structural`)
  console.log(`  ${SEPARATOR}`)
  console.log(`  ${"Type".padEnd(18)} ${"Cohen's d".padStart(12)} ${"Effect Size".padStart(14)}`)
  console.log(`  ${SEPARATOR}`)

  for (const type of PLAGIARISM_TYPES) {
    const typeResults = results.filter(r => r.level !== "non-plagiarized" && FR_LEVEL_TO_TYPE[r.level] === type)

    if (typeResults.length === 0) continue

    const sScores = typeResults.map(r => r.structuralScore)
    const hScores = typeResults.map(r => r.hybridScore)
    const d = computeCohensD(sScores, hScores)

    console.log(`  ${`${type} (n=${typeResults.length})`.padEnd(18)} ${d.toFixed(4).padStart(12)} ${interpretCohensD(d).padStart(14)}`)
  }
}

// -- Main ----------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`\n  ERROR: Results file not found at: ${INPUT_FILE}`)
    console.error("  Run evaluate-ir-plag.ts first to generate the raw results.")
    process.exit(1)
  }

  const inputData: InputData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"))
  const results = inputData.results

  console.log(`\n  Loading ${results.length} pair results from ir-plag-evaluation-results.json...`)

  // Compute all metrics for each mode
  const allMetrics: Record<ScoreMode, ModeMetrics> = {
    structural: computeModeMetrics(results, "structural"),
    semantic: computeModeMetrics(results, "semantic"),
    hybrid: computeModeMetrics(results, "hybrid"),
  }

  // Print comprehensive report
  printHeader(results, inputData.config)

  for (const mode of ["structural", "semantic", "hybrid"] as ScoreMode[]) {
    printModeSection(allMetrics[mode])
  }

  printUnifiedComparisonTable(allMetrics)
  printModeComparisonSummary(allMetrics)
  printHybridVsStructuralComparison(allMetrics.structural, allMetrics.hybrid)
  printStatisticalAnalysis(results)

  // Compute statistical analysis for JSON output
  const structuralScores = results.map(r => r.structuralScore)
  const hybridScores = results.map(r => r.hybridScore)
  const semanticScores = results.map(r => r.semanticScore)

  const wilcoxonHybridVsStructural = wilcoxonSignedRankTest(structuralScores, hybridScores)
  const wilcoxonHybridVsSemantic = wilcoxonSignedRankTest(semanticScores, hybridScores)
  const cohensD_HybridVsStructural = computeCohensD(structuralScores, hybridScores)
  const cohensD_HybridVsSemantic = computeCohensD(semanticScores, hybridScores)

  const perTypeCohensD: Record<string, { cohensD: number; interpretation: string }> = {}
  for (const type of PLAGIARISM_TYPES) {
    const typeResults = results.filter(r => r.level !== "non-plagiarized" && FR_LEVEL_TO_TYPE[r.level] === type)
    const sScores = typeResults.map(r => r.structuralScore)
    const hScores = typeResults.map(r => r.hybridScore)
    const d = computeCohensD(sScores, hScores)
    perTypeCohensD[type] = { cohensD: round(d, 4), interpretation: interpretCohensD(d) }
  }

  // Save structured output
  const output = {
    generatedAt: new Date().toISOString(),
    dataset: inputData.dataset,
    config: inputData.config,
    totalPairs: results.length,
    positives: results.filter(r => r.label === 1).length,
    negatives: results.filter(r => r.label === 0).length,
    metrics: allMetrics,
    unifiedComparisonTable: PLAGIARISM_TYPES.map(type => ({
      type,
      description: TYPE_DESCRIPTIONS[type],
      structuralMean: allMetrics.structural.levelBreakdown.find(l => l.level === type)?.meanScore ?? 0,
      semanticMean: allMetrics.semantic.levelBreakdown.find(l => l.level === type)?.meanScore ?? 0,
      hybridMean: allMetrics.hybrid.levelBreakdown.find(l => l.level === type)?.meanScore ?? 0,
    })),
    statisticalAnalysis: {
      hybridVsStructural: {
        wilcoxon: wilcoxonHybridVsStructural,
        cohensD: round(cohensD_HybridVsStructural, 4),
        cohensDInterpretation: interpretCohensD(cohensD_HybridVsStructural),
      },
      hybridVsSemantic: {
        wilcoxon: wilcoxonHybridVsSemantic,
        cohensD: round(cohensD_HybridVsSemantic, 4),
        cohensDInterpretation: interpretCohensD(cohensD_HybridVsSemantic),
      },
      perTypeCohensD,
    },
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))
  console.log(`\n  ${DOUBLE_SEP}`)
  console.log(`  Full metrics saved to: ${OUTPUT_FILE}`)
  console.log(`  ${DOUBLE_SEP}\n`)
}

main()
