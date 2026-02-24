import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AssignmentSection } from "./AssignmentSection"
import { describe, it, expect, vi } from "vitest"
import type { Assignment } from "@/business/models/dashboard/types"
import type { ISODateString } from "@/shared/types/class"

describe("AssignmentSection", () => {
  const mockAssignments: Assignment[] = [
    {
      id: 1,
      classId: 1,
      assignmentName: "Assignment 1",
      deadline: "2024-12-31T23:59:59Z" as ISODateString,
      hasSubmitted: false,
      programmingLanguage: "python",
      maxGrade: 100,
    },
    {
      id: 2,
      classId: 1,
      assignmentName: "Assignment 2",
      deadline: "2024-12-25T23:59:59Z" as ISODateString,
      hasSubmitted: true,
      programmingLanguage: "java",
      grade: 95,
      maxGrade: 100,
    },
  ]

  it("renders section title", () => {
    const onAssignmentClick = vi.fn()
    render(
      <AssignmentSection
        title="CURRENT & UPCOMING"
        assignments={mockAssignments}
        onAssignmentClick={onAssignmentClick}
        isTeacher={false}
      />,
    )

    expect(screen.getByText("CURRENT & UPCOMING")).toBeInTheDocument()
  })

  it("renders all assignments", () => {
    const onAssignmentClick = vi.fn()
    render(
      <AssignmentSection
        title="CURRENT & UPCOMING"
        assignments={mockAssignments}
        onAssignmentClick={onAssignmentClick}
        isTeacher={false}
      />,
    )

    expect(screen.getByText("Assignment 1")).toBeInTheDocument()
    expect(screen.getByText("Assignment 2")).toBeInTheDocument()
  })

  it("calls onAssignmentClick when assignment is clicked", async () => {
    const user = userEvent.setup()
    const onAssignmentClick = vi.fn()
    render(
      <AssignmentSection
        title="CURRENT & UPCOMING"
        assignments={mockAssignments}
        onAssignmentClick={onAssignmentClick}
        isTeacher={false}
      />,
    )

    await user.click(screen.getByText("Assignment 1"))
    expect(onAssignmentClick).toHaveBeenCalledWith(1)
  })

  it("renders nothing when assignments array is empty", () => {
    const onAssignmentClick = vi.fn()
    const { container } = render(
      <AssignmentSection
        title="CURRENT & UPCOMING"
        assignments={[]}
        onAssignmentClick={onAssignmentClick}
        isTeacher={false}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it("passes isTeacher prop to assignment cards", () => {
    const onAssignmentClick = vi.fn()

    render(
      <AssignmentSection
        title="CURRENT & UPCOMING"
        assignments={mockAssignments}
        onAssignmentClick={onAssignmentClick}
        isTeacher={true}
      />,
    )

    expect(screen.getByText("Assignment 1")).toBeInTheDocument()
    expect(screen.getByText("Assignment 2")).toBeInTheDocument()
  })
})
