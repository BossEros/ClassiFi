import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

const navigateMock = vi.fn()

vi.mock("react-router-dom", async () => {
  const actualModule =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    )

  return {
    ...actualModule,
    useNavigate: () => navigateMock,
  }
})

vi.mock(
  "@/presentation/components/shared/dashboard/NotificationBadge",
  () => ({
    NotificationBadge: () => (
      <div data-testid="notification-badge">Notifications</div>
    ),
  }),
)

function mockMatchMedia(isMobileViewport: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 639px)" ? isMobileViewport : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function TopBarHarness() {
  const topBar = useTopBar({
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      { label: "Biology 101", to: "/dashboard/classes/12" },
      {
        label: "Assignment Overview",
        to: "/dashboard/assignments/42",
      },
    ],
  })

  return topBar.main
}

describe("TopBar", () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })

  it("shows a mobile back button with the current page title instead of the full breadcrumb trail", async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()

    render(<TopBarHarness />)

    expect(screen.getByText("Assignment Overview")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Go back to Biology 101" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Classes")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Go back to Biology 101" }),
    )

    expect(navigateMock).toHaveBeenCalledWith("/dashboard/classes/12")
  })

  it("keeps the full breadcrumb trail on desktop viewports", () => {
    mockMatchMedia(false)

    render(<TopBarHarness />)

    expect(screen.getByText("Classes")).toBeInTheDocument()
    expect(screen.getByText("Biology 101")).toBeInTheDocument()
    expect(screen.getByText("Assignment Overview")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Go back to Biology 101" }),
    ).not.toBeInTheDocument()
  })
})
