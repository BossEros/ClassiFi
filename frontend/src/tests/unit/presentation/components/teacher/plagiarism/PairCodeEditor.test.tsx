import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import { PairCodeEditor } from "@/presentation/components/teacher/plagiarism/PairCodeEditor"
import type { MatchFragment } from "@/presentation/components/teacher/plagiarism/types"

const monacoMockState = vi.hoisted(() => ({
  decorationCount: 0,
  hoverMessages: [] as string[],
  mouseMoveHandler: null as
    | ((event: { target?: { position?: { lineNumber: number; column: number } } }) => void)
    | null,
  mouseLeaveHandler: null as (() => void) | null,
  contentWidgetNodes: [] as HTMLElement[],
}))

vi.mock("monaco-editor", () => ({
  KeyCode: { Tab: 2 },
  KeyMod: { Shift: 1024 },
  editor: {
    ContentWidgetPositionPreference: { ABOVE: 1, BELOW: 2 },
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
      addContentWidget: vi.fn((widget: { getDomNode: () => HTMLElement }) => {
        const node = widget.getDomNode()
        monacoMockState.contentWidgetNodes.push(node)
        document.body.appendChild(node)
      }),
      onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
      onMouseLeave: vi.fn((handler: () => void) => {
        monacoMockState.mouseLeaveHandler = handler
        return { dispose: vi.fn() }
      }),
      onMouseMove: vi.fn(
        (
          handler: (event: {
            target?: { position?: { lineNumber: number; column: number } }
          }) => void,
        ) => {
          monacoMockState.mouseMoveHandler = handler
          return { dispose: vi.fn() }
        },
      ),
      removeContentWidget: vi.fn((widget: { getDomNode: () => HTMLElement }) => {
        widget.getDomNode().remove()
      }),
      hasTextFocus: vi.fn(() => false),
      layoutContentWidget: vi.fn(),
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
    monacoMockState.mouseMoveHandler = null
    monacoMockState.mouseLeaveHandler = null
    monacoMockState.contentWidgetNodes = []
    document.body
      .querySelectorAll(".classifi-fragment-explanation-widget")
      .forEach((node) => node.remove())
  })

  it("keeps native Monaco hover messages disabled while the custom widget is active", async () => {
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

    expect(screen.queryByLabelText("Editor fragment explanation")).not.toBeInTheDocument()
    expect(monacoMockState.hoverMessages).toHaveLength(0)
  })

  it("shows the selected fragment explanation as a content widget when enabled", async () => {
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
        selectedFragment={aiMatchFragment}
        hoveredFragment={null}
        onFragmentSelect={vi.fn()}
        onFragmentHover={vi.fn()}
        language="python"
        variant="light"
        shouldShowSelectedExplanation
      />,
    )

    expect(
      await screen.findByLabelText("Editor fragment explanation"),
    ).toHaveTextContent("Same Assignment With Renamed Variables")
  })

  it("lets the hovered fragment explanation take priority over the selected fragment explanation", async () => {
    const smallerHoveredFragment: MatchFragment = {
      ...aiMatchFragment,
      id: 302,
      leftSelection: { startRow: 0, startCol: 3, endRow: 0, endCol: 8 },
      rightSelection: { startRow: 0, startCol: 3, endRow: 0, endCol: 8 },
      length: 5,
      explanation: {
        category: "identifier_names",
        label: "Smaller Hovered Fragment",
        reasons: ["The hover target is more specific than the selected match."],
      },
    }

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
        fragments={[aiMatchFragment, smallerHoveredFragment]}
        selectedFragment={aiMatchFragment}
        hoveredFragment={null}
        onFragmentSelect={vi.fn()}
        onFragmentHover={vi.fn()}
        language="python"
        variant="light"
        shouldShowSelectedExplanation
      />,
    )

    expect(
      await screen.findByLabelText("Editor fragment explanation"),
    ).toHaveTextContent("Same Assignment With Renamed Variables")

    act(() => {
      monacoMockState.mouseMoveHandler?.({
        target: { position: { lineNumber: 1, column: 50 } },
      })
    })

    await waitFor(() => {
      expect(screen.getByLabelText("Editor fragment explanation")).toHaveTextContent(
        "Smaller Hovered Fragment",
      )
    })
  })

  it("detects fragment hover by line range instead of exact character columns", async () => {
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

    act(() => {
      monacoMockState.mouseMoveHandler?.({
        target: { position: { lineNumber: 1, column: 80 } },
      })
    })

    expect(
      await screen.findByLabelText("Editor fragment explanation"),
    ).toHaveTextContent("Same Assignment With Renamed Variables")
  })
})
