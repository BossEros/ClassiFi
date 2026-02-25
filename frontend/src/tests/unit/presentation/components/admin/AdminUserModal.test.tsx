import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminUserModal } from "@/presentation/components/admin/AdminUserModal"
import * as adminService from "@/business/services/adminService"

vi.mock("@/business/services/adminService")

describe("AdminUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows password validation error on blur", async () => {
    const user = userEvent.setup()

    render(
      <AdminUserModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />,
    )

    const passwordInput = screen.getByPlaceholderText("********")

    await user.type(passwordInput, "weak")
    await user.tab()

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters long"),
      ).toBeInTheDocument()
    })

    expect(adminService.createUser).not.toHaveBeenCalled()
  })

  it("submits valid values and calls createUser", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    vi.mocked(adminService.createUser).mockResolvedValue({
      id: 1,
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "teacher",
      avatarUrl: null,
      isActive: true,
      createdAt: "2026-02-22T00:00:00.000Z",
    })

    render(
      <AdminUserModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
    )

    await user.type(screen.getByPlaceholderText("John"), "John")
    await user.type(screen.getByPlaceholderText("Doe"), "Doe")
    await user.type(
      screen.getByPlaceholderText("john.doe@example.com"),
      "john.doe@example.com",
    )
    await user.type(screen.getByPlaceholderText("********"), "Password1!")
    await user.selectOptions(screen.getByDisplayValue("Student"), "teacher")

    await user.click(screen.getByRole("button", { name: "Create User" }))

    await waitFor(() => {
      expect(adminService.createUser).toHaveBeenCalledWith({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "Password1!",
        role: "teacher",
      })
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
