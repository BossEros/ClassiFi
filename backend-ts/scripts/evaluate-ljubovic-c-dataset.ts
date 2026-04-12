/**
 * Ljubovic C Dataset Evaluation Script — Structural, Semantic & Hybrid
 *
 * Evaluates all three ClassiFi analysis modes against the Ljubovic "Programming
 * Homework Dataset for Plagiarism Detection" (IEEE DataPort, 2020) — real student
 * C submissions from University of Sarajevo, Course A2016 (18 assignments).
 *
 * Ground truth: `ground-truth-static-anon.txt` — groups of students who plagiarized
 * (based on code similarity detection by the course instructors).
 *
 * Scoring modes:
 *   Structural  — Winnowing fingerprinting (k=23, w=17)
 *   Semantic    — GraphCodeBERT cosine similarity (via VPS HTTP)
 *   Hybrid      — Weighted combination (structural=0.7, semantic=0.3)
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/evaluate-ljubovic-c-dataset.ts
 *
 * Citation:
 *   Ljubovic, V. (2020). "Programming Homework Dataset for Plagiarism Detection".
 *   IEEE DataPort. DOI: 10.21227/71fw-ss32
 *   Ljubovic, V. & Pajic, E. (2020). IEEE Access.
 *
 * GitHub mirror (A2016 only):
 *   https://github.com/vfrunza/GPLAG-Plagerism-Detection
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
const SEMANTIC_CONCURRENCY_LIMIT = 4
const SEMANTIC_TIMEOUT_MS = 30_000

/** Ratio of sampled negative pairs to total positive pairs. */
const NEGATIVE_SAMPLE_RATIO = 2

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const DATASET_ROOT = path.join(RESULT_DIR, "ljubovic-c-dataset", "Data")
const SRC_ROOT = path.join(DATASET_ROOT, "src", "A2016")
const GROUND_TRUTH_FILE = path.join(DATASET_ROOT, "ground-truth-static-anon.txt")
const OUTPUT_FILE = path.join(RESULT_DIR, "ljubovic-c-evaluation-results.json")

// -- Types ---------------------------------------------------------------------

type ScoreMode = "structural" | "semantic" | "hybrid"

interface LabeledPair {
  assignment: string
  student1: string
  student2: string
  label: 0 | 1
}

interface PairResult {
  assignment: string
  student1: string
  student2: string
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

interface AssignmentGroundTruth {
  assignment: string
  groups: string[][]
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
      const next = this.queue.shift()!
      next()
    } else {
      this.available++
    }
  }
}

const semanticSemaphore = new Semaphore(SEMANTIC_CONCURRENCY_LIMIT)

// -- Ground Truth Parsing ------------------------------------------------------

/**
 * Parses the Ljubovic ground-truth-static-anon.txt into structured groups
 * per assignment. Only returns A2016 assignments.
 */
function parseGroundTruth(): AssignmentGroundTruth[] {
  const raw = fs.readFileSync(GROUND_TRUTH_FILE, "utf-8")
  const lines = raw.trim().split("\n")
  const assignments: AssignmentGroundTruth[] = []
  let current: AssignmentGroundTruth | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith("- ")) {
      const assignmentPath = trimmed.substring(2).trim()

      if (current) {
        assignments.push(current)
      }

      current = { assignment: assignmentPath, groups: [] }
    } else if (trimmed.length > 0 && current) {
      const students = trimmed.split(",").map(s => s.trim()).filter(s => s.length > 0)

      if (students.length >= 2) {
        current.groups.push(students)
      }
    }
  }

  if (current) {
    assignments.push(current)
  }

  return assignments.filter(a => a.assignment.startsWith("A2016/"))
}

/**
 * Generates all unique pairwise combinations from a group of students.
 */
function generatePairsFromGroup(students: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = []

  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      pairs.push([students[i], students[j]])
    }
  }

  return pairs
}

/**
 * Builds labeled pairs for all A2016 assignments:
 * - Positive pairs: all pairwise combos from each plagiarism group
 * - Negative pairs: random non-plagiarizing student pairs (sampled)
 */
function buildLabeledPairs(assignments: AssignmentGroundTruth[]): LabeledPair[] {
  const allPairs: LabeledPair[] = []
  let totalPositive = 0
  let totalNegative = 0

  for (const { assignment, groups } of assignments) {
    const assignmentDir = path.join(SRC_ROOT, ...assignment.replace("A2016/", "").split("/"))

    if (!fs.existsSync(assignmentDir)) {
      console.log(`  WARNING: Source folder missing for ${assignment}, skipping.`)
      continue
    }

    const allStudentFiles = fs.readdirSync(assignmentDir)
      .filter(f => f.endsWith(".c"))
      .map(f => f.replace(".c", ""))

    // Build positive pair set
    const positiveSet = new Set<string>()
    const positivePairs: Array<[string, string]> = []

    for (const group of groups) {
      const groupStudents = group.filter(s => allStudentFiles.includes(s))
      const pairs = generatePairsFromGroup(groupStudents)

      for (const [s1, s2] of pairs) {
        const key = [s1, s2].sort().join("|")

        if (!positiveSet.has(key)) {
          positiveSet.add(key)
          positivePairs.push([s1, s2])
        }
      }
    }

    // Add positive pairs
    for (const [s1, s2] of positivePairs) {
      allPairs.push({ assignment, student1: s1, student2: s2, label: 1 })
    }

    // Build set of students involved in plagiarism (for sampling negatives)
    const plagiarizingStudents = new Set<string>()

    for (const group of groups) {
      for (const s of group) {
        plagiarizingStudents.add(s)
      }
    }

    const cleanStudents = allStudentFiles.filter(s => !plagiarizingStudents.has(s))

    // Sample negative pairs (clean student × clean student)
    const targetNegativeCount = Math.min(
      positivePairs.length * NEGATIVE_SAMPLE_RATIO,
      Math.floor((cleanStudents.length * (cleanStudents.length - 1)) / 2),
    )

    const negativeSet = new Set<string>()

    // Use deterministic seeded shuffle for reproducibility
    const shuffledClean = [...cleanStudents].sort()
    let negativeCount = 0

    for (let i = 0; i < shuffledClean.length && negativeCount < targetNegativeCount; i++) {
      for (let j = i + 1; j < shuffledClean.length && negativeCount < targetNegativeCount; j++) {
        const key = [shuffledClean[i], shuffledClean[j]].sort().join("|")

        if (!negativeSet.has(key)) {
          negativeSet.add(key)
          allPairs.push({ assignment, student1: shuffledClean[i], student2: shuffledClean[j], label: 0 })
          negativeCount++
        }
      }
    }

    totalPositive += positivePairs.length
    totalNegative += negativeCount
    console.log(
      `  ${assignment}: ${positivePairs.length} positive, ${negativeCount} negative pairs ` +
      `(${allStudentFiles.length} students, ${groups.length} plagiarism groups)`
    )
  }

  console.log(`\n  TOTAL: ${totalPositive} positive + ${totalNegative} negative = ${allPairs.length} pairs`)

  return allPairs
}

// -- Structural Scoring --------------------------------------------------------

async function computeStructuralScore(code1: string, code2: string): Promise<number> {
  const detector = new PlagiarismDetector({
    language: "c",
    kgramLength: PRODUCTION_K,
    kgramsInWindow: PRODUCTION_W,
    minFragmentLength: 2,
  })

  const report = await detector.analyze([new File("FileA.c", code1), new File("FileB.c", code2)])
  const pairs = report.getPairs()

  return pairs.length > 0 ? pairs[0].similarity : 0.0
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

// -- Hybrid Score --------------------------------------------------------------

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
    const assignmentRelPath = pair.assignment.replace("A2016/", "")
    const assignmentDir = path.join(SRC_ROOT, ...assignmentRelPath.split("/"))
    const file1Path = path.join(assignmentDir, `${pair.student1}.c`)
    const file2Path = path.join(assignmentDir, `${pair.student2}.c`)

    if (!fs.existsSync(file1Path) || !fs.existsSync(file2Path)) {
      errors++
      results.push({
        assignment: pair.assignment, student1: pair.student1, student2: pair.student2,
        label: pair.label, structuralScore: 0, semanticScore: 0, hybridScore: 0,
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
        assignment: pair.assignment,
        student1: pair.student1,
        student2: pair.student2,
        label: pair.label,
        structuralScore,
        semanticScore,
        hybridScore: computeHybridScore(structuralScore, semanticScore),
      })
    } catch {
      errors++
      results.push({
        assignment: pair.assignment, student1: pair.student1, student2: pair.student2,
        label: pair.label, structuralScore: 0, semanticScore: 0, hybridScore: 0,
      })
    }

    processed++

    if (processed % 50 === 0 || processed === pairs.length) {
      const elapsedMs = Date.now() - startTime
      const pairsPerSec = processed / (elapsedMs / 1000)
      const remaining = pairs.length - processed
      const etaSec = Math.round(remaining / pairsPerSec)
      process.stdout.write(
        `\r  [LJUBOVIC-C] ${processed}/${pairs.length} (${errors} errors) — ` +
        `${pairsPerSec.toFixed(1)} pairs/s — ETA: ${etaSec}s  `
      )
    }
  }

  process.stdout.write(
    `\r  [LJUBOVIC-C] ${processed}/${pairs.length} (${errors} errors) — done.                          \n`
  )

  return results
}

// -- Main ----------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("\n" + "=".repeat(70))
  console.log("  LJUBOVIC C DATASET EVALUATION")
  console.log("  Ljubovic (2020) — Programming Homework Dataset for Plagiarism Detection")
  console.log("  Course A2016 — University of Sarajevo — C Language")
  console.log(`  Config: k=${PRODUCTION_K}, w=${PRODUCTION_W} (Production Defaults)`)
  console.log(`  Weights: structural=${STRUCTURAL_WEIGHT}, semantic=${SEMANTIC_WEIGHT}`)
  console.log("=".repeat(70))

  if (!fs.existsSync(GROUND_TRUTH_FILE)) {
    console.error(`\n  ERROR: Ground truth file not found at: ${GROUND_TRUTH_FILE}`)
    console.error("  Clone the dataset first:")
    console.error("  git clone https://github.com/vfrunza/GPLAG-Plagerism-Detection.git")
    console.error("  into: backend-ts/evaluation-results/ljubovic-c-dataset/")
    process.exit(1)
  }

  // Parse ground truth
  console.log("\n  Parsing ground truth (A2016 assignments) ...")
  const assignmentGroundTruth = parseGroundTruth()
  console.log(`  Found ${assignmentGroundTruth.length} A2016 assignments with ground truth.\n`)

  // Build labeled pairs
  console.log("  Building labeled pairs ...")
  const pairs = buildLabeledPairs(assignmentGroundTruth)
  const positiveCount = pairs.filter(p => p.label === 1).length
  const negativeCount = pairs.filter(p => p.label === 0).length

  console.log(`\n  Scoring all ${pairs.length} pairs ...`)

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

  // -- Per-assignment breakdown (structural mode) ---
  console.log("\n" + "=".repeat(70))
  console.log("  PER-ASSIGNMENT BREAKDOWN (Structural Mode)")
  console.log("=".repeat(70))

  const assignmentNames = [...new Set(results.map(r => r.assignment))]

  for (const assignment of assignmentNames) {
    const assignmentResults = results.filter(r => r.assignment === assignment)
    const pos = assignmentResults.filter(r => r.label === 1).length
    const neg = assignmentResults.filter(r => r.label === 0).length

    if (pos === 0) continue

    const auc = computeRocAuc(assignmentResults, "structural")
    const metrics = findBestF1Threshold(assignmentResults, "structural")

    console.log(
      `  ${assignment}: F1=${pct(metrics.f1Score)}, AUC=${auc.toFixed(4)}, ` +
      `P=${pct(metrics.precision)}, R=${pct(metrics.recall)} ` +
      `(${pos}+/${neg}−)`
    )
  }

  console.log("\n" + "=".repeat(70))
  console.log(`  Wall time: ${wallElapsedSec}s`)
  console.log("=".repeat(70))

  // -- Save results ---
  const outputData: Record<string, unknown> = {
    note: "Ljubovic C dataset evaluation — A2016 course, 18 assignments (Ljubovic, 2020).",
    citation: "Ljubovic, V. (2020). Programming Homework Dataset for Plagiarism Detection. IEEE DataPort. DOI: 10.21227/71fw-ss32",
    config: { k: PRODUCTION_K, w: PRODUCTION_W, structuralWeight: STRUCTURAL_WEIGHT, semanticWeight: SEMANTIC_WEIGHT },
    datasetInfo: {
      source: "https://ieee-dataport.org/open-access/programming-homework-dataset-plagiarism-detection",
      githubMirror: "https://github.com/vfrunza/GPLAG-Plagerism-Detection",
      course: "A2016",
      assignmentCount: assignmentGroundTruth.length,
      totalPairs: pairs.length,
      positives: positiveCount,
      negatives: negativeCount,
      language: "c",
      negativeSampleRatio: NEGATIVE_SAMPLE_RATIO,
    },
    wallTimeSeconds: parseFloat(wallElapsedSec),
    modes: modeSummaries,
    results,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), "utf-8")
  console.log(`\n  Results saved to: ${OUTPUT_FILE}`)
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
