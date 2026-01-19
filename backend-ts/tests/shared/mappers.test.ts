/**
 * DTOs and Mappers Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
    toUserDTO,
    toClassDTO,
    toAssignmentDTO,
    toSubmissionDTO,
    toStudentDTO,
} from '../../src/shared/mappers.js';
import {
    createMockUser,
    createMockClass,
    createMockAssignment,
    createMockSubmission,
} from '../utils/factories.js';

describe('Mappers', () => {
    describe('toUserDTO', () => {
        it('should map user entity to DTO', () => {
            const user = createMockUser();
            const dto = toUserDTO(user);

            expect(dto.id).toBe(user.id);
            expect(dto.email).toBe(user.email);
            expect(dto.firstName).toBe(user.firstName);
            expect(dto.lastName).toBe(user.lastName);
            expect(dto.role).toBe(user.role);
            expect(dto.createdAt).toBeDefined();
        });
    });

    describe('toClassDTO', () => {
        it('should map class entity to DTO', () => {
            const classData = createMockClass();
            const dto = toClassDTO(classData);

            expect(dto.id).toBe(classData.id);
            expect(dto.className).toBe(classData.className);
            expect(dto.classCode).toBe(classData.classCode);
            expect(dto.teacherId).toBe(classData.teacherId);
        });

        it('should include extras when provided', () => {
            const classData = createMockClass();
            const dto = toClassDTO(classData, { studentCount: 25, teacherName: 'Dr. Smith' });

            expect(dto.studentCount).toBe(25);
            expect(dto.teacherName).toBe('Dr. Smith');
        });
    });

    describe('toAssignmentDTO', () => {
        it('should map assignment entity to DTO', () => {
            const assignment = createMockAssignment();
            const dto = toAssignmentDTO(assignment);

            expect(dto.id).toBe(assignment.id);
            expect(dto.assignmentName).toBe(assignment.assignmentName);
            expect(dto.programmingLanguage).toBe(assignment.programmingLanguage);
        });
    });

    describe('toSubmissionDTO', () => {
        it('should map submission entity to DTO', () => {
            const submission = createMockSubmission();
            const dto = toSubmissionDTO(submission);

            expect(dto.id).toBe(submission.id);
            expect(dto.fileName).toBe(submission.fileName);
            expect(dto.submissionNumber).toBe(submission.submissionNumber);
        });

        it('should include student info when provided', () => {
            const submission = createMockSubmission();
            const dto = toSubmissionDTO(submission, {
                studentName: 'John Doe',
            });

            expect(dto.studentName).toBe('John Doe');
        });
    });

    describe('toStudentDTO', () => {
        it('should map user to student DTO with full name', () => {
            const user = createMockUser({ firstName: 'John', lastName: 'Doe' });
            const dto = toStudentDTO(user);

            expect(dto.id).toBe(user.id);
            expect(dto.fullName).toBe('John Doe');
        });
    });
});
