import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AssignmentFilterBar } from "./AssignmentFilterBar"
import { describe, it, expect, vi } from "vitest"

describe("AssignmentFilterBar", () => {
  const mockCounts = {
    all: 10,
    pending: 5,
    submitted: 3,
  }

  it("renders all filter buttons", () => {
    const onFilterChange = vi.fn()
    render(
      <AssignmentFilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={mockCounts}
      />,
    )

    expect(screen.getByText(/All Assignments/)).toBeInTheDocument()
    expect(screen.getByText(/Pending/)).toBeInTheDocument()
    expect(screen.getByText(/Submitted/)).toBeInTheDocument()
  })

  it("displays correct counts for each filter", () => {
    const onFilterChange = vi.fn()
    render(
      <AssignmentFilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={mockCounts}
      />,
    )

    expect(screen.getByText(/All Assignments \(10\)/)).toBeInTheDocument()
    expect(screen.getByText(/Pending \(5\)/)).toBeInTheDocument()
    expect(screen.getByText(/Submitted \(3\)/)).toBeInTheDocument()
  })

  it("highlights active filter", () => {
    const onFilterChange = vi.fn()
    render(
      <AssignmentFilterBar
        activeFilter="pending"
        onFilterChange={onFilterChange}
        counts={mockCounts}
      />,
    )

    const pendingButton = screen.getByText(/Pending/).closest("button")
    expect(pendingButton).toHaveClass("bg-teal-500/20")
  })

  it("calls onFilterChange when filter is clicked", async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    render(
      <AssignmentFilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={mockCounts}
      />,
    )

    await user.click(screen.getByText(/Pending/))
    expect(onFilterChange).toHaveBeenCalledWith("pending")
  })

  it("sets aria-pressed correctly for active filter", () => {
    const onFilterChange = vi.fn()
    render(
      <AssignmentFilterBar
        activeFilter="submitted"
        onFilterChange={onFilterChange}
        counts={mockCounts}
      />,
    )

    const submittedButton = screen.getByText(/Submitted/).closest("button")
    expect(submittedButton).toHaveAttribute("aria-pressed", "true")
  })

  it("handles zero counts", () => {
    const onFilterChange = vi.fn()
    const zeroCounts = { all: 0, pending: 0, submitted: 0 }
    render(
      <AssignmentFilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={zeroCounts}
      />,
    )

    expect(screen.getByText(/All Assignments \(0\)/)).toBeInTheDocument()
    expect(screen.getByText(/Pending \(0\)/)).toBeInTheDocument()
    expect(screen.getByText(/Submitted \(0\)/)).toBeInTheDocument()
  })
})
