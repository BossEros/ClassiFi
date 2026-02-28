import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JoinClassModal } from "@/presentation/components/student/forms/JoinClassModal"
import * as studentDashboardService from "@/business/services/studentDashboardService"

vi.mock("@/business/services/studentDashboardService")

describe("JoinClassModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("normalizes class code input to uppercase without spaces", async () => {
    const user = userEvent.setup()

    render(
      <JoinClassModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        studentId={1}
      />,
    )

    const classCodeInput = screen.getByLabelText("Class Code")
    await user.type(classCodeInput, "ab c 12")

    expect(classCodeInput).toHaveValue("ABC12")
  })

  it("shows inline error for invalid class code length", async () => {
    const user = userEvent.setup()

    render(
      <JoinClassModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        studentId={1}
      />,
    )

    await user.type(screen.getByLabelText("Class Code"), "ABC")
    await user.click(screen.getByRole("button", { name: "Join Class" }))

    await waitFor(() => {
      expect(
        screen.getByText("Class code must be 6-8 characters"),
      ).toBeInTheDocument()
    })

    expect(studentDashboardService.joinClass).not.toHaveBeenCalled()
  })

  it("submits valid code and closes modal on success", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    vi.mocked(studentDashboardService.joinClass).mockResolvedValue({
      success: true,
      message: "Joined class",
      classInfo: {
        id: 1,
        teacherId: 1,
        className: "Programming 1",
        classCode: "ABC123",
        description: null,
        isActive: true,
        createdAt: "2026-02-22T00:00:00.000Z",
        yearLevel: 1,
        semester: 1,
        academicYear: "2025-2026",
        schedule: {
          days: ["monday", "wednesday"],
          startTime: "08:00",
          endTime: "09:30",
        },
      },
    })

    render(
      <JoinClassModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        studentId={10}
      />,
    )

    await user.type(screen.getByLabelText("Class Code"), "abc123")
    await user.click(screen.getByRole("button", { name: "Join Class" }))

    await waitFor(() => {
      expect(studentDashboardService.joinClass).toHaveBeenCalledWith(
        10,
        "ABC123",
      )
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
