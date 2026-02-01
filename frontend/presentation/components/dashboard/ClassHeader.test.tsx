import { render, screen, fireEvent } from "@testing-library/react"
import { ClassHeader } from "./ClassHeader"
import { vi, describe, it, expect } from "vitest"

// Mock dependencies
vi.mock("@/presentation/components/ui/Button", () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

vi.mock("@/presentation/components/ui/DropdownMenu", () => ({
  DropdownMenu: ({ items }: any) => (
    <div>
      {items?.map((item: any) => (
        <div key={item.id} onClick={item.onClick}>
          {item.label}
        </div>
      ))}
    </div>
  ),
}))

describe("ClassHeader", () => {
  const defaultProps = {
    classNameTitle: "Intro to CS",
    instructorName: "Dr. Smith",
    schedule: {
      days: ["monday" as const, "wednesday" as const],
      startTime: "10:00",
      endTime: "11:00",
    },
    studentCount: 20,
    isTeacher: false,
  }

  it("renders class details correctly", () => {
    render(<ClassHeader {...defaultProps} />)
    expect(screen.getByText("Intro to CS")).toBeInTheDocument()
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument()
    expect(screen.getByText(/MW 10:00 - 11:00 AM/)).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    const description = "This is an introductory course to computer science"
    render(<ClassHeader {...defaultProps} description={description} />)
    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it("does not render description section when not provided", () => {
    const { container } = render(<ClassHeader {...defaultProps} />)
    const descriptionText = container.querySelector(".text-gray-400")
    expect(descriptionText).not.toBeInTheDocument()
  })

  it("renders teacher actions when isTeacher is true", () => {
    const onViewGradebook = vi.fn()
    render(
      <ClassHeader
        {...defaultProps}
        isTeacher={true}
        onViewGradebook={onViewGradebook}
      />,
    )

    expect(screen.getByText("Gradebook")).toBeInTheDocument()
    expect(screen.queryByText("Leave Class")).not.toBeInTheDocument()

    // Check for edit/delete options in dropdown (simplified check since we mocked it)
    expect(screen.getByText("Edit Class")).toBeInTheDocument()
    expect(screen.getByText("Delete Class")).toBeInTheDocument()
  })

  it("renders student actions when isTeacher is false", () => {
    const onLeaveClass = vi.fn()
    render(
      <ClassHeader
        {...defaultProps}
        isTeacher={false}
        onLeaveClass={onLeaveClass}
      />,
    )

    expect(screen.getByText("Leave Class")).toBeInTheDocument()
    expect(screen.queryByText("Gradebook")).not.toBeInTheDocument()
  })

  it("calls action handlers", () => {
    const onLeaveClass = vi.fn()
    render(
      <ClassHeader
        {...defaultProps}
        isTeacher={false}
        onLeaveClass={onLeaveClass}
      />,
    )

    fireEvent.click(screen.getByText("Leave Class"))
    expect(onLeaveClass).toHaveBeenCalled()
  })
})
