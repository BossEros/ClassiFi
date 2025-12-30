/**
 * Database Models Index
 * Re-exports all Drizzle ORM table definitions and types
 */
export { users, usersRelations, userRoleEnum } from './user.model.js';
export type { User, NewUser } from './user.model.js';
export { classes, classesRelations } from './class.model.js';
export type { Class, NewClass, ClassSchedule } from './class.model.js';
export { assignments, assignmentsRelations, programmingLanguageEnum } from './assignment.model.js';
export type { Assignment, NewAssignment } from './assignment.model.js';
export { enrollments, enrollmentsRelations } from './enrollment.model.js';
export type { Enrollment, NewEnrollment } from './enrollment.model.js';
export { submissions, submissionsRelations } from './submission.model.js';
export type { Submission, NewSubmission } from './submission.model.js';
export { similarityReports, similarityReportsRelations } from './similarity-report.model.js';
export type { SimilarityReport, NewSimilarityReport } from './similarity-report.model.js';
export { similarityResults, similarityResultsRelations } from './similarity-result.model.js';
export type { SimilarityResult, NewSimilarityResult } from './similarity-result.model.js';
//# sourceMappingURL=index.d.ts.map