import { z } from 'zod';
// ============================================================================
// Shared Schemas
// ============================================================================
/** Days of the week enum */
export const DayOfWeekSchema = z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]);
/** Time format regex (HH:MM) */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
/** Schedule schema for class meetings */
export const ScheduleSchema = z.object({
    days: z.array(DayOfWeekSchema).min(1, 'Select at least one day'),
    startTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)'),
});
// ============================================================================
// Request Schemas
// ============================================================================
/** Create class request schema */
export const CreateClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    className: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    classCode: z.string().length(8),
    yearLevel: z.number().int().min(1).max(4),
    semester: z.number().int().min(1).max(2),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY (e.g., 2024-2025)'),
    schedule: ScheduleSchema,
});
/** Update class request schema */
export const UpdateClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    className: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
    yearLevel: z.number().int().min(1).max(4).optional(),
    semester: z.number().int().min(1).max(2).optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY').optional(),
    schedule: ScheduleSchema.optional(),
});
/** Delete class request schema */
export const DeleteClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
});
// ============================================================================
// Param & Query Schemas (for OpenAPI docs)
// ============================================================================
/** Class ID param schema */
export const ClassIdParamSchema = z.object({
    classId: z.string(),
});
/** Teacher ID param schema */
export const TeacherIdParamSchema = z.object({
    teacherId: z.string(),
});
/** Student ID param schema */
export const StudentIdParamSchema = z.object({
    studentId: z.string(),
});
/** Get classes query schema */
export const GetClassesQuerySchema = z.object({
    activeOnly: z.string().optional(),
});
/** Get class by ID query schema */
export const GetClassByIdQuerySchema = z.object({
    teacherId: z.string().optional(),
});
/** Teacher ID query schema */
export const TeacherIdQuerySchema = z.object({
    teacherId: z.string(),
});
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
/** Student response schema */
export const StudentResponseSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
});
/** Success message response schema */
export const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});
/** Create class response schema */
export const CreateClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    class: ClassResponseSchema,
});
/** Get class response schema */
export const GetClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    class: ClassResponseSchema,
});
/** Update class response schema */
export const UpdateClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classInfo: ClassResponseSchema,
});
/** Class list response schema */
export const ClassListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classes: z.array(ClassResponseSchema),
});
/** Generate code response schema */
export const GenerateCodeResponseSchema = z.object({
    success: z.literal(true),
    code: z.string(),
    message: z.string(),
});
/** Class students response schema */
export const ClassStudentsResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    students: z.array(StudentResponseSchema),
});
//# sourceMappingURL=class.schema.js.map