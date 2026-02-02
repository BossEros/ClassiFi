import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ClassDetailPage } from "./ClassDetailPage"
import * as authService from "@/business/services/authService"
import * as classService from "@/business/services/classService"
import { ToastProvider } from "@/shared/context/ToastContext"
import type { ISODateString, DayOfWeek } from "@/shared/types/class"

// Mock services
vi.mock("@/business/services/authService")
vi.mock("@/business/services/classService")

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
  yearLevel: 1,
  semester: 1,
  academicYear: "2024-2025",
  schedule: {
    days: ["monday", "wednesday"] as DayOfWeek[],
    startTime: "09:00",
    endTime: "10:30",
  },
}

const generateMockStudents = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    email: `student${i + 1}@test.com`,
    firstName: `Student`,
    lastName: `${i + 1}`,
    fullName: `Student ${i + 1}`,
    avatarUrl: null,
    enrolledAt: new Date().toISOString() as ISODateString,
  }))
}

const renderClassDetailPage = () => {
  return render(
    <MemoryRouter initialEntries={["/dashboard/classes/1"]}>
      <ToastProvider>
        <Routes>
          <Route
            path="/dashboard/classes/:classId"
            element={<ClassDetailPage />}
          />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe("ClassDetailPage - Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser)
  })

  it("does not show pagination with 10 or fewer students", async () => {
    const students = generateMockStudents(10)

    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students,
    })

    renderClassDetailPage()

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    // All 10 students should be visible
    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
      expect(screen.getByText("Student 10")).toBeInTheDocument()
    })

    // No pagination controls should be present
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

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    // First 10 students should be visible
    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
      expect(screen.getByText("Student 10")).toBeInTheDocument()
    })

    // Student 11 should not be visible on page 1
    expect(screen.queryByText("Student 11")).not.toBeInTheDocument()

    // Pagination controls should be present
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

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
    })

    // Click Next button
    const nextButton = screen.getByLabelText("Next page")
    await userEvent.click(nextButton)

    // Page 2 students should be visible
    await waitFor(() => {
      expect(screen.getByText("Student 11")).toBeInTheDocument()
      expect(screen.getByText("Student 20")).toBeInTheDocument()
    })

    // Page 1 students should not be visible
    expect(screen.queryByText("Student 1")).not.toBeInTheDocument()
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

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
    })

    // Click page 3
    const page3Button = screen.getByLabelText("Page 3")
    await userEvent.click(page3Button)

    // Page 3 students should be visible
    await waitFor(() => {
      expect(screen.getByText("Student 21")).toBeInTheDocument()
      expect(screen.getByText("Student 25")).toBeInTheDocument()
    })

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

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
    })

    // Navigate to page 2
    const nextButton = screen.getByLabelText("Next page")
    await userEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText("Student 11")).toBeInTheDocument()
    })

    // Switch to Coursework tab
    const courseworkTab = screen.getByRole("tab", { name: /coursework/i })
    await userEvent.click(courseworkTab)

    // Switch back to Students tab
    await userEvent.click(studentsTab)

    // Should be back on page 1
    await waitFor(() => {
      expect(screen.getByText("Student 1")).toBeInTheDocument()
      expect(screen.queryByText("Student 11")).not.toBeInTheDocument()
    })

    expect(screen.getByText("Showing 1-10 of 25 students")).toBeInTheDocument()
  })

  it("shows empty state with 0 students", async () => {
    vi.mocked(classService.getClassDetailData).mockResolvedValue({
      classInfo: mockClassInfo,
      assignments: [],
      students: [],
    })

    renderClassDetailPage()

    await waitFor(() => {
      expect(screen.getByText("Test Class")).toBeInTheDocument()
    })

    // Click Students tab
    const studentsTab = screen.getByRole("tab", { name: /students/i })
    await userEvent.click(studentsTab)

    // Empty state should be visible
    await waitFor(() => {
      expect(screen.getByText("No students enrolled")).toBeInTheDocument()
    })

    // No pagination should be present
    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument()
  })
})
