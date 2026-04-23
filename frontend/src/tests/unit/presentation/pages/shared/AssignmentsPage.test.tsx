import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { AssignmentsPage } from "@/presentation/pages/shared/AssignmentsPage"
import * as studentDashboardService from "@/business/services/studentDashboardService"
import * as classService from "@/business/services/classService"
import type { Class, Task } from "@/data/api/class.types"

vi.mock("@/business/services/studentDashboardService")
vi.mock("@/business/services/classService")
vi.mock("@/business/services/teacherDashboardService", () => ({
  getAllTeacherAssignments: vi.fn(),
}))
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => null,
}))
vi.mock("@/presentation/components/ui/TablePaginationFooter", () => ({
  TablePaginationFooter: () => null,
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

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    classId: 1,
    moduleId: null,
    assignmentName: "Binary Search",
    className: "Algorithms",
    deadline: "2026-04-25T12:00:00.000Z" as Task["deadline"],
    programmingLanguage: "python",
    hasSubmitted: false,
    allowLateSubmissions: false,
    latePenaltyConfig: null,
    ...overrides,
  }
}

function renderAssignmentsPage() {
  return render(
    <MemoryRouter>
      <AssignmentsPage />
    </MemoryRouter>,
  )
}

describe("AssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-23T08:00:00.000Z"))
    useAuthStore.setState({ user: mockStudentUser as never, isAuthenticated: true })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("shows all enrolled classes in the student class filter even when a class has no assignments", async () => {
    vi.mocked(studentDashboardService.getEnrolledClasses).mockResolvedValue({
      success: true,
      classes: [
        createClass({ id: 1, className: "Algorithms" }),
        createClass({ id: 2, className: "Databases", classCode: "DB101" }),
      ],
    })
    vi.mocked(classService.getClassAssignments).mockImplementation(async (classId: number) => {
      if (classId === 1) {
        return [createTask({ id: 11, classId: 1, className: "Algorithms" })]
      }

      return []
    })

    renderAssignmentsPage()

    const classFilter = await screen.findByLabelText("Filter by class")
    const classOptions = within(classFilter).getAllByRole("option").map((option) => option.textContent)

    expect(classOptions).toEqual(["All Classes", "Algorithms", "Databases"])
  })

  it("recomputes student status counts from the selected class subset", async () => {
    vi.mocked(studentDashboardService.getEnrolledClasses).mockResolvedValue({
      success: true,
      classes: [
        createClass({ id: 1, className: "Algorithms" }),
        createClass({ id: 2, className: "Databases", classCode: "DB101" }),
      ],
    })
    vi.mocked(classService.getClassAssignments).mockImplementation(async (classId: number) => {
      if (classId === 1) {
        return [
          createTask({ id: 11, classId: 1, className: "Algorithms", assignmentName: "Algo Pending" }),
          createTask({ id: 12, classId: 1, className: "Algorithms", assignmentName: "Algo Finished", hasSubmitted: true }),
          createTask({
            id: 13,
            classId: 1,
            className: "Algorithms",
            assignmentName: "Algo Missed",
            deadline: "2026-04-20T12:00:00.000Z" as Task["deadline"],
          }),
        ]
      }

      return [
        createTask({
          id: 21,
          classId: 2,
          className: "Databases",
          assignmentName: "DB Late But Open",
          deadline: "2026-04-22T12:00:00.000Z" as Task["deadline"],
          allowLateSubmissions: true,
          latePenaltyConfig: {
            tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
            rejectAfterHours: 48,
          },
        }),
      ]
    })

    renderAssignmentsPage()

    const classFilter = await screen.findByLabelText("Filter by class")
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    })

    await user.selectOptions(classFilter, "Databases")

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /All 1/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Pending 1/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Finished 0/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Missed 0/i })).toBeInTheDocument()
      expect(screen.getByText("DB Late But Open")).toBeInTheDocument()
      expect(screen.getByText("Pending")).toBeInTheDocument()
    })
  })
})
