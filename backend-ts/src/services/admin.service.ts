import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { sql, eq, or, ilike, and, desc, count } from 'drizzle-orm';
import { UserService } from './user.service.js';
import { ClassService } from './class.service.js';
import { UserRepository, type UserRole } from '../repositories/user.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { SubmissionRepository } from '../repositories/submission.repository.js';
import { SimilarityRepository } from '../repositories/similarity.repository.js';
import { db } from '../shared/database.js';
import { users, classes, submissions, similarityReports, enrollments } from '../models/index.js';
import type { User, Class, ClassSchedule } from '../models/index.js';
import { toUserDTO, toClassDTO, type UserDTO, type ClassDTO } from '../shared/mappers.js';
import { supabase } from '../shared/supabase.js';
import {
    UserNotFoundError,
    ClassNotFoundError,
    InvalidRoleError,
} from '../shared/errors.js';

// ============ Types ============

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface UserFilterOptions extends PaginationOptions {
    search?: string;
    role?: UserRole | 'all';
    status?: 'active' | 'inactive' | 'all';
}

export interface ClassFilterOptions extends PaginationOptions {
    search?: string;
    teacherId?: number;
    status?: 'active' | 'archived' | 'all';
    yearLevel?: number;
    semester?: number;
    academicYear?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AdminStats {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    totalClasses: number;
    activeClasses: number;
    totalSubmissions: number;
    totalPlagiarismReports: number;
}

export interface ActivityItem {
    id: string;
    type: 'user_registered' | 'class_created' | 'submission_made' | 'plagiarism_analyzed';
    description: string;
    user: string;
    target: string;
    timestamp: Date;
}

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

export interface CreateClassData {
    teacherId: number;
    className: string;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: ClassSchedule;
    description?: string;
}

export interface UpdateClassData {
    className?: string;
    description?: string | null;
    isActive?: boolean;
    yearLevel?: number;
    semester?: number;
    academicYear?: string;
    schedule?: ClassSchedule;
    teacherId?: number;
}

/**
 * Business logic for admin-only operations.
 * Handles user management, analytics, and class oversight.
 */
@injectable()
export class AdminService {
    constructor(
        @inject('UserRepository') private userRepo: UserRepository,
        @inject('ClassRepository') private classRepo: ClassRepository,
        @inject('EnrollmentRepository') private enrollmentRepo: EnrollmentRepository,
        @inject('SubmissionRepository') private submissionRepo: SubmissionRepository,
        @inject('SimilarityRepository') private similarityRepo: SimilarityRepository,
        @inject('UserService') private userService: UserService,
        @inject('ClassService') private classService: ClassService
    ) { }

    // ============ User Management ============

    /**
     * Get all users with pagination, search, and filters.
     */
    async getAllUsers(options: UserFilterOptions): Promise<PaginatedResult<UserDTO>> {
        const { page, limit, search, role, status } = options;
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    ilike(users.email, `%${search}%`),
                    ilike(users.firstName, `%${search}%`),
                    ilike(users.lastName, `%${search}%`)
                )
            );
        }

        if (role && role !== 'all') {
            conditions.push(eq(users.role, role));
        }

        if (status && status !== 'all') {
            conditions.push(eq(users.isActive, status === 'active'));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db
            .select({ count: count() })
            .from(users)
            .where(whereClause);

        const total = Number(countResult[0]?.count ?? 0);

        // Get paginated data
        let query = db
            .select()
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        if (whereClause) {
            query = query.where(whereClause) as typeof query;
        }

        const data = await query;

        return {
            data: data.map(u => toUserDTO(u)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single user by ID.
     */
    async getUserById(userId: number): Promise<UserDTO> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }
        return toUserDTO(user);
    }

    /**
     * Update a user's role.
     */
    async updateUserRole(userId: number, newRole: UserRole): Promise<UserDTO> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        const validRoles: UserRole[] = ['student', 'teacher', 'admin'];
        if (!validRoles.includes(newRole)) {
            throw new InvalidRoleError(newRole);
        }

        const updated = await this.userRepo.updateUser(userId, { role: newRole });
        if (!updated) {
            throw new UserNotFoundError(userId);
        }

        return toUserDTO(updated);
    }

    /**
     * Update a user's details (First/Last Name).
     */
    async updateUserDetails(userId: number, data: { firstName?: string; lastName?: string }): Promise<UserDTO> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        const updated = await this.userRepo.updateUser(userId, data);
        if (!updated) {
            throw new UserNotFoundError(userId);
        }

        return toUserDTO(updated);
    }

    /**
     * Update a user's email address (Admin-only for account recovery).
     * Updates both Supabase Auth and local users table.
     */
    async updateUserEmail(userId: number, newEmail: string): Promise<UserDTO> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        // Check if new email is already in use
        const existingUser = await this.userRepo.getUserByEmail(newEmail);
        if (existingUser && existingUser.id !== userId) {
            throw new Error('Email address is already in use by another account');
        }

        // Ensure user has a Supabase auth account
        if (!user.supabaseUserId) {
            throw new Error('User does not have a linked Supabase auth account');
        }

        // Update email in Supabase Auth
        const { error: authError } = await supabase.auth.admin.updateUserById(
            user.supabaseUserId,
            { email: newEmail, email_confirm: true }
        );

        if (authError) {
            throw new Error(`Failed to update auth email: ${authError.message}`);
        }

        // Update email in local users table
        const updated = await this.userRepo.updateUser(userId, { email: newEmail });
        if (!updated) {
            throw new UserNotFoundError(userId);
        }

        return toUserDTO(updated);
    }

    /**
     * Toggle a user's active status.
     */
    async toggleUserStatus(userId: number): Promise<UserDTO> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        const newStatus = !user.isActive;

        const updated = await db
            .update(users)
            .set({ isActive: newStatus })
            .where(eq(users.id, userId))
            .returning();

        if (!updated[0]) {
            throw new UserNotFoundError(userId);
        }

        return toUserDTO(updated[0]);
    }

    /**
     * Create a new user (admin-initiated).
     */
    async adminCreateUser(data: CreateUserData): Promise<UserDTO> {
        // Check if email exists
        const exists = await this.userRepo.checkEmailExists(data.email);
        if (exists) {
            throw new Error(`User with email '${data.email}' already exists`);
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm for admin-created users
        });

        if (authError || !authData.user) {
            throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        // Create user in local database
        const user = await this.userRepo.createUser({
            supabaseUserId: authData.user.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
        });

        return toUserDTO(user);
    }

    /**
     * Delete a user (admin-initiated).
     */
    async adminDeleteUser(userId: number): Promise<void> {
        const user = await this.userRepo.getUserById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        // If user is a teacher, we must delete their classes first to ensure file cleanup
        if (user.role === 'teacher') {
            // Fetch ALL classes (active and inactive)
            const teacherClasses = await this.classService.getClassesByTeacher(userId, false);

            // Delete each class (this performs file cleanup)
            for (const cls of teacherClasses) {
                try {
                    await this.classService.forceDeleteClass(cls.id);
                } catch (error) {
                    console.error(`Failed to delete class ${cls.id} for teacher ${userId}:`, error);
                    // Continue with other classes/user deletion
                }
            }
        }

        // Use UserService to safely delete account (handles file cleanup)
        await this.userService.deleteAccount(userId);
    }

    // ============ Analytics ============

    /**
     * Get admin dashboard statistics.
     */
    async getAdminStats(): Promise<AdminStats> {
        // User counts by role
        const userCounts = await db
            .select({
                role: users.role,
                count: count(),
            })
            .from(users)
            .groupBy(users.role);

        const roleMap: Record<string, number> = {};
        userCounts.forEach(row => {
            roleMap[row.role] = Number(row.count);
        });

        // Class counts
        const totalClassesResult = await db.select({ count: count() }).from(classes);
        const activeClassesResult = await db
            .select({ count: count() })
            .from(classes)
            .where(eq(classes.isActive, true));

        // Submission count
        const submissionCountResult = await db.select({ count: count() }).from(submissions);

        // Plagiarism report count
        const reportCountResult = await db.select({ count: count() }).from(similarityReports);

        return {
            totalUsers: (roleMap['student'] || 0) + (roleMap['teacher'] || 0) + (roleMap['admin'] || 0),
            totalStudents: roleMap['student'] || 0,
            totalTeachers: roleMap['teacher'] || 0,
            totalAdmins: roleMap['admin'] || 0,
            totalClasses: Number(totalClassesResult[0]?.count ?? 0),
            activeClasses: Number(activeClassesResult[0]?.count ?? 0),
            totalSubmissions: Number(submissionCountResult[0]?.count ?? 0),
            totalPlagiarismReports: Number(reportCountResult[0]?.count ?? 0),
        };
    }

    /**
     * Get recent platform activity.
     */
    async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
        const activities: ActivityItem[] = [];

        // Get recent users
        const recentUsers = await db
            .select()
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(limit);

        recentUsers.forEach(user => {
            activities.push({
                id: `user-${user.id}`,
                type: 'user_registered',
                description: 'registered as',
                user: `${user.firstName} ${user.lastName}`,
                target: user.role.charAt(0).toUpperCase() + user.role.slice(1),
                timestamp: user.createdAt ?? new Date(),
            });
        });

        // Get recent classes
        const recentClasses = await db
            .select({
                class: classes,
                teacher: users,
            })
            .from(classes)
            .leftJoin(users, eq(classes.teacherId, users.id))
            .orderBy(desc(classes.createdAt))
            .limit(limit);

        recentClasses.forEach(row => {
            activities.push({
                id: `class-${row.class.id}`,
                type: 'class_created',
                description: 'created class',
                user: row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : 'Unknown',
                target: row.class.className,
                timestamp: row.class.createdAt ?? new Date(),
            });
        });

        // Sort by timestamp and return limited results
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    // ============ Class Oversight ============

    /**
     * Get all classes with pagination and filters.
     */
    async getAllClasses(options: ClassFilterOptions): Promise<PaginatedResult<ClassDTO & { teacherName: string }>> {
        const { page, limit, search, teacherId, status, yearLevel, semester, academicYear } = options;
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    ilike(classes.className, `%${search}%`),
                    ilike(classes.classCode, `%${search}%`)
                )
            );
        }

        if (teacherId) {
            conditions.push(eq(classes.teacherId, teacherId));
        }

        if (status && status !== 'all') {
            conditions.push(eq(classes.isActive, status === 'active'));
        }

        if (yearLevel) {
            conditions.push(eq(classes.yearLevel, yearLevel));
        }

        if (semester) {
            conditions.push(eq(classes.semester, semester));
        }

        if (academicYear) {
            conditions.push(eq(classes.academicYear, academicYear));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        let countQuery = db.select({ count: count() }).from(classes);
        if (whereClause) {
            countQuery = countQuery.where(whereClause) as typeof countQuery;
        }
        const countResult = await countQuery;
        const total = Number(countResult[0]?.count ?? 0);

        // Get paginated data with teacher info
        let dataQuery = db
            .select({
                class: classes,
                teacher: users,
            })
            .from(classes)
            .leftJoin(users, eq(classes.teacherId, users.id))
            .orderBy(desc(classes.createdAt))
            .limit(limit)
            .offset(offset);

        if (whereClause) {
            dataQuery = dataQuery.where(whereClause) as typeof dataQuery;
        }

        const data = await dataQuery;

        // Get student counts for each class
        const classIds = data.map(d => d.class.id);
        const studentCounts: Record<number, number> = {};

        if (classIds.length > 0) {
            for (const classId of classIds) {
                studentCounts[classId] = await this.classRepo.getStudentCount(classId);
            }
        }

        return {
            data: data.map(row => ({
                ...toClassDTO(row.class, { studentCount: studentCounts[row.class.id] || 0 }),
                teacherName: row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : 'Unknown',
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single class by ID with full details.
     */
    async getClassById(classId: number): Promise<ClassDTO & { teacherName: string }> {
        const result = await db
            .select({
                class: classes,
                teacher: users,
            })
            .from(classes)
            .leftJoin(users, eq(classes.teacherId, users.id))
            .where(eq(classes.id, classId))
            .limit(1);

        if (!result[0]) {
            throw new ClassNotFoundError(classId);
        }

        const studentCount = await this.classRepo.getStudentCount(classId);

        return {
            ...toClassDTO(result[0].class, { studentCount }),
            teacherName: result[0].teacher
                ? `${result[0].teacher.firstName} ${result[0].teacher.lastName}`
                : 'Unknown',
        };
    }

    /**
     * Create a class (admin can assign any teacher).
     */
    async adminCreateClass(data: CreateClassData): Promise<ClassDTO> {
        // Verify teacher exists and is a teacher
        const teacher = await this.userRepo.getUserById(data.teacherId);
        if (!teacher) {
            throw new UserNotFoundError(data.teacherId);
        }
        if (teacher.role !== 'teacher') {
            throw new InvalidRoleError('teacher');
        }

        // Generate unique class code
        let classCode: string;
        let exists = true;
        while (exists) {
            classCode = uuidv4().substring(0, 8).toUpperCase();
            exists = await this.classRepo.checkClassCodeExists(classCode);
        }

        const newClass = await this.classRepo.createClass({
            teacherId: data.teacherId,
            className: data.className,
            classCode: classCode!,
            yearLevel: data.yearLevel,
            semester: data.semester,
            academicYear: data.academicYear,
            schedule: data.schedule,
            description: data.description,
        });

        return toClassDTO(newClass, { studentCount: 0 });
    }

    /**
     * Update a class (admin can update any field including teacher).
     */
    async adminUpdateClass(classId: number, data: UpdateClassData): Promise<ClassDTO> {
        const existingClass = await this.classRepo.getClassById(classId);
        if (!existingClass) {
            throw new ClassNotFoundError(classId);
        }

        // If changing teacher, verify new teacher is valid
        if (data.teacherId && data.teacherId !== existingClass.teacherId) {
            const newTeacher = await this.userRepo.getUserById(data.teacherId);
            if (!newTeacher) {
                throw new UserNotFoundError(data.teacherId);
            }
            if (newTeacher.role !== 'teacher') {
                throw new InvalidRoleError('teacher');
            }
        }

        // Update the class
        const updateData: Record<string, unknown> = {};
        if (data.className !== undefined) updateData.className = data.className;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.yearLevel !== undefined) updateData.yearLevel = data.yearLevel;
        if (data.semester !== undefined) updateData.semester = data.semester;
        if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;
        if (data.schedule !== undefined) updateData.schedule = data.schedule;
        if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;

        const updated = await db
            .update(classes)
            .set(updateData)
            .where(eq(classes.id, classId))
            .returning();

        if (!updated[0]) {
            throw new ClassNotFoundError(classId);
        }

        const studentCount = await this.classRepo.getStudentCount(classId);
        return toClassDTO(updated[0], { studentCount });
    }

    /**
     * Delete a class (hard delete).
     */
    async adminDeleteClass(classId: number): Promise<void> {
        // Use ClassService to force delete class (handles file cleanup)
        await this.classService.forceDeleteClass(classId);
    }

    /**
     * Reassign a class to a new teacher.
     */
    async reassignClassTeacher(classId: number, newTeacherId: number): Promise<ClassDTO> {
        return this.adminUpdateClass(classId, { teacherId: newTeacherId });
    }

    /**
     * Archive a class (soft delete).
     */
    async archiveClass(classId: number): Promise<ClassDTO> {
        return this.adminUpdateClass(classId, { isActive: false });
    }

    /**
     * Get all teachers (for dropdowns).
     */
    async getAllTeachers(): Promise<UserDTO[]> {
        const teachers = await db
            .select()
            .from(users)
            .where(eq(users.role, 'teacher'))
            .orderBy(users.firstName);

        return teachers.map(t => toUserDTO(t));
    }
}
