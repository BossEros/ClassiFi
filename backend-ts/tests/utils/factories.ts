/**
 * Test Utilities and Factories
 * Helper functions for creating test data
 */
import type { User, Class, Assignment, Submission } from '../../src/models/index.js';

/** Create a mock user for testing */
export function createMockUser(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        supabaseUserId: 'test-supabase-id',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        createdAt: new Date(),
        updatedAt: null,
        ...overrides,
    };
}

/** Create a mock teacher for testing */
export function createMockTeacher(overrides: Partial<User> = {}): User {
    return createMockUser({
        id: 2,
        username: 'teacher1',
        email: 'teacher@example.com',
        firstName: 'Test',
        lastName: 'Teacher',
        role: 'teacher',
        ...overrides,
    });
}

/** Create a mock class for testing */
export function createMockClass(overrides: Partial<Class> = {}): Class {
    return {
        id: 1,
        teacherId: 2,
        className: 'Test Class',
        classCode: 'ABC123',
        description: 'A test class description',
        yearLevel: 1,
        semester: 1,
        academicYear: '2024-2025',
        schedule: { days: ['monday', 'wednesday'], startTime: '09:00', endTime: '10:30' },
        createdAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/** Create a mock assignment for testing */
export function createMockAssignment(overrides: Partial<Assignment> = {}): Assignment {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    return {
        id: 1,
        classId: 1,
        assignmentName: 'Test Assignment',
        description: 'Test assignment description',
        programmingLanguage: 'python',
        deadline,
        allowResubmission: true,
        maxAttempts: null,
        createdAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/** Create a mock submission for testing */
export function createMockSubmission(overrides: Partial<Submission> = {}): Submission {
    return {
        id: 1,
        assignmentId: 1,
        studentId: 1,
        fileName: 'solution.py',
        filePath: 'submissions/1/1/1_solution.py',
        fileSize: 1024,
        submissionNumber: 1,
        submittedAt: new Date(),
        isLatest: true,
        ...overrides,
    };
}

/** Create multiple mock users */
export function createMockUsers(count: number, role: 'student' | 'teacher' = 'student'): User[] {
    return Array.from({ length: count }, (_, i) =>
        createMockUser({
            id: i + 1,
            username: `${role}${i + 1}`,
            email: `${role}${i + 1}@example.com`,
            role,
        })
    );
}
