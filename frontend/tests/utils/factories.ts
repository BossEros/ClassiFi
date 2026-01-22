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
 * Creates an ISO date string (branded type).
 */
function toISO(date: Date): ISODateString {
  return date.toISOString() as ISODateString;
}

// ============================================================================
// User Factories
// ============================================================================

/**
 * Creates a mock student user.
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
 * Creates a mock admin user.
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
 * Creates a default schedule.
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
 * Creates a mock class.
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
 * Creates multiple mock classes.
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
 * Creates a mock assignment.
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
 * Creates a mock assignment with a past deadline.
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
 * Creates a mock assignment due soon (within 24 hours).
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
 * Creates a mock enrolled student.
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
 * Creates a mock submission.
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
 * Creates a mock submission that is not the latest.
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
 * Creates a successful auth response.
 */
export function createMockAuthResponse(userOverrides?: Partial<User>) {
  return {
    success: true as const,
    token: "mock-jwt-token",
    user: createMockUser(userOverrides),
  };
}

/**
 * Creates a failed auth response.
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
 * Creates a validation error response.
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
 * Creates a successful validation response.
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
 * Creates a successful API response wrapper.
 */
export function createMockApiSuccess<T>(data: T) {
  return {
    data,
    error: null,
  };
}

/**
 * Creates a failed API response wrapper.
 */
export function createMockApiError(error: string) {
  return {
    data: null,
    error,
  };
}
