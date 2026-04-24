import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { StudentClassesPage } from "@/presentation/pages/student/StudentClassesPage"
import * as studentDashboardService from "@/business/services/studentDashboardService"
import type { Class } from "@/data/api/class.types"

vi.mock("@/business/services/studentDashboardService")
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => null,
}))

const mockStudentUser = {
  id: "7",
  email: "student@test.com",
  firstName: "Test",
  lastName: "Student",
  role: "student" as const,
  createdAt: new Date(),
}

function createClass(overrides: Partial<Class> = {}): Class {
  return {
    id: 1,
    teacherId: 10,
    className: "Algorithms",
    classCode: "ALG101",
    description: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z" as Class["createdAt"],
    semester: 1,
    academicYear: "2025-2026",
    schedule: {
      days: ["monday"],
      startTime: "09:00",
      endTime: "10:00",
    },
    ...overrides,
  }
}

function renderStudentClassesPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/classes"]}>
      <Routes>
        <Route path="/dashboard/classes" element={<StudentClassesPage />} />
        <Route
          path="/dashboard/classes/:classId"
          element={<div>Student class detail page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("StudentClassesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: mockStudentUser as never,
      isAuthenticated: true,
    })
  })

  it("loads enrolled classes with archived classes included and shows archived entries when filtered", async () => {
    vi.mocked(studentDashboardService.getEnrolledClasses).mockResolvedValue({
      success: true,
      classes: [
        createClass({ id: 1, className: "Current Algorithms", isActive: true }),
        createClass({ id: 2, className: "Archived Databases", isActive: false }),
      ],
    } as Awaited<ReturnType<typeof studentDashboardService.getEnrolledClasses>>)

    renderStudentClassesPage()

    await waitFor(() => {
      expect(studentDashboardService.getEnrolledClasses).toHaveBeenCalledWith(
        7,
        undefined,
        true,
      )
    })

    const statusSelect = screen.getByDisplayValue("Current classes")
    fireEvent.change(statusSelect, { target: { value: "archived" } })

    await waitFor(() => {
      expect(screen.getByText("Archived Databases")).toBeInTheDocument()
    })

    expect(screen.queryByText("Current Algorithms")).not.toBeInTheDocument()
  })

  it("does not navigate when an archived class card is clicked", async () => {
    vi.mocked(studentDashboardService.getEnrolledClasses).mockResolvedValue({
      success: true,
      classes: [
        createClass({ id: 1, className: "Current Algorithms", isActive: true }),
        createClass({ id: 2, className: "Archived Databases", isActive: false }),
      ],
    } as Awaited<ReturnType<typeof studentDashboardService.getEnrolledClasses>>)

    const user = userEvent.setup()
    renderStudentClassesPage()

    await waitFor(() => {
      expect(studentDashboardService.getEnrolledClasses).toHaveBeenCalledWith(
        7,
        undefined,
        true,
      )
    })

    const statusSelect = screen.getByDisplayValue("Current classes")
    fireEvent.change(statusSelect, { target: { value: "archived" } })

    const archivedClassCard = await screen.findByText("Archived Databases")
    await user.click(archivedClassCard)

    expect(screen.queryByText("Student class detail page")).not.toBeInTheDocument()
  })

  it("still navigates when an active class card is clicked", async () => {
    vi.mocked(studentDashboardService.getEnrolledClasses).mockResolvedValue({
      success: true,
      classes: [
        createClass({ id: 1, className: "Current Algorithms", isActive: true }),
      ],
    } as Awaited<ReturnType<typeof studentDashboardService.getEnrolledClasses>>)

    const user = userEvent.setup()
    renderStudentClassesPage()

    const activeClassCard = await screen.findByText("Current Algorithms")
    await user.click(activeClassCard)

    expect(await screen.findByText("Student class detail page")).toBeInTheDocument()
  })
})
