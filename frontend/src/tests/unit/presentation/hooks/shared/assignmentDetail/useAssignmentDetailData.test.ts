import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useAssignmentDetailData } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentDetailData"
import { useAuthStore } from "@/shared/store/useAuthStore"
import * as assignmentService from "@/business/services/assignmentService"
import * as testService from "@/business/services/testService"
import {
  createMockAssignment,
  createMockSubmission,
  createMockTeacher,
} from "@/tests/utils/factories"
import type { AssignmentDetail } from "@/data/api/assignment.types"

vi.mock("@/business/services/assignmentService")
vi.mock("@/business/services/testService")

describe("useAssignmentDetailData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: createMockTeacher({ id: "2" }) as never,
      isAuthenticated: true,
    })
  })

  it("loads the selected student's assignment attempt count for teacher review mode", async () => {
    const navigate = vi.fn()
    const assignmentDetail = {
      ...createMockAssignment(),
      className: "Algorithms",
      instructions: "Review the selected submission",
      allowResubmission: true,
      testCases: [{ id: 1, name: "Case 1", isHidden: false }],
    } as AssignmentDetail
    const latestAssignmentSubmissions = [
      createMockSubmission({
        id: 1001,
        assignmentId: 1,
        studentId: 77,
        studentName: "Student Example",
        submissionNumber: 3,
      }),
      createMockSubmission({
        id: 1002,
        assignmentId: 1,
        studentId: 88,
        studentName: "Other Student",
      }),
    ]
    const selectedStudentSubmissionHistory = [
      createMockSubmission({
        id: 901,
        assignmentId: 1,
        studentId: 77,
        submissionNumber: 1,
        isLatest: false,
      }),
      createMockSubmission({
        id: 902,
        assignmentId: 1,
        studentId: 77,
        submissionNumber: 2,
        isLatest: false,
      }),
      createMockSubmission({
        id: 1001,
        assignmentId: 1,
        studentId: 77,
        submissionNumber: 3,
        isLatest: true,
      }),
    ]

    vi.mocked(assignmentService.getAssignmentById).mockResolvedValue(
      assignmentDetail,
    )
    vi.mocked(assignmentService.getAssignmentSubmissions).mockResolvedValue(
      latestAssignmentSubmissions,
    )
    vi.mocked(assignmentService.getSubmissionHistory).mockResolvedValue({
      success: true,
      submissions: selectedStudentSubmissionHistory,
      totalSubmissions: selectedStudentSubmissionHistory.length,
    })
    vi.mocked(testService.getTestResultsForSubmission).mockResolvedValue({
      passed: 1,
      total: 1,
      percentage: 100,
      results: [],
    })

    const { result } = renderHook(() =>
      useAssignmentDetailData({
        assignmentId: "1",
        navigate,
        selectedSubmissionId: 1001,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(assignmentService.getAssignmentById).toHaveBeenCalledWith(1, 2)
    expect(assignmentService.getAssignmentSubmissions).toHaveBeenCalledWith(
      1,
      true,
    )
    expect(assignmentService.getSubmissionHistory).toHaveBeenCalledWith(1, 77)
    expect(testService.getTestResultsForSubmission).toHaveBeenCalledWith(
      1001,
      true,
    )
    expect(result.current.selectedStudentSubmissionCount).toBe(3)
    expect(result.current.submissions).toEqual(latestAssignmentSubmissions)
    expect(result.current.error).toBeNull()
  })
})
