import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminEditUserModal } from "@/presentation/components/admin/AdminEditUserModal"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"

vi.mock("@/business/services/adminService")

const MOCK_USER: AdminUser = {
  id: 10,
  email: "student@classifi.com",
  firstName: "Ana",
  lastName: "Student",
  role: "student",
  avatarUrl: null,
  isActive: true,
  createdAt: "2026-02-22T00:00:00.000Z",
}

describe("AdminEditUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("closes without service calls when there are no changes", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <AdminEditUserModal
        isOpen={true}
        onClose={onClose}
        onSuccess={vi.fn()}
        user={MOCK_USER}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    expect(adminService.updateUserRole).not.toHaveBeenCalled()
    expect(adminService.toggleUserStatus).not.toHaveBeenCalled()
    expect(adminService.updateUserDetails).not.toHaveBeenCalled()
    expect(adminService.updateUserEmail).not.toHaveBeenCalled()
  })

  it("updates changed fields sequentially", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    vi.mocked(adminService.updateUserRole).mockResolvedValue({
      ...MOCK_USER,
      role: "teacher",
    })
    vi.mocked(adminService.toggleUserStatus).mockResolvedValue({
      ...MOCK_USER,
      isActive: false,
    })
    vi.mocked(adminService.updateUserDetails).mockResolvedValue({
      ...MOCK_USER,
      firstName: "Anna",
      lastName: "Student",
    })
    vi.mocked(adminService.updateUserEmail).mockResolvedValue({
      ...MOCK_USER,
      email: "anna.teacher@classifi.com",
    })

    render(
      <AdminEditUserModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        user={MOCK_USER}
      />,
    )

    const firstNameInput = screen.getByDisplayValue("Ana")
    const emailInput = screen.getByDisplayValue("student@classifi.com")

    await user.clear(firstNameInput)
    await user.type(firstNameInput, "Anna")

    await user.clear(emailInput)
    await user.type(emailInput, "anna.teacher@classifi.com")

    await user.selectOptions(screen.getByRole("combobox"), "teacher")

    await user.click(screen.getByRole("button", { name: /Active Account/i }))

    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => {
      expect(adminService.updateUserRole).toHaveBeenCalledWith(10, "teacher")
      expect(adminService.toggleUserStatus).toHaveBeenCalledWith(10)
      expect(adminService.updateUserDetails).toHaveBeenCalledWith(10, {
        firstName: "Anna",
        lastName: "Student",
      })
      expect(adminService.updateUserEmail).toHaveBeenCalledWith(
        10,
        "anna.teacher@classifi.com",
      )
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
