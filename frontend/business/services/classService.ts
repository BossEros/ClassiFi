import * as classRepository from "@/data/repositories/classRepository";
import {
  validateCreateAssignmentData,
  validateUpdateAssignmentData,
} from "@/business/validation/assignmentValidation";
import {
  validateClassName,
  validateClassDescription,
  validateClassCode,
  validateYearLevel,
  validateSemester,
  validateAcademicYear,
  validateSchedule,
} from "@/business/validation/classValidation";
import { validateId } from "@/shared/utils/validators";
import type {
  Class,
  Assignment,
  EnrolledStudent,
  ClassDetailData,
} from "@/business/models/dashboard/types";
import type { UpdateAssignmentRequest } from "@/business/models/assignment/types";
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateAssignmentRequest,
  GradeEntry,
  GradebookStudent,
} from "@/data/api/types";

/**
 * Creates a new class with validation
 *
 * @param request - Class creation data
 * @returns Created class data
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  // Validate required fields using centralized validators
  validateId(request.teacherId, "teacher");

  const classNameError = validateClassName(request.className);
  if (classNameError) throw new Error(classNameError);

  if (request.description) {
    const descriptionError = validateClassDescription(request.description);
    if (descriptionError) throw new Error(descriptionError);
  }

  const classCodeError = validateClassCode(request.classCode);
  if (classCodeError) throw new Error(classCodeError);

  const yearLevelError = validateYearLevel(request.yearLevel);
  if (yearLevelError) throw new Error(yearLevelError);

  const semesterError = validateSemester(request.semester);
  if (semesterError) throw new Error(semesterError);

  const academicYearError = validateAcademicYear(request.academicYear);
  if (academicYearError) throw new Error(academicYearError);

  const scheduleError = validateSchedule(request.schedule);
  if (scheduleError) throw new Error(scheduleError);

  // All validations passed, call repository
  return await classRepository.createClass(request);
}

/**
 * Generates a unique class code from the backend
 *
 * @returns Generated unique class code
 */
export async function generateClassCode(): Promise<string> {
  return await classRepository.generateClassCode();
}

/**
 * Fetches all classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns List of all classes
 */
export async function getAllClasses(
  teacherId: number,
  activeOnly?: boolean,
): Promise<Class[]> {
  validateId(teacherId, "teacher");
  return await classRepository.getAllClasses(teacherId, activeOnly);
}

/**
 * Fetches a class by ID
 *
 * @param classId - ID of the class
 * @param teacherId - Optional teacher ID for authorization
 * @returns Class data
 */
export async function getClassById(
  classId: number,
  teacherId?: number,
): Promise<Class> {
  validateId(classId, "class");

  return await classRepository.getClassById(classId, teacherId);
}

/**
 * Fetches all assignments for a class
 *
 * @param classId - ID of the class
 * @returns List of assignments
 */
export async function getClassAssignments(
  classId: number,
): Promise<Assignment[]> {
  validateId(classId, "class");
  return await classRepository.getClassAssignments(classId);
}

/**
 * Helper function to add fullName to a student object
 * Centralizes the firstName + lastName transformation
 */
function addFullNameToStudent<
  T extends { firstName: string; lastName: string },
>(student: T): T & { fullName: string } {
  return {
    ...student,
    fullName: `${student.firstName} ${student.lastName}`.trim(),
  };
}

/**
 * Fetches all students enrolled in a class
 *
 * @param classId - ID of the class
 * @returns List of enrolled students
 */
export async function getClassStudents(
  classId: number,
): Promise<EnrolledStudent[]> {
  validateId(classId, "class");
  const students = await classRepository.getClassStudents(classId);
  return students.map(addFullNameToStudent);
}

/**
 * Fetches complete class detail data (class info, assignments, and students)
 *
 * @param classId - ID of the class
 * @param teacherId - Optional teacher ID for authorization
 * @returns Complete class detail data
 */
export async function getClassDetailData(
  classId: number,
  teacherId?: number,
): Promise<ClassDetailData> {
  validateId(classId, "class");

  // Fetch all data in parallel for better performance
  const [classInfo, assignments, students] = await Promise.all([
    classRepository.getClassById(classId, teacherId),
    classRepository.getClassAssignments(classId),
    classRepository.getClassStudents(classId),
  ]);

  return {
    classInfo,
    assignments,
    students: students.map(addFullNameToStudent),
  };
}

/**
 * Deletes a class permanently (hard delete with cascade)
 *
 * @param classId - ID of the class to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteClass(
  classId: number,
  teacherId: number,
): Promise<void> {
  validateId(classId, "class");
  validateId(teacherId, "teacher");
  await classRepository.deleteClass(classId, teacherId);
}

// Re-export UpdateClassRequest from centralized types
export type { UpdateClassRequest } from "@/data/api/types";

/**
 * Updates a class with validation
 *
 * @param classId - ID of the class to update
 * @param request - Update data
 * @returns Updated class data
 */
export async function updateClass(
  classId: number,
  request: UpdateClassRequest,
): Promise<Class> {
  validateId(classId, "class");
  validateId(request.teacherId, "teacher");

  return await classRepository.updateClass(classId, {
    ...request,
    className: request.className?.trim(),
    description: request.description?.trim(),
  });
}

/**
 * Creates a new assignment for a class with validation
 *
 * @param request - Assignment creation data (frontend format)
 * @returns Created assignment data
 */
export async function createAssignment(
  request: CreateAssignmentRequest,
): Promise<Assignment> {
  // Validate all fields
  const validation = validateCreateAssignmentData(request);

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError);
  }

  // Validate IDs
  validateId(request.classId, "class");
  validateId(request.teacherId, "teacher");

  // Pass directly to repository (backend uses camelCase)
  return await classRepository.createAssignment(request.classId, {
    teacherId: request.teacherId,
    assignmentName: request.assignmentName.trim(),
    description: request.description.trim(),
    programmingLanguage: request.programmingLanguage,
    deadline:
      typeof request.deadline === "string"
        ? request.deadline
        : request.deadline.toISOString(),
    allowResubmission: request.allowResubmission,
    maxAttempts: request.maxAttempts,
    templateCode: request.templateCode,
    totalScore: request.totalScore,
    scheduledDate: request.scheduledDate
      ? typeof request.scheduledDate === "string"
        ? request.scheduledDate
        : request.scheduledDate.toISOString()
      : null,
  });
}

/**
 * Updates an assignment with validation
 *
 * @param assignmentId - ID of the assignment to update
 * @param request - Assignment update data (frontend format)
 * @returns Updated assignment data
 */
export async function updateAssignment(
  assignmentId: number,
  request: UpdateAssignmentRequest,
): Promise<Assignment> {
  validateId(assignmentId, "assignment");

  // Validate all fields using centralized validation
  validateUpdateAssignmentData(request);

  // Pass directly to repository (backend uses camelCase)
  return await classRepository.updateAssignment(assignmentId, {
    teacherId: request.teacherId,
    assignmentName: request.assignmentName?.trim(),
    description: request.description?.trim(),
    programmingLanguage: request.programmingLanguage,
    deadline: request.deadline
      ? typeof request.deadline === "string"
        ? request.deadline
        : request.deadline.toISOString()
      : undefined,
    allowResubmission: request.allowResubmission,
    maxAttempts: request.maxAttempts,
    templateCode: request.templateCode,
    totalScore: request.totalScore,
    scheduledDate: request.scheduledDate
      ? typeof request.scheduledDate === "string"
        ? request.scheduledDate
        : request.scheduledDate.toISOString()
      : null,
  });
}

/**
 * Deletes an assignment
 *
 * @param assignmentId - ID of the assignment to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteAssignment(
  assignmentId: number,
  teacherId: number,
): Promise<void> {
  validateId(assignmentId, "assignment");
  validateId(teacherId, "teacher");
  await classRepository.deleteAssignment(assignmentId, teacherId);
}

/**
 * Removes a student from a class
 *
 * @param classId - ID of the class
 * @param studentId - ID of the student to remove
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function removeStudent(
  classId: number,
  studentId: number,
  teacherId: number,
): Promise<void> {
  validateId(classId, "class");
  validateId(studentId, "student");
  validateId(teacherId, "teacher");
  await classRepository.removeStudent(classId, studentId, teacherId);
}

// Re-export shared types for Gradebook
export type { GradeEntry, GradebookStudent };
