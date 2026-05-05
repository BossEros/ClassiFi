import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { PairCodeDiff } from "@/presentation/components/teacher/plagiarism/PairCodeDiff"
import type { MatchFragment } from "@/presentation/components/teacher/plagiarism/types"

const monacoMockState = vi.hoisted(() => ({
  hoverMessages: [] as string[],
  decorationCallCount: 0,
}))

vi.mock("monaco-editor", () => ({
  editor: {
    defineTheme: vi.fn(),
    createModel: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    createDiffEditor: vi.fn(() => {
      const createCodeEditor = () => ({
        deltaDecorations: vi.fn(
          (
            _previousDecorationIds: string[],
            decorations: Array<{
              options?: { hoverMessage?: { value: string } }
            }>,
          ) => {
            monacoMockState.decorationCallCount += 1

            for (const decoration of decorations) {
              const hoverMessage = decoration.options?.hoverMessage?.value

              if (hoverMessage) {
                monacoMockState.hoverMessages.push(hoverMessage)
              }
            }

            return decorations.map((_, index) => `decoration-${index}`)
          },
        ),
      })

      return {
        dispose: vi.fn(),
        getModifiedEditor: createCodeEditor,
        getOriginalEditor: createCodeEditor,
        setModel: vi.fn(),
      }
    }),
  },
}))

const renamedIdentifierFragment: MatchFragment = {
  id: 1,
  leftSelection: { startRow: 0, startCol: 0, endRow: 4, endCol: 12 },
  rightSelection: { startRow: 0, startCol: 0, endRow: 4, endCol: 13 },
  length: 32,
  explanation: {
    category: "control_flow",
    label: "Same Control Flow Structure",
    reasons: ["Both fragments use for-loop and conditional logic"],
  },
}

describe("PairCodeDiff", () => {
  beforeEach(() => {
    monacoMockState.hoverMessages = []
    monacoMockState.decorationCallCount = 0

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it("uses difference explanations for diff hover cards instead of match labels", async () => {
    render(
      <PairCodeDiff
        leftFile={{
          id: 1,
          path: "Sinclair_Roman-To-Integer.py",
          filename: "Sinclair_Roman-To-Integer.py",
          content: [
            "roman = {",
            "    'I': 1, 'V': 5, 'X': 10, 'L': 50,",
            "}",
            "total = sum(roman[char] for char in s)",
            "return total",
          ].join("\n"),
          lineCount: 5,
          studentName: "Ava Sinclair",
        }}
        rightFile={{
          id: 2,
          path: "Cross_Roman-To-Integer.py",
          filename: "Cross_Roman-To-Integer.py",
          content: [
            "values = {",
            "    'I': 1, 'V': 5, 'X': 10, 'L': 50,",
            "}",
            "result = sum(values[c] for c in s)",
            "return result",
          ].join("\n"),
          lineCount: 5,
          studentName: "Alexander Cross",
        }}
        fragments={[renamedIdentifierFragment]}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.hoverMessages.length).toBeGreaterThan(0)
    })

    expect(monacoMockState.hoverMessages.join("\n")).toContain(
      "Identifier Renaming With Same Logic",
    )
    expect(monacoMockState.hoverMessages.join("\n")).not.toContain(
      "Same Control Flow Structure",
    )
  })

  it("prefers backend-provided diff explanations over local fallback labels", async () => {
    render(
      <PairCodeDiff
        leftFile={{
          id: 1,
          path: "Left.py",
          filename: "Left.py",
          content: "return total",
          lineCount: 1,
          studentName: "Ava Sinclair",
        }}
        rightFile={{
          id: 2,
          path: "Right.py",
          filename: "Right.py",
          content: "return result",
          lineCount: 1,
          studentName: "Alexander Cross",
        }}
        fragments={[
          {
            ...renamedIdentifierFragment,
            leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
            rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 13 },
            diffExplanation: {
              category: "code_changed",
              label: "AI Reviewed Return Difference",
              reasons: ["The right snippet returns result instead of total."],
              confidence: 0.91,
              source: "ai",
            },
          },
        ]}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.hoverMessages.length).toBeGreaterThan(0)
    })

    expect(monacoMockState.hoverMessages.join("\n")).toContain(
      "AI Reviewed Return Difference",
    )
    expect(monacoMockState.hoverMessages.join("\n")).not.toContain(
      "Output Logic Differs",
    )
  })

  it("renders the hover explanation as one punctuated sentence", async () => {
    render(
      <PairCodeDiff
        leftFile={{
          id: 1,
          path: "Left.py",
          filename: "Left.py",
          content: "roman_dict = {'I': 1}",
          lineCount: 1,
          studentName: "Ava Sinclair",
        }}
        rightFile={{
          id: 2,
          path: "Right.py",
          filename: "Right.py",
          content: "values = {'I': 1}",
          lineCount: 1,
          studentName: "Alexander Cross",
        }}
        fragments={[
          {
            ...renamedIdentifierFragment,
            leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 10 },
            rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 6 },
            diffExplanation: {
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
        ]}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.hoverMessages.length).toBeGreaterThan(0)
    })

    expect(monacoMockState.hoverMessages.join("\n")).toContain(
      [
        "**Dictionary Variable Renamed**",
        "",
        "Left code uses roman_dict while right code uses values.",
      ].join("\n"),
    )
  })

  it("uses backend diff explanation targets for smaller hover labels", async () => {
    render(
      <PairCodeDiff
        leftFile={{
          id: 1,
          path: "Left.py",
          filename: "Left.py",
          content: ["roman_dict = {'I': 1}", "total = 0", "i = 0"].join("\n"),
          lineCount: 3,
          studentName: "Ava Sinclair",
        }}
        rightFile={{
          id: 2,
          path: "Right.py",
          filename: "Right.py",
          content: ["values = {'I': 1}", "result = 0", "index = 0"].join("\n"),
          lineCount: 3,
          studentName: "Alexander Cross",
        }}
        fragments={[
          {
            id: 201,
            leftSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 5 },
            rightSelection: { startRow: 0, startCol: 0, endRow: 2, endCol: 9 },
            length: 32,
            diffExplanation: {
              category: "identifier_renaming",
              label: "Variable Names Systematically Renamed",
              reasons: [
                "Several variable names were renamed across the highlighted block.",
              ],
              confidence: 0.9,
              source: "ai",
            },
            diffExplanationTargets: [
              {
                targetId: "201:0",
                leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 10 },
                rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 6 },
                explanation: {
                  category: "identifier_renaming",
                  label: "Dictionary Variable Renamed",
                  reasons: [
                    "The dictionary variable changes from roman_dict to values.",
                  ],
                  confidence: 0.94,
                  source: "ai",
                },
              },
              {
                targetId: "201:1",
                leftSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 5 },
                rightSelection: { startRow: 1, startCol: 0, endRow: 1, endCol: 6 },
                explanation: {
                  category: "identifier_renaming",
                  label: "Accumulator Variable Renamed",
                  reasons: ["The accumulator changes from total to result."],
                  confidence: 0.93,
                  source: "ai",
                },
              },
            ],
          },
        ]}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.hoverMessages.length).toBeGreaterThan(0)
    })

    const allHoverMessages = monacoMockState.hoverMessages.join("\n")

    expect(allHoverMessages).toContain("Dictionary Variable Renamed")
    expect(allHoverMessages).toContain("Accumulator Variable Renamed")
    expect(allHoverMessages).not.toContain("Variable Names Systematically Renamed")
  })

  it("does not register hover labels for unchanged diff explanation targets", async () => {
    render(
      <PairCodeDiff
        leftFile={{
          id: 1,
          path: "Left.py",
          filename: "Left.py",
          content: [
            "def roman_to_int(s):",
            "    result = sum(values[c] for c in s)",
            "    return result",
          ].join("\n"),
          lineCount: 3,
          studentName: "Ava Sinclair",
        }}
        rightFile={{
          id: 2,
          path: "Right.py",
          filename: "Right.py",
          content: [
            "def roman_to_int(s):",
            "    result = sum(values[c] for c in s)",
            "    return result",
          ].join("\n"),
          lineCount: 3,
          studentName: "Alexander Cross",
        }}
        fragments={[
          {
            id: 301,
            leftSelection: { startRow: 1, startCol: 4, endRow: 1, endCol: 40 },
            rightSelection: { startRow: 1, startCol: 4, endRow: 1, endCol: 40 },
            length: 12,
            diffExplanationTargets: [
              {
                targetId: "301:unchanged",
                leftSelection: { startRow: 1, startCol: 4, endRow: 1, endCol: 40 },
                rightSelection: { startRow: 1, startCol: 4, endRow: 1, endCol: 40 },
                explanation: {
                  category: "code_changed",
                  label: "Highlighted Code Difference",
                  reasons: [
                    "This highlighted region contains code that differs between the two submissions.",
                  ],
                  confidence: 0.5,
                  source: "fallback",
                },
              },
            ],
          },
        ]}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.decorationCallCount).toBeGreaterThanOrEqual(2)
    })

    expect(monacoMockState.hoverMessages).toHaveLength(0)
  })
})
