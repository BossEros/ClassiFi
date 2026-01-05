/**
 * Domain-Specific Error Classes
 * Extends base API errors with domain context
 */
import { ApiError, NotFoundError, BadRequestError, ForbiddenError } from '../api/middlewares/error-handler.js';
export declare class UserNotFoundError extends NotFoundError {
    constructor(identifier: string | number);
}
export declare class UserAlreadyExistsError extends BadRequestError {
    constructor(field: 'email' | 'username', value: string);
}
export declare class InvalidCredentialsError extends ApiError {
    constructor();
}
export declare class EmailNotVerifiedError extends ApiError {
    constructor();
}
export declare class ClassNotFoundError extends NotFoundError {
    constructor(identifier: string | number);
}
export declare class ClassCodeAlreadyExistsError extends BadRequestError {
    constructor(code: string);
}
export declare class NotClassOwnerError extends ForbiddenError {
    constructor();
}
export declare class ClassInactiveError extends BadRequestError {
    constructor();
}
export declare class AssignmentNotFoundError extends NotFoundError {
    constructor(assignmentId: number);
}
export declare class AssignmentInactiveError extends BadRequestError {
    constructor();
}
export declare class DeadlinePassedError extends BadRequestError {
    constructor();
}
export declare class NotEnrolledError extends ForbiddenError {
    constructor();
}
export declare class AlreadyEnrolledError extends BadRequestError {
    constructor();
}
export declare class SubmissionNotFoundError extends NotFoundError {
    constructor(submissionId: number);
}
export declare class ResubmissionNotAllowedError extends BadRequestError {
    constructor();
}
export declare class InvalidFileTypeError extends BadRequestError {
    constructor(expected: string[], received: string);
}
export declare class FileTooLargeError extends BadRequestError {
    constructor(maxSizeMB: number);
}
export declare class UnauthorizedAccessError extends ForbiddenError {
    constructor(resource: string);
}
export declare class InvalidRoleError extends BadRequestError {
    constructor(expectedRole: string);
}
export declare class UploadFailedError extends ApiError {
    constructor(reason: string);
}
export declare class StudentNotInClassError extends NotFoundError {
    constructor();
}
export declare class PlagiarismReportNotFoundError extends NotFoundError {
    constructor(reportId: string);
}
export declare class PlagiarismResultNotFoundError extends NotFoundError {
    constructor(resultId: number);
}
export declare class PlagiarismPairNotFoundError extends NotFoundError {
    constructor(pairId: number);
}
export declare class InsufficientFilesError extends BadRequestError {
    constructor(required: number, provided: number);
}
export declare class UnsupportedLanguageError extends BadRequestError {
    constructor(language: string);
}
export declare class LanguageRequiredError extends BadRequestError {
    constructor();
}
export declare class FileDownloadError extends ApiError {
    constructor(submissionId: number, reason: string);
}
export declare class InsufficientDownloadedFilesError extends BadRequestError {
    constructor(required: number, downloaded: number);
}
//# sourceMappingURL=errors.d.ts.map