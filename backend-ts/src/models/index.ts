/**
 * Database Models Index
 * Re-exports all Drizzle ORM table definitions and types
 */

// User model
export { users, usersRelations, userRoleEnum } from "@/modules/users/user.model.js"
export type { User, NewUser } from "@/modules/users/user.model.js"

// Class model
export { classes, classesRelations } from "@/modules/classes/class.model.js"
export type { Class, NewClass, ClassSchedule } from "@/modules/classes/class.model.js"

// Assignment model
export {
  assignments,
  assignmentsRelations,
  programmingLanguageEnum,
} from "@/modules/assignments/assignment.model.js"

export type {
  Assignment,
  NewAssignment,
  LatePenaltyConfig,
} from "@/modules/assignments/assignment.model.js"

// Enrollment model
export { enrollments, enrollmentsRelations } from "@/modules/enrollments/enrollment.model.js"
export type { Enrollment, NewEnrollment } from "@/modules/enrollments/enrollment.model.js"

// Submission model
export { submissions, submissionsRelations } from "@/modules/submissions/submission.model.js"
export type { Submission, NewSubmission } from "@/modules/submissions/submission.model.js"

// Similarity Report model
export {
  similarityReports,
  similarityReportsRelations,
} from "@/modules/plagiarism/similarity-report.model.js"
export type {
  SimilarityReport,
  NewSimilarityReport,
} from "@/modules/plagiarism/similarity-report.model.js"

// Match Fragment model
export {
  matchFragments,
  matchFragmentsRelations,
} from "@/modules/plagiarism/match-fragment.model.js"
export type { MatchFragment, NewMatchFragment } from "@/modules/plagiarism/match-fragment.model.js"

// Similarity Result model
export {
  similarityResults,
  similarityResultsRelations,
} from "@/modules/plagiarism/similarity-result.model.js"
export type {
  SimilarityResult,
  NewSimilarityResult,
} from "@/modules/plagiarism/similarity-result.model.js"

// Test Case model
export { testCases, testCasesRelations } from "@/modules/test-cases/test-case.model.js"
export type { TestCase, NewTestCase } from "@/modules/test-cases/test-case.model.js"

// Test Result model
export { testResults, testResultsRelations } from "@/modules/test-cases/test-result.model.js"
export type { TestResult, NewTestResult } from "@/modules/test-cases/test-result.model.js"

// Notification model
export {
  notifications,
  notificationsRelations,
  notificationTypeEnum,
  notificationChannelEnum,
} from "@/modules/notifications/notification.model.js"
export type { Notification, NewNotification } from "@/modules/notifications/notification.model.js"
// Note: For type-safe notifications with discriminated metadata, use TypedNotification from "@/modules/notifications/notification.guard.js"

// Notification Delivery model
export {
  notificationDeliveries,
  notificationDeliveriesRelations,
  deliveryStatusEnum,
} from "@/modules/notifications/notification-delivery.model.js"
export type {
  NotificationDelivery,
  NewNotificationDelivery,
} from "@/modules/notifications/notification-delivery.model.js"

// Notification Preference model
export {
  notificationPreferences,
  notificationPreferencesRelations,
} from "@/modules/notifications/notification-preference.model.js"
export type {
  NotificationPreference,
  NewNotificationPreference,
} from "@/modules/notifications/notification-preference.model.js"
