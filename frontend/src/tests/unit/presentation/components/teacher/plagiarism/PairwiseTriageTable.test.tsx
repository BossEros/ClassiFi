import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { PairwiseTriageTable } from "@/presentation/components/teacher/plagiarism/PairwiseTriageTable"
import type { PairResponse } from "@/business/services/plagiarismService"

vi.mock("@/presentation/components/teacher/plagiarism/SimilarityBadge", () => ({
  SimilarityBadge: ({ similarity }: { similarity: number }) => (
    <span>{Math.round(similarity * 100)}%</span>
  ),
}))

vi.mock("@/presentation/components/ui/Select", () => ({
  Select: () => <div>Threshold Select</div>,
}))

vi.mock("@/presentation/components/ui/TablePaginationFooter", () => ({
  TablePaginationFooter: () => <div>Pagination Footer</div>,
}))

const pairFixture: PairResponse = {
  id: 101,
  leftFile: {
    id: 1,
    path: "student-a/Main.java",
    filename: "Main.java",
    lineCount: 20,
    studentName: "Student A",
  },
  rightFile: {
    id: 2,
    path: "student-b/Main.java",
    filename: "Main.java",
    lineCount: 20,
    studentName: "Student B",
  },
  structuralScore: 0.94,
  semanticScore: 0.88,
  hybridScore: 0.97,
  overlap: 20,
  longest: 8,
}

describe("PairwiseTriageTable", () => {
  it("makes the selected pair visually and semantically distinct", () => {
    const handlePairSelect = vi.fn()

    render(
      <PairwiseTriageTable
        pairs={[pairFixture]}
        onPairSelect={handlePairSelect}
        selectedPairId={101}
        showThresholdControl={false}
      />,
    )

    const selectedRow = screen
      .getByText("Student A vs Student B")
      .closest("tr")

    expect(selectedRow).toHaveAttribute("aria-selected", "true")
    expect(selectedRow?.className).toContain("bg-teal-50/90")
    expect(screen.queryByText("Selected")).not.toBeInTheDocument()
    expect(
      screen.getByText("Student A vs Student B").closest("td")?.className,
    ).toContain("border-l-4")

    fireEvent.click(selectedRow as HTMLTableRowElement)
    expect(handlePairSelect).toHaveBeenCalledWith(pairFixture)
  })
})
