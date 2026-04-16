import type { NotificationType } from "@/modules/notifications/notification.schema.js"
import {
  assignmentCreatedEmailTemplate,
  submissionGradedEmailTemplate,
  submissionFeedbackGivenEmailTemplate,
  classAnnouncementEmailTemplate,
  deadlineReminderEmailTemplate,
  enrollmentConfirmedEmailTemplate,
  assignmentUpdatedEmailTemplate,
  newSubmissionReceivedEmailTemplate,
  lateSubmissionReceivedEmailTemplate,
  similarityDetectedEmailTemplate,
  studentEnrolledEmailTemplate,
  studentUnenrolledEmailTemplate,
  newUserRegisteredEmailTemplate,
  teacherApprovedEmailTemplate,
  removedFromClassEmailTemplate,
} from "@/services/email/templates.js"

// ============================================================================
// Notification Payload Types (Discriminated Union)
// ============================================================================

/** Payload for ASSIGNMENT_CREATED notification */
export interface AssignmentCreatedPayload {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  dueDate: string
  assignmentUrl: string
}

/** Payload for SUBMISSION_GRADED notification */
export interface SubmissionGradedPayload {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  grade: number
  maxGrade: number
  submissionUrl: string
  reason?: "similarity_deduction"
  previousGrade?: number
  deductedPoints?: number
}

/** Payload for SUBMISSION_FEEDBACK_GIVEN notification */
export interface SubmissionFeedbackGivenPayload {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  teacherName: string
  submissionUrl: string
}

/** Payload for CLASS_ANNOUNCEMENT notification */
export interface ClassAnnouncementPayload {
  classId: number
  className: string
  message: string
}

/** Payload for DEADLINE_REMINDER notification */
export interface DeadlineReminderPayload {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  assignmentUrl: string
}

/** Payload for ENROLLMENT_CONFIRMED notification */
export interface EnrollmentConfirmedPayload {
  classId: number
  className: string
  enrollmentId: number
  instructorName: string
  classUrl: string
}

/** Payload for ASSIGNMENT_UPDATED notification (student) */
export interface AssignmentUpdatedPayload {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  dueDate: string
  assignmentUrl: string
}

/** Payload for NEW_SUBMISSION_RECEIVED notification (teacher) */
export interface NewSubmissionReceivedPayload {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  studentName: string
  className: string
  classId: number
  submissionUrl: string
}

/** Payload for LATE_SUBMISSION_RECEIVED notification (teacher) */
export interface LateSubmissionReceivedPayload {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  studentName: string
  className: string
  classId: number
  submissionUrl: string
  submittedAt: string
  dueDate: string
}

/** Payload for SIMILARITY_DETECTED notification (teacher) */
export interface SimilarityDetectedPayload {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  studentName: string
  similarityPercentage: number
  submissionUrl: string
}

/** Payload for STUDENT_ENROLLED notification (teacher) */
export interface StudentEnrolledPayload {
  classId: number
  className: string
  studentName: string
  studentEmail: string
}

/** Payload for STUDENT_UNENROLLED notification (teacher) */
export interface StudentUnenrolledPayload {
  classId: number
  className: string
  studentName: string
  studentEmail: string
}

/** Payload for NEW_USER_REGISTERED notification (admin) */
export interface NewUserRegisteredPayload {
  userId: number
  userName: string
  userEmail: string
  userRole: string
}

/** Payload for TEACHER_APPROVED notification (teacher email only) */
export interface TeacherApprovedPayload {
  teacherName: string
  loginUrl: string
}

/** Payload for REMOVED_FROM_CLASS notification (student) */
export interface RemovedFromClassPayload {
  classId: number
  className: string
  instructorName: string
}

/**
 * Maps each NotificationType to its specific payload shape.
 * This creates a discriminated union ensuring type safety across the notification system.
 */
export type NotificationDataByType = {
  ASSIGNMENT_CREATED: AssignmentCreatedPayload
  SUBMISSION_GRADED: SubmissionGradedPayload
  SUBMISSION_FEEDBACK_GIVEN: SubmissionFeedbackGivenPayload
  CLASS_ANNOUNCEMENT: ClassAnnouncementPayload
  DEADLINE_REMINDER: DeadlineReminderPayload
  ENROLLMENT_CONFIRMED: EnrollmentConfirmedPayload
  ASSIGNMENT_UPDATED: AssignmentUpdatedPayload
  NEW_SUBMISSION_RECEIVED: NewSubmissionReceivedPayload
  LATE_SUBMISSION_RECEIVED: LateSubmissionReceivedPayload
  SIMILARITY_DETECTED: SimilarityDetectedPayload
  STUDENT_ENROLLED: StudentEnrolledPayload
  STUDENT_UNENROLLED: StudentUnenrolledPayload
  NEW_USER_REGISTERED: NewUserRegisteredPayload
  TEACHER_APPROVED: TeacherApprovedPayload
  REMOVED_FROM_CLASS: RemovedFromClassPayload
}

/**
 * Metadata stored with each notification.
 * For rich metadata, we persist the full payload for the notification type.
 */
export type NotificationMetadataByType = NotificationDataByType

/** Supported notification delivery channels */
export type NotificationChannel = "EMAIL" | "IN_APP"

/**
 * Helper type to get the payload for a specific notification type.
 * This ensures that when you use a notification type, you get the correct payload type.
 *
 * @example
 * type AssignmentData = PayloadFor<"ASSIGNMENT_CREATED">; // AssignmentCreatedPayload
 */
export type PayloadFor<T extends NotificationType> = NotificationDataByType[T]

// ============================================================================
// Notification Type Configuration
// ============================================================================

/**
 * Configuration for a notification type.
 * Defines how notifications of this type should be rendered and delivered.
 *
 * @template T - The specific notification type literal
 */
export interface NotificationTypeConfig<T extends NotificationType> {
  /** The notification type identifier (literal type for discrimination) */
  type: T

  /** Template function for generating the notification title */
  titleTemplate: (data: NotificationDataByType[T]) => string

  /** Template function for generating the notification message */
  messageTemplate: (data: NotificationDataByType[T]) => string

  /** Optional template function for generating email HTML content */
  emailTemplate?: (data: NotificationDataByType[T]) => string

  /** Delivery channels for this notification type */
  channels: NotificationChannel[]

  /** Function to extract metadata from the data */
  metadata: (data: NotificationDataByType[T]) => NotificationMetadataByType[T]
}

/**
 * Registry of all notification types.
 * Each type defines how notifications should be created and delivered.
 * The type system ensures that each notification type has the correct payload type.
 */
export const NOTIFICATION_TYPES: {
  [K in NotificationType]: NotificationTypeConfig<K>
} = {
  ASSIGNMENT_CREATED: {
    type: "ASSIGNMENT_CREATED",
    titleTemplate: (data) => `${data.className}: New Assignment Posted`,
    messageTemplate: (data) =>
      `Your teacher has posted a new assignment "${data.assignmentTitle}" in ${data.className}, due on ${data.dueDate}.`,
    emailTemplate: (data) => assignmentCreatedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      className: data.className,
      classId: data.classId,
      dueDate: data.dueDate,
      assignmentUrl: data.assignmentUrl,
    }),
  },

  SUBMISSION_GRADED: {
    type: "SUBMISSION_GRADED",
    titleTemplate: (data) =>
      data.reason === "similarity_deduction"
        ? "Score Updated After Similarity Review"
        : "Assignment Graded",
    messageTemplate: (data) =>
      data.reason === "similarity_deduction"
        ? `Your submission for "${data.assignmentTitle}" was reviewed for similarity and your score changed from ${data.previousGrade}/${data.maxGrade} to ${data.grade}/${data.maxGrade}.`
        : `Your submission for "${data.assignmentTitle}" has been graded. Score: ${data.grade}/${data.maxGrade}`,
    emailTemplate: (data) => submissionGradedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      submissionId: data.submissionId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      grade: data.grade,
      maxGrade: data.maxGrade,
      submissionUrl: data.submissionUrl,
      reason: data.reason,
      previousGrade: data.previousGrade,
      deductedPoints: data.deductedPoints,
    }),
  },

  SUBMISSION_FEEDBACK_GIVEN: {
    type: "SUBMISSION_FEEDBACK_GIVEN",
    titleTemplate: () => "New Feedback on Your Submission",
    messageTemplate: (data) =>
      `${data.teacherName} left feedback on your submission for "${data.assignmentTitle}".`,
    emailTemplate: (data) => submissionFeedbackGivenEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      submissionId: data.submissionId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      teacherName: data.teacherName,
      submissionUrl: data.submissionUrl,
    }),
  },

  CLASS_ANNOUNCEMENT: {
    type: "CLASS_ANNOUNCEMENT",
    titleTemplate: (data) => `Announcement: ${data.className}`,
    messageTemplate: (data) => data.message,
    emailTemplate: (data) => classAnnouncementEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      message: data.message,
    }),
  },

  DEADLINE_REMINDER: {
    type: "DEADLINE_REMINDER",
    titleTemplate: () => "Assignment Deadline Reminder",
    messageTemplate: (data) =>
      `Don't forget! "${data.assignmentTitle}" is due on ${data.dueDate}.`,
    emailTemplate: (data) => deadlineReminderEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      dueDate: data.dueDate,
      assignmentUrl: data.assignmentUrl,
    }),
  },

  ENROLLMENT_CONFIRMED: {
    type: "ENROLLMENT_CONFIRMED",
    titleTemplate: (data) => `Enrolled in ${data.className}`,
    messageTemplate: (data) =>
      `You have been successfully enrolled in ${data.className}.`,
    emailTemplate: (data) => enrollmentConfirmedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      enrollmentId: data.enrollmentId,
      instructorName: data.instructorName,
      classUrl: data.classUrl,
    }),
  },

  ASSIGNMENT_UPDATED: {
    type: "ASSIGNMENT_UPDATED",
    titleTemplate: (data) => `${data.className}: Assignment Updated`,
    messageTemplate: (data) =>
      `The assignment "${data.assignmentTitle}" in ${data.className} has been updated. Due: ${data.dueDate}.`,
    emailTemplate: (data) => assignmentUpdatedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      className: data.className,
      classId: data.classId,
      dueDate: data.dueDate,
      assignmentUrl: data.assignmentUrl,
    }),
  },

  NEW_SUBMISSION_RECEIVED: {
    type: "NEW_SUBMISSION_RECEIVED",
    titleTemplate: (data) => `New Submission: ${data.assignmentTitle}`,
    messageTemplate: (data) =>
      `${data.studentName} submitted "${data.assignmentTitle}" in ${data.className}.`,
    emailTemplate: (data) => newSubmissionReceivedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      submissionId: data.submissionId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      studentName: data.studentName,
      className: data.className,
      classId: data.classId,
      submissionUrl: data.submissionUrl,
    }),
  },

  LATE_SUBMISSION_RECEIVED: {
    type: "LATE_SUBMISSION_RECEIVED",
    titleTemplate: (data) => `Late Submission: ${data.assignmentTitle}`,
    messageTemplate: (data) =>
      `${data.studentName} submitted "${data.assignmentTitle}" late in ${data.className}. Due: ${data.dueDate}, Submitted: ${data.submittedAt}.`,
    emailTemplate: (data) => lateSubmissionReceivedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      submissionId: data.submissionId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      studentName: data.studentName,
      className: data.className,
      classId: data.classId,
      submissionUrl: data.submissionUrl,
      submittedAt: data.submittedAt,
      dueDate: data.dueDate,
    }),
  },

  SIMILARITY_DETECTED: {
    type: "SIMILARITY_DETECTED",
    titleTemplate: (data) => `Similarity Alert: ${data.assignmentTitle}`,
    messageTemplate: (data) =>
      `High similarity (${String(data.similarityPercentage)}%) detected for ${data.studentName}'s submission in "${data.assignmentTitle}" (${data.className}).`,
    emailTemplate: (data) => similarityDetectedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      className: data.className,
      classId: data.classId,
      studentName: data.studentName,
      similarityPercentage: data.similarityPercentage,
      submissionUrl: data.submissionUrl,
    }),
  },

  STUDENT_ENROLLED: {
    type: "STUDENT_ENROLLED",
    titleTemplate: (data) => `New Student in ${data.className}`,
    messageTemplate: (data) =>
      `${data.studentName} (${data.studentEmail}) has enrolled in ${data.className}.`,
    emailTemplate: (data) => studentEnrolledEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
    }),
  },

  STUDENT_UNENROLLED: {
    type: "STUDENT_UNENROLLED",
    titleTemplate: (data) => `Student Left ${data.className}`,
    messageTemplate: (data) =>
      `${data.studentName} (${data.studentEmail}) has left ${data.className}.`,
    emailTemplate: (data) => studentUnenrolledEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
    }),
  },

  NEW_USER_REGISTERED: {
    type: "NEW_USER_REGISTERED",
    titleTemplate: () => "Teacher Approval Required",
    messageTemplate: (data) =>
      `${data.userName} (${data.userEmail}) registered as a teacher and is awaiting administrator approval.`,
    emailTemplate: (data) => newUserRegisteredEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      userRole: data.userRole,
    }),
  },

  TEACHER_APPROVED: {
    type: "TEACHER_APPROVED",
    titleTemplate: () => "Teacher Account Approved",
    messageTemplate: () =>
      "Your account has been approved by the administrator. You may now sign in to the system.",
    emailTemplate: (data) => teacherApprovedEmailTemplate(data),
    channels: ["EMAIL"],
    metadata: (data) => ({
      teacherName: data.teacherName,
      loginUrl: data.loginUrl,
    }),
  },

  REMOVED_FROM_CLASS: {
    type: "REMOVED_FROM_CLASS",
    titleTemplate: (data) => `Removed from ${data.className}`,
    messageTemplate: (data) =>
      `You have been removed from ${data.className} by ${data.instructorName}.`,
    emailTemplate: (data) => removedFromClassEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      instructorName: data.instructorName,
    }),
  },
}
