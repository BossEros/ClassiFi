import { render, screen } from "@testing-library/react"
import { StatusBadge } from "./StatusBadge"
import { describe, it, expect } from "vitest"

describe("StatusBadge", () => {
  it("renders pending status", () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("renders not-started status", () => {
    render(<StatusBadge status="not-started" />)
    expect(screen.getByText("Not Started")).toBeInTheDocument()
  })

  it("renders submitted status", () => {
    render(<StatusBadge status="submitted" />)
    expect(screen.getByText("Submitted")).toBeInTheDocument()
  })

  it("renders late status", () => {
    render(<StatusBadge status="late" />)
    expect(screen.getByText("Late")).toBeInTheDocument()
  })

  it("applies correct color classes for each status", () => {
    const { rerender, container } = render(<StatusBadge status="pending" />)
    expect(container.firstChild).toHaveClass("bg-yellow-500/20")

    rerender(<StatusBadge status="submitted" />)
    expect(container.firstChild).toHaveClass("bg-teal-500/20")

    rerender(<StatusBadge status="late" />)
    expect(container.firstChild).toHaveClass("bg-red-500/20")
  })
})
