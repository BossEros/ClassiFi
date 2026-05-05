import { describe, expect, it } from "vitest"
import {
  MatchFragmentExplanationService,
  type ExplainMatchFragmentsInput,
} from "@/modules/plagiarism/match-fragment-explanation.service.js"
import type {
  AiFragmentLabelBatchInput,
  AiFragmentLabelBatchItem,
  AiFragmentLabelProvider,
} from "@/modules/plagiarism/ai-fragment-label-provider.js"

const matchInput: ExplainMatchFragmentsInput = {
  leftContent: ["total = 0", "for i in range(3):", "    total += i"].join("\n"),
  rightContent: ["result = 0", "for index in range(3):", "    result += index"].join(
    "\n",
  ),
  language: "python",
  fragments: [
    {
      fragmentId: 101,
      leftSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 14 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 19 },
    },
  ],
}

describe("MatchFragmentExplanationService", () => {
  it("uses valid confident AI output for match labels", async () => {
    let providerInput: AiFragmentLabelBatchInput | undefined
    const provider = createProvider(async (input) => {
      providerInput = input

      return [
        {
          targetId: "101",
          explanation: {
            category: "identifier_names",
            label: "Same Loop With Renamed Variables",
            reasons: [
              "Both fragments use the same `for` loop while `total` maps to `result` and `i` maps to `index`",
            ],
            confidence: 0.93,
            source: "ai",
          },
        },
      ]
    })
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanations = await service.explainMatchFragments(matchInput)

    expect(providerInput?.taskName).toBe("match_view_fragment_labels")
    expect(providerInput?.fragments).toHaveLength(1)
    expect(explanations.get(101)).toEqual({
      category: "identifier_names",
      label: "Same Loop With Renamed Variables",
      reasons: [
        "Both fragments use the same `for` loop while `total` maps to `result` and `i` maps to `index`.",
      ],
    })
  })

  it("normalizes overly long but valid AI reasons instead of discarding them", async () => {
    const provider = createProvider(async () => [
      {
        targetId: "101",
        explanation: {
          category: "identifier_names",
          label: "Renamed Loop Variables",
          reasons: [
            "Both fragments use the same `for` loop shape, with `total` renamed to `result`, `i` renamed to `index`, and the update expression still adding the loop variable into the running total while preserving the same iteration behavior and arithmetic structure.",
          ],
          confidence: 0.93,
          source: "ai",
        },
      },
    ])
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanations = await service.explainMatchFragments(matchInput)
    const reason = explanations.get(101)?.reasons[0] ?? ""

    expect(explanations.get(101)?.label).toBe("Renamed Loop Variables")
    expect(reason).toContain("`total` renamed to `result`")
    expect(reason.length).toBeLessThanOrEqual(360)
    expect(reason.endsWith(".")).toBe(true)
  })

  it("falls back when the provider fails", async () => {
    const provider = createProvider(async () => {
      throw new Error("provider unavailable")
    })
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanations = await service.explainMatchFragments(matchInput)

    expect(explanations.get(101)?.label).not.toBe(
      "Same Loop With Renamed Variables",
    )
    expect(explanations.get(101)?.reasons.length).toBeGreaterThan(0)
  })

  it("falls back when the provider output is invalid or low confidence", async () => {
    const provider = createProvider(async () => [
      {
        targetId: "101",
        explanation: {
          category: "identifier_names",
          label: "Uncertain Label",
          reasons: ["This response is below the configured confidence threshold."],
          confidence: 0.25,
          source: "ai",
        },
      },
    ])
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanations = await service.explainMatchFragments(matchInput)

    expect(explanations.get(101)?.label).not.toBe("Uncertain Label")
  })

  it("sends comment-only fragments to the provider when AI labels are enabled", async () => {
    let providerCallCount = 0
    let observedLeftSnippet = ""
    let observedRightSnippet = ""
    const provider = createProvider(async (providerInput) => {
      providerCallCount += 1
      observedLeftSnippet = providerInput.fragments[0]?.leftSnippet ?? ""
      observedRightSnippet = providerInput.fragments[0]?.rightSnippet ?? ""

      return [
        {
          targetId: "202",
          explanation: {
            category: "comment_text",
            label: "Comment Purpose Renamed",
            reasons: [
              "The comments describe the same stack setup using different wording.",
            ],
            confidence: 0.92,
          },
        },
      ]
    })
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanations = await service.explainMatchFragments({
      leftContent: "// Create a stack to store opening brackets",
      rightContent: "// Initialize stack to store opening brackets",
      language: "java",
      fragments: [
        {
          fragmentId: 202,
          leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 43 },
          rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 45 },
        },
      ],
    })

    expect(providerCallCount).toBe(1)
    expect(observedLeftSnippet).toBe("// Create a stack to store opening brackets")
    expect(observedRightSnippet).toBe("// Initialize stack to store opening brackets")
    expect(explanations.get(202)).toEqual({
      category: "comment_text",
      label: "Comment Purpose Renamed",
      reasons: [
        "The comments describe the same stack setup using different wording.",
      ],
    })
  })

  it("caches fallback labels after provider failure", async () => {
    let providerCallCount = 0
    const provider = createProvider(async () => {
      providerCallCount += 1
      throw new Error("timeout")
    })
    const service = new MatchFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    await service.explainMatchFragments(matchInput)
    await service.explainMatchFragments(matchInput)

    expect(providerCallCount).toBe(1)
  })
})

function createProvider(
  generateLabels: (
    input: AiFragmentLabelBatchInput,
  ) => Promise<AiFragmentLabelBatchItem[]>,
): AiFragmentLabelProvider {
  return { generateLabels }
}
