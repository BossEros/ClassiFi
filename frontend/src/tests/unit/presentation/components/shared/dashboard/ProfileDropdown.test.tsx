import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProfileDropdown } from "@/presentation/components/shared/dashboard/ProfileDropdown"
import type { User } from "@/data/api/auth.types"

vi.mock("@/business/services/authService", () => ({
  logoutUser: vi.fn(),
}))

const testUser: User = {
  id: "1",
  email: "teacher@classifi.test",
  firstName: "Taylor",
  lastName: "Nguyen",
  role: "teacher",
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
}

function mockMatchMedia(matchesDesktopViewport: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: matchesDesktopViewport,
    media: "(min-width: 1024px)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe("ProfileDropdown", () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it("keeps the mobile dropdown anchored inside the sidebar trigger container", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProfileDropdown user={testUser} userInitials="TN">
          <div>Open Profile Menu</div>
        </ProfileDropdown>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /open profile menu/i }))

    const dropdownMenu = screen.getByRole("menu")

    expect(dropdownMenu).toHaveClass("absolute", "bottom-full", "left-0", "right-0", "w-full")
    expect(dropdownMenu).not.toHaveAttribute("style")
  })

  it("keeps the desktop expanded-sidebar dropdown anchored inside the trigger container", async () => {
    mockMatchMedia(true)

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProfileDropdown user={testUser} userInitials="TN">
          <div>Open Profile Menu</div>
        </ProfileDropdown>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /open profile menu/i }))

    const dropdownMenu = screen.getByRole("menu")

    expect(dropdownMenu).toHaveClass("absolute", "bottom-full", "left-0", "right-0", "w-full")
    expect(dropdownMenu).not.toHaveAttribute("style")
  })

  it("renders a floating desktop menu only when the sidebar is collapsed", async () => {
    mockMatchMedia(true)

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProfileDropdown
          user={testUser}
          userInitials="TN"
          isSidebarCollapsed
        >
          <div>Open Profile Menu</div>
        </ProfileDropdown>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /open profile menu/i }))

    const dropdownMenu = screen.getByRole("menu")

    expect(dropdownMenu).toHaveClass("fixed", "bottom-2", "w-48")
    expect(dropdownMenu).toHaveStyle({
      left: "72px",
    })
  })
})
