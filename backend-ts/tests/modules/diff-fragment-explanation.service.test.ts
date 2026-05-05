import { describe, expect, it } from "vitest"
import { DiffFragmentExplanationSchema } from "@/modules/plagiarism/diff-fragment-explanation.schema.js"
import {
  buildProviderFragmentPayloads,
  DiffFragmentExplanationService,
  parseProviderBatchOutput,
  type DiffExplanationProvider,
} from "@/modules/plagiarism/diff-fragment-explanation.service.js"

const input = {
  leftContent: "return total",
  rightContent: "return result",
  leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
  rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 13 },
  language: "python",
}

const batchInput = {
  leftContent: ["total = price + tax", "return total"].join("\n"),
  rightContent: ["result = price + tax", "return result"].join("\n"),
  language: "python",
  fragments: [
    {
      fragmentId: 101,
      leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
      rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 6 },
    },
    {
      fragmentId: 102,
      leftSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 12 },
      rightSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 13 },
    },
  ],
}

describe("DiffFragmentExplanationSchema", () => {
  it("accepts a valid AI-shaped explanation", () => {
    const explanation = DiffFragmentExplanationSchema.parse({
      category: "code_changed",
      label: "Logic Expression Changed",
      reasons: ["Both snippets return a value, but the returned identifier differs."],
      confidence: 0.91,
      source: "ai",
    })

    expect(explanation.source).toBe("ai")
    expect(explanation.confidence).toBe(0.91)
  })

  it("rejects invalid explanation payloads", () => {
    expect(() =>
      DiffFragmentExplanationSchema.parse({
        category: "unknown",
        label: "Bad",
        reasons: ["Invalid category"],
        confidence: 0.5,
        source: "ai",
      }),
    ).toThrow()

    expect(() =>
      DiffFragmentExplanationSchema.parse({
        category: "code_changed",
        reasons: ["Missing label"],
        confidence: 0.5,
        source: "ai",
      }),
    ).toThrow()

    expect(() =>
      DiffFragmentExplanationSchema.parse({
        category: "code_changed",
        label: "Bad confidence",
        reasons: ["Confidence is outside the allowed range."],
        confidence: 1.1,
        source: "ai",
      }),
    ).toThrow()

    expect(() =>
      DiffFragmentExplanationSchema.parse({
        category: "code_changed",
        label: "Extra field",
        reasons: ["Strict schemas should reject extra fields."],
        confidence: 0.8,
        source: "ai",
        extra: true,
      }),
    ).toThrow()
  })
})

describe("DiffFragmentExplanationService", () => {
  it("returns fallback output when the provider times out or fails", async () => {
    const failingProvider: DiffExplanationProvider = {
      explainBatch: async () => {
        throw new Error("provider unavailable")
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider: failingProvider,
      minimumConfidence: 0.7,
    })

    const explanation = await service.explainDiffFragment(input)

    expect(explanation.source).toBe("fallback")
    expect(explanation.label).toBe("Output Logic Differs")
  })

  it("returns fallback output when the provider confidence is too low", async () => {
    const lowConfidenceProvider: DiffExplanationProvider = {
      explainBatch: async () => [
        {
          targetId: "0:0",
          explanation: {
            category: "code_changed",
            label: "Weak AI Label",
            reasons: ["The provider was uncertain."],
            confidence: 0.42,
            source: "ai",
          },
        },
      ],
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider: lowConfidenceProvider,
      minimumConfidence: 0.7,
    })

    const explanation = await service.explainDiffFragment(input)

    expect(explanation.source).toBe("fallback")
    expect(explanation.label).toBe("Output Logic Differs")
  })

  it("returns provider output when enabled and confidence is sufficient", async () => {
    const provider: DiffExplanationProvider = {
      explainBatch: async () => [
        {
          targetId: "0:0",
          explanation: {
            category: "code_changed",
            label: "Return Value Changed",
            reasons: [
              "Both snippets return values, but the right snippet returns result.",
            ],
            confidence: 0.91,
            source: "ai",
          },
        },
      ],
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanation = await service.explainDiffFragment(input)

    expect(explanation).toMatchObject({
      source: "ai",
      label: "Return Value Changed",
    })
  })

  it("normalizes provider output into one complete explanation sentence", async () => {
    const provider: DiffExplanationProvider = {
      explainBatch: async () => [
        {
          targetId: "0:0",
          explanation: {
            category: "identifier_renaming",
            label: "Dictionary Variable Renamed",
            reasons: [
              "Left code uses roman_dict while right code uses values",
              "The dictionary initialization and contents remain identical.",
            ],
            confidence: 0.94,
            source: "ai",
          },
        },
      ],
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanation = await service.explainDiffFragment(input)

    expect(explanation.reasons).toEqual([
      "Left code uses roman_dict while right code uses values.",
    ])
  })

  it("keeps specific AI diff labels even when the raw reason is slightly long", async () => {
    const provider: DiffExplanationProvider = {
      explainBatch: async () => [
        {
          targetId: "0:0",
          explanation: {
            category: "identifier_renaming",
            label: "Variables Renamed",
            reasons: [
              "The addition statement changes `roman_dict` to `values`, `total` to `result`, and `i` to `index`, while preserving the same lookup and accumulation operation with the updated variable names in the right snippet.",
            ],
            confidence: 0.94,
            source: "ai",
          },
        },
      ],
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanation = await service.explainDiffFragment(input)
    const reason = explanation.reasons[0] ?? ""

    expect(explanation.source).toBe("ai")
    expect(reason).toContain("`roman_dict` to `values`")
    expect(reason).toContain("`total` to `result`")
    expect(reason.length).toBeLessThanOrEqual(360)
  })

  it("requests all fragments from the provider in one pair-level batch", async () => {
    let providerCallCount = 0
    const provider: DiffExplanationProvider = {
      explainBatch: async (providerInput) => {
        providerCallCount += 1

        expect(providerInput.fragments).toHaveLength(2)
        expect(providerInput.fragments.map((fragment) => fragment.targetId)).toEqual([
          "101:0",
          "102:0",
        ])

        return [
          {
            targetId: "101:0",
            explanation: {
              category: "identifier_renaming",
              label: "Accumulator Renamed",
              reasons: ["The accumulator name changed from total to result."],
              confidence: 0.95,
              source: "ai",
            },
          },
          {
            targetId: "102:0",
            explanation: {
              category: "output_logic_changed",
              label: "Return Identifier Changed",
              reasons: ["The returned identifier changed in the final statement."],
              confidence: 0.92,
              source: "ai",
            },
          },
        ]
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanationsByFragmentId =
      await service.explainDiffFragments(batchInput)

    expect(providerCallCount).toBe(1)
    expect(explanationsByFragmentId.get(101)).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
    expect(explanationsByFragmentId.get(102)).toMatchObject({
      source: "ai",
      label: "Return Identifier Changed",
    })
  })

  it("creates separate explanation targets for changed lines inside one stored fragment", async () => {
    let observedTargetIds: Array<string | undefined> = []
    const provider: DiffExplanationProvider = {
      explainBatch: async (providerInput) => {
        observedTargetIds = providerInput.fragments.map(
          (fragment) => fragment.targetId,
        )

        return [
          {
            targetId: "201:0",
            explanation: {
              category: "identifier_renaming",
              label: "Dictionary Variable Renamed",
              reasons: ["The dictionary variable changes from roman_dict to values."],
              confidence: 0.94,
              source: "ai",
            },
          },
          {
            targetId: "201:1",
            explanation: {
              category: "identifier_renaming",
              label: "Accumulator Variable Renamed",
              reasons: ["The accumulator changes from total to result."],
              confidence: 0.93,
              source: "ai",
            },
          },
          {
            targetId: "201:2",
            explanation: {
              category: "identifier_renaming",
              label: "Loop Counter Renamed",
              reasons: ["The loop counter changes from i to index."],
              confidence: 0.92,
              source: "ai",
            },
          },
        ]
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanationTargets = await service.explainDiffFragmentTargets({
      leftContent: [
        "roman_dict = {'I': 1}",
        "total = 0",
        "i = 0",
      ].join("\n"),
      rightContent: ["values = {'I': 1}", "result = 0", "index = 0"].join("\n"),
      language: "python",
      fragments: [
        {
          fragmentId: 201,
          leftSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 5 },
          rightSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 9 },
        },
      ],
    })

    expect(observedTargetIds).toEqual(["201:0", "201:1", "201:2"])
    expect(explanationTargets.map((target) => target.explanation.label)).toEqual([
      "Dictionary Variable Renamed",
      "Accumulator Variable Renamed",
      "Loop Counter Renamed",
    ])
  })

  it("sends comment-only changes to the provider when AI labels are enabled", async () => {
    let providerCallCount = 0
    let observedIsCommentOnly: boolean | undefined
    const provider: DiffExplanationProvider = {
      explainBatch: async (providerInput) => {
        providerCallCount += 1
        observedIsCommentOnly = providerInput.fragments[0]?.isCommentOnly

        return [
          {
            targetId: "301:0",
            explanation: {
              category: "comment_changed",
              label: "Comment Purpose Changed",
              reasons: [
                "The right comment changes the setup wording from creating a stack to initializing it.",
              ],
              confidence: 0.91,
              source: "ai",
            },
          },
        ]
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanationTargets = await service.explainDiffFragmentTargets({
      leftContent: [
        "public static boolean isValid(String s) {",
        "  // Create a stack to store opening brackets",
        "  Stack<Character> stack = new Stack<>();",
      ].join("\n"),
      rightContent: [
        "public static boolean isValid(String s) {",
        "  // Initialize stack to store opening brackets",
        "  Stack<Character> stack = new Stack<>();",
      ].join("\n"),
      language: "java",
      fragments: [
        {
          fragmentId: 301,
          leftSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 46 },
          rightSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 47 },
        },
      ],
    })

    expect(providerCallCount).toBe(1)
    expect(observedIsCommentOnly).toBe(true)
    expect(explanationTargets).toHaveLength(1)
    expect(explanationTargets[0]?.explanation).toMatchObject({
      category: "comment_changed",
      label: "Comment Purpose Changed",
      source: "ai",
    })
    expect(explanationTargets[0]?.explanation.reasons[0]).toContain(
      "initializing",
    )
  })

  it("passes bounded surrounding context to the provider for executable code targets", async () => {
    let observedLeftContextSnippet = ""
    let observedRightContextSnippet = ""
    const provider: DiffExplanationProvider = {
      explainBatch: async (providerInput) => {
        observedLeftContextSnippet =
          providerInput.fragments[0]?.leftContextSnippet ?? ""
        observedRightContextSnippet =
          providerInput.fragments[0]?.rightContextSnippet ?? ""

        return [
          {
            targetId: "401:1",
            explanation: {
              category: "identifier_renaming",
              label: "Accumulator Variable Renamed",
              reasons: ["The accumulator changes from total to result."],
              confidence: 0.93,
              source: "ai",
            },
          },
        ]
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    await service.explainDiffFragmentTargets({
      leftContent: [
        "def roman_to_int(s):",
        "    roman_dict = {'I': 1}",
        "    total = 0",
        "    return total",
      ].join("\n"),
      rightContent: [
        "def roman_to_int(s):",
        "    values = {'I': 1}",
        "    result = 0",
        "    return result",
      ].join("\n"),
      language: "python",
      fragments: [
        {
          fragmentId: 401,
          leftSelection: { startRow: 2, startCol: 0, endRow: 2, endCol: 13 },
          rightSelection: { startRow: 2, startCol: 0, endRow: 2, endCol: 14 },
        },
      ],
    })

    expect(observedLeftContextSnippet).toContain("def roman_to_int")
    expect(observedLeftContextSnippet).toContain("return total")
    expect(observedRightContextSnippet).toContain("def roman_to_int")
    expect(observedRightContextSnippet).toContain("return result")
  })

  it("falls back only for missing or low-confidence batch items", async () => {
    const provider: DiffExplanationProvider = {
      explainBatch: async () => [
        {
          targetId: "101:0",
          explanation: {
            category: "identifier_renaming",
            label: "Accumulator Renamed",
            reasons: ["The accumulator name changed from total to result."],
            confidence: 0.94,
            source: "ai",
          },
        },
        {
          targetId: "102:0",
          explanation: {
            category: "code_changed",
            label: "Weak AI Label",
            reasons: ["The provider was uncertain."],
            confidence: 0.2,
            source: "ai",
          },
        },
      ],
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const explanationsByFragmentId =
      await service.explainDiffFragments(batchInput)

    expect(explanationsByFragmentId.get(101)).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
    expect(explanationsByFragmentId.get(102)).toMatchObject({
      source: "fallback",
      label: "Output Logic Differs",
    })
  })

  it("reuses cached pair explanations without calling the provider again", async () => {
    let providerCallCount = 0
    const provider: DiffExplanationProvider = {
      explainBatch: async () => {
        providerCallCount += 1

        return [
          {
            targetId: "101:0",
            explanation: {
              category: "identifier_renaming",
              label: "Accumulator Renamed",
              reasons: ["The accumulator name changed from total to result."],
              confidence: 0.94,
              source: "ai",
            },
          },
          {
            targetId: "102:0",
            explanation: {
              category: "output_logic_changed",
              label: "Return Identifier Changed",
              reasons: ["The returned identifier changed in the final statement."],
              confidence: 0.9,
              source: "ai",
            },
          },
        ]
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    const firstExplanationsByFragmentId =
      await service.explainDiffFragments(batchInput)
    const secondExplanationsByFragmentId =
      await service.explainDiffFragments(batchInput)

    expect(providerCallCount).toBe(1)
    expect(firstExplanationsByFragmentId.get(101)).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
    expect(secondExplanationsByFragmentId.get(101)).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
  })

  it("caches fallback targets after provider failures to avoid repeated slow calls", async () => {
    let providerCallCount = 0
    const failingProvider: DiffExplanationProvider = {
      explainBatch: async () => {
        providerCallCount += 1
        throw new Error("Anthropic tool input was empty")
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider: failingProvider,
      minimumConfidence: 0.7,
    })

    const firstTargets = await service.explainDiffFragmentTargets(batchInput)
    const secondTargets = await service.explainDiffFragmentTargets(batchInput)

    expect(providerCallCount).toBe(1)
    expect(firstTargets[0]?.explanation.source).toBe("fallback")
    expect(secondTargets[0]?.explanation.source).toBe("fallback")
  })

  it("creates full-file targets for added, removed, and changed lines", async () => {
    const service = new DiffFragmentExplanationService({
      enabled: false,
      minimumConfidence: 0.7,
    })

    const targets = await service.explainPairDiffTargets({
      leftContent: ["#include <stdio.h>", "int value = 5;", "printf(\"old\");"].join(
        "\n",
      ),
      rightContent: [
        "#include <stdio.h>",
        "#include <string.h>",
        "int value = strlen(s);",
      ].join("\n"),
      language: "c",
    })

    expect(targets.map((target) => target.targetKind)).toEqual([
      "added",
      "changed",
      "removed",
    ])
    expect(targets[0]).toMatchObject({
      targetId: "pair:0",
      leftSelection: null,
      rightSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 19 },
    })
    expect(targets[1]).toMatchObject({
      targetId: "pair:1",
      leftSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 14 },
      rightSelection: { startRow: 2, startCol: 0, endRow: 2, endCol: 22 },
    })
    expect(targets[2]).toMatchObject({
      targetId: "pair:2",
      leftSelection: { startRow: 2, startCol: 0, endRow: 2, endCol: 14 },
      rightSelection: null,
    })
  })

  it("passes one-sided full-file targets to the provider before fallback merge", async () => {
    const observedTargets: Array<{
      targetId: string | undefined
      targetKind: string | undefined
      hasLeftSelection: boolean
      hasRightSelection: boolean
    }> = []
    const provider: DiffExplanationProvider = {
      explainBatch: async (providerInput) => {
        observedTargets.push(
          ...providerInput.fragments.map((fragment) => ({
            targetId: fragment.targetId,
            targetKind: fragment.targetKind,
            hasLeftSelection: fragment.leftSelection !== null,
            hasRightSelection: fragment.rightSelection !== null,
          })),
        )

        return []
      },
    }
    const service = new DiffFragmentExplanationService({
      enabled: true,
      provider,
      minimumConfidence: 0.7,
    })

    await service.explainPairDiffTargets({
      leftContent: ["int value = 5;", "printf(\"old\");"].join("\n"),
      rightContent: ["#include <string.h>", "int value = 5;"].join("\n"),
      language: "c",
    })

    expect(observedTargets).toEqual([
      {
        targetId: "pair:0",
        targetKind: "added",
        hasLeftSelection: false,
        hasRightSelection: true,
      },
      {
        targetId: "pair:1",
        targetKind: "removed",
        hasLeftSelection: true,
        hasRightSelection: false,
      },
    ])
  })

  it("builds provider payloads with empty snippets for missing added and removed sides", () => {
    const payloads = buildProviderFragmentPayloads({
      leftContent: ["int value = 5;", "printf(\"old\");"].join("\n"),
      rightContent: ["#include <string.h>", "int value = 5;"].join("\n"),
      language: "c",
      fragments: [
        {
          fragmentId: -1,
          targetId: "pair:0",
          targetKind: "added",
          leftSelection: null,
          rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 19 },
          leftContextSnippet: "",
          rightContextSnippet: "> 1: #include <string.h>",
        },
        {
          fragmentId: -1,
          targetId: "pair:1",
          targetKind: "removed",
          leftSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 14 },
          rightSelection: null,
          leftContextSnippet: "> 2: printf(\"old\");",
          rightContextSnippet: "",
        },
      ],
    })

    expect(payloads).toMatchObject([
      {
        targetId: "pair:0",
        targetKind: "added",
        leftSnippet: "",
        rightSnippet: "#include <string.h>",
      },
      {
        targetId: "pair:1",
        targetKind: "removed",
        leftSnippet: "printf(\"old\");",
        rightSnippet: "",
      },
    ])
  })
})

describe("parseProviderBatchOutput", () => {
  it("accepts the expected fragments wrapper", () => {
    const parsedOutput = parseProviderBatchOutput({
      fragments: [
        {
          targetId: "101:0",
          category: "identifier_renaming",
          label: "Accumulator Renamed",
          reasons: ["The accumulator changed names."],
          confidence: 0.92,
        },
      ],
    })

    expect(parsedOutput).toEqual([
      {
        targetId: "101:0",
        explanation: {
          category: "identifier_renaming",
          label: "Accumulator Renamed",
          reasons: ["The accumulator changed names."],
          confidence: 0.92,
          source: "ai",
        },
      },
    ])
  })

  it("accepts common provider wrapper keys when the model omits fragments", () => {
    const parsedOutput = parseProviderBatchOutput({
      explanations: [
        {
          targetId: "101:0",
          category: "identifier_renaming",
          label: "Accumulator Renamed",
          reasons: ["The accumulator changed names."],
          confidence: 0.92,
        },
      ],
    })

    expect(parsedOutput[0]?.targetId).toBe("101:0")
    expect(parsedOutput[0]?.explanation).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
  })

  it("accepts a nested tool-name wrapper around the fragments array", () => {
    const parsedOutput = parseProviderBatchOutput({
      create_diff_fragment_explanations: {
        fragments: [
          {
            targetId: "101:0",
            category: "identifier_renaming",
            label: "Accumulator Renamed",
            reasons: ["The accumulator changed names."],
            confidence: 0.92,
          },
        ],
      },
    })

    expect(parsedOutput[0]?.targetId).toBe("101:0")
  })

  it("accepts a direct array when the provider omits the fragments wrapper", () => {
    const parsedOutput = parseProviderBatchOutput([
      {
        targetId: "101:0",
        category: "identifier_renaming",
        label: "Accumulator Renamed",
        reasons: ["The accumulator changed names."],
        confidence: 0.92,
      },
    ])

    expect(parsedOutput[0]?.targetId).toBe("101:0")
    expect(parsedOutput[0]?.explanation).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
  })

  it("accepts a single direct target object when only one target is returned", () => {
    const parsedOutput = parseProviderBatchOutput({
      targetId: "101:0",
      category: "identifier_renaming",
      label: "Accumulator Renamed",
      reasons: ["The accumulator changed names."],
      confidence: 0.92,
    })

    expect(parsedOutput).toHaveLength(1)
    expect(parsedOutput[0]?.targetId).toBe("101:0")
  })

  it("accepts fenced JSON text output from text-only providers", () => {
    const parsedOutput = parseProviderBatchOutput(`
      \`\`\`json
      {
        "fragments": [
          {
            "targetId": "101:0",
            "category": "identifier_renaming",
            "label": "Accumulator Renamed",
            "reasons": ["The accumulator changed names."],
            "confidence": 0.92
          }
        ]
      }
      \`\`\`
    `)

    expect(parsedOutput[0]?.targetId).toBe("101:0")
    expect(parsedOutput[0]?.explanation).toMatchObject({
      source: "ai",
      label: "Accumulator Renamed",
    })
  })

  it("reports available keys when the provider output shape is unsupported", () => {
    expect(() =>
      parseProviderBatchOutput({
        explanationText: "The accumulator was renamed.",
      }),
    ).toThrow(/Available keys: explanationText/)
  })
})
