import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminDeleteUserModal } from "@/presentation/components/admin/AdminDeleteUserModal"
import type { AdminUser } from "@/business/services/adminService"

const TEST_USER: AdminUser = {
  id: 42,
  email: "student@example.com",
  firstName: "Test",
  lastName: "Student",
  role: "student",
  avatarUrl: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("AdminDeleteUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows schema validation error when confirmation text is invalid", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <AdminDeleteUserModal
        isOpen={true}
        user={TEST_USER}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.type(screen.getByPlaceholderText("DELETE"), "DEL")

    const deleteButton = screen.getByRole("button", { name: "Delete User" })
    const formElement = deleteButton.closest("form")

    expect(formElement).not.toBeNull()
    fireEvent.submit(formElement as HTMLFormElement)

    await waitFor(() => {
      expect(
        screen.getByText("Please type DELETE to confirm"),
      ).toBeInTheDocument()
    })

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("submits valid confirmation and calls onConfirm then onClose", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(
      <AdminDeleteUserModal
        isOpen={true}
        user={TEST_USER}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.type(screen.getByPlaceholderText("DELETE"), "delete")
    await user.click(screen.getByRole("button", { name: "Delete User" }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it("shows onConfirm error and keeps modal open", async () => {
    const user = userEvent.setup()
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new Error("Failed to delete user"))
    const onClose = vi.fn()

    render(
      <AdminDeleteUserModal
        isOpen={true}
        user={TEST_USER}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE")
    await user.click(screen.getByRole("button", { name: "Delete User" }))

    await waitFor(() => {
      expect(screen.getByText("Failed to delete user")).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
