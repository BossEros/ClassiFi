import type { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AdminEnrollmentsPage from "@/presentation/pages/admin/AdminEnrollmentsPage"
import * as adminService from "@/business/services/adminService"
import { useAuthStore } from "@/shared/store/useAuthStore"

const showToastMock = vi.fn()

vi.mock("@/business/services/adminService")
vi.mock("@/presentation/hooks/shared/useDebouncedValue", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}))
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => ({ main: null }),
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

const mockEnrollmentRecord = {
  id: 1,
  studentId: 10,
  studentFirstName: "Jane",
  studentLastName: "Doe",
  studentEmail: "jane@example.com",
  studentAvatarUrl: null,
  studentIsActive: true,
  classId: 2,
  className: "Algorithms",
  classCode: "ALG101",
  classIsActive: true,
  teacherId: 7,
  teacherName: "Prof. Ada",
  teacherAvatarUrl: null,
  semester: 1,
  academicYear: "2025-2026",
  enrolledAt: "2025-06-01T00:00:00Z",
}

const mockStudentOption = {
  id: 11,
  email: "alexa@example.com",
  firstName: "Alexa",
  lastName: "Santos",
  role: "student" as const,
  avatarUrl: null,
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
}

const mockClassOptions = [
  {
    id: 2,
    className: "Algorithms",
    classCode: "ALG101",
    teacherId: 7,
    semester: 1,
    academicYear: "2025-2026",
    schedule: { days: ["monday" as const], startTime: "09:00", endTime: "10:00" },
    description: null,
    isActive: true,
    studentCount: 20,
    createdAt: "2025-01-01T00:00:00Z",
    teacherName: "Prof. Ada",
  },
  {
    id: 3,
    className: "Data Structures",
    classCode: "DS201",
    teacherId: 8,
    semester: 1,
    academicYear: "2025-2026",
    schedule: { days: ["tuesday" as const], startTime: "10:00", endTime: "11:00" },
    description: null,
    isActive: true,
    studentCount: 18,
    createdAt: "2025-01-01T00:00:00Z",
    teacherName: "Prof. Turing",
  },
]

function renderAdminEnrollmentsPage() {
  return render(
    <MemoryRouter>
      <AdminEnrollmentsPage />
    </MemoryRouter>,
  )
}

describe("AdminEnrollmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockAdminUser as never, isAuthenticated: true })
    vi.mocked(adminService.getAllEnrollments).mockResolvedValue({
      success: true,
      data: [mockEnrollmentRecord],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    })
    vi.mocked(adminService.getAllClasses).mockResolvedValue({
      success: true,
      data: mockClassOptions,
      total: 2,
      page: 1,
      limit: 8,
      totalPages: 1,
    })
    vi.mocked(adminService.transferStudent).mockResolvedValue(undefined)
    vi.mocked(adminService.removeStudentFromClass).mockResolvedValue(undefined)
    vi.mocked(adminService.addStudentToClass).mockResolvedValue(undefined)
    vi.mocked(adminService.getAllUsers).mockResolvedValue({
      success: true,
      data: [mockStudentOption],
      total: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    })
  })

  it("renders enrollment records from the service", async () => {
    renderAdminEnrollmentsPage()

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enrollment Management" })).toBeInTheDocument()
    })

    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("Algorithms")).toBeInTheDocument()
    expect(screen.getByText("Prof. Ada")).toBeInTheDocument()
    expect(screen.getByText("Active Enrollment")).toBeInTheDocument()
  })

  it("enrolls a selected student into a selected class", async () => {
    const user = userEvent.setup()
    renderAdminEnrollmentsPage()

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: /^Enroll Student$/i }))

    const enrollmentDialog = await screen.findByRole("dialog", { name: /Manual Enrollment/i })

    expect(within(enrollmentDialog).getByText("Select Student")).toBeInTheDocument()
    expect(within(enrollmentDialog).getByText("Select Class")).toBeInTheDocument()

    await user.click(within(enrollmentDialog).getByRole("button", { name: /Select student Alexa Santos/i }))
    await user.click(within(enrollmentDialog).getByRole("button", { name: /Select class Algorithms/i }))
    await user.click(within(enrollmentDialog).getByRole("button", { name: /^Enroll Student$/i }))

    await waitFor(() => {
      expect(adminService.addStudentToClass).toHaveBeenCalledWith(2, 11)
    })
  })

  it("transfers a student to another class from the page workflow", async () => {
    const user = userEvent.setup()
    renderAdminEnrollmentsPage()

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: /Transfer/i }))

    const transferDialog = await screen.findByRole("dialog", { name: /Transfer Enrollment/i })

    expect(within(transferDialog).getByText("Select Destination Class")).toBeInTheDocument()

    await user.click(within(transferDialog).getByRole("button", { name: /Select destination class Data Structures/i }))
    await user.click(within(transferDialog).getByRole("button", { name: /^Transfer Student$/i }))

    await waitFor(() => {
      expect(adminService.transferStudent).toHaveBeenCalledWith({
        studentId: 10,
        fromClassId: 2,
        toClassId: 3,
      })
    })
  })

  it("removes a student from the selected class", async () => {
    const user = userEvent.setup()
    renderAdminEnrollmentsPage()

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: /Remove/i }))
    await user.click(screen.getByRole("button", { name: /^Remove Student$/i }))

    await waitFor(() => {
      expect(adminService.removeStudentFromClass).toHaveBeenCalledWith(2, 10)
    })
  })
})
