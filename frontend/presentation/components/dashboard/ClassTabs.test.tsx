import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClassTabs } from "./ClassTabs"
import { describe, it, expect, vi } from "vitest"

describe("ClassTabs", () => {
  it("renders all tabs", () => {
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="coursework" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    expect(screen.getByText("Coursework")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Calendar")).toBeInTheDocument()
  })

  it("highlights active tab", () => {
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="students" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    const studentsTab = screen.getByText("Students").closest("button")
    expect(studentsTab).toHaveClass("border-teal-500")
    expect(studentsTab).toHaveClass("text-teal-400")
  })

  it("calls onTabChange when tab is clicked", async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="coursework" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    await user.click(screen.getByText("Students"))
    expect(onTabChange).toHaveBeenCalledWith("students")
  })

  it("renders children content", () => {
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="coursework" onTabChange={onTabChange}>
        <div>Test Content</div>
      </ClassTabs>,
    )

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("sets aria-selected correctly for active tab", () => {
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="calendar" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    const calendarTab = screen.getByText("Calendar").closest("button")
    expect(calendarTab).toHaveAttribute("aria-selected", "true")
  })

  it("sets aria-controls for each tab", () => {
    const onTabChange = vi.fn()
    render(
      <ClassTabs activeTab="coursework" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    const courseworkTab = screen.getByText("Coursework").closest("button")
    expect(courseworkTab).toHaveAttribute("aria-controls", "coursework-panel")
  })

  it("renders icons for each tab", () => {
    const onTabChange = vi.fn()
    const { container } = render(
      <ClassTabs activeTab="coursework" onTabChange={onTabChange}>
        <div>Content</div>
      </ClassTabs>,
    )

    const icons = container.querySelectorAll("svg")
    expect(icons.length).toBeGreaterThanOrEqual(3)
  })
})
