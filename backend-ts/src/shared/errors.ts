/**
 * Domain-Specific Error Classes
 * Extends base API errors with domain context
 */

import { ApiError, NotFoundError, BadRequestError, ForbiddenError } from '../api/middlewares/error-handler.js';

// ============ User Errors ============

export class UserNotFoundError extends NotFoundError {
    constructor(identifier: string | number) {
        super(`User not found: ${identifier}`);
        this.name = 'UserNotFoundError';
    }
}

export class UserAlreadyExistsError extends BadRequestError {
    constructor(field: 'email' | 'username', value: string) {
        super(`User with ${field} '${value}' already exists`);
        this.name = 'UserAlreadyExistsError';
    }
}

export class InvalidCredentialsError extends ApiError {
    constructor() {
        super('Invalid email or password', 401);
        this.name = 'InvalidCredentialsError';
    }
}

export class EmailNotVerifiedError extends ApiError {
    constructor() {
        super('Please verify your email address before logging in', 401);
        this.name = 'EmailNotVerifiedError';
    }
}

// ============ Class Errors ============

export class ClassNotFoundError extends NotFoundError {
    constructor(identifier: string | number) {
        super(`Class not found: ${identifier}`);
        this.name = 'ClassNotFoundError';
    }
}

export class ClassCodeAlreadyExistsError extends BadRequestError {
    constructor(code: string) {
        super(`Class code '${code}' is already in use`);
        this.name = 'ClassCodeAlreadyExistsError';
    }
}

export class NotClassOwnerError extends ForbiddenError {
    constructor() {
        super('You are not the owner of this class');
        this.name = 'NotClassOwnerError';
    }
}

export class ClassInactiveError extends BadRequestError {
    constructor() {
        super('This class is no longer active');
        this.name = 'ClassInactiveError';
    }
}

// ============ Assignment Errors ============

export class AssignmentNotFoundError extends NotFoundError {
    constructor(assignmentId: number) {
        super(`Assignment not found: ${assignmentId}`);
        this.name = 'AssignmentNotFoundError';
    }
}

export class AssignmentInactiveError extends BadRequestError {
    constructor() {
        super('This assignment is no longer active');
        this.name = 'AssignmentInactiveError';
    }
}

export class DeadlinePassedError extends BadRequestError {
    constructor() {
        super('The deadline for this assignment has passed');
        this.name = 'DeadlinePassedError';
    }
}

// ============ Enrollment Errors ============

export class NotEnrolledError extends ForbiddenError {
    constructor() {
        super('You are not enrolled in this class');
        this.name = 'NotEnrolledError';
    }
}

export class AlreadyEnrolledError extends BadRequestError {
    constructor() {
        super('You are already enrolled in this class');
        this.name = 'AlreadyEnrolledError';
    }
}

// ============ Submission Errors ============

export class SubmissionNotFoundError extends NotFoundError {
    constructor(submissionId: number) {
        super(`Submission not found: ${submissionId}`);
        this.name = 'SubmissionNotFoundError';
    }
}

export class ResubmissionNotAllowedError extends BadRequestError {
    constructor() {
        super('Resubmission is not allowed for this assignment');
        this.name = 'ResubmissionNotAllowedError';
    }
}

export class InvalidFileTypeError extends BadRequestError {
    constructor(expected: string[], received: string) {
        super(`Invalid file type. Expected ${expected.join(' or ')}, received ${received}`);
        this.name = 'InvalidFileTypeError';
    }
}

export class FileTooLargeError extends BadRequestError {
    constructor(maxSizeMB: number) {
        super(`File size exceeds ${maxSizeMB}MB limit`);
        this.name = 'FileTooLargeError';
    }
}

// ============ Authorization Errors ============

export class UnauthorizedAccessError extends ForbiddenError {
    constructor(resource: string) {
        super(`Unauthorized access to ${resource}`);
        this.name = 'UnauthorizedAccessError';
    }
}

export class InvalidRoleError extends BadRequestError {
    constructor(expectedRole: string) {
        super(`This action requires ${expectedRole} role`);
        this.name = 'InvalidRoleError';
    }
}
