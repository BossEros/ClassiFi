import { render, screen } from "@testing-library/react"
import { GradeDisplay } from "./GradeDisplay"
import { describe, it, expect } from "vitest"

describe("GradeDisplay", () => {
  it("renders grade with default maxGrade", () => {
    render(<GradeDisplay grade={95} />)
    expect(screen.getByText("95/100")).toBeInTheDocument()
    expect(screen.getByText(/Grade/i)).toBeInTheDocument()
  })

  it("renders grade with custom maxGrade", () => {
    render(<GradeDisplay grade={45} maxGrade={50} />)
    expect(screen.getByText("45/50")).toBeInTheDocument()
  })

  it("renders N/A for null grade", () => {
    render(<GradeDisplay grade={null} />)
    expect(screen.getByText("N/A")).toBeInTheDocument()
  })

  it("applies color based on percentage", () => {
    const { container, rerender } = render(<GradeDisplay grade={95} />)
    expect(container.querySelector(".text-green-500")).toBeInTheDocument()

    rerender(<GradeDisplay grade={85} />)
    expect(container.querySelector(".text-teal-500")).toBeInTheDocument()

    rerender(<GradeDisplay grade={50} />)
    expect(container.querySelector(".text-red-500")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <GradeDisplay grade={95} className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
