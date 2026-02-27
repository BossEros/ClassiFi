import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GradeOverrideModal } from "@/presentation/components/teacher/gradebook/GradeOverrideModal"

describe("GradeOverrideModal", () => {
  it("shows validation error when grade is out of range", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <GradeOverrideModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        studentName="Jane Student"
        assignmentName="Assignment 1"
        currentGrade={null}
        totalScore={50}
      />,
    )

    await user.type(screen.getByLabelText("New Grade (0 - 50)"), "51")
    await user.click(screen.getByRole("button", { name: "Save Grade" }))

    await waitFor(() => {
      expect(screen.getByText("Grade must be between 0 and 50")).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits parsed grade and trimmed feedback", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <GradeOverrideModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        studentName="Jane Student"
        assignmentName="Assignment 1"
        currentGrade={null}
        totalScore={100}
      />,
    )

    await user.type(screen.getByLabelText("New Grade (0 - 100)"), "89.5")
    await user.type(
      screen.getByLabelText("Feedback (optional)"),
      "  Great progress  ",
    )

    await user.click(screen.getByRole("button", { name: "Save Grade" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(89.5, "Great progress")
    })
  })
})
