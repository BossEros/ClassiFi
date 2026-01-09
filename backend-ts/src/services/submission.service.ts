import { inject, injectable } from 'tsyringe';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { StorageService } from './storage.service.js';
import { toSubmissionDTO, type SubmissionDTO } from '../shared/mappers.js';
import {
    AssignmentNotFoundError,
    AssignmentInactiveError,
    DeadlinePassedError,
    NotEnrolledError,
    ResubmissionNotAllowedError,
    InvalidFileTypeError,
    FileTooLargeError,
    UploadFailedError,
} from '../shared/errors.js';

/**
 * Business logic for submission-related operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class SubmissionService {
    constructor(
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository,
        @inject('AssignmentRepository') private assignmentRepo: AssignmentRepository,
        @inject('EnrollmentRepository') private enrollmentRepo: EnrollmentRepository,
        @inject('ClassRepository') private classRepo: ClassRepository,
        @inject('StorageService') private storageService: StorageService
    ) { }

    /** Submit an assignment */
    async submitAssignment(
        assignmentId: number,
        studentId: number,
        file: { filename: string; data: Buffer; mimetype: string }
    ): Promise<SubmissionDTO> {
        // Validate assignment exists and is active
        const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);

        if (!assignment) {
            throw new AssignmentNotFoundError(assignmentId);
        }

        if (!assignment.isActive) {
            throw new AssignmentInactiveError();
        }

        // Check deadline
        const now = new Date();
        if (assignment.deadline && now > assignment.deadline) {
            throw new DeadlinePassedError();
        }

        // Check if student is enrolled in the class
        const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, assignment.classId);
        if (!isEnrolled) {
            throw new NotEnrolledError();
        }

        // Check for existing submission
        const existingSubmission = await this.submissionRepo.getLatestSubmission(assignmentId, studentId);

        if (existingSubmission && !assignment.allowResubmission) {
            throw new ResubmissionNotAllowedError();
        }

        // Validate file extension
        const extension = file.filename.split('.').pop()?.toLowerCase();
        const validExtensions: Record<string, string[]> = {
            python: ['py'],
            java: ['java'],
        };

        const allowedExtensions = validExtensions[assignment.programmingLanguage] ?? [];
        if (!extension || !allowedExtensions.includes(extension)) {
            throw new InvalidFileTypeError(allowedExtensions, extension ?? 'unknown');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.data.length > maxSize) {
            throw new FileTooLargeError(10);
        }

        // Get next submission number
        const submissionCount = await this.submissionRepo.getSubmissionCount(assignmentId, studentId);
        const submissionNumber = submissionCount + 1;

        // Upload file using StorageService
        const filePath = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${file.filename}`;

        try {
            await this.storageService.upload('submissions', filePath, file.data, file.mimetype);
        } catch (error) {
            console.error('Submission upload error:', error);
            throw new UploadFailedError(error instanceof Error ? error.message : 'Unknown upload error');
        }

        // Create submission record
        const submission = await this.submissionRepo.createSubmission({
            assignmentId,
            studentId,
            fileName: file.filename,
            filePath,
            fileSize: file.data.length,
            submissionNumber,
        });

        return toSubmissionDTO(submission);
    }

    /** Get submission history for a student-assignment pair */
    async getSubmissionHistory(assignmentId: number, studentId: number): Promise<SubmissionDTO[]> {
        const submissions = await this.submissionRepo.getSubmissionHistory(assignmentId, studentId);
        return submissions.map((s) => toSubmissionDTO(s));
    }

    /** Get all submissions for an assignment */
    async getAssignmentSubmissions(assignmentId: number, latestOnly: boolean = true): Promise<SubmissionDTO[]> {
        const submissions = await this.submissionRepo.getSubmissionsWithStudentInfo(assignmentId, latestOnly);

        return submissions.map((s) =>
            toSubmissionDTO(s.submission, {
                studentName: s.studentName,
            })
        );
    }

    /** Get all submissions by a student */
    async getStudentSubmissions(studentId: number, latestOnly: boolean = true): Promise<SubmissionDTO[]> {
        const submissions = await this.submissionRepo.getSubmissionsByStudent(studentId, latestOnly);
        return submissions.map((s) => toSubmissionDTO(s));
    }

    /** Get file download URL using StorageService */
    async getFileDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        return await this.storageService.getSignedUrl('submissions', filePath, expiresIn);
    }
}
