import { render, screen } from "@testing-library/react"
import { DateBlock } from "./DateBlock"
import { describe, it, expect } from "vitest"

describe("DateBlock", () => {
  it("renders date with month and day", () => {
    const date = new Date("2024-10-24")
    render(<DateBlock date={date} />)

    expect(screen.getByText("OCT")).toBeInTheDocument()
    expect(screen.getByText("24")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const date = new Date("2024-10-24")
    const { container } = render(
      <DateBlock date={date} className="custom-class" />,
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})
