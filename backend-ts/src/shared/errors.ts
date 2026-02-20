export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = "ApiError"
  }
}

/** 400 Bad Request */
export class BadRequestError extends ApiError {
  constructor(message: string = "Bad Request") {
    super(message, 400)
    this.name = "BadRequestError"
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

/** 403 Forbidden */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

/** 404 Not Found */
export class NotFoundError extends ApiError {
  constructor(message: string = "Not Found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

// ============ User Errors ============

export class UserNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`User not found: ${identifier}`)
    this.name = "UserNotFoundError"
  }
}

export class UserAlreadyExistsError extends BadRequestError {
  constructor(email: string) {
    super(`User with email '${email}' already exists`)
    this.name = "UserAlreadyExistsError"
  }
}

export class InvalidCredentialsError extends ApiError {
  constructor() {
    super("Invalid email or password", 401)
    this.name = "InvalidCredentialsError"
  }
}

export class EmailNotVerifiedError extends ApiError {
  constructor() {
    super("Please verify your email address before logging in", 401)
    this.name = "EmailNotVerifiedError"
  }
}

// ============ Class Errors ============

export class ClassNotFoundError extends NotFoundError {
  constructor(identifier: string | number) {
    super(`Class not found: ${identifier}`)
    this.name = "ClassNotFoundError"
  }
}

export class ClassCodeAlreadyExistsError extends BadRequestError {
  constructor(code: string) {
    super(`Class code '${code}' is already in use`)
    this.name = "ClassCodeAlreadyExistsError"
  }
}

export class NotClassOwnerError extends ForbiddenError {
  constructor() {
    super("You are not the owner of this class")
    this.name = "NotClassOwnerError"
  }
}

export class ClassInactiveError extends BadRequestError {
  constructor() {
    super("This class is no longer active")
    this.name = "ClassInactiveError"
  }
}

// ============ Assignment Errors ============

export class AssignmentNotFoundError extends NotFoundError {
  constructor(assignmentId: number) {
    super(`Assignment not found: ${assignmentId}`)
    this.name = "AssignmentNotFoundError"
  }
}

export class AssignmentInactiveError extends BadRequestError {
  constructor() {
    super("This assignment is no longer active")
    this.name = "AssignmentInactiveError"
  }
}

export class InvalidAssignmentDataError extends BadRequestError {
  constructor(message: string) {
    super(message)
    this.name = "InvalidAssignmentDataError"
  }
}

export class DeadlinePassedError extends BadRequestError {
  constructor() {
    super("The deadline for this assignment has passed")
    this.name = "DeadlinePassedError"
  }
}

export class TestCaseNotFoundError extends NotFoundError {
  constructor(testCaseId: number) {
    super(`Test case not found: ${testCaseId}`)
    this.name = "TestCaseNotFoundError"
  }
}

export class TestCaseOwnershipError extends ForbiddenError {
  constructor(testCaseId: number, assignmentId: number) {
    super(
      `Test case ${testCaseId} does not belong to assignment ${assignmentId}`,
    )
    this.name = "TestCaseOwnershipError"
  }
}

// ============ Enrollment Errors ============

export class NotEnrolledError extends ForbiddenError {
  constructor() {
    super("You are not enrolled in this class")
    this.name = "NotEnrolledError"
  }
}

export class AlreadyEnrolledError extends BadRequestError {
  constructor() {
    super("You are already enrolled in this class")
    this.name = "AlreadyEnrolledError"
  }
}

// ============ Submission Errors ============

export class SubmissionNotFoundError extends NotFoundError {
  constructor(submissionId: number) {
    super(`Submission not found: ${submissionId}`)
    this.name = "SubmissionNotFoundError"
  }
}

export class SubmissionFileNotFoundError extends NotFoundError {
  constructor(submissionId: number) {
    super(`File not found for submission: ${submissionId}`)
    this.name = "SubmissionFileNotFoundError"
  }
}

export class ResubmissionNotAllowedError extends BadRequestError {
  constructor() {
    super("Resubmission is not allowed for this assignment")
    this.name = "ResubmissionNotAllowedError"
  }
}

export class MaxAttemptsExceededError extends BadRequestError {
  constructor(maxAttempts: number) {
    super(
      `Maximum number of attempts (${maxAttempts}) has been reached for this assignment`,
    )
    this.name = "MaxAttemptsExceededError"
  }
}

export class InvalidFileTypeError extends BadRequestError {
  constructor(expected: string[], received: string) {
    super(
      `Invalid file type. Expected ${expected.join(" or ")}, received ${received}`,
    )
    this.name = "InvalidFileTypeError"
  }
}

export class FileTooLargeError extends BadRequestError {
  constructor(maxSizeMB: number) {
    super(`File size exceeds ${maxSizeMB}MB limit`)
    this.name = "FileTooLargeError"
  }
}

// ============ Authorization Errors ============

export class UnauthorizedAccessError extends ForbiddenError {
  constructor(resource: string) {
    super(`Unauthorized access to ${resource}`)
    this.name = "UnauthorizedAccessError"
  }
}

export class InvalidRoleError extends BadRequestError {
  constructor(expectedRole: string) {
    super(`This action requires ${expectedRole} role`)
    this.name = "InvalidRoleError"
  }
}

// ============ File/Storage Errors ============

export class UploadFailedError extends ApiError {
  constructor(reason: string) {
    super(`File upload failed: ${reason}`, 500)
    this.name = "UploadFailedError"
  }
}

export class StudentNotInClassError extends NotFoundError {
  constructor() {
    super("Student not found in this class")
    this.name = "StudentNotInClassError"
  }
}

// ============ Plagiarism Errors ============

export class PlagiarismReportNotFoundError extends NotFoundError {
  constructor(reportId: string) {
    super(`Plagiarism report not found: ${reportId}`)
    this.name = "PlagiarismReportNotFoundError"
  }
}

export class PlagiarismResultNotFoundError extends NotFoundError {
  constructor(resultId: number) {
    super(`Plagiarism result not found: ${resultId}`)
    this.name = "PlagiarismResultNotFoundError"
  }
}

export class PlagiarismPairNotFoundError extends NotFoundError {
  constructor(pairId: number) {
    super(`Plagiarism pair not found: ${pairId}`)
    this.name = "PlagiarismPairNotFoundError"
  }
}

export class InsufficientFilesError extends BadRequestError {
  constructor(required: number, provided: number) {
    super(
      `At least ${required} files are required for plagiarism analysis, but only ${provided} were provided`,
    )
    this.name = "InsufficientFilesError"
  }
}

export class UnsupportedLanguageError extends BadRequestError {
  constructor(language: string) {
    super(
      `Unsupported programming language for plagiarism detection: ${language}`,
    )
    this.name = "UnsupportedLanguageError"
  }
}

export class LanguageRequiredError extends BadRequestError {
  constructor() {
    super("Programming language is required (java, python, or c)")
    this.name = "LanguageRequiredError"
  }
}

export class FileDownloadError extends ApiError {
  constructor(submissionId: number, reason: string) {
    super(
      `Failed to download file for submission ${submissionId}: ${reason}`,
      500,
    )
    this.name = "FileDownloadError"
  }
}

export class InsufficientDownloadedFilesError extends BadRequestError {
  constructor(required: number, downloaded: number) {
    super(
      `Could not download enough files for analysis. Need at least ${required}, but only ${downloaded} were downloaded successfully`,
    )
    this.name = "InsufficientDownloadedFilesError"
  }
}
