import { SubmissionRepository, AssignmentRepository, EnrollmentRepository, ClassRepository } from '../repositories/index.js';
import { supabase } from '../shared/supabase.js';

/**
 * Business logic for submission-related operations.
 */
export class SubmissionService {
    private submissionRepo: SubmissionRepository;
    private assignmentRepo: AssignmentRepository;
    private enrollmentRepo: EnrollmentRepository;
    private classRepo: ClassRepository;

    constructor() {
        this.submissionRepo = new SubmissionRepository();
        this.assignmentRepo = new AssignmentRepository();
        this.enrollmentRepo = new EnrollmentRepository();
        this.classRepo = new ClassRepository();
    }

    /** Submit an assignment */
    async submitAssignment(
        assignmentId: number,
        studentId: number,
        file: { filename: string; data: Buffer; mimetype: string }
    ): Promise<{ success: boolean; message: string; submission?: any }> {
        try {
            // Validate assignment exists and is active
            const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);

            if (!assignment) {
                return { success: false, message: 'Assignment not found' };
            }

            if (!assignment.isActive) {
                return { success: false, message: 'Assignment is no longer active' };
            }

            // Check deadline
            const now = new Date();
            if (assignment.deadline && now > assignment.deadline) {
                return { success: false, message: 'Assignment deadline has passed' };
            }

            // Check if student is enrolled in the class
            const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, assignment.classId);
            if (!isEnrolled) {
                return { success: false, message: 'Student is not enrolled in this class' };
            }

            // Check for existing submission
            const existingSubmission = await this.submissionRepo.getLatestSubmission(assignmentId, studentId);

            if (existingSubmission && !assignment.allowResubmission) {
                return { success: false, message: 'Resubmission is not allowed for this assignment' };
            }

            // Validate file extension
            const extension = file.filename.split('.').pop()?.toLowerCase();
            const validExtensions: Record<string, string[]> = {
                python: ['py'],
                java: ['java'],
            };

            const allowedExtensions = validExtensions[assignment.programmingLanguage] ?? [];
            if (!extension || !allowedExtensions.includes(extension)) {
                return {
                    success: false,
                    message: `Invalid file type. Expected ${allowedExtensions.join(' or ')} for ${assignment.programmingLanguage}`,
                };
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.data.length > maxSize) {
                return { success: false, message: 'File size exceeds 10MB limit' };
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
                return { success: false, message: `File upload failed: ${uploadError.message}` };
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

            return {
                success: true,
                message: 'Assignment submitted successfully',
                submission: {
                    id: submission.id,
                    assignmentId: submission.assignmentId,
                    studentId: submission.studentId,
                    fileName: submission.fileName,
                    filePath: submission.filePath,
                    fileSize: submission.fileSize,
                    submissionNumber: submission.submissionNumber,
                    submittedAt: submission.submittedAt?.toISOString(),
                    isLatest: submission.isLatest,
                },
            };
        } catch (error) {
            console.error('Submission error:', error);
            return { success: false, message: 'Failed to submit assignment' };
        }
    }

    /** Get submission history for a student-assignment pair */
    async getSubmissionHistory(
        assignmentId: number,
        studentId: number
    ): Promise<{ success: boolean; message: string; submissions: any[] }> {
        try {
            const submissions = await this.submissionRepo.getSubmissionHistory(assignmentId, studentId);

            return {
                success: true,
                message: 'Submission history retrieved successfully',
                submissions: submissions.map((s) => ({
                    id: s.id,
                    assignmentId: s.assignmentId,
                    studentId: s.studentId,
                    fileName: s.fileName,
                    filePath: s.filePath,
                    fileSize: s.fileSize,
                    submissionNumber: s.submissionNumber,
                    submittedAt: s.submittedAt?.toISOString(),
                    isLatest: s.isLatest,
                })),
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve submission history', submissions: [] };
        }
    }

    /** Get all submissions for an assignment */
    async getAssignmentSubmissions(
        assignmentId: number,
        latestOnly: boolean = true
    ): Promise<{ success: boolean; message: string; submissions: any[] }> {
        try {
            const submissions = await this.submissionRepo.getSubmissionsWithStudentInfo(assignmentId, latestOnly);

            return {
                success: true,
                message: 'Submissions retrieved successfully',
                submissions: submissions.map((s) => ({
                    id: s.submission.id,
                    assignmentId: s.submission.assignmentId,
                    studentId: s.submission.studentId,
                    fileName: s.submission.fileName,
                    filePath: s.submission.filePath,
                    fileSize: s.submission.fileSize,
                    submissionNumber: s.submission.submissionNumber,
                    submittedAt: s.submission.submittedAt?.toISOString(),
                    isLatest: s.submission.isLatest,
                    studentName: s.studentName,
                    studentUsername: s.studentUsername,
                })),
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve submissions', submissions: [] };
        }
    }

    /** Get all submissions by a student */
    async getStudentSubmissions(
        studentId: number,
        latestOnly: boolean = true
    ): Promise<{ success: boolean; message: string; submissions: any[] }> {
        try {
            const submissions = await this.submissionRepo.getSubmissionsByStudent(studentId, latestOnly);

            return {
                success: true,
                message: 'Submissions retrieved successfully',
                submissions: submissions.map((s) => ({
                    id: s.id,
                    assignmentId: s.assignmentId,
                    studentId: s.studentId,
                    fileName: s.fileName,
                    filePath: s.filePath,
                    fileSize: s.fileSize,
                    submissionNumber: s.submissionNumber,
                    submittedAt: s.submittedAt?.toISOString(),
                    isLatest: s.isLatest,
                })),
            };
        } catch (error) {
            return { success: false, message: 'Failed to retrieve submissions', submissions: [] };
        }
    }

    /** Get file download URL */
    async getFileDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        const { data } = await supabase.storage
            .from('submissions')
            .createSignedUrl(filePath, expiresIn);

        return data?.signedUrl ?? '';
    }
}
