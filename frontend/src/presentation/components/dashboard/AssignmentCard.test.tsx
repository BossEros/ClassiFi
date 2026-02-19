import { render, screen, fireEvent } from "@testing-library/react"
import { AssignmentCard } from "./AssignmentCard"
import { vi, describe, it, expect } from "vitest"
import type { Assignment } from "@/shared/types/class"

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
    expect(screen.getByTestId("status-badge")).toBeInTheDocument()
    expect(screen.getByTestId("grade-display")).toHaveTextContent("85/100")
  })

  it("calculates status correctly (late)", () => {
    // Mock date to be after deadline
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01"))

    render(<AssignmentCard {...defaultProps} />)
    expect(screen.getByTestId("status-badge")).toHaveTextContent("late")

    vi.useRealTimers()
  })

  it("calculates status correctly (submitted)", () => {
    render(
      <AssignmentCard assignment={{ ...mockAssignment, hasSubmitted: true }} />,
    )
    expect(screen.getByTestId("status-badge")).toHaveTextContent("submitted")
  })

  it("renders teacher actions when isTeacher is true", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <AssignmentCard
        {...defaultProps}
        isTeacher={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    expect(screen.getByTitle("Edit Assignment")).toBeInTheDocument()
    expect(screen.getByTitle("Delete Assignment")).toBeInTheDocument()
  })

  it("does not render teacher actions when isTeacher is false", () => {
    const onEdit = vi.fn()
    render(
      <AssignmentCard {...defaultProps} isTeacher={false} onEdit={onEdit} />,
    )

    expect(screen.queryByTitle("Edit Assignment")).not.toBeInTheDocument()
  })

  it("calls action handlers", () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <AssignmentCard
        {...defaultProps}
        isTeacher={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )

    fireEvent.click(screen.getByTitle("Edit Assignment"))
    expect(onEdit).toHaveBeenCalled()

    fireEvent.click(screen.getByTitle("Delete Assignment"))
    expect(onDelete).toHaveBeenCalled()
  })

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn()
    render(<AssignmentCard {...defaultProps} onClick={onClick} />)

    fireEvent.click(screen.getByTestId("card"))
    expect(onClick).toHaveBeenCalled()
  })
})
