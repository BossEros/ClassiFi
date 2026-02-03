/**
 * Configuration for a notification type.
 * Defines how notifications of this type should be rendered and delivered.
 */
export interface NotificationTypeConfig {
    /** The notification type identifier */
    type: string; 

    /** Template function for generating the notification title */
    titleTemplate: (data: any) => string;

    /** Template function for generating the notification message */
    messageTemplate: (data: any) => string;

    /** Optional template function for generating email HTML content */
    emailTemplate?: (data: any) => string;

    /** Delivery channels for this notification type */
    channels: ("EMAIL" | "IN_APP")[];

    /** Optional function to extract metadata from the data */
    metadata?: (data: any) => Record<string, any>;
}

/**
 * Registry of all notification types.
 * Each type defines how notifications should be created and delivered.
 */
export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
    ASSIGNMENT_CREATED: {
        type: "ASSIGNMENT_CREATED",
        titleTemplate: (data) => `New Assignment: ${data.assignmentTitle}`,
        messageTemplate: (data) =>
            `Your teacher has created a new assignment "${data.assignmentTitle}" due on ${data.dueDate}.`,
        emailTemplate: (data) => `
      <h2>New Assignment Posted</h2>
      <p>Your teacher has created a new assignment in ${data.className}.</p>
      <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      <p><a href="${data.assignmentUrl}">View Assignment</a></p>
    `,
        channels: ["EMAIL", "IN_APP"],
        metadata: (data) => ({
            assignmentId: data.assignmentId,
            classId: data.classId,
            dueDate: data.dueDate,
        }),
    },

    SUBMISSION_GRADED: {
        type: "SUBMISSION_GRADED",
        titleTemplate: (data) => `Assignment Graded: ${data.assignmentTitle}`,
        messageTemplate: (data) =>
            `Your submission for "${data.assignmentTitle}" has been graded. Score: ${data.grade}/${data.maxGrade}`,
        emailTemplate: (data) => `
      <h2>Your Assignment Has Been Graded</h2>
      <p>Your submission for "${data.assignmentTitle}" has been graded.</p>
      <p><strong>Score:</strong> ${data.grade}/${data.maxGrade}</p>
      <p><a href="${data.submissionUrl}">View Submission</a></p>
    `,
        channels: ["EMAIL", "IN_APP"],
        metadata: (data) => ({
            submissionId: data.submissionId,
            assignmentId: data.assignmentId,
            grade: data.grade,
            maxGrade: data.maxGrade,
        }),
    },

    CLASS_ANNOUNCEMENT: {
        type: "CLASS_ANNOUNCEMENT",
        titleTemplate: (data) => `Announcement: ${data.className}`,
        messageTemplate: (data) => data.message,
        emailTemplate: (data) => `
      <h2>Class Announcement</h2>
      <p><strong>Class:</strong> ${data.className}</p>
      <p>${data.message}</p>
    `,
        channels: ["EMAIL", "IN_APP"],
        metadata: (data) => ({
            classId: data.classId,
        }),
    },

    DEADLINE_REMINDER: {
        type: "DEADLINE_REMINDER",
        titleTemplate: (data) => `Reminder: ${data.assignmentTitle} Due Soon`,
        messageTemplate: (data) =>
            `Don't forget! "${data.assignmentTitle}" is due on ${data.dueDate}.`,
        emailTemplate: (data) => `
      <h2>Assignment Deadline Reminder</h2>
      <p>This is a reminder that your assignment is due soon.</p>
      <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      <p><a href="${data.assignmentUrl}">View Assignment</a></p>
    `,
        channels: ["EMAIL", "IN_APP"],
        metadata: (data) => ({
            assignmentId: data.assignmentId,
            dueDate: data.dueDate,
        }),
    },

    ENROLLMENT_CONFIRMED: {
        type: "ENROLLMENT_CONFIRMED",
        titleTemplate: (data) => `Enrolled in ${data.className}`,
        messageTemplate: (data) =>
            `You have been successfully enrolled in ${data.className}.`,
        emailTemplate: (data) => `
      <h2>Enrollment Confirmed</h2>
      <p>You have been successfully enrolled in <strong>${data.className}</strong>.</p>
      <p><strong>Instructor:</strong> ${data.instructorName}</p>
      <p><a href="${data.classUrl}">View Class</a></p>
    `,
        channels: ["EMAIL", "IN_APP"],
        metadata: (data) => ({
            classId: data.classId,
            enrollmentId: data.enrollmentId,
        }),
    },
};
