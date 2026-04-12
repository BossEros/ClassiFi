/**
 * Structural Analysis Evaluation on Type 1/2 Clone Dataset
 *
 * Evaluates Winnowing on synthetic Type 1 (formatting) and Type 2 (renamed)
 * clones to measure performance on its intended detection target.
 *
 * Usage (from backend-ts/):
 *   npx vitest run tests/evaluate-type12.test.ts --no-coverage --reporter=verbose
 */

import { describe, it } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"
import { PlagiarismDetector, File } from "@/lib/plagiarism/index.js"

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPT_DIR = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")))
const RESULT_DIR = path.resolve(SCRIPT_DIR, "../../evaluation-results")
const FUNCTIONS_FILE = path.join(RESULT_DIR, "type12_functions.jsonl")
const PAIRS_FILE = path.join(RESULT_DIR, "type12_test.txt")

// ── Types ─────────────────────────────────────────────────────────────────────

interface FunctionEntry { idx: string; func: string; lang: string }
interface PairEntry { id1: string; id2: string; label: number; lang: string; cloneType: string }
interface PredictionResult { id1: string; id2: string; label: number; score: number; lang: string; cloneType: string }

interface ClassificationMetrics {
  threshold: number; accuracy: number; precision: number; recall: number
  f1Score: number; tp: number; fp: number; tn: number; fn: number
}

// ── Data Loading ──────────────────────────────────────────────────────────────

function loadFunctions(): Map<string, FunctionEntry> {
  const raw = fs.readFileSync(FUNCTIONS_FILE, "utf-8")
  const map = new Map<string, FunctionEntry>()
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue
    const obj = JSON.parse(line)
    map.set(String(obj.idx), { idx: String(obj.idx), func: obj.func, lang: obj.lang })
  }
  return map
}

function loadPairs(): PairEntry[] {
  const raw = fs.readFileSync(PAIRS_FILE, "utf-8")
  const pairs: PairEntry[] = []
  for (const line of raw.split("\n")) {
    const parts = line.trim().split(/\t/)
    if (parts.length < 5) continue
    pairs.push({ id1: parts[0], id2: parts[1], label: parseInt(parts[2], 10), lang: parts[3], cloneType: parts[4] })
  }
  return pairs
}

function getExtension(lang: string): string {
  switch (lang) {
    case "python": return "py"
    case "java": return "java"
    case "c": return "c"
    default: return "txt"
  }
}

// ── Similarity ────────────────────────────────────────────────────────────────

async function computeSimilarity(
  func1: string, func2: string, lang: string,
  kgramLength: number, kgramsInWindow: number,
): Promise<number> {
  const detector = new PlagiarismDetector({
    language: lang as "python" | "java" | "c",
    kgramLength,
    kgramsInWindow,
    minFragmentLength: 2,
  })
  const file1 = new File("file1." + getExtension(lang), func1)
  const file2 = new File("file2." + getExtension(lang), func2)
  const report = await detector.analyze([file1, file2])
  const pairs = report.getPairs()
  return pairs.length > 0 ? pairs[0].similarity : 0.0
}

// ── Metrics ───────────────────────────────────────────────────────────────────

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

function findBestThreshold(results: PredictionResult[]): ClassificationMetrics {
  let best = computeMetrics(results, 0.05)
  for (let t = 0.01; t <= 0.95; t += 0.01) {
    const m = computeMetrics(results, t)
    if (m.f1Score > best.f1Score) best = m
  }
  return best
}

function computeRocAuc(results: PredictionResult[]): number {
  const thresholds = Array.from({ length: 201 }, (_, i) => i / 200)
  const totalPos = results.filter(r => r.label === 1).length
  const totalNeg = results.filter(r => r.label === 0).length
  const points: Array<{ fpr: number; tpr: number }> = []
  for (const t of thresholds) {
    const m = computeMetrics(results, t)
    points.push({ fpr: totalNeg > 0 ? m.fp / totalNeg : 0, tpr: totalPos > 0 ? m.tp / totalPos : 0 })
  }
  points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr)
  let auc = 0
  for (let i = 1; i < points.length; i++) {
    auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2
  }
  return auc
}

function computeAvgPrecision(results: PredictionResult[]): number {
  const sorted = [...results].sort((a, b) => b.score - a.score)
  const totalPos = results.filter(r => r.label === 1).length
  if (totalPos === 0) return 0
  let cumTp = 0, ap = 0
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) { cumTp++; ap += cumTp / (i + 1) }
  }
  return ap / totalPos
}

// ── Score Distribution ────────────────────────────────────────────────────────

function printDistribution(label: string, scores: number[]): void {
  if (scores.length === 0) return
  const sorted = [...scores].sort((a, b) => a - b)
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const p25 = sorted[Math.floor(scores.length * 0.25)]
  const p75 = sorted[Math.floor(scores.length * 0.75)]
  console.log(`    ${label}: mean=${mean.toFixed(4)}, median=${median.toFixed(4)}, min=${min.toFixed(4)}, max=${max.toFixed(4)}, P25=${p25.toFixed(4)}, P75=${p75.toFixed(4)}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

/** k=13, w=10 (best from sweep) and production k=23, w=17 */
const CONFIGS = [
  { k: 13, w: 10, label: "Best Sweep" },
  { k: 23, w: 17, label: "Production" },
]

describe("Type 1/2 Clone Evaluation", () => {
  it("evaluates Winnowing on Type 1/2 clones", { timeout: 1_800_000 }, async () => {
    console.log("\n" + "═".repeat(70))
    console.log("  STRUCTURAL ANALYSIS — TYPE 1/2 CLONE EVALUATION")
    console.log("═".repeat(70))

    const functions = loadFunctions()
    const allPairs = loadPairs()

    console.log(`  Functions loaded: ${functions.size}`)
    console.log(`  Total pairs: ${allPairs.length}`)
    console.log(`    Type 1 clone pairs: ${allPairs.filter(p => p.cloneType === "type1").length}`)
    console.log(`    Type 2 clone pairs: ${allPairs.filter(p => p.cloneType === "type2").length}`)
    console.log(`    Non-clone pairs:    ${allPairs.filter(p => p.cloneType === "non-clone").length}`)

    const outputData: Record<string, unknown> = { configs: CONFIGS, results: {} }

    for (const config of CONFIGS) {
      console.log(`\n${"─".repeat(70)}`)
      console.log(`  CONFIG: k=${config.k}, w=${config.w} (${config.label})`)
      console.log(`${"─".repeat(70)}`)

      // Evaluate all pairs
      const results: PredictionResult[] = []
      let errors = 0
      const startTime = Date.now()

      for (let i = 0; i < allPairs.length; i++) {
        const pair = allPairs[i]
        const func1 = functions.get(pair.id1)
        const func2 = functions.get(pair.id2)
        if (!func1 || !func2) continue

        try {
          const score = await computeSimilarity(func1.func, func2.func, pair.lang, config.k, config.w)
          results.push({ ...pair, score })
        } catch {
          errors++
          results.push({ ...pair, score: 0.0 })
        }

        if ((i + 1) % 200 === 0 || i === allPairs.length - 1) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          process.stdout.write(`\r    ${i + 1}/${allPairs.length} (${elapsed}s, ${errors} errors)`)
        }
      }
      console.log("")

      // ── Overall metrics ──
      const overall = findBestThreshold(results)
      const rocAuc = computeRocAuc(results)
      const avgPrec = computeAvgPrecision(results)

      console.log(`\n  OVERALL (all pairs):`)
      console.log(`    Best Threshold: ${overall.threshold.toFixed(2)}`)
      console.log(`    Accuracy:  ${(overall.accuracy * 100).toFixed(2)}%`)
      console.log(`    Precision: ${(overall.precision * 100).toFixed(2)}%`)
      console.log(`    Recall:    ${(overall.recall * 100).toFixed(2)}%`)
      console.log(`    F1-Score:  ${(overall.f1Score * 100).toFixed(2)}%`)
      console.log(`    ROC-AUC:   ${rocAuc.toFixed(4)}`)
      console.log(`    Avg Prec:  ${avgPrec.toFixed(4)}`)

      // ── Type 1 only ──
      const type1Results = results.filter(r => r.cloneType === "type1" || r.cloneType === "non-clone")
      const type1Metrics = findBestThreshold(type1Results)
      const type1Auc = computeRocAuc(type1Results)

      console.log(`\n  TYPE 1 ONLY (formatting changes):`)
      console.log(`    Best Threshold: ${type1Metrics.threshold.toFixed(2)}`)
      console.log(`    Accuracy:  ${(type1Metrics.accuracy * 100).toFixed(2)}%`)
      console.log(`    Precision: ${(type1Metrics.precision * 100).toFixed(2)}%`)
      console.log(`    Recall:    ${(type1Metrics.recall * 100).toFixed(2)}%`)
      console.log(`    F1-Score:  ${(type1Metrics.f1Score * 100).toFixed(2)}%`)
      console.log(`    ROC-AUC:   ${type1Auc.toFixed(4)}`)

      // ── Type 2 only ──
      const type2Results = results.filter(r => r.cloneType === "type2" || r.cloneType === "non-clone")
      const type2Metrics = findBestThreshold(type2Results)
      const type2Auc = computeRocAuc(type2Results)

      console.log(`\n  TYPE 2 ONLY (renamed identifiers):`)
      console.log(`    Best Threshold: ${type2Metrics.threshold.toFixed(2)}`)
      console.log(`    Accuracy:  ${(type2Metrics.accuracy * 100).toFixed(2)}%`)
      console.log(`    Precision: ${(type2Metrics.precision * 100).toFixed(2)}%`)
      console.log(`    Recall:    ${(type2Metrics.recall * 100).toFixed(2)}%`)
      console.log(`    F1-Score:  ${(type2Metrics.f1Score * 100).toFixed(2)}%`)
      console.log(`    ROC-AUC:   ${type2Auc.toFixed(4)}`)

      // ── Score distributions ──
      console.log(`\n  Score distributions:`)
      const type1Scores = results.filter(r => r.cloneType === "type1").map(r => r.score)
      const type2Scores = results.filter(r => r.cloneType === "type2").map(r => r.score)
      const negScores = results.filter(r => r.cloneType === "non-clone").map(r => r.score)
      printDistribution("Type 1 clones", type1Scores)
      printDistribution("Type 2 clones", type2Scores)
      printDistribution("Non-clones   ", negScores)

      outputData.results = {
        ...outputData.results as Record<string, unknown>,
        [config.label]: {
          config: { k: config.k, w: config.w },
          overall: { ...overall, rocAuc, avgPrec },
          type1: { ...type1Metrics, rocAuc: type1Auc },
          type2: { ...type2Metrics, rocAuc: type2Auc },
          distributions: {
            type1: { mean: type1Scores.reduce((s, v) => s + v, 0) / type1Scores.length, count: type1Scores.length },
            type2: { mean: type2Scores.reduce((s, v) => s + v, 0) / type2Scores.length, count: type2Scores.length },
            nonClone: { mean: negScores.reduce((s, v) => s + v, 0) / negScores.length, count: negScores.length },
          },
        },
      }
    }

    // Save results
    const outPath = path.join(RESULT_DIR, "type12-evaluation-results.json")
    fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2))
    console.log(`\n  Results saved to: ${outPath}`)
  })
})
