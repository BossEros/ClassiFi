import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChangePasswordModal } from "@/presentation/components/shared/settings/ChangePasswordModal"
import * as authService from "@/business/services/authService"

vi.mock("@/business/services/authService")

describe("ChangePasswordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows schema validation error for weak new password", async () => {
    const user = userEvent.setup()

    render(<ChangePasswordModal isOpen={true} onClose={vi.fn()} />)

    const passwordInputs = screen.getAllByPlaceholderText(/password/i)

    await user.type(passwordInputs[0], "OldPassword1!")
    await user.type(passwordInputs[1], "weak")
    await user.type(passwordInputs[2], "weak")

    await user.click(screen.getByRole("button", { name: "Change Password" }))

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters long"),
      ).toBeInTheDocument()
    })

    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it(
    "submits valid values and triggers delayed success callbacks",
    async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onSuccess = vi.fn()

      vi.mocked(authService.changePassword).mockResolvedValue({
        success: true,
        message: "Password changed successfully.",
      })

      render(
        <ChangePasswordModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />,
      )

      const passwordInputs = screen.getAllByPlaceholderText(/password/i)

      await user.type(passwordInputs[0], "OldPassword1!")
      await user.type(passwordInputs[1], "NewPassword1!")
      await user.type(passwordInputs[2], "NewPassword1!")

      await user.click(screen.getByRole("button", { name: "Change Password" }))

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith({
          currentPassword: "OldPassword1!",
          newPassword: "NewPassword1!",
          confirmPassword: "NewPassword1!",
        })
      })

      expect(screen.getByText("Password Changed!")).toBeInTheDocument()

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
      }, { timeout: 4000 })
    },
    10000,
  )
})
