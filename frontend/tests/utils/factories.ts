/**
 * Test Data Factories
 *
 * Factory functions for creating consistent mock data across tests.
 * Follows the same pattern as backend test factories.
 *
 * Each factory creates a valid default object that can be customized
 * via the overrides parameter.
 */
import type { User, UserRole } from "@/shared/types/auth";
import type {
  Class,
  Assignment,
  EnrolledStudent,
  ISODateString,
  Schedule,
} from "@/shared/types/class";
import type { Submission } from "@/shared/types/submission";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert a Date to an ISO 8601 formatted string.
 *
 * @param date - The date to convert.
 * @returns The ISO 8601 formatted string as an `ISODateString`.
 */
function toISO(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

// ============================================================================
// User Factories
// ============================================================================

/**
 * Create a mock student User object with sensible default fields.
 *
 * @param overrides - Partial `User` properties that will be merged over the defaults
 * @returns A `User` object representing a student with the provided overrides applied
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user-1",
    email: "student@example.com",
    firstName: "Test",
    lastName: "Student",
    role: "student" as UserRole,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock teacher user.
 *
 * @param overrides - Partial fields to merge into the default mock user
 * @returns A teacher User with default properties overridden by `overrides`
 */
export function createMockTeacher(overrides?: Partial<User>): User {
  return {
    id: "user-2",
    email: "teacher@example.com",
    firstName: "Test",
    lastName: "Teacher",
    role: "teacher" as UserRole,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock admin user for tests.
 *
 * @param overrides - Partial fields to override on the default admin user
 * @returns A `User` object representing an admin with default values merged with `overrides`
 */
export function createMockAdmin(overrides?: Partial<User>): User {
  return {
    id: "user-3",
    email: "admin@example.com",
    firstName: "Test",
    lastName: "Admin",
    role: "admin" as UserRole,
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Class Factories
// ============================================================================

/**
 * Create a default schedule object for tests.
 *
 * @param overrides - Partial schedule fields to override the defaults
 * @returns A schedule with default days and times, with any provided overrides applied
 */
export function createMockSchedule(overrides?: Partial<Schedule>): Schedule {
  return {
    days: ["monday", "wednesday", "friday"],
    startTime: "09:00",
    endTime: "10:30",
    ...overrides,
  };
}

/**
 * Creates a mock class object for tests.
 *
 * @param overrides - Partial properties to override the default mock values
 * @returns A `Class` object populated with sensible defaults and any provided overrides
 */
export function createMockClass(overrides?: Partial<Class>): Class {
  return {
    id: 1,
    teacherId: 2,
    className: "Introduction to Programming",
    classCode: "CS101",
    description: "Learn the fundamentals of programming",
    isActive: true,
    createdAt: toISO(new Date()),
    yearLevel: 1,
    semester: 1,
    academicYear: "2024-2025",
    schedule: createMockSchedule(),
    ...overrides,
  };
}

/**
 * Generates an array of mock Class objects with sequential ids, names, and codes.
 *
 * @param count - Number of mock classes to create
 * @returns An array of `Class` objects of length `count` with incremental `id`, `className`, and `classCode`
 */
export function createMockClasses(count: number): Class[] {
  return Array.from({ length: count }, (_, i) =>
    createMockClass({
      id: i + 1,
      className: `Class ${i + 1}`,
      classCode: `CLS${String(i + 1).padStart(3, "0")}`,
    }),
  );
}

// ============================================================================
// Assignment Factories
// ============================================================================

/**
 * Create a mock Assignment object with sensible defaults and optional overrides.
 *
 * @param overrides - Partial assignment fields to merge on top of the defaults
 * @returns A mock Assignment with default properties, with any `overrides` applied
 */
export function createMockAssignment(
  overrides?: Partial<Assignment>,
): Assignment {
  const now = new Date();
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return {
    id: 1,
    classId: 1,
    assignmentName: "Hello World Assignment",
    deadline: toISO(deadline),
    programmingLanguage: "python",
    description: "Write a program that prints Hello World",
    allowResubmission: true,
    isActive: true,
    createdAt: toISO(now),
    totalScore: 100,
    ...overrides,
  };
}

/**
 * Generate a mock Assignment object whose deadline is set to one day in the past.
 *
 * @param overrides - Optional partial fields to override the default assignment values
 * @returns An Assignment with its `deadline` set to one day before now; any provided `overrides` are applied over the defaults
 */
export function createMockPastDueAssignment(
  overrides?: Partial<Assignment>,
): Assignment {
  const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

  return createMockAssignment({
    deadline: toISO(pastDeadline),
    ...overrides,
  });
}

/**
 * Generate a mock assignment with a default deadline 6 hours from now.
 *
 * @param overrides - Partial fields to override the default assignment values
 * @returns An `Assignment` object whose `deadline` is an ISO string 6 hours from now unless overridden
 */
export function createMockUrgentAssignment(
  overrides?: Partial<Assignment>,
): Assignment {
  const urgentDeadline = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

  return createMockAssignment({
    deadline: toISO(urgentDeadline),
    ...overrides,
  });
}

// ============================================================================
// Enrolled Student Factories
// ============================================================================

/**
 * Create a default mock enrolled student for tests.
 *
 * @param overrides - Partial properties to override the default enrolled student fields
 * @returns An `EnrolledStudent` object populated with sensible defaults, with any provided `overrides` applied
 */
export function createMockEnrolledStudent(
  overrides?: Partial<EnrolledStudent>,
): EnrolledStudent {
  return {
    id: 1,
    firstName: "Enrolled",
    lastName: "Student",
    email: "enrolled@example.com",
    avatarUrl: null,
    enrolledAt: toISO(new Date()),
    fullName: "Enrolled Student",
    ...overrides,
  };
}

// ============================================================================
// Submission Factories
// ============================================================================

/**
 * Generate a mock Submission populated with sensible default values.
 *
 * @param overrides - Partial fields to override the default submission properties
 * @returns A Submission with default properties; any fields present in `overrides` replace the defaults
 */
export function createMockSubmission(
  overrides?: Partial<Submission>,
): Submission {
  return {
    id: 1,
    assignmentId: 1,
    studentId: 1,
    fileName: "solution.py",
    fileSize: 1024,
    submissionNumber: 1,
    submittedAt: toISO(new Date()),
    isLatest: true,
    ...overrides,
  };
}

/**
 * Creates a mock graded submission.
 *
 * @param overrides - Optional partial submission fields to override the defaults
 * @returns A mock Submission with a default `grade` of 95; any fields in `overrides` replace the defaults
 */
export function createMockGradedSubmission(
  overrides?: Partial<Submission>,
): Submission {
  return createMockSubmission({
    grade: 95,
    ...overrides,
  });
}

/**
 * Creates a mock submission marked as not the latest.
 *
 * @param overrides - Optional partial Submission fields to override the defaults
 * @returns A `Submission` object with `isLatest` set to `false` and `submissionNumber` set to `1`, merged with any provided overrides
 */
export function createMockOlderSubmission(
  overrides?: Partial<Submission>,
): Submission {
  return createMockSubmission({
    isLatest: false,
    submissionNumber: 1,
    ...overrides,
  });
}

// ============================================================================
// Auth Response Factories
// ============================================================================

/**
 * Create a successful authentication response object containing a mock token and user.
 *
 * @param userOverrides - Partial user fields to override the generated mock user
 * @returns An object with `success: true`, a mock `token` string, and a `user` object
 */
export function createMockAuthResponse(userOverrides?: Partial<User>) {
  return {
    success: true as const,
    token: "mock-jwt-token",
    user: createMockUser(userOverrides),
  };
}

/**
 * Creates an authentication failure response object.
 *
 * @param message - Error message to include in the response; defaults to "Invalid credentials".
 * @returns An object with `success: false` and the provided `message`.
 */
export function createMockAuthError(message = "Invalid credentials") {
  return {
    success: false as const,
    message,
  };
}

// ============================================================================
// Validation Factories
// ============================================================================

/**
 * Create a validation result representing a failed validation with field-specific errors.
 *
 * @param errors - Array of objects describing validation failures; each item has `field` and `message` properties
 * @returns An object with `isValid` set to `false` and the supplied `errors` array
 */
export function createMockValidationError(
  errors: Array<{ field: string; message: string }>,
) {
  return {
    isValid: false as const,
    errors,
  };
}

/**
 * Creates a validation result marked as valid.
 *
 * @returns An object with `isValid: true` and an empty `errors` array
 */
export function createMockValidationSuccess() {
  return {
    isValid: true as const,
    errors: [],
  };
}

// ============================================================================
// API Response Factories
// ============================================================================

/**
 * Create a successful API response wrapper.
 *
 * @param data - The payload to include in the response
 * @returns An object with `data` set to the provided payload and `error` set to `null`
 */
export function createMockApiSuccess<T>(data: T) {
  return {
    data,
    error: null,
  };
}

/**
 * Create a failed API response wrapper with the provided error message.
 *
 * @param error - Error message describing the failure
 * @returns An object with `data` set to `null` and `error` set to the provided message
 */
export function createMockApiError(error: string) {
  return {
    data: null,
    error,
  };
}