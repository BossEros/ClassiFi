import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react"
import {
  submitAssignment,
  validateFile,
} from "@/business/services/assignmentService"
import {
  getTestResultsForSubmission,
  runTestsPreview,
} from "@/business/services/testService"
import type { Submission } from "@/business/models/assignment/types"
import type { AssignmentDetail } from "@/business/models/assignment/types"
import type { User } from "@/business/models/auth/types"
import type { TestPreviewResult } from "@/business/models/test/types"
import type { ToastVariant } from "@/presentation/components/ui/Toast"

interface UseAssignmentSubmissionFlowOptions {
  assignmentId: string | undefined
  user: User | null
  assignment: AssignmentDetail | null
  setError: Dispatch<SetStateAction<string | null>>
  setSubmissions: Dispatch<SetStateAction<Submission[]>>
  setSubmissionTestResults: Dispatch<SetStateAction<TestPreviewResult | null>>
  showToast: (message: string, variant?: ToastVariant) => void
}

interface UseAssignmentSubmissionFlowResult {
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFile: File | null
  fileError: string | null
  isSubmitting: boolean
  isRunningPreview: boolean
  previewResults: TestPreviewResult | null
  resultsError: string | null
  expandedPreviewTests: Set<number>
  expandedSubmissionTests: Set<number>
  expandedInitialTests: Set<number>
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void
  clearSelectedFile: () => void
  handleSubmit: () => Promise<void>
  handleRunPreviewTests: () => Promise<void>
  togglePreviewTestExpand: (index: number) => void
  toggleSubmissionTestExpand: (index: number) => void
  toggleInitialTestExpand: (index: number) => void
}

/**
 * Manages assignment submission flow state and side effects.
 *
 * @param options - Submission dependencies and callback setters.
 * @returns Submission UI state and action handlers.
 */
export function useAssignmentSubmissionFlow({
  assignmentId,
  user,
  assignment,
  setError,
  setSubmissions,
  setSubmissionTestResults,
  showToast,
}: UseAssignmentSubmissionFlowOptions): UseAssignmentSubmissionFlowResult {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submissionAbortRef = useRef<AbortController | null>(null)
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRunningPreview, setIsRunningPreview] = useState(false)
  const [previewResults, setPreviewResults] =
    useState<TestPreviewResult | null>(null)
  const [expandedPreviewTests, setExpandedPreviewTests] = useState<Set<number>>(
    new Set(),
  )
  const [expandedSubmissionTests, setExpandedSubmissionTests] = useState<
    Set<number>
  >(new Set())
  const [expandedInitialTests, setExpandedInitialTests] = useState<Set<number>>(
    new Set(),
  )
  const [resultsError, setResultsError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (submissionAbortRef.current) {
        submissionAbortRef.current.abort()
        submissionAbortRef.current = null
      }

      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current = []
    }
  }, [])

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

    if (assignment) {
      const validationError = validateFile(file, assignment.programmingLanguage)
      if (validationError) {
        setFileError(validationError)
        setSelectedFile(null)
        return
      }
    }

    setFileError(null)
    setSelectedFile(file)
  }

  const fetchTestResultsWithRetry = async (
    submissionId: number,
    signal: AbortSignal,
  ): Promise<boolean> => {
    const maxRetries = 10
    const retryDelayMs = 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal.aborted) {
        return false
      }

      try {
        const testResults = await getTestResultsForSubmission(submissionId)
        if (!signal.aborted) {
          setSubmissionTestResults(testResults)
          return true
        }
        return false
      } catch (testResultsError) {
        console.error(
          `Attempt ${attempt} failed to load submission test results`,
          testResultsError,
        )

        if (attempt === maxRetries) {
          if (!signal.aborted) {
            console.error(
              "Failed to load test results after all retries",
              testResultsError,
            )
          }
          return false
        }

        if (!signal.aborted) {
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              if (!signal.aborted) {
                resolve()
              } else {
                reject(new Error("Aborted"))
              }
            }, retryDelayMs)

            timeoutIdsRef.current.push(timeoutId)
            signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timeoutId)
                reject(new Error("Aborted"))
              },
              { once: true },
            )
          })
        }
      }
    }

    return false
  }

  const clearSubmissionForm = () => {
    setSelectedFile(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !user || !assignmentId || !assignment) {
      return
    }

    const validationError = validateFile(
      selectedFile,
      assignment.programmingLanguage,
    )
    if (validationError) {
      setFileError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setResultsError(null)

      const assignmentIdNumber = parseInt(assignmentId, 10)
      const userIdNumber = parseInt(user.id, 10)

      const submission = await submitAssignment({
        assignmentId: assignmentIdNumber,
        studentId: userIdNumber,
        file: selectedFile,
        programmingLanguage: assignment.programmingLanguage,
      })

      setSubmissions((previousSubmissions) => [
        submission,
        ...previousSubmissions,
      ])
      clearSubmissionForm()

      submissionAbortRef.current = new AbortController()
      const signal = submissionAbortRef.current.signal

      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current = []

      try {
        const didLoadTestResults = await fetchTestResultsWithRetry(
          submission.id,
          signal,
        )

        if (!didLoadTestResults && !signal.aborted) {
          setResultsError(
            "Failed to load test results after multiple attempts. Please refresh the page.",
          )
          showToast(
            "Submission successful, but test results failed to load",
            "error",
          )
        } else if (didLoadTestResults) {
          showToast("Assignment submitted successfully!")
        }
      } catch (abortError) {
        if (abortError instanceof Error && abortError.message !== "Aborted") {
          throw abortError
        }
      } finally {
        timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
        timeoutIdsRef.current = []
      }
    } catch (submissionError) {
      console.error("Failed to submit assignment:", submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit assignment",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const togglePreviewTestExpand = (index: number) => {
    setExpandedPreviewTests((previousExpandedTests) => {
      const nextExpandedTests = new Set(previousExpandedTests)
      if (nextExpandedTests.has(index)) {
        nextExpandedTests.delete(index)
      } else {
        nextExpandedTests.add(index)
      }
      return nextExpandedTests
    })
  }

  const toggleSubmissionTestExpand = (index: number) => {
    setExpandedSubmissionTests((previousExpandedTests) => {
      const nextExpandedTests = new Set(previousExpandedTests)
      if (nextExpandedTests.has(index)) {
        nextExpandedTests.delete(index)
      } else {
        nextExpandedTests.add(index)
      }
      return nextExpandedTests
    })
  }

  const toggleInitialTestExpand = (index: number) => {
    setExpandedInitialTests((previousExpandedTests) => {
      const nextExpandedTests = new Set(previousExpandedTests)
      if (nextExpandedTests.has(index)) {
        nextExpandedTests.delete(index)
      } else {
        nextExpandedTests.add(index)
      }
      return nextExpandedTests
    })
  }

  const handleRunPreviewTests = async () => {
    if (!selectedFile || !assignment || !assignmentId) {
      return
    }

    try {
      setIsRunningPreview(true)
      setPreviewResults(null)

      const fileContent = await selectedFile.text()

      const previewTestResults = await runTestsPreview(
        fileContent,
        assignment.programmingLanguage as "python" | "java" | "c",
        parseInt(assignmentId, 10),
      )

      setPreviewResults(previewTestResults)

      if (previewTestResults.percentage === 100) {
        showToast(
          `All ${previewTestResults.total} tests passed! You can now submit.`,
        )
      } else {
        showToast(
          `${previewTestResults.passed}/${previewTestResults.total} tests passed`,
        )
      }
    } catch (previewError) {
      console.error("Failed to run preview tests:", previewError)
      showToast(
        previewError instanceof Error
          ? previewError.message
          : "Failed to run tests",
        "error",
      )
    } finally {
      setIsRunningPreview(false)
    }
  }

  return {
    fileInputRef,
    selectedFile,
    fileError,
    isSubmitting,
    isRunningPreview,
    previewResults,
    resultsError,
    expandedPreviewTests,
    expandedSubmissionTests,
    expandedInitialTests,
    handleFileSelect,
    clearSelectedFile,
    handleSubmit,
    handleRunPreviewTests,
    togglePreviewTestExpand,
    toggleSubmissionTestExpand,
    toggleInitialTestExpand,
  }
}
