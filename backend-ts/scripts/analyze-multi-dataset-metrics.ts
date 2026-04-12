/**
 * Multi-Dataset Unified Metrics Analysis
 *
 * Reads pre-computed evaluation results from all available datasets and computes
 * the full thesis metrics suite for cross-dataset comparison:
 *
 *   - IR-Plag (Karnalim, 2020)     — 460 Java pairs, labeled L1–L6 plagiarism types
 *   - Ljubovic C (Ljubovic, 2020)  — 2,724 C pairs, real university student submissions
 *   - SOCO Java (PAN-FIRE 2014)    — 2,084 sampled Java pairs (all 84 plagiarised) [optional]
 *   - Python/Khani (Khani, 2024)   — 293 Python pairs, student similarity labels
 *
 * Per dataset, per mode (Structural / Semantic / Hybrid):
 *   ROC-AUC, F1 (best threshold), Precision, Recall, Accuracy,
 *   AP (Average Precision over full dataset), MCC, P@5, R@10, Separation Ratio
 *
 * Cross-mode per dataset:
 *   Cohen's d (hybrid vs structural), Wilcoxon signed-rank p-value
 *
 * Outputs:
 *   - Console: unified cross-dataset comparison tables
 *   - multi-dataset-metrics.json: full structured results
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/analyze-multi-dataset-metrics.ts
 *
 * Prerequisites:
 *   ir-plag-evaluation-results.json      (run evaluate-ir-plag.ts)
 *   ljubovic-c-evaluation-results.json   (run evaluate-ljubovic-c-dataset.ts)
 *   python-evaluation-results.json       (run evaluate-python-dataset.ts)
 *   soco-evaluation-results-hybrid.json  (run evaluate-soco-hybrid.ts) [optional]
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { computeRankingMetricsAtK } from "./shared/ranking-metrics.js"

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const OUTPUT_FILE = path.join(RESULT_DIR, "multi-dataset-metrics.json")

// -- Types ---------------------------------------------------------------------

type ScoreMode = "structural" | "semantic" | "hybrid"

/**
 * Normalized pair: the minimal set of fields needed for all metric calculations.
 * Extracted uniformly from each dataset's raw results regardless of extra fields.
 */
interface NormalizedPair {
  label: 0 | 1
  structuralScore: number
  semanticScore: number
  hybridScore: number
}

interface ThresholdMetrics {
  threshold: number
  precision: number
  recall: number
  f1Score: number
  accuracy: number
  tp: number
  fp: number
  tn: number
  fn: number
}

interface WilcoxonResult {
  testStatistic: number
  zScore: number
  pValue: number
  isSignificant: boolean
  sampleSize: number
}

interface ModeMetrics {
  rocAuc: number
  bestThreshold: ThresholdMetrics
  /** MCC computed at the best F1 threshold. */
  mcc: number
  /** Average Precision over the entire dataset (single-query MAP). */
  averagePrecision: number
  precisionAt5: number
  recallAt10: number
  separationRatio: number
  scoreDistribution: {
    positives: { mean: number; stdDev: number; min: number; max: number }
    negatives: { mean: number; stdDev: number; min: number; max: number }
  }
}

interface StatisticalComparison {
  cohensD: number
  cohensDInterpretation: string
  wilcoxon: WilcoxonResult
}

interface DatasetMetrics {
  name: string
  citation: string
  language: string
  totalPairs: number
  positives: number
  negatives: number
  structural: ModeMetrics
  semantic: ModeMetrics
  hybrid: ModeMetrics
  hybridVsStructural: StatisticalComparison
}

// -- Dataset Definitions -------------------------------------------------------

interface DatasetDefinition {
  name: string
  citation: string
  language: string
  filePath: string
  required: boolean
  extractPairs: (rawData: Record<string, unknown>) => NormalizedPair[]
}

function extractResultsArray(rawData: Record<string, unknown>): NormalizedPair[] {
  const results = rawData["results"] as Array<Record<string, unknown>>

  return results.map(r => ({
    label: r["label"] as 0 | 1,
    structuralScore: r["structuralScore"] as number,
    semanticScore: r["semanticScore"] as number,
    hybridScore: r["hybridScore"] as number,
  }))
}

const DATASET_DEFINITIONS: DatasetDefinition[] = [
  {
    name: "IR-Plag (Karnalim 2020)",
    citation: "Karnalim, O. (2020). Source Code Plagiarism Dataset. GitHub: oscarkarnalim/sourcecodeplagiarismdataset",
    language: "Java",
    filePath: path.join(RESULT_DIR, "ir-plag-evaluation-results.json"),
    required: true,
    extractPairs: extractResultsArray,
  },
  {
    name: "Ljubovic C (Ljubovic 2020)",
    citation: "Ljubovic, V. (2020). Programming Homework Dataset for Plagiarism Detection. IEEE DataPort. DOI: 10.21227/71fw-ss32",
    language: "C",
    filePath: path.join(RESULT_DIR, "ljubovic-c-evaluation-results.json"),
    required: true,
    extractPairs: extractResultsArray,
  },
  {
    name: "Python/Khani (Khani 2024)",
    citation: "Khani, E. (2024). Student Code Similarity & Plagiarism Labels. Kaggle.",
    language: "Python",
    filePath: path.join(RESULT_DIR, "python-evaluation-results.json"),
    required: true,
    extractPairs: extractResultsArray,
  },
  {
    name: "SOCO Java (PAN-FIRE 2014)",
    citation: "Flores, E. et al. (2014). Overview of SOCO Track on Detection of Source Code Re-use. PAN at FIRE 2014.",
    language: "Java",
    filePath: path.join(RESULT_DIR, "soco-evaluation-results-hybrid.json"),
    required: false,
    extractPairs: extractResultsArray,
  },
]

// -- Score Accessor ------------------------------------------------------------

function getScore(pair: NormalizedPair, mode: ScoreMode): number {
  if (mode === "structural") return pair.structuralScore
  if (mode === "semantic") return pair.semanticScore

  return pair.hybridScore
}

// -- Statistical Helpers -------------------------------------------------------

function computeMean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0
  const sumSq = values.reduce((s, v) => s + (v - mean) ** 2, 0)

  return Math.sqrt(sumSq / (values.length - 1))
}

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

// -- ROC-AUC -------------------------------------------------------------------

function computeRocAuc(pairs: NormalizedPair[], mode: ScoreMode): number {
  const positiveCount = pairs.filter(p => p.label === 1).length
  const negativeCount = pairs.length - positiveCount

  if (positiveCount === 0 || negativeCount === 0) return 0.5

  const sorted = [...pairs].sort((a, b) => getScore(b, mode) - getScore(a, mode))
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

// -- Average Precision (AP) ----------------------------------------------------

/**
 * Computes Average Precision (AP) over the full dataset treated as a single query.
 * AP = (1/R) × Σ(Precision@k × rel(k)) where R = total relevant items.
 *
 * This is MAP for a single-group dataset (SOCO, Python, Ljubovic treated globally).
 * For IR-Plag, this represents overall AP; per-case MAP is in analyze-ir-plag-metrics.ts.
 */
function computeAveragePrecision(pairs: NormalizedPair[], mode: ScoreMode): number {
  const sorted = [...pairs].sort((a, b) => getScore(b, mode) - getScore(a, mode))
  const totalRelevant = sorted.filter(p => p.label === 1).length

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

// -- Threshold Classification --------------------------------------------------

function classifyAtThreshold(
  pairs: NormalizedPair[],
  mode: ScoreMode,
  threshold: number,
): ThresholdMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0

  for (const p of pairs) {
    const predicted = getScore(p, mode) >= threshold ? 1 : 0
    if (predicted === 1 && p.label === 1) tp++
    else if (predicted === 1 && p.label === 0) fp++
    else if (predicted === 0 && p.label === 0) tn++
    else fn++
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const accuracy = (tp + tn) / pairs.length

  return {
    threshold: round(threshold, 6),
    precision: round(precision, 6),
    recall: round(recall, 6),
    f1Score: round(f1Score, 6),
    accuracy: round(accuracy, 6),
    tp, fp, tn, fn,
  }
}

function findBestF1Threshold(pairs: NormalizedPair[], mode: ScoreMode): ThresholdMetrics {
  const candidateThresholds = [...new Set(pairs.map(p => getScore(p, mode)))].sort((a, b) => a - b)
  let bestMetrics: ThresholdMetrics | null = null

  for (const threshold of candidateThresholds) {
    const metrics = classifyAtThreshold(pairs, mode, threshold)
    if (!bestMetrics || metrics.f1Score > bestMetrics.f1Score) bestMetrics = metrics
  }

  return bestMetrics ?? classifyAtThreshold(pairs, mode, 0.5)
}

// -- MCC -----------------------------------------------------------------------

/**
 * Matthews Correlation Coefficient — balanced metric for imbalanced datasets.
 * Range: [-1, +1]. More informative than F1 alone.
 */
function computeMCC(tp: number, fp: number, tn: number, fn: number): number {
  const numerator = (tp * tn) - (fp * fn)
  const denominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))

  return denominator === 0 ? 0 : round(numerator / denominator, 6)
}

// -- Cohen's d -----------------------------------------------------------------

/**
 * Cohen's d effect size (pooled standard deviation).
 * Compares distributions of scores for Mode B vs Mode A.
 */
function computeCohensD(scoresA: number[], scoresB: number[]): number {
  if (scoresA.length < 2 || scoresB.length < 2) return 0

  const meanA = computeMean(scoresA)
  const meanB = computeMean(scoresB)
  const varA = scoresA.reduce((s, v) => s + (v - meanA) ** 2, 0) / (scoresA.length - 1)
  const varB = scoresB.reduce((s, v) => s + (v - meanB) ** 2, 0) / (scoresB.length - 1)
  const pooledStdDev = Math.sqrt((varA + varB) / 2)

  return pooledStdDev === 0 ? 0 : round((meanB - meanA) / pooledStdDev, 4)
}

function interpretCohensD(d: number): string {
  const abs = Math.abs(d)
  if (abs < 0.2) return "negligible"
  if (abs < 0.5) return "small"
  if (abs < 0.8) return "medium"

  return "large"
}

// -- Wilcoxon Signed-Rank Test -------------------------------------------------

/**
 * Wilcoxon signed-rank test for paired samples.
 * Non-parametric test for whether hybrid significantly differs from structural.
 * Uses normal approximation (valid for n > 20).
 */
function wilcoxonSignedRankTest(scoresA: number[], scoresB: number[]): WilcoxonResult {
  const differences = scoresA.map((a, i) => scoresB[i] - a).filter(d => d !== 0)
  const n = differences.length

  if (n === 0) {
    return { testStatistic: 0, zScore: 0, pValue: 1, isSignificant: false, sampleSize: 0 }
  }

  const ranked = differences
    .map((d, i) => ({ index: i, absDiff: Math.abs(d), sign: d > 0 ? 1 : -1 }))
    .sort((a, b) => a.absDiff - b.absDiff)

  const ranks = new Array<number>(ranked.length)
  let i = 0

  while (i < ranked.length) {
    let j = i
    while (j < ranked.length && ranked[j].absDiff === ranked[i].absDiff) j++
    const avgRank = (i + 1 + j) / 2
    for (let k = i; k < j; k++) ranks[k] = avgRank
    i = j
  }

  let wPlus = 0

  for (let idx = 0; idx < ranked.length; idx++) {
    if (ranked[idx].sign > 0) wPlus += ranks[idx]
  }

  const wMinus = (n * (n + 1)) / 2 - wPlus
  const testStatistic = Math.min(wPlus, wMinus)
  const meanW = (n * (n + 1)) / 4
  const stdW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const zScore = stdW === 0 ? 0 : (testStatistic - meanW) / stdW
  const pValue = 2 * normalCDF(-Math.abs(zScore))

  return {
    testStatistic: round(testStatistic, 1),
    zScore: round(zScore, 4),
    pValue: round(pValue, 8),
    isSignificant: pValue < 0.05,
    sampleSize: n,
  }
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

// -- Per-Mode Metrics ----------------------------------------------------------

function computeModeMetrics(pairs: NormalizedPair[], mode: ScoreMode): ModeMetrics {
  const rocAuc = round(computeRocAuc(pairs, mode), 6)
  const bestThreshold = findBestF1Threshold(pairs, mode)
  const mcc = computeMCC(bestThreshold.tp, bestThreshold.fp, bestThreshold.tn, bestThreshold.fn)
  const averagePrecision = round(computeAveragePrecision(pairs, mode), 6)

  const { precision: p5 } = computeRankingMetricsAtK(
    pairs, p => getScore(p, mode), p => p.label === 1, 5,
  )
  const { recall: r10 } = computeRankingMetricsAtK(
    pairs, p => getScore(p, mode), p => p.label === 1, 10,
  )

  const positiveScores = pairs.filter(p => p.label === 1).map(p => getScore(p, mode))
  const negativeScores = pairs.filter(p => p.label === 0).map(p => getScore(p, mode))
  const posMean = computeMean(positiveScores)
  const negMean = computeMean(negativeScores)
  const separationRatio = negMean > 0 ? round(posMean / negMean, 4) : 0

  return {
    rocAuc,
    bestThreshold,
    mcc,
    averagePrecision,
    precisionAt5: round(p5, 4),
    recallAt10: round(r10, 4),
    separationRatio,
    scoreDistribution: {
      positives: {
        mean: round(posMean, 4),
        stdDev: round(computeStdDev(positiveScores, posMean), 4),
        min: round(Math.min(...positiveScores), 4),
        max: round(Math.max(...positiveScores), 4),
      },
      negatives: {
        mean: round(negMean, 4),
        stdDev: round(computeStdDev(negativeScores, negMean), 4),
        min: round(Math.min(...negativeScores), 4),
        max: round(Math.max(...negativeScores), 4),
      },
    },
  }
}

function computeDatasetMetrics(
  definition: DatasetDefinition,
  pairs: NormalizedPair[],
): DatasetMetrics {
  const structural = computeModeMetrics(pairs, "structural")
  const semantic = computeModeMetrics(pairs, "semantic")
  const hybrid = computeModeMetrics(pairs, "hybrid")

  const structuralScores = pairs.map(p => p.structuralScore)
  const hybridScores = pairs.map(p => p.hybridScore)
  const cohensDValue = computeCohensD(structuralScores, hybridScores)

  return {
    name: definition.name,
    citation: definition.citation,
    language: definition.language,
    totalPairs: pairs.length,
    positives: pairs.filter(p => p.label === 1).length,
    negatives: pairs.filter(p => p.label === 0).length,
    structural,
    semantic,
    hybrid,
    hybridVsStructural: {
      cohensD: cohensDValue,
      cohensDInterpretation: interpretCohensD(cohensDValue),
      wilcoxon: wilcoxonSignedRankTest(structuralScores, hybridScores),
    },
  }
}

// -- Console Output ------------------------------------------------------------

const SEP = "─".repeat(100)
const DOUBLE_SEP = "═".repeat(100)

function pct(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

function printDatasetHeader(metrics: DatasetMetrics): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log(`  ${metrics.name.toUpperCase()} — ${metrics.language}`)
  console.log(`  ${metrics.totalPairs} pairs  |  ${metrics.positives} plagiarised  |  ${metrics.negatives} non-plagiarised`)
  console.log(`  ${metrics.citation}`)
  console.log(DOUBLE_SEP)
}

function printModeSummaryRow(label: string, m: ModeMetrics): void {
  console.log(
    `  ${label.padEnd(12)} ` +
    `${m.rocAuc.toFixed(4).padStart(8)} ` +
    `${m.averagePrecision.toFixed(4).padStart(6)} ` +
    `${pct(m.bestThreshold.f1Score).padStart(8)} ` +
    `${m.mcc.toFixed(4).padStart(7)} ` +
    `${pct(m.bestThreshold.precision).padStart(10)} ` +
    `${pct(m.bestThreshold.recall).padStart(8)} ` +
    `${pct(m.precisionAt5).padStart(5)} ` +
    `${pct(m.recallAt10).padStart(5)} ` +
    `${m.separationRatio.toFixed(3).padStart(9)}`
  )
}

function printDatasetMetrics(metrics: DatasetMetrics): void {
  printDatasetHeader(metrics)

  console.log(
    `\n  ${"Mode".padEnd(12)} ` +
    `${"ROC-AUC".padStart(8)} ` +
    `${"AP".padStart(6)} ` +
    `${"Best F1".padStart(8)} ` +
    `${"MCC".padStart(7)} ` +
    `${"Precision".padStart(10)} ` +
    `${"Recall".padStart(8)} ` +
    `${"P@5".padStart(5)} ` +
    `${"R@10".padStart(5)} ` +
    `${"Sep.Ratio".padStart(9)}`
  )
  console.log(`  ${SEP}`)
  printModeSummaryRow("structural", metrics.structural)
  printModeSummaryRow("semantic", metrics.semantic)
  printModeSummaryRow("hybrid", metrics.hybrid)

  console.log(`\n  Score Distributions (best mode = hybrid)`)
  console.log(`  ${SEP}`)
  console.log(
    `  ${"".padEnd(12)} ` +
    `${"Pos.Mean".padStart(10)} ${"Pos.σ".padStart(7)} ${"Neg.Mean".padStart(10)} ${"Neg.σ".padStart(7)}`
  )
  console.log(`  ${SEP}`)

  for (const [label, m] of [["structural", metrics.structural], ["semantic", metrics.semantic], ["hybrid", metrics.hybrid]] as const) {
    console.log(
      `  ${label.padEnd(12)} ` +
      `${m.scoreDistribution.positives.mean.toFixed(4).padStart(10)} ` +
      `${m.scoreDistribution.positives.stdDev.toFixed(4).padStart(7)} ` +
      `${m.scoreDistribution.negatives.mean.toFixed(4).padStart(10)} ` +
      `${m.scoreDistribution.negatives.stdDev.toFixed(4).padStart(7)}`
    )
  }

  console.log(`\n  Hybrid vs Structural — Statistical Comparison`)
  console.log(`  ${SEP}`)

  const stat = metrics.hybridVsStructural
  const pStr = stat.wilcoxon.pValue < 0.0001
    ? stat.wilcoxon.pValue.toExponential(3)
    : stat.wilcoxon.pValue.toFixed(6)

  console.log(`  Cohen's d     : ${stat.cohensD.toFixed(4)}  (${stat.cohensDInterpretation})`)
  console.log(`  Wilcoxon W    : ${stat.wilcoxon.testStatistic}`)
  console.log(`  z-score       : ${stat.wilcoxon.zScore.toFixed(4)}`)
  console.log(`  p-value       : ${pStr}`)
  console.log(`  Significant?  : ${stat.wilcoxon.isSignificant ? "YES (p < 0.05)" : "NO"}`)
}

function printCrossDatasetTable(allMetrics: DatasetMetrics[]): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  CROSS-DATASET COMPARISON — HYBRID MODE")
  console.log(DOUBLE_SEP)
  console.log(
    `  ${"Dataset".padEnd(28)} ` +
    `${"Lang".padEnd(6)} ` +
    `${"Pairs".padStart(6)} ` +
    `${"ROC-AUC".padStart(8)} ` +
    `${"AP".padStart(7)} ` +
    `${"F1".padStart(7)} ` +
    `${"MCC".padStart(7)} ` +
    `${"P@5".padStart(5)} ` +
    `${"Sep.R".padStart(7)}`
  )
  console.log(`  ${SEP}`)

  for (const metrics of allMetrics) {
    const h = metrics.hybrid
    console.log(
      `  ${metrics.name.padEnd(28)} ` +
      `${metrics.language.padEnd(6)} ` +
      `${String(metrics.totalPairs).padStart(6)} ` +
      `${h.rocAuc.toFixed(4).padStart(8)} ` +
      `${h.averagePrecision.toFixed(4).padStart(7)} ` +
      `${pct(h.bestThreshold.f1Score).padStart(7)} ` +
      `${h.mcc.toFixed(4).padStart(7)} ` +
      `${pct(h.precisionAt5).padStart(5)} ` +
      `${h.separationRatio.toFixed(3).padStart(7)}`
    )
  }
}

function printCrossDatasetStructuralTable(allMetrics: DatasetMetrics[]): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  CROSS-DATASET COMPARISON — STRUCTURAL vs SEMANTIC vs HYBRID")
  console.log(DOUBLE_SEP)
  console.log(
    `  ${"Dataset".padEnd(28)} ` +
    `${"Struct AUC".padStart(10)} ` +
    `${"Sem AUC".padStart(9)} ` +
    `${"Hybrid AUC".padStart(10)} ` +
    `${"Struct F1".padStart(9)} ` +
    `${"Hybrid F1".padStart(9)} ` +
    `${"Cohen's d".padStart(10)} ` +
    `${"p-value".padStart(9)}`
  )
  console.log(`  ${SEP}`)

  for (const metrics of allMetrics) {
    const s = metrics.structural
    const sem = metrics.semantic
    const h = metrics.hybrid
    const pStr = metrics.hybridVsStructural.wilcoxon.pValue < 0.0001
      ? "<0.0001"
      : metrics.hybridVsStructural.wilcoxon.pValue.toFixed(5)

    console.log(
      `  ${metrics.name.padEnd(28)} ` +
      `${s.rocAuc.toFixed(4).padStart(10)} ` +
      `${sem.rocAuc.toFixed(4).padStart(9)} ` +
      `${h.rocAuc.toFixed(4).padStart(10)} ` +
      `${pct(s.bestThreshold.f1Score).padStart(9)} ` +
      `${pct(h.bestThreshold.f1Score).padStart(9)} ` +
      `${metrics.hybridVsStructural.cohensD.toFixed(4).padStart(10)} ` +
      `${pStr.padStart(9)}`
    )
  }
}

// -- Main ----------------------------------------------------------------------

function main(): void {
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  CLASSIFI — MULTI-DATASET UNIFIED METRICS ANALYSIS")
  console.log("  Winnowing k=23,w=17  |  GraphCodeBERT  |  Hybrid 0.7/0.3")
  console.log(DOUBLE_SEP)

  // Load all available datasets
  const loadedDatasets: Array<{ definition: DatasetDefinition; pairs: NormalizedPair[] }> = []

  for (const definition of DATASET_DEFINITIONS) {
    if (!fs.existsSync(definition.filePath)) {
      if (definition.required) {
        console.error(`\n  ERROR: Required dataset file not found: ${definition.filePath}`)
        console.error(`  Run the corresponding evaluation script first.`)
        process.exit(1)
      } else {
        console.log(`  SKIPPING (optional): ${definition.name} — file not found.`)
        console.log(`  To include it, run: npx tsx scripts/evaluate-soco-hybrid.ts`)
        continue
      }
    }

    const rawData = JSON.parse(fs.readFileSync(definition.filePath, "utf-8")) as Record<string, unknown>
    const pairs = definition.extractPairs(rawData)

    console.log(`  Loaded ${pairs.length} pairs — ${definition.name}`)
    loadedDatasets.push({ definition, pairs })
  }

  if (loadedDatasets.length === 0) {
    console.error("\n  No datasets loaded. Exiting.")
    process.exit(1)
  }

  // Compute metrics for each dataset
  const allMetrics: DatasetMetrics[] = []

  for (const { definition, pairs } of loadedDatasets) {
    console.log(`\n  Computing metrics for: ${definition.name} ...`)
    allMetrics.push(computeDatasetMetrics(definition, pairs))
  }

  // Print per-dataset detailed reports
  for (const metrics of allMetrics) {
    printDatasetMetrics(metrics)
  }

  // Print cross-dataset comparison tables
  printCrossDatasetTable(allMetrics)
  printCrossDatasetStructuralTable(allMetrics)

  // Summary: Cohen's d and Wilcoxon across all datasets
  console.log(`\n${DOUBLE_SEP}`)
  console.log("  STATISTICAL SIGNIFICANCE SUMMARY — Hybrid vs Structural")
  console.log(DOUBLE_SEP)
  console.log(`  ${"Dataset".padEnd(28)} ${"Cohen's d".padStart(10)} ${"Effect".padStart(12)} ${"W statistic".padStart(13)} ${"p-value".padStart(10)} ${"Significant?".padStart(13)}`)
  console.log(`  ${SEP}`)

  for (const metrics of allMetrics) {
    const stat = metrics.hybridVsStructural
    const pStr = stat.wilcoxon.pValue < 0.0001 ? "<0.0001" : stat.wilcoxon.pValue.toFixed(5)
    console.log(
      `  ${metrics.name.padEnd(28)} ` +
      `${stat.cohensD.toFixed(4).padStart(10)} ` +
      `${stat.cohensDInterpretation.padStart(12)} ` +
      `${String(stat.wilcoxon.testStatistic).padStart(13)} ` +
      `${pStr.padStart(10)} ` +
      `${(stat.wilcoxon.isSignificant ? "YES ✓" : "NO").padStart(13)}`
    )
  }

  // Save JSON output
  const output = {
    generatedAt: new Date().toISOString(),
    config: {
      winnowing: { k: 23, w: 17 },
      hybrid: { structuralWeight: 0.7, semanticWeight: 0.3 },
    },
    datasets: allMetrics,
    crossDatasetSummary: {
      hybrid: allMetrics.map(m => ({
        dataset: m.name,
        language: m.language,
        totalPairs: m.totalPairs,
        rocAuc: m.hybrid.rocAuc,
        averagePrecision: m.hybrid.averagePrecision,
        f1: m.hybrid.bestThreshold.f1Score,
        mcc: m.hybrid.mcc,
        precisionAt5: m.hybrid.precisionAt5,
        separationRatio: m.hybrid.separationRatio,
      })),
      statisticalSignificance: allMetrics.map(m => ({
        dataset: m.name,
        cohensD: m.hybridVsStructural.cohensD,
        cohensDInterpretation: m.hybridVsStructural.cohensDInterpretation,
        wilcoxonP: m.hybridVsStructural.wilcoxon.pValue,
        isSignificant: m.hybridVsStructural.wilcoxon.isSignificant,
      })),
    },
  }

  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8")

  console.log(`\n${DOUBLE_SEP}`)
  console.log(`  Results saved to: ${OUTPUT_FILE}`)
  console.log(DOUBLE_SEP)
}

main()
