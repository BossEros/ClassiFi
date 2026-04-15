import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { GradeBreakdownPanel } from "@/presentation/components/shared/GradeBreakdownPanel"
import type { GradeBreakdown } from "@/data/api/gradebook.types"

function createGradeBreakdown(
  overrides: Partial<GradeBreakdown> = {},
): GradeBreakdown {
  return {
    originalGrade: 92,
    latePenaltyPercent: 10,
    similarityPenaltyPercent: 5,
    similarityScore: 86,
    finalGrade: 77,
    effectiveGrade: 77,
    isOverridden: false,
    ...overrides,
  }
}

describe("GradeBreakdownPanel", () => {
  it("shows only the final grade summary when no manual override exists", () => {
    render(
      <GradeBreakdownPanel
        breakdown={createGradeBreakdown()}
        totalScore={100}
        submittedAt="2026-03-20T13:00:00.000Z"
        deadline="2026-03-20T12:00:00.000Z"
        testsPassed={9}
        testsTotal={10}
      />,
    )

    expect(screen.getByText("Test Score")).toBeInTheDocument()
    expect(screen.getByText("Final Grade")).toBeInTheDocument()
    expect(screen.queryByText("Automatic Final")).not.toBeInTheDocument()
    expect(screen.queryByText("Manual Override")).not.toBeInTheDocument()
  })

  it("shows automatic and final scores as separate steps when a manual override exists", () => {
    render(
      <GradeBreakdownPanel
        breakdown={createGradeBreakdown({
          effectiveGrade: 85,
          isOverridden: true,
        })}
        totalScore={100}
        overrideReason="Rounded up after manual review"
      />,
    )

    expect(screen.getByText("Automatic Final")).toBeInTheDocument()
    expect(screen.getByText("Manual Override")).toBeInTheDocument()
    expect(screen.getByText("Final Grade")).toBeInTheDocument()
    expect(screen.getByText("Rounded up after manual review")).toBeInTheDocument()
    expect(screen.getByText("77 / 100")).toBeInTheDocument()
    expect(screen.getAllByText("85 / 100")).toHaveLength(2)
  })

  it("renders nothing when there is no original grade to explain", () => {
    const { container } = render(
      <GradeBreakdownPanel
        breakdown={createGradeBreakdown({
          originalGrade: null,
          finalGrade: null,
          effectiveGrade: null,
        })}
        totalScore={100}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
