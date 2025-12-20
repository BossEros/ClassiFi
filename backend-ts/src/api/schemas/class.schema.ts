import { z } from 'zod';

/** Create class request schema */
export const CreateClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    className: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
});

export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;

/** Update class request schema */
export const UpdateClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    className: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
});

export type UpdateClassRequest = z.infer<typeof UpdateClassRequestSchema>;

/** Delete class request schema */
export const DeleteClassRequestSchema = z.object({
    teacherId: z.number().int().positive(),
});

export type DeleteClassRequest = z.infer<typeof DeleteClassRequestSchema>;

/** Class response schema */
export const ClassResponseSchema = z.object({
    id: z.number(),
    teacherId: z.number(),
    className: z.string(),
    classCode: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    isActive: z.boolean(),
    studentCount: z.number().optional(),
});

export type ClassResponse = z.infer<typeof ClassResponseSchema>;

/** Class list response schema */
export const ClassListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    classes: z.array(ClassResponseSchema),
});

export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;

/** Student response schema */
export const StudentResponseSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
});

export type StudentResponse = z.infer<typeof StudentResponseSchema>;
