import { render, screen } from "@testing-library/react"
import { ScheduleInfo } from "./ScheduleInfo"
import { describe, it, expect } from "vitest"
import type { DayOfWeek } from "@/shared/types/class"

describe("ScheduleInfo", () => {
  it("renders schedule correctly with MWF format", () => {
    const days: DayOfWeek[] = ["monday", "wednesday", "friday"]
    render(<ScheduleInfo days={days} startTime="14:00" endTime="15:30" />)
    expect(screen.getByText("MWF 2:00 - 3:30 PM")).toBeInTheDocument()
  })

  it("renders schedule correctly with TTH format", () => {
    const days: DayOfWeek[] = ["tuesday", "thursday"]
    render(<ScheduleInfo days={days} startTime="09:00" endTime="10:30" />)
    expect(screen.getByText("TTH 9:00 - 10:30 AM")).toBeInTheDocument()
  })

  it("renders schedule crossing AM/PM boundary", () => {
    const days: DayOfWeek[] = ["monday"]
    render(<ScheduleInfo days={days} startTime="11:30" endTime="13:00" />)
    expect(screen.getByText("M 11:30 AM - 1:00 PM")).toBeInTheDocument()
  })

  it("renders nothing when data is missing", () => {
    const { container } = render(
      <ScheduleInfo days={[]} startTime="" endTime="" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("applies custom className", () => {
    const days: DayOfWeek[] = ["monday"]
    render(
      <ScheduleInfo
        days={days}
        startTime="10:00"
        endTime="11:00"
        className="custom-class"
      />,
    )
    const textElement = screen.getByText("M 10:00 - 11:00 AM")
    expect(textElement.parentElement).toHaveClass("custom-class")
  })
})
