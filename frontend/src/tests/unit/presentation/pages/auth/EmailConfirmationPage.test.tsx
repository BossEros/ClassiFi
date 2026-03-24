import { describe, it, expect, vi, afterEach } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { EmailConfirmationPage } from "@/presentation/pages/auth/EmailConfirmationPage"
import { authTheme } from "@/presentation/constants/authTheme"

describe("EmailConfirmationPage", () => {
  afterEach(() => {
    vi.useRealTimers()
    window.history.replaceState(null, "", "/login")
  })

  it("keeps the success state after rerenders and redirects with the latest callback", async () => {
    vi.useFakeTimers()

    const initialRedirectHandler = vi.fn()
    const latestRedirectHandler = vi.fn()

    window.history.replaceState(
      null,
      "",
      "/confirm-email#access_token=test-access-token&type=signup",
    )

    const { rerender } = render(
      <EmailConfirmationPage onRedirectToLogin={initialRedirectHandler} />,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText("Email Confirmed!")).toBeInTheDocument()
    expect(
      screen.getByText("Your email has been confirmed successfully!"),
    ).toBeInTheDocument()

    rerender(<EmailConfirmationPage onRedirectToLogin={latestRedirectHandler} />)

    expect(
      screen.queryByText(
        "No confirmation data found. Please click the link in your email.",
      ),
    ).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(initialRedirectHandler).not.toHaveBeenCalled()
    expect(latestRedirectHandler).toHaveBeenCalledTimes(1)
  })

  it("uses the shared auth card width for the confirmation view", async () => {
    window.history.replaceState(
      null,
      "",
      "/confirm-email#access_token=test-access-token&type=signup",
    )

    const { container } = render(<EmailConfirmationPage />)

    await act(async () => {
      await Promise.resolve()
    })

    const confirmationCardWrapper = Array.from(
      container.querySelectorAll("div"),
    ).find(
      (element) =>
        authTheme.cardWrapper
          .split(" ")
          .every((className) => element.classList.contains(className)) &&
        authTheme.loginCardWidth
          .split(" ")
          .every((className) => element.classList.contains(className)),
    )

    expect(confirmationCardWrapper).not.toBeNull()
  })
})
