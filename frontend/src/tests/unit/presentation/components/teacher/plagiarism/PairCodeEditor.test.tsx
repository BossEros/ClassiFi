import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { PairCodeEditor } from "@/presentation/components/teacher/plagiarism/PairCodeEditor"
import type { MatchFragment } from "@/presentation/components/teacher/plagiarism/types"

const monacoMockState = vi.hoisted(() => ({
  decorationCount: 0,
  hoverMessages: [] as string[],
}))

vi.mock("monaco-editor", () => ({
  KeyCode: { Tab: 2 },
  KeyMod: { Shift: 1024 },
  editor: {
    ScrollType: { Smooth: 1 },
    defineTheme: vi.fn(),
    create: vi.fn(() => ({
      addAction: vi.fn(() => ({ dispose: vi.fn() })),
      deltaDecorations: vi.fn(
        (
          _previousDecorationIds: string[],
          decorations: Array<{
            options?: { hoverMessage?: { value: string } }
          }>,
        ) => {
          monacoMockState.decorationCount += decorations.length

          for (const decoration of decorations) {
            const hoverMessage = decoration.options?.hoverMessage?.value

            if (hoverMessage) {
              monacoMockState.hoverMessages.push(hoverMessage)
            }
          }

          return decorations.map((_, index) => `decoration-${index}`)
        },
      ),
      dispose: vi.fn(),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
      onMouseLeave: vi.fn(() => ({ dispose: vi.fn() })),
      onMouseMove: vi.fn(() => ({ dispose: vi.fn() })),
      revealPositionInCenter: vi.fn(),
      setPosition: vi.fn(),
      trigger: vi.fn(),
    })),
  },
}))

const aiMatchFragment: MatchFragment = {
  id: 301,
  leftSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 12 },
  rightSelection: { startRow: 0, startCol: 0, endRow: 0, endCol: 13 },
  length: 12,
  explanation: {
    category: "identifier_names",
    label: "Same Assignment With Renamed Variables",
    reasons: [
      "Both highlighted lines assign zero to an accumulator variable",
      "This extra reason should not render in the hover.",
    ],
  },
}

describe("PairCodeEditor", () => {
  beforeEach(() => {
    monacoMockState.decorationCount = 0
    monacoMockState.hoverMessages = []
  })

  it("renders Match View explanations through Monaco hover messages", async () => {
    render(
      <PairCodeEditor
        side="left"
        file={{
          id: 1,
          path: "Left.py",
          filename: "Left.py",
          content: "total = 0",
          lineCount: 1,
          studentName: "Ava Sinclair",
        }}
        fragments={[aiMatchFragment]}
        selectedFragment={null}
        hoveredFragment={null}
        onFragmentSelect={vi.fn()}
        onFragmentHover={vi.fn()}
        language="python"
        variant="light"
      />,
    )

    await waitFor(() => {
      expect(monacoMockState.decorationCount).toBeGreaterThan(0)
    })

    const hoverText = monacoMockState.hoverMessages.join("\n")

    expect(screen.queryByLabelText("Editor fragment explanation")).not.toBeInTheDocument()
    expect(hoverText).toContain("Same Assignment With Renamed Variables")
    expect(hoverText).toContain(
      "Both highlighted lines assign zero to an accumulator variable.",
    )
    expect(hoverText).not.toContain("This extra reason should not render")
  })
})
