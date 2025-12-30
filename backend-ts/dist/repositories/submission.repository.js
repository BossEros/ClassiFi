var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { eq, and, desc, sql } from 'drizzle-orm';
import { submissions, users } from '@/models/index.js';
import { BaseRepository } from '@/repositories/base.repository.js';
import { injectable } from 'tsyringe';
/**
 * Repository for submission-related database operations.
 */
let SubmissionRepository = class SubmissionRepository extends BaseRepository {
    constructor() {
        super(submissions);
    }
    /** Get a submission by ID */
    async getSubmissionById(submissionId) {
        return await this.findById(submissionId);
    }
    /** Get all submissions for an assignment */
    async getSubmissionsByAssignment(assignmentId, latestOnly = true) {
        if (latestOnly) {
            return await this.db
                .select()
                .from(submissions)
                .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.isLatest, true)))
                .orderBy(desc(submissions.submittedAt));
        }
        return await this.db
            .select()
            .from(submissions)
            .where(eq(submissions.assignmentId, assignmentId))
            .orderBy(desc(submissions.submittedAt));
    }
    /** Get all submissions by a student */
    async getSubmissionsByStudent(studentId, latestOnly = true) {
        if (latestOnly) {
            return await this.db
                .select()
                .from(submissions)
                .where(and(eq(submissions.studentId, studentId), eq(submissions.isLatest, true)))
                .orderBy(desc(submissions.submittedAt));
        }
        return await this.db
            .select()
            .from(submissions)
            .where(eq(submissions.studentId, studentId))
            .orderBy(desc(submissions.submittedAt));
    }
    /** Get submission history for a student-assignment pair */
    async getSubmissionHistory(assignmentId, studentId) {
        return await this.db
            .select()
            .from(submissions)
            .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)))
            .orderBy(submissions.submissionNumber);
    }
    /** Get the latest submission for a student-assignment pair */
    async getLatestSubmission(assignmentId, studentId) {
        const results = await this.db
            .select()
            .from(submissions)
            .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId), eq(submissions.isLatest, true)))
            .limit(1);
        return results[0];
    }
    /** Get submission count for a student-assignment pair */
    async getSubmissionCount(assignmentId, studentId) {
        const result = await this.db
            .select({ count: sql `count(*)` })
            .from(submissions)
            .where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentId, studentId)));
        return Number(result[0]?.count ?? 0);
    }
    /** Create a new submission */
    async createSubmission(data) {
        // Mark previous submission as not latest
        await this.db
            .update(submissions)
            .set({ isLatest: false })
            .where(and(eq(submissions.assignmentId, data.assignmentId), eq(submissions.studentId, data.studentId)));
        // Create new submission
        const results = await this.db
            .insert(submissions)
            .values({
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
            submissionNumber: data.submissionNumber,
            isLatest: true,
        })
            .returning();
        return results[0];
    }
    /** Get submissions with student info for an assignment */
    async getSubmissionsWithStudentInfo(assignmentId, latestOnly = true) {
        const query = this.db
            .select({
            submission: submissions,
            studentName: sql `concat(${users.firstName}, ' ', ${users.lastName})`,
            studentUsername: users.username,
        })
            .from(submissions)
            .innerJoin(users, eq(submissions.studentId, users.id))
            .where(latestOnly
            ? and(eq(submissions.assignmentId, assignmentId), eq(submissions.isLatest, true))
            : eq(submissions.assignmentId, assignmentId))
            .orderBy(desc(submissions.submittedAt));
        return await query;
    }
};
SubmissionRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [])
], SubmissionRepository);
export { SubmissionRepository };
//# sourceMappingURL=submission.repository.js.map