import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import { validateId } from "@/shared/utils/idUtils"
import type {
  Submission,
  SubmissionHistoryResponse,
  AssignmentDetail,
  SubmitAssignmentRequest,
  SubmissionContent,
} from "@/data/api/assignment.types"
import { validateFile } from "@/shared/utils/fileValidationUtils"
export { validateFile }

/**
 * Submits a student's code file for a specific assignment.
 * Validates the assignment ID, student ID, and file type against the required
 * programming language before uploading to the repository.
 *
 * @param request - The submission request containing the assignment ID, student ID, file, and programming language.
 * @returns The created submission object with status and metadata.
 * @throws Error if ID validation fails, file validation fails, or the server rejects the submission.
 */
export async function submitAssignment(
  request: SubmitAssignmentRequest,
): Promise<Submission> {
  // Ensure both IDs are valid non-zero numbers before hitting the API
  validateId(request.assignmentId, "assignment")
  validateId(request.studentId, "student")

  // Confirm the file type is compatible with the assignment's programming language
  const validationError = validateFile(
    request.file,
    request.programmingLanguage,
  )

  if (validationError) {
    throw new Error(validationError)
  }

  // All checks passed — upload the file and create the submission record
  const response = await assignmentRepository.submitAssignmentWithFile(request)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.submission) {
    throw new Error("Failed to submit assignment")
  }

  return response.data.submission
}

/**
 * Retrieves the full submission history for a specific student on a given assignment.
 * Returns all attempts in chronological order so the student can track their progress
 * and see feedback from previous submissions.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param studentId - The unique identifier of the student.
 * @returns An object containing the list of past submissions and related metadata.
 * @throws Error if either ID is invalid or the data cannot be fetched.
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number,
): Promise<SubmissionHistoryResponse> {
  validateId(assignmentId, "assignment")
  validateId(studentId, "student")

  const response =
    await assignmentRepository.getSubmissionHistoryForStudentAndAssignment(
      assignmentId,
      studentId,
    )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch submission history")
  }

  return response.data
}

/**
 * Retrieves all submissions made by a specific student across all assignments.
 * Useful for building student activity views or teacher grading dashboards.
 *
 * @param studentId - The unique identifier of the student.
 * @param latestOnly - If true, returns only the most recent submission per assignment to avoid duplicates (defaults to true).
 * @returns An array of submission objects sorted by submission date.
 * @throws Error if the student ID is invalid or the data cannot be retrieved.
 */
export async function getStudentSubmissions(
  studentId: number,
  latestOnly: boolean = true,
): Promise<Submission[]> {
  validateId(studentId, "student")

  const response = await assignmentRepository.getAllSubmissionsByStudentId(
    studentId,
    latestOnly,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch submissions")
  }

  return response.data.submissions
}

/**
 * Retrieves all student submissions for a given assignment.
 * Primarily used by teachers to review and grade submitted work.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param latestOnly - If true, returns only the latest submission per student to avoid duplicates (defaults to true).
 * @returns An array of submission objects from all students who submitted.
 * @throws Error if the assignment ID is invalid or the data cannot be retrieved.
 */
export async function getAssignmentSubmissions(
  assignmentId: number,
  latestOnly: boolean = true,
): Promise<Submission[]> {
  validateId(assignmentId, "assignment")

  const response = await assignmentRepository.getAllSubmissionsForAssignmentId(
    assignmentId,
    latestOnly,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch submissions")
  }

  return response.data.submissions
}

/**
 * Retrieves the full details of an assignment by its ID.
 * The response is personalized based on the requesting user's context —
 * for example, a student sees their own submission status alongside the assignment info.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param userId - The ID of the user making the request (used for role-based personalization).
 * @returns The detailed assignment object including instructions, deadline, and submission status.
 * @throws Error if the assignment is not found or the data cannot be fetched.
 */
export async function getAssignmentById(
  assignmentId: number,
  userId: number,
): Promise<AssignmentDetail> {
  validateId(assignmentId, "assignment")

  const response = await assignmentRepository.getAssignmentDetailsByIdForUser(
    assignmentId,
    userId,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.assignment) {
    throw new Error("Failed to fetch assignment details")
  }

  return response.data.assignment
}

/**
 * Fetches the source code content of a submission for in-browser preview.
 * Used to display submitted code in the Monaco editor without requiring a file download.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns An object containing the source code string and the programming language.
 * @throws Error if the submission ID is invalid or the content cannot be retrieved.
 */
export async function getSubmissionContent(
  submissionId: number,
): Promise<SubmissionContent> {
  validateId(submissionId, "submission")

  const response =
    await assignmentRepository.getSubmissionFileContentById(submissionId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch submission content")
  }

  return response.data
}

/**
 * Generates a secure, time-limited download URL for a submission's source code file.
 * Used to allow teachers or students to download the submitted file to their local machine.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns A temporary download URL for the submission file.
 * @throws Error if the submission ID is invalid or the URL cannot be generated.
 */
export async function getSubmissionDownloadUrl(
  submissionId: number,
): Promise<string> {
  validateId(submissionId, "submission")

  const response =
    await assignmentRepository.getSubmissionFileDownloadUrlById(submissionId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.downloadUrl) {
    throw new Error("Failed to generate download URL")
  }

  return response.data.downloadUrl
}

/**
 * Sends reminder notifications to all students who have not yet submitted a given assignment.
 * Allows teachers to nudge students before or after the deadline to encourage completion.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param teacherId - The unique identifier of the teacher triggering the reminder.
 * @returns An object indicating success and the notification message dispatched.
 * @throws Error if either ID is invalid or the notifications could not be sent.
 */
export async function sendReminderToNonSubmitters(
  assignmentId: number,
  teacherId: number,
): Promise<{ success: boolean; message: string }> {
  validateId(assignmentId, "assignment")
  validateId(teacherId, "teacher")

  const response = await assignmentRepository.sendReminderToNonSubmitters(
    assignmentId,
    teacherId,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to send reminders")
  }

  return response.data
}

/**
 * Saves or updates a teacher's written feedback for a specific submission.
 * The feedback text is trimmed and must be non-empty before being persisted.
 *
 * @param submissionId - The unique identifier of the submission to attach feedback to.
 * @param feedback - The teacher's written feedback text (must not be blank).
 * @returns The updated submission object with the new feedback applied.
 * @throws Error if the feedback is empty or the update fails.
 */
export async function saveSubmissionFeedback(
  submissionId: number,
  feedback: string,
): Promise<Submission> {
  validateId(submissionId, "submission")

  if (!feedback || feedback.trim().length === 0) {
    throw new Error("Feedback cannot be empty")
  }

  const response = await assignmentRepository.saveSubmissionFeedback(
    submissionId,
    feedback.trim(),
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.success || !response.data.data) {
    throw new Error("Failed to save feedback")
  }

  return response.data.data as unknown as Submission
}
