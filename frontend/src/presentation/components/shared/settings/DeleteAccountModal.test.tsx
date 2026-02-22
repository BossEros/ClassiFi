import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as authService from "@/business/services/authService"
import { DeleteAccountModal } from "@/presentation/components/shared/settings/DeleteAccountModal"

const mockNavigate = vi.fn()

vi.mock("@/business/services/authService")
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  )

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("DeleteAccountModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows schema validation error when confirmation text is invalid", async () => {
    const user = userEvent.setup()

    render(<DeleteAccountModal isOpen={true} onClose={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.type(screen.getByPlaceholderText("Enter your password"), "Pass1!")

    const deleteButton = screen.getByRole("button", { name: "Delete My Account" })
    const formElement = deleteButton.closest("form")

    expect(formElement).not.toBeNull()
    fireEvent.submit(formElement as HTMLFormElement)

    await waitFor(() => {
      expect(
        screen.getByText("Please type DELETE to confirm account deletion"),
      ).toBeInTheDocument()
    })

    expect(authService.deleteAccount).not.toHaveBeenCalled()
  })

  it(
    "submits valid values, shows success state, and redirects",
    async () => {
      const user = userEvent.setup()

      vi.mocked(authService.deleteAccount).mockResolvedValue({
        success: true,
        message: "Your account has been permanently deleted.",
      })

      render(<DeleteAccountModal isOpen={true} onClose={vi.fn()} />)

      await user.click(screen.getByRole("button", { name: "Continue" }))
      await user.type(
        screen.getByPlaceholderText("Enter your password"),
        "Pass1!Word",
      )
      await user.type(screen.getByPlaceholderText("DELETE"), "delete")
      await user.click(screen.getByRole("button", { name: "Delete My Account" }))

      await waitFor(() => {
        expect(authService.deleteAccount).toHaveBeenCalledWith({
          password: "Pass1!Word",
          confirmation: "DELETE",
        })
      })

      expect(screen.getByText("Account Deleted")).toBeInTheDocument()

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
        },
        { timeout: 4500 },
      )
    },
    10000,
  )

  it("shows service error message when deletion fails", async () => {
    const user = userEvent.setup()

    vi.mocked(authService.deleteAccount).mockResolvedValue({
      success: false,
      message: "Password is incorrect.",
    })

    render(<DeleteAccountModal isOpen={true} onClose={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Continue" }))
    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "WrongPassword1!",
    )
    await user.type(screen.getByPlaceholderText("DELETE"), "DELETE")
    await user.click(screen.getByRole("button", { name: "Delete My Account" }))

    await waitFor(() => {
      expect(screen.getByText("Password is incorrect.")).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
