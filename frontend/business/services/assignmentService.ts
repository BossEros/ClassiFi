import * as assignmentRepository from "@/data/repositories/assignmentRepository";
import { validateId } from "@/shared/utils/validators";
import type {
  Submission,
  SubmissionHistoryResponse,
  AssignmentDetail,
  SubmitAssignmentRequest,
  SubmissionContent,
} from "@/data/api/types";
import { validateFile } from "@/shared/utils/assignmentValidation";
export { validateFile };

/**
 * Submits an assignment with file upload
 *
 * @param request - Submit assignment request containing all necessary data
 * @returns Submission data
 */
export async function submitAssignment(
  request: SubmitAssignmentRequest,
): Promise<Submission> {
  // Validate inputs
  validateId(request.assignmentId, "assignment");
  validateId(request.studentId, "student");

  // Validate file
  const validationError = validateFile(
    request.file,
    request.programmingLanguage,
  );

  if (validationError) {
    throw new Error(validationError);
  }

  // Submit to repository
  const response = await assignmentRepository.submitAssignment(request);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data || !response.data.submission) {
    throw new Error("Failed to submit assignment");
  }

  return response.data.submission;
}

/**
 * Gets submission history for a student and assignment
 *
 * @param assignmentId - ID of the assignment
 * @param studentId - ID of the student
 * @returns Submission history data
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number,
): Promise<SubmissionHistoryResponse> {
  validateId(assignmentId, "assignment");
  validateId(studentId, "student");

  const response = await assignmentRepository.getSubmissionHistory(
    assignmentId,
    studentId,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Failed to fetch submission history");
  }

  return response.data;
}

/**
 * Gets all submissions by a student
 *
 * @param studentId - ID of the student
 * @param latestOnly - If true, only return latest submission per assignment
 * @returns List of submissions
 */
export async function getStudentSubmissions(
  studentId: number,
  latestOnly: boolean = true,
): Promise<Submission[]> {
  validateId(studentId, "student");

  const response = await assignmentRepository.getStudentSubmissions(
    studentId,
    latestOnly,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Failed to fetch submissions");
  }

  return response.data.submissions;
}

/**
 * Gets all submissions for an assignment (typically for teachers)
 *
 * @param assignmentId - ID of the assignment
 * @param latestOnly - If true, only return latest submission per student
 * @returns List of submissions
 */
export async function getAssignmentSubmissions(
  assignmentId: number,
  latestOnly: boolean = true,
): Promise<Submission[]> {
  validateId(assignmentId, "assignment");

  const response = await assignmentRepository.getAssignmentSubmissions(
    assignmentId,
    latestOnly,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Failed to fetch submissions");
  }

  return response.data.submissions;
}

/**
 * Gets assignment details by ID
 *
 * @param assignmentId - ID of the assignment
 * @param userId - ID of the user requesting details
 * @returns Assignment details
 */
export async function getAssignmentById(
  assignmentId: number,
  userId: number,
): Promise<AssignmentDetail> {
  validateId(assignmentId, "assignment");

  const response = await assignmentRepository.getAssignmentById(
    assignmentId,
    userId,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data || !response.data.assignment) {
    throw new Error("Failed to fetch assignment details");
  }

  return response.data.assignment;
}

/**
 * Gets submission content for preview
 *
 * @param submissionId - ID of the submission
 * @returns Object containing content and language
 */
export async function getSubmissionContent(
  submissionId: number,
): Promise<SubmissionContent> {
  validateId(submissionId, "submission");

  const response = await assignmentRepository.getSubmissionContent(submissionId);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("Failed to fetch submission content");
  }

  return response.data;
}

/**
 * Gets submission download URL
 *
 * @param submissionId - ID of the submission
 * @returns Download URL
 */
export async function getSubmissionDownloadUrl(
  submissionId: number,
): Promise<string> {
  validateId(submissionId, "submission");

  const response =
    await assignmentRepository.getSubmissionDownloadUrl(submissionId);

  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data || !response.data.downloadUrl) {
    throw new Error("Failed to generate download URL");
  }

  return response.data.downloadUrl;
}
