import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { ClassesPage } from "@/presentation/pages/teacher/ClassesPage"
import * as classService from "@/business/services/classService"
import type { Class } from "@/data/api/class.types"

vi.mock("@/business/services/classService")
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => null,
}))

const mockTeacherUser = {
  id: "9",
  email: "teacher@test.com",
  firstName: "Test",
  lastName: "Teacher",
  role: "teacher" as const,
  createdAt: new Date(),
}

function createClass(overrides: Partial<Class> = {}): Class {
  return {
    id: 1,
    teacherId: 9,
    className: "Algorithms",
    classCode: "ALG101",
    description: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z" as Class["createdAt"],
    teacherName: "Test Teacher",
    studentCount: 20,
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

function renderClassesPage(initialEntry: string = "/dashboard/classes") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/classes" element={<ClassesPage />} />
        <Route
          path="/dashboard/classes/:classId"
          element={<div>Class detail page</div>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("Teacher ClassesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: mockTeacherUser as never,
      isAuthenticated: true,
    })
  })

  it("does not navigate when an archived class card is clicked from the archived filter", async () => {
    vi.mocked(classService.getAllClasses).mockResolvedValue([
      createClass({
        id: 2,
        className: "Archived Algorithms",
        isActive: false,
      }),
    ])

    const user = userEvent.setup()
    renderClassesPage()

    await waitFor(() => {
      expect(classService.getAllClasses).toHaveBeenCalledWith(9, true)
    })

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "archived" },
    })

    await waitFor(() => {
      expect(classService.getAllClasses).toHaveBeenLastCalledWith(9, false)
    })

    const archivedClassCard = screen.getByText("Archived Algorithms")
    await user.click(archivedClassCard)

    expect(screen.queryByText("Class detail page")).not.toBeInTheDocument()
  })

  it("still navigates when an active class card is clicked", async () => {
    vi.mocked(classService.getAllClasses).mockResolvedValue([
      createClass({
        id: 3,
        className: "Active Algorithms",
        isActive: true,
      }),
    ])

    const user = userEvent.setup()
    renderClassesPage()

    const activeClassCard = await screen.findByText("Active Algorithms")
    await user.click(activeClassCard)

    expect(await screen.findByText("Class detail page")).toBeInTheDocument()
  })
})
