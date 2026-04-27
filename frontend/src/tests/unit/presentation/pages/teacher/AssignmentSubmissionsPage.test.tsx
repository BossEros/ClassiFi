import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { AssignmentSubmissionsPage } from "@/presentation/pages/teacher/AssignmentSubmissionsPage"
import * as assignmentService from "@/business/services/assignmentService"
import * as classService from "@/business/services/classService"
import * as plagiarismService from "@/business/services/plagiarismService"
import type { EnrolledStudent, ISODateString } from "@/data/api/class.types"
import type {
  AssignmentDetail,
  Submission,
} from "@/data/api/assignment.types"

vi.mock("@/business/services/assignmentService")
vi.mock("@/business/services/classService")
vi.mock("@/business/services/plagiarismService")
vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => null,
}))
vi.mock("@/presentation/hooks/shared/useMediaQuery", () => ({
  useIsMobile: () => false,
}))
vi.mock("@/presentation/components/shared/DesktopOnlyFeatureNotice", () => ({
  DesktopOnlyFeatureNotice: () => <div>Desktop only</div>,
}))
vi.mock("@/shared/store/useToastStore", () => ({
  useToastStore: (selector: (state: { showToast: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ showToast: vi.fn() }),
}))

const mockTeacherUser = {
  id: "11",
  email: "teacher@test.com",
  firstName: "Test",
  lastName: "Teacher",
  role: "teacher" as const,
  createdAt: new Date(),
}

function createAssignmentDetail(): AssignmentDetail {
  return {
    id: 7,
    classId: 3,
    className: "Algorithms",
    assignmentName: "Binary Search",
    instructions: "Solve the task.",
    instructionsImageUrl: null,
    deadline: "2026-05-01T10:00:00.000Z" as ISODateString,
    programmingLanguage: "python",
    allowResubmission: true,
    maxAttempts: 3,
    createdAt: "2026-04-01T10:00:00.000Z" as ISODateString,
    isActive: true,
    submissionCount: 1,
    moduleId: null,
    totalScore: 100,
    allowLateSubmissions: false,
    latePenaltyConfig: null,
    enableSimilarityPenalty: false,
    similarityPenaltyConfig: null,
    testCases: [],
  }
}

function createSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 101,
    assignmentId: 7,
    studentId: 201,
    studentName: "Alice Active",
    fileName: "solution.py",
    fileSize: 128,
    submissionNumber: 1,
    submittedAt: "2026-04-30T09:00:00.000Z" as ISODateString,
    grade: 95,
    isLatest: true,
    ...overrides,
  }
}

function createStudent(
  id: number,
  fullName: string,
  isActive: boolean,
): EnrolledStudent {
  const [firstName, ...remainingNameParts] = fullName.split(" ")

  return {
    id,
    firstName,
    lastName: remainingNameParts.join(" "),
    fullName,
    email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@test.com`,
    avatarUrl: null,
    isActive,
    enrolledAt: "2026-04-01T09:00:00.000Z" as ISODateString,
  }
}

function renderAssignmentSubmissionsPage() {
  return render(
    <MemoryRouter initialEntries={["/dashboard/assignments/7/submissions"]}>
      <Routes>
        <Route
          path="/dashboard/assignments/:assignmentId/submissions"
          element={<AssignmentSubmissionsPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AssignmentSubmissionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: mockTeacherUser as never,
      isAuthenticated: true,
    })

    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(
      createAssignmentDetail(),
    )
    vi.mocked(assignmentService.getAssignmentSubmissions).mockResolvedValue([
      createSubmission(),
    ])
    vi.mocked(plagiarismService.getAssignmentSimilarityStatus).mockResolvedValue(
      {
        hasReusableReport: false,
        reusableReportId: null,
      },
    )
  })

  it("uses only active students when computing missing submissions", async () => {
    vi.mocked(classService.getClassStudents).mockImplementation(
      async (_classId, status) => {
        if (status === "active") {
          return [
            createStudent(201, "Alice Active", true),
            createStudent(202, "Bob Active", true),
          ]
        }

        return [
          createStudent(201, "Alice Active", true),
          createStudent(202, "Bob Active", true),
          createStudent(203, "Ian Inactive", false),
        ]
      },
    )

    renderAssignmentSubmissionsPage()

    await waitFor(() => {
      expect(classService.getClassStudents).toHaveBeenCalledWith(3, "active")
    })

    expect(screen.getByText("Missing")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })
})
