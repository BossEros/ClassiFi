var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable } from 'tsyringe';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { AssignmentRepository } from '../repositories/assignment.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { supabase } from '../shared/supabase.js';
import { toSubmissionDTO } from '../shared/mappers.js';
import { AssignmentNotFoundError, AssignmentInactiveError, DeadlinePassedError, NotEnrolledError, ResubmissionNotAllowedError, InvalidFileTypeError, FileTooLargeError, UploadFailedError, } from '../shared/errors.js';
/**
 * Business logic for submission-related operations.
 * Uses domain errors for exceptional conditions.
 */
let SubmissionService = class SubmissionService {
    submissionRepo;
    assignmentRepo;
    enrollmentRepo;
    classRepo;
    constructor(submissionRepo, assignmentRepo, enrollmentRepo, classRepo) {
        this.submissionRepo = submissionRepo;
        this.assignmentRepo = assignmentRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.classRepo = classRepo;
    }
    /** Submit an assignment */
    async submitAssignment(assignmentId, studentId, file) {
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
        const validExtensions = {
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
        // Upload file to Supabase Storage
        const filePath = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${file.filename}`;
        const { error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(filePath, file.data, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (uploadError) {
            throw new UploadFailedError(uploadError.message);
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
    async getSubmissionHistory(assignmentId, studentId) {
        const submissions = await this.submissionRepo.getSubmissionHistory(assignmentId, studentId);
        return submissions.map((s) => toSubmissionDTO(s));
    }
    /** Get all submissions for an assignment */
    async getAssignmentSubmissions(assignmentId, latestOnly = true) {
        const submissions = await this.submissionRepo.getSubmissionsWithStudentInfo(assignmentId, latestOnly);
        return submissions.map((s) => toSubmissionDTO(s.submission, {
            studentName: s.studentName,
            studentUsername: s.studentUsername,
        }));
    }
    /** Get all submissions by a student */
    async getStudentSubmissions(studentId, latestOnly = true) {
        const submissions = await this.submissionRepo.getSubmissionsByStudent(studentId, latestOnly);
        return submissions.map((s) => toSubmissionDTO(s));
    }
    /** Get file download URL */
    async getFileDownloadUrl(filePath, expiresIn = 3600) {
        const { data } = await supabase.storage
            .from('submissions')
            .createSignedUrl(filePath, expiresIn);
        return data?.signedUrl ?? '';
    }
};
SubmissionService = __decorate([
    injectable(),
    __param(0, inject('SubmissionRepository')),
    __param(1, inject('AssignmentRepository')),
    __param(2, inject('EnrollmentRepository')),
    __param(3, inject('ClassRepository')),
    __metadata("design:paramtypes", [SubmissionRepository,
        AssignmentRepository,
        EnrollmentRepository,
        ClassRepository])
], SubmissionService);
export { SubmissionService };
//# sourceMappingURL=submission.service.js.map