import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ForgotPasswordForm } from "@/presentation/components/auth/forms/ForgotPasswordForm"
import * as authService from "@/business/services/authService"

vi.mock("@/business/services/authService")

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows validation error for invalid email on blur", async () => {
    const user = userEvent.setup()

    vi.mocked(authService.requestPasswordReset).mockResolvedValue({
      success: true,
      message: "Reset email sent",
    })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText("Email address")
    await user.type(emailInput, "invalid-email")
    await user.tab()

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address"),
      ).toBeInTheDocument()
    })

    expect(authService.requestPasswordReset).not.toHaveBeenCalled()
  })

  it("submits valid email and renders success state", async () => {
    const user = userEvent.setup()

    vi.mocked(authService.requestPasswordReset).mockResolvedValue({
      success: true,
      message: "Reset email sent",
    })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText("Email address")
    await user.type(emailInput, "teacher@classifi.com")
    await user.click(
      screen.getByRole("button", { name: "Send reset instructions" }),
    )

    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith({
        email: "teacher@classifi.com",
      })
    })

    expect(screen.getByText("Check your email")).toBeInTheDocument()
    expect(screen.getByText("teacher@classifi.com")).toBeInTheDocument()
  })

  it("renders service error when request fails", async () => {
    const user = userEvent.setup()

    vi.mocked(authService.requestPasswordReset).mockResolvedValue({
      success: false,
      message: "Failed to process request",
    })

    render(<ForgotPasswordForm />)

    const emailInput = screen.getByLabelText("Email address")
    await user.type(emailInput, "teacher@classifi.com")
    await user.click(
      screen.getByRole("button", { name: "Send reset instructions" }),
    )

    await waitFor(() => {
      expect(screen.getByText("Failed to process request")).toBeInTheDocument()
    })
  })
})
