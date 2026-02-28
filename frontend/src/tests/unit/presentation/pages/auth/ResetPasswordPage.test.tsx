import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ResetPasswordPage } from "@/presentation/pages/auth/ResetPasswordPage"
import * as authService from "@/business/services/authService"

vi.mock("@/business/services/authService")

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.initializeResetFlow).mockResolvedValue({
      success: true,
      message: "Reset flow initialized",
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows invalid link state when reset session is not valid", async () => {
    vi.mocked(authService.initializeResetFlow).mockResolvedValue({
      success: false,
      message: "Invalid or expired reset link.",
    })

    render(<ResetPasswordPage />)

    await waitFor(() => {
      expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument()
    })

    expect(
      screen.getByText("Invalid or expired reset link."),
    ).toBeInTheDocument()
  })

  it("shows schema validation errors on submit", async () => {
    const user = userEvent.setup()

    vi.mocked(authService.resetPassword).mockResolvedValue({
      success: true,
      message: "Password reset successful",
    })

    render(<ResetPasswordPage />)

    await waitFor(() => {
      expect(screen.getByText("Reset Your Password")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Reset Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument()
      expect(
        screen.getByText("Please confirm your password"),
      ).toBeInTheDocument()
    })

    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it("submits valid values and triggers success redirect callback", async () => {
    const user = userEvent.setup()
    const handleSuccess = vi.fn()

    vi.mocked(authService.resetPassword).mockResolvedValue({
      success: true,
      message: "Password has been reset successfully.",
    })

    render(<ResetPasswordPage onSuccess={handleSuccess} />)

    await waitFor(() => {
      expect(screen.getByText("Reset Your Password")).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText("New Password"), "ValidPass1!")
    await user.type(
      screen.getByLabelText("Confirm New Password"),
      "ValidPass1!",
    )
    await user.click(screen.getByRole("button", { name: "Reset Password" }))

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        newPassword: "ValidPass1!",
        confirmPassword: "ValidPass1!",
      })
    })

    expect(screen.getByText("Password Reset Complete!")).toBeInTheDocument()
    await waitFor(
      () => {
        expect(handleSuccess).toHaveBeenCalledTimes(1)
      },
      { timeout: 4000 },
    )
  }, 10000)
})
