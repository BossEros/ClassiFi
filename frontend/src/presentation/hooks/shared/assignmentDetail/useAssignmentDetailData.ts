import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import type { NavigateFunction } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  getAssignmentById,
  getAssignmentSubmissions,
  getSubmissionHistory,
} from "@/business/services/assignmentService"
import { getTestResultsForSubmission } from "@/business/services/testService"
import type { User } from "@/business/models/auth/types"
import type {
  AssignmentDetail,
  Submission,
} from "@/business/models/assignment/types"
import type { TestPreviewResult } from "@/business/models/test/types"

interface UseAssignmentDetailDataOptions {
  assignmentId: string | undefined
  navigate: NavigateFunction
  selectedSubmissionId?: number | null
}

interface UseAssignmentDetailDataResult {
  user: User | null
  assignment: AssignmentDetail | null
  submissions: Submission[]
  submissionTestResults: TestPreviewResult | null
  isLoading: boolean
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
  setSubmissions: Dispatch<SetStateAction<Submission[]>>
  setSubmissionTestResults: Dispatch<SetStateAction<TestPreviewResult | null>>
}

/**
 * Loads assignment detail page data and keeps initial role-based behavior.
 *
 * @param options - Assignment ID and navigation function.
 * @returns Assignment detail page data state and setters.
 */
export function useAssignmentDetailData({
  assignmentId,
  navigate,
  selectedSubmissionId = null,
}: UseAssignmentDetailDataOptions): UseAssignmentDetailDataResult {
  const currentUser = useAuthStore((state) => state.user)
  const [user, setUser] = useState<User | null>(null)
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionTestResults, setSubmissionTestResults] =
    useState<TestPreviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    const fetchAssignmentData = async () => {
      if (!assignmentId) {
        setError("Assignment not found")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const assignmentIdNumber = parseInt(assignmentId, 10)
        const currentUserId = parseInt(currentUser.id, 10)

        const assignmentData = await getAssignmentById(
          assignmentIdNumber,
          currentUserId,
        )

        setAssignment(assignmentData)

        // Get submission history for student
        if (currentUser.role === "student") {
          // Check if the assignment has test cases
          const hasTestCases = assignmentData.testCases && assignmentData.testCases.length > 0

          // Get submission history
          const historyResponse = await getSubmissionHistory(
            assignmentIdNumber,
            currentUserId,
          )

          // Sort Submissions
          const sortedSubmissions = [...historyResponse.submissions].sort(
            (a, b) => b.submissionNumber - a.submissionNumber,
          )
          setSubmissions(sortedSubmissions)

          // Get latest submission
          const latestSubmission =
            sortedSubmissions.find((submission) => submission.isLatest) ||
            sortedSubmissions[0]

          // Only fetch test results when the assignment has test cases
          if (latestSubmission && hasTestCases) {
            try {
              const testResults = await getTestResultsForSubmission(
                latestSubmission.id,
              )

              setSubmissionTestResults(testResults)
            } catch (testResultsError) {
              console.error(
                "Failed to load test results for latest submission",
                testResultsError,
              )
            }
          }

          return
        }

        // Get all submissions for teacher and admin
        if (currentUser.role === "teacher" || currentUser.role === "admin") {
          // Get all submissions
          const allSubmissions = await getAssignmentSubmissions(
            assignmentIdNumber,
            true,
          )

          setSubmissions(allSubmissions)

          const hasTestCases =
            (assignmentData.testCases?.length ?? 0) > 0

          if (!hasTestCases || allSubmissions.length === 0) {
            setSubmissionTestResults(null)
            return
          }

          const selectedSubmission =
            (selectedSubmissionId
              ? allSubmissions.find(
                  (submission) => submission.id === selectedSubmissionId,
                )
              : undefined) ?? allSubmissions[0]

            try {
              const teacherSubmissionTestResults = await getTestResultsForSubmission(
                selectedSubmission.id,
                true,
              )
              setSubmissionTestResults(teacherSubmissionTestResults)
            } catch (testResultsError) {
            console.error(
              "Failed to load test results for teacher-selected submission",
              testResultsError,
            )
            setSubmissionTestResults(null)
          }
        }
      } catch (requestError) {
        console.error("Failed to fetch assignment data:", requestError)

        const errorMessage =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load assignment. Please try again."

        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignmentData()
  }, [assignmentId, currentUser, navigate, selectedSubmissionId])

  return {
    user,
    assignment,
    submissions,
    submissionTestResults,
    isLoading,
    error,
    setError,
    setSubmissions,
    setSubmissionTestResults,
  }
}
