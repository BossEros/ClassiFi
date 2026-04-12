/**
 * IR-Plag Dataset Evaluation Script — Structural, Semantic & Hybrid
 *
 * Evaluates all three ClassiFi analysis modes against the IR-Plag dataset
 * (Karnalim, 2020), a controlled benchmark of 467 Java source files across
 * 7 programming tasks.
 *
 * The dataset covers six plagiarism levels (Faidhi & Robinson, 1987):
 *   L1 - Comments and whitespace changes only        → Clone Type 1
 *   L2 - Identifier renaming                         → Clone Type 2
 *   L3 - Statement/expression reordering             → Clone Type 3
 *   L4 - Code additions (unused statements/variables)→ Clone Type 3
 *   L5 - Control flow changes (loop/conditional)     → Clone Type 3/4
 *   L6 - Data structure / algorithmic changes        → Clone Type 4
 *
 * Scoring modes:
 *   Structural  — Winnowing fingerprinting (k=23, w=17)
 *   Semantic    — GraphCodeBERT cosine similarity (via VPS HTTP)
 *   Hybrid      — Weighted combination (structural=0.7, semantic=0.3)
 *
 * Usage (from backend-ts/):
 *   npx tsx scripts/evaluate-ir-plag.ts
 *
 * Prerequisites:
 *   IR-Plag-Dataset must be extracted at:
 *   backend-ts/evaluation-results/IR-Plag-Dataset/IR-Plag-Dataset/
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// -- Constants -----------------------------------------------------------------

const PRODUCTION_K = 23
const PRODUCTION_W = 17
const STRUCTURAL_WEIGHT = 0.7
const SEMANTIC_WEIGHT = 0.3
const SEMANTIC_SERVICE_URL = "http://159.65.128.153:8002"
const SEMANTIC_CONCURRENCY_LIMIT = 2
const SEMANTIC_TIMEOUT_MS = 10_000
const PLAGIARISM_LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"] as const

type PlagiarismLevel = typeof PLAGIARISM_LEVELS[number]

// -- Paths ---------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../evaluation-results")
const DATASET_DIR = path.join(RESULT_DIR, "IR-Plag-Dataset", "IR-Plag-Dataset")
const OUTPUT_FILE = path.join(RESULT_DIR, "ir-plag-evaluation-results.json")

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

// -- Utilities -----------------------------------------------------------------

function findJavaFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".java"))
  return files.length > 0 ? path.join(dir, files[0]) : null
}

function findAllJavaFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".java"))
    .map(f => path.join(dir, f))
}

// -- Structural Scoring (Winnowing) -------------------------------------------

async function computeStructuralScore(code1: string, code2: string): Promise<number> {
  const detector = new PlagiarismDetector({
    language: "java",
    kgramLength: PRODUCTION_K,
    kgramsInWindow: PRODUCTION_W,
    minFragmentLength: 2,
  })

  const report = await detector.analyze([
    new File("Original.java", code1),
    new File("Candidate.java", code2),
  ])

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
      body: JSON.stringify({ code1, code2, language: "java" }),
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

// -- Dataset Walking -----------------------------------------------------------

async function evaluateFilePair(
  originalCode: string,
  candidateCode: string,
  caseName: string,
  fileName: string,
  level: PlagiarismLevel | "non-plagiarized",
  label: 1 | 0,
): Promise<PairResult> {
  const [structuralScore, semanticScore] = await Promise.all([
    computeStructuralScore(originalCode, candidateCode).catch(() => 0.0),
    computeSemanticScore(originalCode, candidateCode).catch(() => 0.0),
  ])

  return {
    case: caseName,
    file: fileName,
    level,
    label,
    structuralScore,
    semanticScore,
    hybridScore: computeHybridScore(structuralScore, semanticScore),
  }
}

async function evaluateCase(caseDir: string, caseName: string): Promise<PairResult[]> {
  const originalFile = findJavaFile(path.join(caseDir, "original"))
  if (!originalFile) {
    console.warn(`  [WARN] No original file in ${caseDir}`)
    return []
  }
  const originalCode = fs.readFileSync(originalFile, "utf-8")

  const pairPromises: Promise<PairResult>[] = []

  // Plagiarized levels
  for (const level of PLAGIARISM_LEVELS) {
    const levelDir = path.join(caseDir, "plagiarized", level)
    if (!fs.existsSync(levelDir)) continue

    const submissionDirs = fs.readdirSync(levelDir)
      .filter(d => fs.statSync(path.join(levelDir, d)).isDirectory())

    for (const submissionDir of submissionDirs) {
      for (const javaFile of findAllJavaFiles(path.join(levelDir, submissionDir))) {
        const candidateCode = fs.readFileSync(javaFile, "utf-8")
        pairPromises.push(evaluateFilePair(originalCode, candidateCode, caseName, path.basename(javaFile), level, 1))
      }
    }
  }

  // Non-plagiarized
  const nonPlagDir = path.join(caseDir, "non-plagiarized")
  if (fs.existsSync(nonPlagDir)) {
    const submissionDirs = fs.readdirSync(nonPlagDir)
      .filter(d => fs.statSync(path.join(nonPlagDir, d)).isDirectory())

    for (const submissionDir of submissionDirs) {
      for (const javaFile of findAllJavaFiles(path.join(nonPlagDir, submissionDir))) {
        const candidateCode = fs.readFileSync(javaFile, "utf-8")
        pairPromises.push(evaluateFilePair(originalCode, candidateCode, caseName, path.basename(javaFile), "non-plagiarized", 0))
      }
    }
  }

  return Promise.all(pairPromises)
}

// -- Metrics Helpers ----------------------------------------------------------

type ScoreMode = "structural" | "semantic" | "hybrid"

function getScore(result: PairResult, mode: ScoreMode): number {
  if (mode === "structural") return result.structuralScore
  if (mode === "semantic") return result.semanticScore
  return result.hybridScore
}

function findBestF1Threshold(results: PairResult[], mode: ScoreMode): { threshold: number; f1: number } {
  const scores = results.map(r => getScore(r, mode)).sort((a, b) => a - b)
  const candidates = [...new Set(scores)]

  let bestF1 = 0
  let bestThreshold = 0.5

  for (const threshold of candidates) {
    let tp = 0, fp = 0, fn = 0
    for (const r of results) {
      const predicted = getScore(r, mode) >= threshold ? 1 : 0
      if (predicted === 1 && r.label === 1) tp++
      else if (predicted === 1 && r.label === 0) fp++
      else if (predicted === 0 && r.label === 1) fn++
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    if (f1 > bestF1) { bestF1 = f1; bestThreshold = threshold }
  }

  return { threshold: bestThreshold, f1: bestF1 }
}

// -- Reporting -----------------------------------------------------------------

function printLevelTable(results: PairResult[], mode: ScoreMode): void {
  const thresholds = [0.25, 0.30, 0.40, 0.50, 0.54, 0.75]
  const levelOrder: Array<PlagiarismLevel | "non-plagiarized"> = [...PLAGIARISM_LEVELS, "non-plagiarized"]

  console.log(`\n${"─".repeat(90)}`)
  console.log(`  [${mode.toUpperCase()}] Detection Rate by Plagiarism Level`)
  console.log(`${"─".repeat(90)}`)
  console.log(`  ${"Level".padEnd(18)} ${"N".padStart(4)} ${"Mean".padStart(7)} ${"Min".padStart(7)} ${"Max".padStart(7)}  ${thresholds.map(t => `@${t}`).join("  ")}`)
  console.log(`${"─".repeat(90)}`)

  for (const level of levelOrder) {
    const levelResults = results.filter(r => r.level === level)
    if (levelResults.length === 0) continue

    const scores = levelResults.map(r => getScore(r, mode))
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length
    const min = Math.min(...scores)
    const max = Math.max(...scores)

    const detRates = thresholds.map(t => {
      const detected = levelResults.filter(r => getScore(r, mode) >= t).length
      return `${((detected / levelResults.length) * 100).toFixed(0).padStart(4)}%`
    })

    const label = level === "non-plagiarized" ? "Non-Plagiarized" : level
    console.log(
      `  ${label.padEnd(18)} ${String(levelResults.length).padStart(4)} ` +
      `${mean.toFixed(3).padStart(7)} ${min.toFixed(3).padStart(7)} ${max.toFixed(3).padStart(7)}  ` +
      detRates.join("   ")
    )
  }
}

function printOverallMetrics(results: PairResult[], mode: ScoreMode): void {
  const { threshold: bestThreshold, f1: bestF1 } = findBestF1Threshold(results, mode)
  const thresholds = [0.25, 0.30, 0.40, 0.50, 0.54, 0.75, bestThreshold].sort((a, b) => a - b)
  const uniqueThresholds = [...new Set(thresholds.map(t => parseFloat(t.toFixed(4))))]

  console.log(`\n  Overall (${mode}) — Best F1 = ${(bestF1 * 100).toFixed(2)}% @ threshold ${bestThreshold.toFixed(4)}`)
  console.log(`  ${"Threshold".padEnd(12)} ${"TP".padStart(5)} ${"FP".padStart(5)} ${"TN".padStart(5)} ${"FN".padStart(5)} ${"Precision".padStart(10)} ${"Recall".padStart(8)} ${"F1".padStart(8)}`)
  console.log(`  ${"─".repeat(66)}`)

  for (const threshold of uniqueThresholds) {
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
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    const marker = threshold === bestThreshold ? " ← BEST" : ""

    console.log(
      `  ${String(threshold.toFixed(4)).padEnd(12)} ${String(tp).padStart(5)} ${String(fp).padStart(5)} ` +
      `${String(tn).padStart(5)} ${String(fn).padStart(5)} ` +
      `${(precision * 100).toFixed(2).padStart(9)}% ${(recall * 100).toFixed(2).padStart(7)}% ${(f1 * 100).toFixed(2).padStart(7)}%${marker}`
    )
  }
}

function printComparativeHeader(results: PairResult[]): void {
  const positives = results.filter(r => r.label === 1).length
  const negatives = results.filter(r => r.label === 0).length

  console.log("\n" + "=".repeat(90))
  console.log("  IR-PLAG EVALUATION RESULTS — STRUCTURAL vs SEMANTIC vs HYBRID")
  console.log("  ClassiFi  |  Winnowing k=23,w=17  |  GraphCodeBERT  |  Hybrid 0.7/0.3")
  console.log("=".repeat(90))
  console.log(`\n  Total: ${results.length} pairs  |  ${positives} plagiarized (L1–L6)  |  ${negatives} non-plagiarized`)
  console.log(`  Hybrid weights: structural=${STRUCTURAL_WEIGHT}, semantic=${SEMANTIC_WEIGHT}`)
}

function printBestF1Summary(results: PairResult[]): void {
  console.log("\n" + "=".repeat(90))
  console.log("  BEST F1 SUMMARY — ALL THREE MODES")
  console.log("=".repeat(90))
  console.log(`  ${"Mode".padEnd(14)} ${"Best F1".padStart(9)} ${"Precision".padStart(10)} ${"Recall".padStart(8)} ${"Threshold".padStart(10)}`)
  console.log(`  ${"─".repeat(55)}`)

  for (const mode of ["structural", "semantic", "hybrid"] as ScoreMode[]) {
    const { threshold, f1 } = findBestF1Threshold(results, mode)
    let tp = 0, fp = 0, fn = 0
    for (const r of results) {
      const predicted = getScore(r, mode) >= threshold ? 1 : 0
      if (predicted === 1 && r.label === 1) tp++
      else if (predicted === 1 && r.label === 0) fp++
      else if (predicted === 0 && r.label === 1) fn++
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0

    console.log(
      `  ${mode.padEnd(14)} ${(f1 * 100).toFixed(2).padStart(8)}% ` +
      `${(precision * 100).toFixed(2).padStart(9)}% ${(recall * 100).toFixed(2).padStart(7)}% ` +
      `${String(threshold.toFixed(4)).padStart(10)}`
    )
  }
}

// -- Main ----------------------------------------------------------------------

async function main(): Promise<void> {
  if (!fs.existsSync(DATASET_DIR)) {
    console.error(`\n  ERROR: Dataset not found at: ${DATASET_DIR}`)
    process.exit(1)
  }

  // Verify semantic service is reachable before running 460 pairs
  console.log(`\n  Checking semantic service at ${SEMANTIC_SERVICE_URL} ...`)
  try {
    const healthResp = await fetch(`${SEMANTIC_SERVICE_URL}/health`)
    const health = await healthResp.json() as { status: string; model_loaded: boolean }
    console.log(`  Semantic service: ${health.status}, model_loaded=${health.model_loaded}`)
    if (!health.model_loaded) {
      console.error("  ERROR: Semantic model is not loaded on the VPS. Aborting.")
      process.exit(1)
    }
  } catch (err) {
    console.error(`  ERROR: Cannot reach semantic service: ${err}`)
    process.exit(1)
  }

  const caseDirs = fs.readdirSync(DATASET_DIR).filter(d => d.startsWith("case-")).sort()

  console.log(`\n  Found ${caseDirs.length} cases: ${caseDirs.join(", ")}`)
  console.log("  Modes: Structural (Winnowing) + Semantic (GraphCodeBERT) + Hybrid")
  console.log(`  Weights: structural=${STRUCTURAL_WEIGHT}, semantic=${SEMANTIC_WEIGHT}\n`)

  const allResults: PairResult[] = []
  const startTime = Date.now()

  for (const caseName of caseDirs) {
    const caseDir = path.join(DATASET_DIR, caseName)
    process.stdout.write(`  Evaluating ${caseName} ...`)

    const caseResults = await evaluateCase(caseDir, caseName)
    allResults.push(...caseResults)

    const plagCount = caseResults.filter(r => r.label === 1).length
    const nonPlagCount = caseResults.filter(r => r.label === 0).length
    console.log(` ${plagCount} plagiarized, ${nonPlagCount} non-plagiarized`)
  }

  const wallSec = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n  Completed ${allResults.length} pairs in ${wallSec}s`)

  printComparativeHeader(allResults)

  for (const mode of ["structural", "semantic", "hybrid"] as ScoreMode[]) {
    printLevelTable(allResults, mode)
    printOverallMetrics(allResults, mode)
  }

  printBestF1Summary(allResults)

  // Save full results
  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({
      config: {
        k: PRODUCTION_K,
        w: PRODUCTION_W,
        structuralWeight: STRUCTURAL_WEIGHT,
        semanticWeight: SEMANTIC_WEIGHT,
        semanticServiceUrl: SEMANTIC_SERVICE_URL,
      },
      dataset: "IR-Plag (Karnalim, 2020)",
      totalPairs: allResults.length,
      wallTimeSeconds: parseFloat(wallSec),
      results: allResults,
    }, null, 2)
  )

  console.log(`\n  Full results saved to: ${OUTPUT_FILE}`)
  console.log("=".repeat(90))
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
