import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TestCaseModal } from "@/presentation/components/teacher/forms/testCases/TestCaseModal"

describe("TestCaseModal", () => {
  it("does not render when closed", () => {
    render(
      <TestCaseModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.queryByText("Add Test Case")).not.toBeInTheDocument()
  })

  it("shows validation error when expected output is empty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <TestCaseModal isOpen onClose={vi.fn()} onSave={onSave} defaultName="" />,
    )

    await user.click(screen.getByRole("button", { name: "Add Test Case" }))

    expect(
      await screen.findByText("Expected output is required"),
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("submits trimmed payload when form is valid", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <TestCaseModal isOpen onClose={vi.fn()} onSave={onSave} defaultName="" />,
    )

    await user.type(
      screen.getByLabelText("Test Case Name"),
      "  Basic Input Test  ",
    )
    await user.type(screen.getByLabelText(/Expected Output/i), "42")
    await user.click(screen.getByText("Visible Test Case"))
    await user.click(screen.getByRole("button", { name: "Add Test Case" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: "Basic Input Test",
        input: "",
        expectedOutput: "42",
        isHidden: true,
        timeLimit: 5,
      })
    })
  })
})
