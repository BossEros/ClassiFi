import { render, screen } from "@testing-library/react"
import { InstructorInfo } from "./InstructorInfo"
import { describe, it, expect } from "vitest"

describe("InstructorInfo", () => {
  it("renders instructor name with icon", () => {
    render(<InstructorInfo instructorName="Dr. John Smith" />)

    expect(screen.getByText("Dr. John Smith")).toBeInTheDocument()
    const icon = document.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <InstructorInfo
        instructorName="Dr. John Smith"
        className="custom-class"
      />,
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("renders with empty instructor name", () => {
    const { container } = render(<InstructorInfo instructorName="" />)

    // Just verify the component renders without crashing
    expect(container.firstChild).toBeInTheDocument()
  })
})
