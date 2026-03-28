import { describe, expect, it } from "vitest"
import {
  File,
  PlagiarismDetector,
  type DetectorOptions,
} from "../../src/lib/plagiarism/index.js"

type ComparedPair = [string, string]

interface PairExpectation {
  pair: ComparedPair
  minSimilarity?: number
  maxSimilarity?: number
  minFragmentCount?: number
  maxFragmentCount?: number
}

interface RelativePairExpectation {
  higherPair: ComparedPair
  lowerPair: ComparedPair
}

interface CuratedFixtureScenario {
  id: string
  detectorOptions: DetectorOptions
  files: Array<{ path: string; content: string }>
  pairExpectations: PairExpectation[]
  relativeExpectations?: RelativePairExpectation[]
}

interface PairMetrics {
  similarity: number
  fragmentCount: number
}

const curatedFixtureScenarios: CuratedFixtureScenario[] = [
  {
    id: "python-renamed-sum-ranks-above-distinct-branching-solution",
    detectorOptions: {
      language: "python",
      kgramLength: 5,
      kgramsInWindow: 4,
      minFragmentLength: 2,
    },
    files: [
      {
        path: "alpha.py",
        content: [
          "def solve(values):",
          "    total = 0",
          "    for value in values:",
          "        total = total + value",
          "    return total",
        ].join("\n"),
      },
      {
        path: "beta.py",
        content: [
          "def solve(numbers):",
          "    total = 0",
          "    for number in numbers:",
          "        total = total + number",
          "    return total",
        ].join("\n"),
      },
      {
        path: "delta.py",
        content: [
          "def solve(values):",
          "    if not values:",
          "        return 0",
          "    return max(values)",
        ].join("\n"),
      },
    ],
    pairExpectations: [
      {
        pair: ["alpha.py", "beta.py"],
        minSimilarity: 0.95,
        minFragmentCount: 1,
      },
      {
        pair: ["alpha.py", "delta.py"],
        maxSimilarity: 0.5,
      },
    ],
    relativeExpectations: [
      {
        higherPair: ["alpha.py", "beta.py"],
        lowerPair: ["alpha.py", "delta.py"],
      },
    ],
  },
]

describe("curated plagiarism fixtures", () => {
  for (const scenario of curatedFixtureScenarios) {
    it(`evaluates ${scenario.id}`, async () => {
      const result = await evaluateCuratedScenario(scenario)

      for (const expectation of scenario.pairExpectations) {
        const pairMetrics = getPairMetricsOrThrow(result, expectation)

        if (expectation.minSimilarity !== undefined) {
          expect(pairMetrics.similarity).toBeGreaterThanOrEqual(
            expectation.minSimilarity,
          )
        }

        if (expectation.maxSimilarity !== undefined) {
          expect(pairMetrics.similarity).toBeLessThanOrEqual(
            expectation.maxSimilarity,
          )
        }

        if (expectation.minFragmentCount !== undefined) {
          expect(pairMetrics.fragmentCount).toBeGreaterThanOrEqual(
            expectation.minFragmentCount,
          )
        }

        if (expectation.maxFragmentCount !== undefined) {
          expect(pairMetrics.fragmentCount).toBeLessThanOrEqual(
            expectation.maxFragmentCount,
          )
        }
      }

      for (const relativeExpectation of scenario.relativeExpectations ?? []) {
        assertRelativePairOrdering(result, relativeExpectation)
      }
    })
  }
})

function assertRelativePairOrdering(
  result: Map<string, PairMetrics>,
  expectation: RelativePairExpectation,
): void {
  const higherPairMetrics = getPairMetricsOrThrow(result, {
    pair: expectation.higherPair,
  })
  const lowerPairMetrics = getPairMetricsOrThrow(result, {
    pair: expectation.lowerPair,
  })

  expect(higherPairMetrics.similarity).toBeGreaterThan(
    lowerPairMetrics.similarity,
  )
}

async function evaluateCuratedScenario(
  scenario: CuratedFixtureScenario,
): Promise<Map<string, PairMetrics>> {
  const detector = new PlagiarismDetector(scenario.detectorOptions)
  const files = scenario.files.map(
    (file, fileIndex) =>
      new File(file.path, file.content, {
        submissionId: String(fileIndex + 1),
      }),
  )
  const report = await detector.analyze(files)
  const pairMetricsByKey = new Map<string, PairMetrics>()

  for (const pair of report.getPairs()) {
    pairMetricsByKey.set(createPairKey(pair.leftFile.filename, pair.rightFile.filename), {
      similarity: pair.similarity,
      fragmentCount: report.getFragments(pair).length,
    })
  }

  return pairMetricsByKey
}

function getPairMetricsOrThrow(
  pairMetricsByKey: Map<string, PairMetrics>,
  expectation: { pair: ComparedPair },
): PairMetrics {
  const pairKey = createPairKey(expectation.pair[0], expectation.pair[1])
  const pairMetrics = pairMetricsByKey.get(pairKey)

  expect(pairMetrics).toBeDefined()

  if (!pairMetrics) {
    throw new Error(`Expected pair metrics for ${pairKey}`)
  }

  return pairMetrics
}

function createPairKey(leftFilename: string, rightFilename: string): string {
  return [leftFilename, rightFilename].sort().join("::")
}
