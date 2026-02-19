import { render, screen } from "@testing-library/react"
import { ClassCodeBadge } from "./ClassCodeBadge"
import { describe, it, expect } from "vitest"

describe("ClassCodeBadge", () => {
  it("renders class code", () => {
    render(<ClassCodeBadge classCode="CS101" />)

    expect(screen.getByText("CS101")).toBeInTheDocument()
  })

  it("applies teal styling", () => {
    const { container } = render(<ClassCodeBadge classCode="CS101" />)

    expect(container.firstChild).toHaveClass("bg-teal-500/20")
    expect(container.firstChild).toHaveClass("text-teal-400")
    expect(container.firstChild).toHaveClass("border-teal-500/30")
  })

  it("applies monospace font", () => {
    const { container } = render(<ClassCodeBadge classCode="CS101" />)

    expect(container.firstChild).toHaveClass("font-mono")
  })

  it("applies custom className", () => {
    const { container } = render(
      <ClassCodeBadge classCode="CS101" className="custom-class" />,
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("renders with long class code", () => {
    render(<ClassCodeBadge classCode="VERYLONGCLASSCODE123" />)

    expect(screen.getByText("VERYLONGCLASSCODE123")).toBeInTheDocument()
  })
})
