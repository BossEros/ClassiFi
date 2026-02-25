import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminCreateClassModal } from "@/presentation/components/admin/AdminCreateClassModal"
import * as adminService from "@/business/services/adminService"

vi.mock("@/business/services/adminService")

describe("AdminCreateClassModal", () => {
  const teachers = [
    {
      id: 1,
      email: "teacher1@classifi.com",
      firstName: "Alice",
      lastName: "Teacher",
      role: "teacher" as const,
      avatarUrl: null,
      isActive: true,
      createdAt: "2026-02-22T00:00:00.000Z",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows validation error when required fields are missing", async () => {
    const user = userEvent.setup()

    render(
      <AdminCreateClassModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        teachers={teachers}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Create Class" }))

    await waitFor(() => {
      expect(
        screen.getByText(
          /Class name is required|Please select a teacher|At least one schedule day is required/,
        ),
      ).toBeInTheDocument()
    })

    expect(adminService.createClass).not.toHaveBeenCalled()
  })

  it("submits valid class data and calls success handlers", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    vi.mocked(adminService.createClass).mockResolvedValue({
      id: 1,
      className: "Programming 1",
      classCode: "ABC123",
      teacherId: 1,
      yearLevel: 1,
      semester: 1,
      academicYear: "2026-2027",
      schedule: {
        days: ["monday", "wednesday"],
        startTime: "08:00",
        endTime: "09:30",
      },
      description: "Intro class",
      isActive: true,
      studentCount: 0,
      createdAt: "2026-02-22T00:00:00.000Z",
      teacherName: "Alice Teacher",
    })

    render(
      <AdminCreateClassModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        teachers={teachers}
      />,
    )

    await user.type(
      screen.getByPlaceholderText("e.g. Introduction to Computer Science"),
      "Programming 1",
    )

    await user.selectOptions(screen.getByDisplayValue("Select a teacher..."), "1")
    await user.click(screen.getByRole("button", { name: "Mon" }))
    await user.click(screen.getByRole("button", { name: "Wed" }))

    await user.click(screen.getByRole("button", { name: "Create Class" }))

    await waitFor(() => {
      expect(adminService.createClass).toHaveBeenCalledWith(
        expect.objectContaining({
          className: "Programming 1",
          teacherId: 1,
          schedule: expect.objectContaining({
            days: ["monday", "wednesday"],
          }),
        }),
      )
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
