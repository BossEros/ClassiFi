import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GradeOverrideModal } from "@/presentation/components/teacher/gradebook/GradeOverrideModal"
import { SetGradeModal } from "@/presentation/components/teacher/gradebook/SetGradeModal"

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
        currentGrade={40}
        totalScore={50}
      />,
    )

    await user.clear(screen.getByLabelText(/New Grade/i))
    await user.type(screen.getByLabelText(/New Grade/i), "51")
    await user.click(screen.getByRole("button", { name: "Confirm Override" }))

    await waitFor(() => {
      expect(
        screen.getByText("Grade must be between 0 and 50"),
      ).toBeInTheDocument()
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
        currentGrade={80}
        totalScore={100}
      />,
    )

    await user.clear(screen.getByLabelText(/New Grade/i))
    await user.type(screen.getByLabelText(/New Grade/i), "89.5")
    await user.type(
      screen.getByLabelText(/Feedback/i),
      "  Great progress  ",
    )

    await user.click(screen.getByRole("button", { name: "Confirm Override" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(89.5, "Great progress")
    })
  })
})

describe("SetGradeModal", () => {
  it("shows validation error when grade is out of range", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <SetGradeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        studentName="Jane Student"
        assignmentName="Assignment 1"
        totalScore={50}
      />,
    )

    await user.type(screen.getByLabelText(/^Grade/i), "51")
    await user.click(screen.getByRole("button", { name: "Set Grade" }))

    await waitFor(() => {
      expect(
        screen.getByText("Grade must be between 0 and 50"),
      ).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits parsed grade on valid input", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <SetGradeModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        studentName="Jane Student"
        assignmentName="Assignment 1"
        totalScore={100}
      />,
    )

    await user.type(screen.getByLabelText(/^Grade/i), "75.5")
    await user.click(screen.getByRole("button", { name: "Set Grade" }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(75.5)
    })
  })
})

