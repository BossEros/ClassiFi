import { useAuthStore } from "@/shared/store/useAuthStore"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ClassDetailPage } from "@/presentation/pages/teacher/ClassDetailPage"
import * as classService from "@/business/services/classService"
import * as moduleService from "@/business/services/moduleService"
import type { ISODateString, DayOfWeek, Module } from "@/data/api/class.types"

vi.mock("@/business/services/classService")
vi.mock("@/business/services/moduleService")

const mockUser = {
  id: "1",
  email: "teacher@test.com",
  firstName: "Test",
  lastName: "Teacher",
  role: "teacher" as const,
  createdAt: new Date(),
}

const mockClassInfo = {
  id: 1,
  teacherId: 1,
  className: "Test Class",
  classCode: "ABC123",
  description: "Test Description",
  isActive: true,
  createdAt: new Date().toISOString() as ISODateString,
  teacherName: "Test Teacher",
  studentCount: 25,

  semester: 1,
  academicYear: "2024-2025",
  schedule: {
    days: ["monday", "wednesday"] as DayOfWeek[],
    startTime: "09:00",
    endTime: "10:30",
  },
}

const sampleModule: Module = {
  id: 101,
  name: "Module 1",
  classId: 1,
  isPublished: true,
  assignments: [],
  createdAt: "2026-01-01T00:00:00.000Z" as ISODateString,
  updatedAt: "2026-01-01T00:00:00.000Z" as ISODateString,
}

const generateMockStudents = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    email: `student${index + 1}@test.com`,
    firstName: "Student",
    lastName: `${index + 1}`,
    fullName: `Student ${index + 1}`,
    avatarUrl: null,
    enrolledAt: new Date().toISOString() as ISODateString,
  }))
}

const renderClassDetailPage = () => {
  return render(
    <MemoryRouter initialEntries={["/dashboard/classes/1"]}>
      <Routes>
        <Route
          path="/dashboard/classes/:classId"
          element={<ClassDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

const waitForClassHeading = async () => {
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Class" }),
    ).toBeInTheDocument()
  })
}

const expectRenderedStudentCopies = async (
  studentNames: string[],
  expectedCopyCount: number = 2,
) => {
  await waitFor(() => {
    for (const studentName of studentNames) {
      expect(screen.getAllByText(studentName)).toHaveLength(expectedCopyCount)
    }
  })
}

const expectStudentToBeAbsent = (studentName: string) => {
  expect(screen.queryAllByText(studentName)).toHaveLength(0)
}

const switchAssignmentsToListView = async () => {
  await userEvent.click(screen.getByRole("tab", { name: /list/i }))
}

describe("ClassDetailPage - Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockUser as any, isAuthenticated: true })
    vi.mocked(moduleService.getModulesByClassId).mockResolvedValue([])
  })

  it("shows teacher timeline filters and hides student status filters", async () => {
    vi.mocked(moduleService.getModulesByClassId).mockResolvedValue([sampleModule])

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [
        {
          id: 1,
          classId: 1,
          moduleId: sampleModule.id,
          assignmentName: "Teacher Assignment",
          deadline: "2099-03-01T12:00:00.000Z" as ISODateString,
          programmingLanguage: "python",
        },
      ] as any,
      students: [],
    })

    renderClassDetailPage()

    await waitForClassHeading()
    await switchAssignmentsToListView()

    expect(screen.queryByText(/Pending \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Submitted \(/)).not.toBeInTheDocument()
    expect(screen.getByText(/All Assignments \(/)).toBeInTheDocument()
    expect(screen.getByText(/Current & Upcoming \(/)).toBeInTheDocument()
    expect(screen.getByText(/Past \(/)).toBeInTheDocument()
    expect(screen.getByText("Add Assignment")).toBeInTheDocument()
  })

  it("filters teacher assignments by timeline", async () => {
    vi.mocked(moduleService.getModulesByClassId).mockResolvedValue([sampleModule])

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [
        {
          id: 1,
          classId: 1,
          moduleId: sampleModule.id,
          assignmentName: "Current Assignment",
          deadline: "2099-12-01T12:00:00.000Z" as ISODateString,
          programmingLanguage: "python",
        },
        {
          id: 2,
          classId: 1,
          moduleId: sampleModule.id,
          assignmentName: "Past Assignment",
          deadline: "2024-01-01T12:00:00.000Z" as ISODateString,
          programmingLanguage: "python",
        },
      ] as any,
      students: [],
    })

    renderClassDetailPage()

    await waitForClassHeading()
    await switchAssignmentsToListView()

    expect(screen.getByText("CURRENT & UPCOMING")).toBeInTheDocument()
    expect(screen.getByText("PAST ASSIGNMENTS")).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: /Filter by Past/i }),
    )

    await waitFor(() => {
      expect(screen.queryByText("CURRENT & UPCOMING")).not.toBeInTheDocument()
      expect(screen.getByText("PAST ASSIGNMENTS")).toBeInTheDocument()
    })
  })

  it("does not show pagination with 10 or fewer students", async () => {
    const students = generateMockStudents(10)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1", "Student 10"])

    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument()
  })

  it("shows pagination with more than 10 students", async () => {
    const students = generateMockStudents(25)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1", "Student 10"])

    expectStudentToBeAbsent("Student 11")
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument()
    expect(screen.getByLabelText("Next page")).toBeInTheDocument()
    expect(screen.getByText("Showing 1-10 of 25 students")).toBeInTheDocument()
  })

  it("navigates to next page when clicking Next button", async () => {
    const students = generateMockStudents(25)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1"])

    await userEvent.click(screen.getByLabelText("Next page"))

    await expectRenderedStudentCopies(["Student 11", "Student 20"])

    expectStudentToBeAbsent("Student 1")
    expect(screen.getByText("Showing 11-20 of 25 students")).toBeInTheDocument()
  })

  it("navigates to specific page when clicking page number", async () => {
    const students = generateMockStudents(25)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1"])

    await userEvent.click(screen.getByLabelText("Page 3"))

    await expectRenderedStudentCopies(["Student 21", "Student 25"])

    expect(screen.getByText("Showing 21-25 of 25 students")).toBeInTheDocument()
  })

  it("resets to page 1 when switching tabs", async () => {
    const students = generateMockStudents(25)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1"])

    await userEvent.click(screen.getByLabelText("Next page"))

    await expectRenderedStudentCopies(["Student 11"])

    await userEvent.click(screen.getByRole("tab", { name: /assignments/i }))
    await userEvent.click(studentsTab)

    await expectRenderedStudentCopies(["Student 1"])
    expectStudentToBeAbsent("Student 11")

    expect(screen.getByText("Showing 1-10 of 25 students")).toBeInTheDocument()
  })

  it("shows empty state with 0 students", async () => {
    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students: [],
    })

    renderClassDetailPage()

    await waitForClassHeading()

    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await waitFor(() => {
      expect(screen.getByText("No students enrolled")).toBeInTheDocument()
    })

    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument()
  })
})
