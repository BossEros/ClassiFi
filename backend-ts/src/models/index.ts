/**
 * Database Models Index
 * Re-exports all Drizzle ORM table definitions and types
 */

// User model
export { users, usersRelations, userRoleEnum } from './user.model.js';
export type { User, NewUser } from './user.model.js';

// Class model
export { classes, classesRelations } from './class.model.js';
export type { Class, NewClass, ClassSchedule } from './class.model.js';

// Assignment model
export { assignments, assignmentsRelations, programmingLanguageEnum } from './assignment.model.js';
export type { Assignment, NewAssignment } from './assignment.model.js';

// Enrollment model
export { enrollments, enrollmentsRelations } from './enrollment.model.js';
export type { Enrollment, NewEnrollment } from './enrollment.model.js';

// Submission model
export { submissions, submissionsRelations } from './submission.model.js';
export type { Submission, NewSubmission } from './submission.model.js';

// Similarity Report model
export { similarityReports, similarityReportsRelations } from './similarity-report.model.js';
export type { SimilarityReport, NewSimilarityReport } from './similarity-report.model.js';

// Similarity Result model
export { similarityResults, similarityResultsRelations } from './similarity-result.model.js';
export type { SimilarityResult, NewSimilarityResult } from './similarity-result.model.js';
