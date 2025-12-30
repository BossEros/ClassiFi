import { v4 as uuidv4 } from 'uuid';
import { ClassRepository, AssignmentRepository, EnrollmentRepository, UserRepository } from '../repositories/index.js';
/**
 * Business logic for class-related operations.
 */
export class ClassService {
    classRepo;
    assignmentRepo;
    enrollmentRepo;
    userRepo;
    constructor() {
        this.classRepo = new ClassRepository();
        this.assignmentRepo = new AssignmentRepository();
        this.enrollmentRepo = new EnrollmentRepository();
        this.userRepo = new UserRepository();
    }
    /** Generate a unique class code */
    async generateClassCode() {
        let code;
        let exists = true;
        // Generate until we find a unique code
        while (exists) {
            code = uuidv4().substring(0, 8).toUpperCase();
            exists = await this.classRepo.checkClassCodeExists(code);
        }
        return code;
    }
    /** Create a new class */
    async createClass(teacherId, className, classCode, yearLevel, semester, academicYear, schedule, description) {
        try {
            // Verify teacher exists
            const teacher = await this.userRepo.getUserById(teacherId);
            if (!teacher) {
                return { success: false, message: 'Teacher not found' };
            }
            if (teacher.role !== 'teacher') {
                return { success: false, message: 'User is not a teacher' };
            }
            // Create the class
            const newClass = await this.classRepo.createClass({
                teacherId,
                className,
                classCode,
                yearLevel,
                semester,
                academicYear,
                schedule,
                description,
            });
            const studentCount = await this.classRepo.getStudentCount(newClass.id);
            return {
                success: true,
                message: 'Class created successfully',
                classData: {
                    id: newClass.id,
                    teacherId: newClass.teacherId,
                    className: newClass.className,
                    classCode: newClass.classCode,
                    description: newClass.description,
                    yearLevel: newClass.yearLevel,
                    semester: newClass.semester,
                    academicYear: newClass.academicYear,
                    schedule: newClass.schedule,
                    createdAt: newClass.createdAt?.toISOString(),
                    isActive: newClass.isActive,
                    studentCount,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to create class' };
        }
    }
    /** Get a class by ID */
    async getClassById(classId, teacherId) {
        try {
            const classData = await this.classRepo.getClassById(classId);
            if (!classData) {
                return { success: false, message: 'Class not found' };
            }
            // Optional authorization check
            if (teacherId && classData.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized access to this class' };
            }
            const studentCount = await this.classRepo.getStudentCount(classId);
            return {
                success: true,
                message: 'Class retrieved successfully',
                classData: {
                    id: classData.id,
                    teacherId: classData.teacherId,
                    className: classData.className,
                    classCode: classData.classCode,
                    description: classData.description,
                    yearLevel: classData.yearLevel,
                    semester: classData.semester,
                    academicYear: classData.academicYear,
                    schedule: classData.schedule,
                    createdAt: classData.createdAt?.toISOString(),
                    isActive: classData.isActive,
                    studentCount,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to retrieve class' };
        }
    }
    /** Get all classes for a teacher */
    async getClassesByTeacher(teacherId, activeOnly = true) {
        try {
            const classes = await this.classRepo.getClassesByTeacher(teacherId, activeOnly);
            const classesWithCounts = await Promise.all(classes.map(async (c) => {
                const studentCount = await this.classRepo.getStudentCount(c.id);
                return {
                    id: c.id,
                    teacherId: c.teacherId,
                    className: c.className,
                    classCode: c.classCode,
                    description: c.description,
                    yearLevel: c.yearLevel,
                    semester: c.semester,
                    academicYear: c.academicYear,
                    schedule: c.schedule,
                    createdAt: c.createdAt?.toISOString(),
                    isActive: c.isActive,
                    studentCount,
                };
            }));
            return {
                success: true,
                message: 'Classes retrieved successfully',
                classes: classesWithCounts,
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to retrieve classes', classes: [] };
        }
    }
    /** Update a class */
    async updateClass(classId, teacherId, data) {
        try {
            const existingClass = await this.classRepo.getClassById(classId);
            if (!existingClass) {
                return { success: false, message: 'Class not found' };
            }
            if (existingClass.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to update this class' };
            }
            const updatedClass = await this.classRepo.updateClass(classId, data);
            if (!updatedClass) {
                return { success: false, message: 'Failed to update class' };
            }
            const studentCount = await this.classRepo.getStudentCount(classId);
            return {
                success: true,
                message: 'Class updated successfully',
                classData: {
                    id: updatedClass.id,
                    teacherId: updatedClass.teacherId,
                    className: updatedClass.className,
                    classCode: updatedClass.classCode,
                    description: updatedClass.description,
                    yearLevel: updatedClass.yearLevel,
                    semester: updatedClass.semester,
                    academicYear: updatedClass.academicYear,
                    schedule: updatedClass.schedule,
                    createdAt: updatedClass.createdAt?.toISOString(),
                    isActive: updatedClass.isActive,
                    studentCount,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to update class' };
        }
    }
    /** Delete a class */
    async deleteClass(classId, teacherId) {
        try {
            const existingClass = await this.classRepo.getClassById(classId);
            if (!existingClass) {
                return { success: false, message: 'Class not found' };
            }
            if (existingClass.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to delete this class' };
            }
            const deleted = await this.classRepo.deleteClass(classId);
            if (!deleted) {
                return { success: false, message: 'Failed to delete class' };
            }
            return { success: true, message: 'Class deleted successfully' };
        }
        catch (error) {
            return { success: false, message: 'Failed to delete class' };
        }
    }
    /** Create an assignment for a class */
    async createAssignment(classId, teacherId, data) {
        try {
            const classData = await this.classRepo.getClassById(classId);
            if (!classData) {
                return { success: false, message: 'Class not found' };
            }
            if (classData.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to create assignment for this class' };
            }
            const assignment = await this.assignmentRepo.createAssignment({
                classId,
                assignmentName: data.assignmentName,
                description: data.description,
                programmingLanguage: data.programmingLanguage,
                deadline: data.deadline,
                allowResubmission: data.allowResubmission,
            });
            return {
                success: true,
                message: 'Assignment created successfully',
                assignment: {
                    id: assignment.id,
                    classId: assignment.classId,
                    assignmentName: assignment.assignmentName,
                    description: assignment.description,
                    programmingLanguage: assignment.programmingLanguage,
                    deadline: assignment.deadline?.toISOString(),
                    allowResubmission: assignment.allowResubmission,
                    createdAt: assignment.createdAt?.toISOString(),
                    isActive: assignment.isActive,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to create assignment' };
        }
    }
    /** Get all assignments for a class */
    async getClassAssignments(classId) {
        try {
            const assignments = await this.assignmentRepo.getAssignmentsByClassId(classId);
            return {
                success: true,
                message: 'Assignments retrieved successfully',
                assignments: assignments.map((a) => ({
                    id: a.id,
                    classId: a.classId,
                    assignmentName: a.assignmentName,
                    description: a.description,
                    programmingLanguage: a.programmingLanguage,
                    deadline: a.deadline?.toISOString(),
                    allowResubmission: a.allowResubmission,
                    createdAt: a.createdAt?.toISOString(),
                    isActive: a.isActive,
                })),
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to retrieve assignments', assignments: [] };
        }
    }
    /** Get all students enrolled in a class */
    async getClassStudents(classId) {
        try {
            const students = await this.classRepo.getEnrolledStudents(classId);
            return {
                success: true,
                message: 'Students retrieved successfully',
                students: students.map((s) => ({
                    id: s.id,
                    username: s.username,
                    email: s.email,
                    firstName: s.firstName,
                    lastName: s.lastName,
                })),
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to retrieve students', students: [] };
        }
    }
    /** Remove a student from a class */
    async removeStudent(classId, studentId, teacherId) {
        try {
            const classData = await this.classRepo.getClassById(classId);
            if (!classData) {
                return { success: false, message: 'Class not found' };
            }
            if (classData.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to remove students from this class' };
            }
            const removed = await this.classRepo.removeStudent(classId, studentId);
            if (!removed) {
                return { success: false, message: 'Student not found in this class' };
            }
            return { success: true, message: 'Student removed successfully' };
        }
        catch (error) {
            return { success: false, message: 'Failed to remove student' };
        }
    }
    /** Get assignment details */
    async getAssignmentDetails(assignmentId, userId) {
        try {
            const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
            if (!assignment) {
                return { success: false, message: 'Assignment not found' };
            }
            const classData = await this.classRepo.getClassById(assignment.classId);
            return {
                success: true,
                message: 'Assignment retrieved successfully',
                assignment: {
                    id: assignment.id,
                    classId: assignment.classId,
                    assignmentName: assignment.assignmentName,
                    description: assignment.description,
                    programmingLanguage: assignment.programmingLanguage,
                    deadline: assignment.deadline?.toISOString(),
                    allowResubmission: assignment.allowResubmission,
                    createdAt: assignment.createdAt?.toISOString(),
                    isActive: assignment.isActive,
                    className: classData?.className,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to retrieve assignment' };
        }
    }
    /** Update an assignment */
    async updateAssignment(assignmentId, teacherId, data) {
        try {
            const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
            if (!assignment) {
                return { success: false, message: 'Assignment not found' };
            }
            const classData = await this.classRepo.getClassById(assignment.classId);
            if (!classData || classData.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to update this assignment' };
            }
            const updatedAssignment = await this.assignmentRepo.updateAssignment(assignmentId, data);
            if (!updatedAssignment) {
                return { success: false, message: 'Failed to update assignment' };
            }
            return {
                success: true,
                message: 'Assignment updated successfully',
                assignment: {
                    id: updatedAssignment.id,
                    classId: updatedAssignment.classId,
                    assignmentName: updatedAssignment.assignmentName,
                    description: updatedAssignment.description,
                    programmingLanguage: updatedAssignment.programmingLanguage,
                    deadline: updatedAssignment.deadline?.toISOString(),
                    allowResubmission: updatedAssignment.allowResubmission,
                    createdAt: updatedAssignment.createdAt?.toISOString(),
                    isActive: updatedAssignment.isActive,
                },
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to update assignment' };
        }
    }
    /** Delete an assignment */
    async deleteAssignment(assignmentId, teacherId) {
        try {
            const assignment = await this.assignmentRepo.getAssignmentById(assignmentId);
            if (!assignment) {
                return { success: false, message: 'Assignment not found' };
            }
            const classData = await this.classRepo.getClassById(assignment.classId);
            if (!classData || classData.teacherId !== teacherId) {
                return { success: false, message: 'Unauthorized to delete this assignment' };
            }
            const deleted = await this.assignmentRepo.deleteAssignment(assignmentId);
            if (!deleted) {
                return { success: false, message: 'Failed to delete assignment' };
            }
            return { success: true, message: 'Assignment deleted successfully' };
        }
        catch (error) {
            return { success: false, message: 'Failed to delete assignment' };
        }
    }
}
//# sourceMappingURL=class.service.js.map