import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { useCallback, useRef, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Sidebar } from "@/presentation/components/shared/dashboard/Sidebar"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { User } from "@/data/api/auth.types"

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

/**
 * Wraps Sidebar with an "Open menu" button that simulates what DashboardLayout
 * does — it receives the mobile toggle function via onRegisterMobileToggle and
 * renders it in the top bar. The button is hidden while the mobile drawer is
 * open (via onMobileOpenChange), matching the original DashboardLayout behaviour
 * the tests rely on.
 */
function SidebarWithMobileToggle({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const mobileToggleRef = useRef<(() => void) | null>(null)

  const handleRegisterMobileToggle = useCallback((toggleFn: () => void) => {
    mobileToggleRef.current = toggleFn
  }, [])

  return (
    <>
      {!isMobileOpen && (
        <button aria-label="Open menu" onClick={() => mobileToggleRef.current?.()}>
          Open menu
        </button>
      )}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={vi.fn()}
        onRegisterMobileToggle={handleRegisterMobileToggle}
        onMobileOpenChange={setIsMobileOpen}
      />
    </>
  )
}

function renderSidebar(isCollapsed = false) {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <SidebarWithMobileToggle isCollapsed={isCollapsed} />
    </MemoryRouter>,
  )
}

function SidebarRouteChangeHarness() {
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const mobileToggleRef = useRef<(() => void) | null>(null)

  const handleRegisterMobileToggle = useCallback((toggleFn: () => void) => {
    mobileToggleRef.current = toggleFn
  }, [])

  return (
    <>
      <button onClick={() => navigate("/dashboard/classes")}>
        Navigate to classes
      </button>
      {!isMobileOpen && (
        <button aria-label="Open menu" onClick={() => mobileToggleRef.current?.()}>
          Open menu
        </button>
      )}
      <Sidebar
        isCollapsed={false}
        onToggleCollapse={vi.fn()}
        onRegisterMobileToggle={handleRegisterMobileToggle}
        onMobileOpenChange={setIsMobileOpen}
      />
    </>
  )
}

describe("Sidebar", () => {
  beforeEach(() => {
    mockMatchMedia(false)
    useAuthStore.setState({ user: testUser, isAuthenticated: true })
    document.body.style.overflow = ""
  })

  it("keeps the full brand header on mobile even when desktop collapse is enabled", () => {
    const { container } = renderSidebar(true)

    expect(screen.getByText("ClassiFi")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Taylor")).toBeInTheDocument()

    const sidebarElement = container.querySelector("aside")

    expect(sidebarElement).toHaveClass("w-72")
    expect(sidebarElement?.getAttribute("style")).toContain(
      "--sidebar-width: 224px",
    )
  })

  it("renders the compact desktop header when the desktop viewport is collapsed", async () => {
    mockMatchMedia(true)
    const { container } = renderSidebar(true)

    await waitFor(() => {
      expect(screen.queryByText("ClassiFi")).not.toBeInTheDocument()
    })

    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument()

    const sidebarElement = container.querySelector("aside")
    expect(sidebarElement?.getAttribute("style")).toContain(
      "--sidebar-width: 64px",
    )
  })

  it("locks body scrolling while the mobile drawer is open and restores it on close", async () => {
    const user = userEvent.setup()
    renderSidebar()

    const mobileMenuButton = screen.getByLabelText("Open menu")

    await user.click(mobileMenuButton)

    expect(screen.queryByLabelText("Open menu")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Close sidebar")).toBeInTheDocument()
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByLabelText("Close sidebar"))

    expect(screen.getByLabelText("Open menu")).toBeInTheDocument()
    expect(document.body.style.overflow).toBe("")
  })

  it("closes the mobile drawer after route navigation without an effect-driven state write", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SidebarRouteChangeHarness />
      </MemoryRouter>,
    )

    await user.click(screen.getByLabelText("Open menu"))

    expect(screen.getByLabelText("Close sidebar")).toBeInTheDocument()
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByRole("button", { name: "Navigate to classes" }))

    expect(screen.getByLabelText("Open menu")).toBeInTheDocument()
    expect(document.body.style.overflow).toBe("")
  })
})
