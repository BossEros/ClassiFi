import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import type { NavigateFunction } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"
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
}: UseAssignmentDetailDataOptions): UseAssignmentDetailDataResult {
  const [user, setUser] = useState<User | null>(null)
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionTestResults, setSubmissionTestResults] =
    useState<TestPreviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
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

        if (currentUser.role === "student") {
          const historyResponse = await getSubmissionHistory(
            assignmentIdNumber,
            currentUserId,
          )

          const sortedSubmissions = [...historyResponse.submissions].sort(
            (a, b) => b.submissionNumber - a.submissionNumber,
          )
          setSubmissions(sortedSubmissions)

          const latestSubmission =
            sortedSubmissions.find((submission) => submission.isLatest) ||
            sortedSubmissions[0]

          if (latestSubmission) {
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

        if (currentUser.role === "teacher" || currentUser.role === "admin") {
          const allSubmissions = await getAssignmentSubmissions(
            assignmentIdNumber,
            true,
          )
          setSubmissions(allSubmissions)
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
  }, [assignmentId, navigate])

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
