import { render, screen, fireEvent } from "@testing-library/react"
import { AssignmentCard } from "./AssignmentCard"
import { vi, describe, it, expect } from "vitest"
import type { Assignment } from "@/business/models/dashboard/types"

// Mock child components to isolate AssignmentCard logic
vi.mock("@/presentation/components/ui/DateBlock", () => ({
  DateBlock: ({ date }: any) => (
    <div data-testid="date-block">{date.toString()}</div>
  ),
}))

vi.mock("@/presentation/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => (
    <div data-testid="status-badge">{status}</div>
  ),
}))

vi.mock("@/presentation/components/ui/GradeDisplay", () => ({
  GradeDisplay: ({ grade, maxGrade }: any) => (
    <div data-testid="grade-display">
      {grade}/{maxGrade}
    </div>
  ),
}))

// Mock Card components
vi.mock("@/presentation/components/ui/Card", () => ({
  Card: ({ children, onClick, className }: any) => (
    <div onClick={onClick} className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

describe("AssignmentCard", () => {
  const mockAssignment: Assignment = {
    id: 1,
    classId: 101,
    assignmentName: "Test Assignment",
    deadline: "2023-12-31T23:59:59.000Z" as any,
    programmingLanguage: "python",
    hasSubmitted: false,
    grade: 85,
    maxGrade: 100,
  }

  const defaultProps = {
    assignment: mockAssignment,
  }

  it("renders assignment details correctly", () => {
    render(<AssignmentCard {...defaultProps} />)

    expect(screen.getByText("Test Assignment")).toBeInTheDocument()
    expect(screen.getByTestId("date-block")).toBeInTheDocument()
    expect(screen.getByTestId("grade-display")).toHaveTextContent("85/100")
  })

  it("calculates status correctly (late)", () => {
    // Mock date to be after deadline
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01"))

    render(
      <AssignmentCard
        assignment={{ ...mockAssignment, grade: null, maxGrade: undefined }}
      />,
    )
    expect(screen.getByTestId("status-badge")).toHaveTextContent("late")

    vi.useRealTimers()
  })

  it("calculates status correctly (submitted)", () => {
    render(
      <AssignmentCard
        assignment={{
          ...mockAssignment,
          hasSubmitted: true,
          grade: null,
          maxGrade: undefined,
        }}
      />,
    )
    expect(screen.getByTestId("status-badge")).toHaveTextContent("submitted")
  })

  it("does not render teacher submission counts", () => {
    render(
      <AssignmentCard
        assignment={{
          ...mockAssignment,
          submissionCount: 12,
          studentCount: 30,
        }}
        isTeacher={true}
      />,
    )

    expect(screen.queryByText("12/30 submitted")).not.toBeInTheDocument()
  })

  it("uses teacher metadata instead of student submitted timestamp", () => {
    render(
      <AssignmentCard
        assignment={{
          ...mockAssignment,
          hasSubmitted: true,
          submittedAt: "2023-12-30T12:00:00.000Z" as any,
        }}
        isTeacher={true}
      />,
    )

    expect(screen.queryByText(/Submitted/)).not.toBeInTheDocument()
    expect(screen.getByText(/Due/)).toBeInTheDocument()
  })

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn()
    render(<AssignmentCard {...defaultProps} onClick={onClick} />)

    fireEvent.click(screen.getByTestId("card"))
    expect(onClick).toHaveBeenCalled()
  })
})
