import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { AdminClassDetailPage } from "@/presentation/pages/admin/AdminClassDetailPage"
import * as adminService from "@/business/services/adminService"
import type { ISODateString } from "@/data/api/class.types"

const showToastMock = vi.fn()

vi.mock("@/business/services/adminService")
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => ({ main: null }),
}))
vi.mock("@/presentation/hooks/shared/useDebouncedValue", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}))
vi.mock("@/presentation/hooks/shared/useDocumentClick", () => ({
  useDocumentClick: vi.fn(),
}))
vi.mock("@/shared/store/useToastStore", () => ({
  useToastStore: (selector: (state: { showToast: typeof showToastMock }) => unknown) =>
    selector({ showToast: showToastMock }),
}))

const mockAdminUser = {
  id: "1",
  email: "admin@classifi.test",
  firstName: "Admin",
  lastName: "User",
  role: "admin" as const,
  createdAt: new Date(),
}

function renderAdminClassDetailPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/classes/7"]}>
      <Routes>
        <Route
          path="/dashboard/classes/:classId"
          element={<AdminClassDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AdminClassDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockAdminUser as never, isAuthenticated: true })

    vi.mocked(adminService.getAdminClassDetailData).mockResolvedValue({
      classInfo: {
        id: 7,
        className: "Algorithms",
        classCode: "ALG101",
        teacherId: 2,
        semester: 1,
        academicYear: "2025-2026",
        schedule: {
          days: ["monday"],
          startTime: "09:00",
          endTime: "10:00",
        },
        description: null,
        isActive: true,
        studentCount: 2,
        createdAt: "2025-01-01T00:00:00.000Z",
        teacherName: "Prof. Ada",
        teacherEmail: "ada@classifi.test",
        teacherAvatarUrl: null,
      },
      assignments: [],
      students: [
        {
          id: 11,
          firstName: "Alice",
          lastName: "Active",
          fullName: "Alice Active",
          email: "alice@classifi.test",
          avatarUrl: null,
          isActive: true,
          enrolledAt: "2025-06-01T00:00:00.000Z" as ISODateString,
        },
        {
          id: 12,
          firstName: "Ivan",
          lastName: "Inactive",
          fullName: "Ivan Inactive",
          email: "ivan@classifi.test",
          avatarUrl: null,
          isActive: false,
          enrolledAt: "2025-06-02T00:00:00.000Z" as ISODateString,
        },
      ],
    })
    vi.mocked(adminService.removeStudentFromClass).mockResolvedValue(undefined)
    vi.mocked(adminService.deleteClass).mockResolvedValue(undefined)
    vi.mocked(adminService.archiveClass).mockResolvedValue({} as any)
    vi.mocked(adminService.restoreClass).mockResolvedValue({} as any)
    vi.mocked(adminService.addStudentToClass).mockResolvedValue(undefined)
    vi.mocked(adminService.getAllUsers).mockResolvedValue({
      success: true,
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    })
  })

  it("renders a status column with enrollment-style active and inactive student badges", async () => {
    renderAdminClassDetailPage()

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Algorithms" })).toBeInTheDocument()
    })

    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument()

    const aliceRow = screen.getByText("Alice Active").closest("tr")
    const ivanRow = screen.getByText("Ivan Inactive").closest("tr")

    expect(aliceRow).not.toBeNull()
    expect(ivanRow).not.toBeNull()

    expect(within(aliceRow as HTMLElement).getByText("Active Enrollment")).toBeInTheDocument()
    expect(within(ivanRow as HTMLElement).getByText("Inactive Student")).toBeInTheDocument()
  })
})
