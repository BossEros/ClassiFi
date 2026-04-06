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
import type { Submission } from "@/data/api/assignment.types"
import type { AssignmentDetail } from "@/data/api/assignment.types"
import type { User } from "@/data/api/auth.types"
import type { TestPreviewResult } from "@/data/api/test-case.types"
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

  // Cleanup on unmount
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

  // Handle file selection
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

  /**
   * Wait for the given delay, but resolve immediately if the signal is aborted.
   */
  const abortableDelay = (ms: number, signal: AbortSignal): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (signal.aborted) { resolve(); return }

      const timeoutId = setTimeout(resolve, ms)
      timeoutIdsRef.current.push(timeoutId)

      signal.addEventListener("abort", () => { clearTimeout(timeoutId); resolve() }, { once: true })
    })
  }

  /**
   * Poll for test results with retries (up to 10 attempts, 1s apart).
   * Returns true if results were loaded, false if aborted or all retries exhausted.
   */
  const fetchTestResultsWithRetry = async (
    submissionId: number,
    signal: AbortSignal,
  ): Promise<boolean> => {
    const maxRetries = 10
    const retryDelayMs = 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Honour a cancellation triggered from outside (e.g. component unmount or a new submission)
      if (signal.aborted) return false

      try {
        // STEP 1: Ask the backend whether the test runner has finished for this submission
        const testResults = await getTestResultsForSubmission(submissionId)

        // STEP 2: Re-check abort after the async call — the component may have unmounted while we waited
        if (signal.aborted) return false

        // STEP 3: Results are ready — push them into state so the results card can render
        setSubmissionTestResults(testResults)
        return true
      } catch {
        // Backend returned an error — the test runner hasn't finished yet.
        // Wait 1s before the next attempt; skip the delay on the last attempt.
        if (attempt < maxRetries) {
          await abortableDelay(retryDelayMs, signal)
        }
      }
    }

    // All retries exhausted without a successful response
    return false
  }

  // Clear submission form
  const clearSubmissionForm = () => {
    setSelectedFile(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Kicks off a poll for test results after a submission is created.
  // The backend runs tests asynchronously, so we retry until the results are ready.
  const pollForSubmissionTestResults = async (submissionId: number): Promise<void> => {
    // Cancel any previous poll that might still be running from an earlier submission
    submissionAbortRef.current?.abort()
    submissionAbortRef.current = new AbortController()
    const signal = submissionAbortRef.current.signal

    // Clear any leftover retry timers from a previous attempt
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutIdsRef.current = []

    const didLoadTestResults = await fetchTestResultsWithRetry(submissionId, signal)

    // Always clean up timer references once the poll finishes, success or not
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutIdsRef.current = []

    if (didLoadTestResults) {
      showToast("Assignment submitted successfully!")
    } else if (!signal.aborted) {
      setResultsError("Failed to load test results after multiple attempts. Please refresh the page.")
      showToast("Submission successful, but test results failed to load", "error")
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Don't do anything if the student hasn't selected a file or the page is still loading
    if (!selectedFile || !user || !assignmentId || !assignment) return

    // STEP 1: Run client-side file validation before hitting the backend
    const validationError = validateFile(selectedFile, assignment.programmingLanguage)
    if (validationError) {
      setFileError(validationError)
      return
    }

    try {
      // STEP 2: Show a loading spinner and clear any stale errors from a previous attempt
      setIsSubmitting(true)
      setError(null)
      setResultsError(null)

      // STEP 3: Upload the file — the backend validates the assignment window,
      // runs the test cases, grades the submission, and writes everything to the DB
      const submission = await submitAssignment({
        assignmentId: parseInt(assignmentId, 10),
        studentId: parseInt(user.id, 10),
        file: selectedFile,
        programmingLanguage: assignment.programmingLanguage,
      })

      // STEP 4: Prepend the new submission to the history list and reset the form
      setSubmissions((previousSubmissions) => [submission, ...previousSubmissions])
      clearSubmissionForm()

      // STEP 5: If the assignment has no test cases, we're done — nothing to poll for
      if ((assignment.testCases?.length ?? 0) === 0) {
        setSubmissionTestResults(null)
        showToast("Assignment submitted successfully!")
        return
      }

      // STEP 6: Poll until the backend finishes running the test cases and the results are ready
      await pollForSubmissionTestResults(submission.id)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to submit assignment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Shared toggle helper for test expand/collapse state
  const toggleSetItem = (setter: Dispatch<SetStateAction<Set<number>>>, index: number) => {
    setter((previous) => {
      const next = new Set(previous)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }

  const togglePreviewTestExpand = (index: number) => toggleSetItem(setExpandedPreviewTests, index)
  const toggleSubmissionTestExpand = (index: number) => toggleSetItem(setExpandedSubmissionTests, index)
  const toggleInitialTestExpand = (index: number) => toggleSetItem(setExpandedInitialTests, index)

  // Handle run preview tests
  const handleRunPreviewTests = async () => {
    // Don't do anything if the student hasn't selected a file yet or if the page is still loading
    if (!selectedFile || !assignment || !assignmentId) {
      return
    }

    try {
      // STEP 1: Show a loading spinner and wipe out any old preview results from a previous run
      setIsRunningPreview(true)
      setPreviewResults(null)

      // STEP 2: Read the file the student picked so we can send the source code as plain text
      const fileContent = await selectedFile.text()

      // STEP 3: Send the code to the backend — it runs against the test cases but doesn't save anything yet
      const previewTestResults = await runTestsPreview(
        fileContent,
        assignment.programmingLanguage as "python" | "java" | "c",
        parseInt(assignmentId, 10),
      )

      // STEP 4: Save the results so the test results card below the button can display them
      setPreviewResults(previewTestResults)

      // STEP 5: Tell the student how they did — full pass gets a "you're good to submit" message
      if (previewTestResults.percentage === 100) {
        showToast(`All ${previewTestResults.total} tests passed! You can now submit.`)
      } else {
        showToast(`${previewTestResults.passed}/${previewTestResults.total} tests passed`)
      }
    } catch (previewError) {
      // Something went wrong on the backend — show the error message so the student knows what happened
      showToast(
        previewError instanceof Error ? previewError.message : "Failed to run tests",
        "error",
      )
    } finally {
      // Always turn off the loading spinner, even if the run crashed
      setIsRunningPreview(false)
    }
  }

  // Return all the states and functions
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

