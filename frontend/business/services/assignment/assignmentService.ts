/**
 * Assignment Service
 * Business logic for assignments and submissions.
 */

import * as assignmentRepository from '../../../data/repositories/assignment/assignmentRepository'
import type {
  Submission,
  SubmissionHistoryResponse,
  AssignmentDetail,
  SubmitAssignmentRequest
} from '../../models/assignment/types'

/**
 * Maximum file size for submissions (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed file extensions by programming language
 */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  python: ['.py', '.ipynb'],
  java: ['.java', '.jar']
}

/**
 * Validates a file before submission
 *
 * @param file - File to validate
 * @param programmingLanguage - Expected programming language
 * @returns Validation error message or null if valid
 */
export function validateFile(file: File, programmingLanguage: string): string | null {
  // Check if file exists
  if (!file) {
    return 'Please select a file to submit'
  }

  // Check file size
  if (file.size === 0) {
    return 'File is empty'
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return `File size exceeds maximum allowed (${maxMB}MB)`
  }

  // Check file extension
  const fileName = file.name.toLowerCase()
  const fileExt = fileName.substring(fileName.lastIndexOf('.'))

  const allowedExts = ALLOWED_EXTENSIONS[programmingLanguage.toLowerCase()] || []

  if (!allowedExts.includes(fileExt)) {
    return `Invalid file type. Expected ${allowedExts.join(', ')} for ${programmingLanguage}`
  }

  return null
}

/**
 * Formats file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Submits an assignment with file upload
 *
 * @param request - Submit assignment request containing all necessary data
 * @returns Submission data
 */
export async function submitAssignment(
  request: SubmitAssignmentRequest
): Promise<Submission> {
  // Validate inputs
  if (!request.assignmentId || request.assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  if (!request.studentId || request.studentId <= 0) {
    throw new Error('Invalid student ID')
  }

  // Validate file
  const validationError = validateFile(request.file, request.programmingLanguage)
  if (validationError) {
    throw new Error(validationError)
  }

  // Submit to repository
  const response = await assignmentRepository.submitAssignment(request)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.submission) {
    throw new Error('Failed to submit assignment')
  }

  return response.data.submission
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
  studentId: number
): Promise<SubmissionHistoryResponse> {
  if (!assignmentId || assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  if (!studentId || studentId <= 0) {
    throw new Error('Invalid student ID')
  }

  const response = await assignmentRepository.getSubmissionHistory(
    assignmentId,
    studentId
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error('Failed to fetch submission history')
  }

  return response.data
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
  latestOnly: boolean = true
): Promise<Submission[]> {
  if (!studentId || studentId <= 0) {
    throw new Error('Invalid student ID')
  }

  const response = await assignmentRepository.getStudentSubmissions(
    studentId,
    latestOnly
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error('Failed to fetch submissions')
  }

  return response.data.submissions
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
  latestOnly: boolean = true
): Promise<Submission[]> {
  if (!assignmentId || assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  const response = await assignmentRepository.getAssignmentSubmissions(
    assignmentId,
    latestOnly
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error('Failed to fetch submissions')
  }

  return response.data.submissions
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
  userId: number
): Promise<AssignmentDetail> {
  if (!assignmentId || assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  const response = await assignmentRepository.getAssignmentById(
    assignmentId,
    userId
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data || !response.data.assignment) {
    throw new Error('Failed to fetch assignment details')
  }

  return response.data.assignment
}
