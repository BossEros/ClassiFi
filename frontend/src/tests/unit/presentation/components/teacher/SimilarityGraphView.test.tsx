import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SimilarityGraphView } from "@/presentation/components/teacher/plagiarism/SimilarityGraphView"
import {
  buildSimilarityGraphData,
  type SimilarityGraphSelection,
} from "@/presentation/utils/plagiarismGraphUtils"
import type { FileResponse, PairResponse } from "@/data/api/plagiarism.types"

function createPair(
  id: number,
  leftSubmissionId: number,
  leftStudentName: string,
  rightSubmissionId: number,
  rightStudentName: string,
  hybridScore: number,
): PairResponse {
  return {
    id,
    leftFile: {
      id: leftSubmissionId,
      path: `${leftStudentName}.py`,
      filename: `${leftStudentName}.py`,
      lineCount: 20,
      studentName: leftStudentName,
    },
    rightFile: {
      id: rightSubmissionId,
      path: `${rightStudentName}.py`,
      filename: `${rightStudentName}.py`,
      lineCount: 20,
      studentName: rightStudentName,
    },
    structuralScore: hybridScore,
    semanticScore: hybridScore,
    hybridScore,
    overlap: 10,
    longest: 5,
  }
}

describe("SimilarityGraphView", () => {
  const submissions: FileResponse[] = [
    {
      id: 1,
      path: "Alice.py",
      filename: "Alice.py",
      lineCount: 20,
      studentName: "Alice",
    },
    {
      id: 2,
      path: "Bob.py",
      filename: "Bob.py",
      lineCount: 20,
      studentName: "Bob",
    },
    {
      id: 3,
      path: "Cara.py",
      filename: "Cara.py",
      lineCount: 20,
      studentName: "Cara",
    },
  ]
  const pairs = [createPair(1, 1, "Alice", 2, "Bob", 0.96)]

  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock)
  })

  function renderGraphView(selection: SimilarityGraphSelection = { type: "none" }) {
    const graphData = buildSimilarityGraphData(submissions, pairs, 95)

    const onReviewPair = vi.fn()
    const onSelectionChange = vi.fn()
    const onThresholdChange = vi.fn()
    const onShowSingletonsChange = vi.fn()

    render(
      <SimilarityGraphView
        graphData={graphData}
        minimumSimilarityPercent={95}
        onMinimumSimilarityPercentChange={onThresholdChange}
        onReviewPair={onReviewPair}
        selection={selection}
        onSelectionChange={onSelectionChange}
        selectedPairId={null}
        showSingletons={false}
        onShowSingletonsChange={onShowSingletonsChange}
      />,
    )

    return {
      graphData,
      onReviewPair,
      onSelectionChange,
    }
  }

  it("renders the simplified interaction guidance, review context, and isolated-submissions copy", () => {
    renderGraphView({ type: "cluster", clusterId: 1 })

    expect(
      screen.getByText(
        "Explore submission similarity as a graph. Each line connects two submissions that meet the current threshold. Click a line to review a pair, or click a submission to inspect its matching context.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByText("Show isolated submissions")).toBeInTheDocument()
    expect(screen.getByText("Review Context")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Alice" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bob" })).toBeInTheDocument()
  })

  it("reviews the strongest pair from the overview state and synchronizes graph selection", async () => {
    const { onReviewPair, onSelectionChange } = renderGraphView()

    await userEvent.click(
      screen.getByRole("button", { name: "Review strongest pair" }),
    )

    expect(onSelectionChange).toHaveBeenCalledWith({
      type: "cluster",
      clusterId: 1,
    })
    expect(onReviewPair).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
      }),
    )
  })
})
