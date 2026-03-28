import { describe, expect, it } from "vitest"
import {
  curatedFixtureScenarios,
  type RelativePairExpectation,
} from "../fixtures/plagiarism/curated-fixtures.js"
import {
  evaluateCuratedScenario,
  getPairMetricsOrThrow,
} from "../helpers/plagiarism-fixture-harness.js"

describe("curated plagiarism fixtures", () => {
  for (const scenario of curatedFixtureScenarios) {
    it(`evaluates ${scenario.id}`, async () => {
      const result = await evaluateCuratedScenario(scenario)

      for (const expectation of scenario.pairExpectations) {
        const pairMetrics = getPairMetricsOrThrow(result, expectation)

        if (expectation.minStructuralScore !== undefined) {
          expect(pairMetrics.structuralScore).toBeGreaterThanOrEqual(
            expectation.minStructuralScore,
          )
        }

        if (expectation.maxStructuralScore !== undefined) {
          expect(pairMetrics.structuralScore).toBeLessThanOrEqual(
            expectation.maxStructuralScore,
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
  result: Awaited<ReturnType<typeof evaluateCuratedScenario>>,
  expectation: RelativePairExpectation,
): void {
  const higherPairMetrics = getPairMetricsOrThrow(result, {
    pair: expectation.higherPair,
  })
  const lowerPairMetrics = getPairMetricsOrThrow(result, {
    pair: expectation.lowerPair,
  })

  expect(higherPairMetrics.structuralScore).toBeGreaterThan(
    lowerPairMetrics.structuralScore,
  )
}
