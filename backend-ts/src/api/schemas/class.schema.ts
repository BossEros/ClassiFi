import { z } from 'zod';

// ============================================================================
// Shared Schemas
// ============================================================================

/** Days of the week enum */
export const DayOfWeekSchema = z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]);

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

/** Time format regex (HH:MM) */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Schedule schema for class meetings */
export const ScheduleSchema = z.object({
    days: z.array(DayOfWeekSchema).min(1, 'Select at least one day'),
    startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

/** Create class request schema */
export const CreateClassRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    className: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    classCode: z.string().length(8),
    yearLevel: z.number().int().min(1).max(4),
    semester: z.number().int().min(1).max(2),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY (e.g., 2024-2025)'),
    schedule: ScheduleSchema,
});

export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;

/** Update class request schema */
export const UpdateClassRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    className: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
    yearLevel: z.number().int().min(1).max(4).optional(),
    semester: z.number().int().min(1).max(2).optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY').optional(),
    schedule: ScheduleSchema.optional(),
});

export type UpdateClassRequest = z.infer<typeof UpdateClassRequestSchema>;

/** Delete class request schema */
export const DeleteClassRequestSchema = z.object({
    teacherId: z.number().int().min(1),
});

export type DeleteClassRequest = z.infer<typeof DeleteClassRequestSchema>;

// ============================================================================
// Param & Query Schemas (for OpenAPI docs)
// ============================================================================

/** Class ID param schema (auto-coerces string to number) */
export const ClassIdParamSchema = z.object({
    classId: z.coerce.number().int().min(1),
});

export type ClassIdParam = z.infer<typeof ClassIdParamSchema>;

/** Teacher ID param schema (auto-coerces string to number) */
export const TeacherIdParamSchema = z.object({
    teacherId: z.coerce.number().int().min(1),
});

export type TeacherIdParam = z.infer<typeof TeacherIdParamSchema>;

/** Student ID param schema (auto-coerces string to number) */
export const StudentIdParamSchema = z.object({
    studentId: z.coerce.number().int().min(1),
});

export type StudentIdParam = z.infer<typeof StudentIdParamSchema>;

/** Get classes query schema */
export const GetClassesQuerySchema = z.object({
    activeOnly: z.string().optional(),
});

export type GetClassesQuery = z.infer<typeof GetClassesQuerySchema>;

/** Get class by ID query schema */
export const GetClassByIdQuerySchema = z.object({
    teacherId: z.string().optional(),
});

export type GetClassByIdQuery = z.infer<typeof GetClassByIdQuerySchema>;

/** Teacher ID query schema */
export const TeacherIdQuerySchema = z.object({
    teacherId: z.string(),
});

export type TeacherIdQuery = z.infer<typeof TeacherIdQuerySchema>;

// ============================================================================
// Response Schemas
// ============================================================================

/** Class response schema */
export const ClassResponseSchema = z.object({
    id: z.number(),
    teacherId: z.number(),
    className: z.string(),
    classCode: z.string(),
    description: z.string().nullable(),
    yearLevel: z.number(),
    semester: z.number(),
    academicYear: z.string(),
    schedule: ScheduleSchema,
    createdAt: z.string(),
    isActive: z.boolean(),
    studentCount: z.number().optional(),
});

export type ClassResponse = z.infer<typeof ClassResponseSchema>;

/** Student response schema */
export const StudentResponseSchema = z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
});

export type StudentResponse = z.infer<typeof StudentResponseSchema>;

/** Success message response schema */
export const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});

export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;

/** Create class response schema */
export const CreateClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    class: ClassResponseSchema,
});

export type CreateClassResponse = z.infer<typeof CreateClassResponseSchema>;

/** Get class response schema */
export const GetClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    class: ClassResponseSchema,
});

export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;

/** Update class response schema */
export const UpdateClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    class: ClassResponseSchema,
});

export type UpdateClassResponse = z.infer<typeof UpdateClassResponseSchema>;

/** Class list response schema */
export const ClassListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classes: z.array(ClassResponseSchema),
});

export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;

/** Generate code response schema */
export const GenerateCodeResponseSchema = z.object({
    success: z.literal(true),
    code: z.string(),
    message: z.string(),
});

export type GenerateCodeResponse = z.infer<typeof GenerateCodeResponseSchema>;

/** Class students response schema */
export const ClassStudentsResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    students: z.array(StudentResponseSchema),
});

export type ClassStudentsResponse = z.infer<typeof ClassStudentsResponseSchema>;

/** Combined params for student removal (classId + studentId) */
export const ClassStudentParamsSchema = z.object({
    classId: z.string(),
    studentId: z.string(),
});

export type ClassStudentParams = z.infer<typeof ClassStudentParamsSchema>;
