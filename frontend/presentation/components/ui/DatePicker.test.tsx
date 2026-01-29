import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DatePicker } from "./DatePicker"

describe("DatePicker", () => {
  it("renders correctly", () => {
    const handleChange = vi.fn()
    render(<DatePicker value="" onChange={handleChange} />)
    expect(screen.getByText("Pick a date...")).toBeInTheDocument()
  })

  it("opens popover on click and shows correct month", () => {
    const handleChange = vi.fn()
    render(<DatePicker value="2024-05-15" onChange={handleChange} />)

    // It includes weekday
    expect(screen.getByText(/May 15, 2024/)).toBeInTheDocument()

    const trigger = screen.getByRole("button", { name: /May 15, 2024/i })
    fireEvent.click(trigger)

    expect(screen.getByText("May 2024")).toBeInTheDocument()
  })

  it("should have accessible navigation buttons", () => {
    const handleChange = vi.fn()
    render(<DatePicker value="2024-05-15" onChange={handleChange} />)

    const trigger = screen.getByRole("button", { name: /May 15, 2024/i })
    fireEvent.click(trigger)

    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Next month" }),
    ).toBeInTheDocument()
  })
})
