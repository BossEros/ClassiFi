/**
 * Database Models Index
 * Re-exports all Drizzle ORM table definitions and types
 */
// User model
export { users, usersRelations, userRoleEnum } from './user.model.js';
// Class model
export { classes, classesRelations } from './class.model.js';
// Assignment model
export { assignments, assignmentsRelations, programmingLanguageEnum } from './assignment.model.js';
// Enrollment model
export { enrollments, enrollmentsRelations } from './enrollment.model.js';
// Submission model
export { submissions, submissionsRelations } from './submission.model.js';
// Similarity Report model
export { similarityReports, similarityReportsRelations } from './similarity-report.model.js';
// Match Fragment model
export { matchFragments, matchFragmentsRelations } from './match-fragment.model.js';
// Similarity Result model
export { similarityResults, similarityResultsRelations } from './similarity-result.model.js';
//# sourceMappingURL=index.js.map