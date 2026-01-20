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

// Re-export shared types for Gradebook
export type { GradeEntry, GradebookStudent };

/**
 * Creates a new class with comprehensive validation.
 *
 * @param createClassData - The detailed data required to create a new class (name, code, schedule, etc.).
 * @returns The newly created class object.
 */
export async function createClass(
  createClassData: CreateClassRequest,
): Promise<Class> {
  // Validate required fields using centralized validators
  validateId(createClassData.teacherId, "teacher");

  const classNameError = validateClassName(createClassData.className);
  if (classNameError) throw new Error(classNameError);

  if (createClassData.description) {
    const descriptionError = validateClassDescription(
      createClassData.description,
    );
    if (descriptionError) throw new Error(descriptionError);
  }

  const classCodeError = validateClassCode(createClassData.classCode);
  if (classCodeError) throw new Error(classCodeError);

  const yearLevelError = validateYearLevel(createClassData.yearLevel);
  if (yearLevelError) throw new Error(yearLevelError);

  const semesterError = validateSemester(createClassData.semester);
  if (semesterError) throw new Error(semesterError);

  const academicYearError = validateAcademicYear(createClassData.academicYear);
  if (academicYearError) throw new Error(academicYearError);

  const scheduleError = validateSchedule(createClassData.schedule);
  if (scheduleError) throw new Error(scheduleError);

  // All validations passed, call repository
  return await classRepository.createClass(createClassData);
}

/**
 * Generates a unique class code from the backend.
 *
 * @returns A unique 6-character class code string.
 */
export async function generateClassCode(): Promise<string> {
  return await classRepository.generateClassCode();
}

/**
 * Fetches all classes associated with a specific teacher.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param activeOnly - If true, returns only currently active classes (defaults to all).
 * @returns An array of class objects associated with the teacher.
 */
export async function getAllClasses(
  teacherId: number,
  activeOnly?: boolean,
): Promise<Class[]> {
  validateId(teacherId, "teacher");

  return await classRepository.getAllClasses(teacherId, activeOnly);
}

/**
 * Fetches detailed information for a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @param teacherId - Optional teacher ID for authorization purposes.
 * @returns The class object containing details.
 */
export async function getClassById(
  classId: number,
  teacherId?: number,
): Promise<Class> {
  validateId(classId, "class");

  return await classRepository.getClassById(classId, teacherId);
}

/**
 * Fetches all assignments created within a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of assignment objects.
 */
export async function getClassAssignments(
  classId: number,
): Promise<Assignment[]> {
  validateId(classId, "class");

  return await classRepository.getClassAssignments(classId);
}

/**
 * Helper function to append a full name property to a student object.
 * Centralizes the formatting logic: `${firstName} ${lastName}`.
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
 * Fetches the list of all students currently enrolled in a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of enrolled student objects, with full names included.
 */
export async function getClassStudents(
  classId: number,
): Promise<EnrolledStudent[]> {
  validateId(classId, "class");

  const students = await classRepository.getClassStudents(classId);

  return students.map(addFullNameToStudent);
}

/**
 * Fetches comprehensive details for a class including basic info, assignments, and student roster.
 *
 * @param classId - The unique identifier of the class.
 * @param teacherId - Optional teacher ID for authorization.
 * @returns An aggregated object containing all class details.
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
 * Permanently deletes a class and cascades the deletion to related data.
 *
 * @param classId - The unique identifier of the class to delete.
 * @param teacherId - The unique identifier of the teacher (for authorization).
 * @returns A promise that resolves upon successful deletion.
 */
export async function deleteClass(
  classId: number,
  teacherId: number,
): Promise<void> {
  validateId(classId, "class");
  validateId(teacherId, "teacher");

  await classRepository.deleteClass(classId, teacherId);
}

/**
 * Updates an existing class with new details.
 *
 * @param classId - The unique identifier of the class to update.
 * @param updateData - The data object containing fields to update.
 * @returns The updated class object.
 */
export async function updateClass(
  classId: number,
  updateData: UpdateClassRequest,
): Promise<Class> {
  validateId(classId, "class");
  validateId(updateData.teacherId, "teacher");

  return await classRepository.updateClass(classId, {
    ...updateData,
    className: updateData.className?.trim(),
    description: updateData.description?.trim(),
  });
}

/**
 * Creates a new assignment within a class.
 *
 * @param createAssignmentData - The data required to create the assignment.
 * @returns The newly created assignment object.
 */
export async function createAssignment(
  createAssignmentData: CreateAssignmentRequest,
): Promise<Assignment> {
  // Validate all fields
  const validation = validateCreateAssignmentData(createAssignmentData);

  if (!validation.isValid) {
    const firstError = validation.errors[0];
    throw new Error(firstError.message);
  }

  // Validate IDs
  validateId(createAssignmentData.classId, "class");
  validateId(createAssignmentData.teacherId, "teacher");

  // Pass directly to repository
  return await classRepository.createAssignment(createAssignmentData.classId, {
    teacherId: createAssignmentData.teacherId,
    assignmentName: createAssignmentData.assignmentName.trim(),
    description: createAssignmentData.description.trim(),
    programmingLanguage: createAssignmentData.programmingLanguage,
    deadline:
      typeof createAssignmentData.deadline === "string"
        ? createAssignmentData.deadline
        : createAssignmentData.deadline.toISOString(),
    allowResubmission: createAssignmentData.allowResubmission,
    maxAttempts: createAssignmentData.maxAttempts,
    templateCode: createAssignmentData.templateCode,
    totalScore: createAssignmentData.totalScore,
    scheduledDate: createAssignmentData.scheduledDate
      ? typeof createAssignmentData.scheduledDate === "string"
        ? createAssignmentData.scheduledDate
        : createAssignmentData.scheduledDate.toISOString()
      : null,
  });
}

/**
 * Updates an existing assignment with new data.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param updateAssignmentData - The data object containing fields to update.
 * @returns The updated assignment object.
 */
export async function updateAssignment(
  assignmentId: number,
  updateAssignmentData: UpdateAssignmentRequest,
): Promise<Assignment> {
  validateId(assignmentId, "assignment");

  // Validate all fields using centralized validation
  validateUpdateAssignmentData(updateAssignmentData);

  // Pass directly to repository (backend uses camelCase)
  return await classRepository.updateAssignment(assignmentId, {
    teacherId: updateAssignmentData.teacherId,
    assignmentName: updateAssignmentData.assignmentName?.trim(),
    description: updateAssignmentData.description?.trim(),
    programmingLanguage: updateAssignmentData.programmingLanguage,
    deadline: updateAssignmentData.deadline
      ? typeof updateAssignmentData.deadline === "string"
        ? updateAssignmentData.deadline
        : updateAssignmentData.deadline.toISOString()
      : undefined,
    allowResubmission: updateAssignmentData.allowResubmission,
    maxAttempts: updateAssignmentData.maxAttempts,
    templateCode: updateAssignmentData.templateCode,
    totalScore: updateAssignmentData.totalScore,
    scheduledDate: updateAssignmentData.scheduledDate
      ? typeof updateAssignmentData.scheduledDate === "string"
        ? updateAssignmentData.scheduledDate
        : updateAssignmentData.scheduledDate.toISOString()
      : null,
  });
}

/**
 * Permanently deletes an assignment.
 *
 * @param assignmentId - The unique identifier of the assignment to delete.
 * @param teacherId - The unique identifier of the teacher (for authorization).
 * @returns A promise that resolves upon successful deletion.
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
 * Removes a student from a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student to remove.
 * @param teacherId - The unique identifier of the teacher (for authorization).
 * @returns A promise that resolves upon successful removal.
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
