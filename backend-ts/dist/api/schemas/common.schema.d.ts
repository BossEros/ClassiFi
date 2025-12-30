import { z } from 'zod';
/** Generic success message response - used by many endpoints */
export declare const SuccessMessageSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
}, {
    message: string;
    success: true;
}>;
export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;
/** Generic limit query schema - used by dashboard endpoints */
export declare const LimitQuerySchema: z.ZodObject<{
    limit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: string | undefined;
}, {
    limit?: string | undefined;
}>;
export type LimitQuery = z.infer<typeof LimitQuerySchema>;
/** Latest only query schema - used by submission endpoints */
export declare const LatestOnlyQuerySchema: z.ZodObject<{
    latestOnly: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    latestOnly?: string | undefined;
}, {
    latestOnly?: string | undefined;
}>;
export type LatestOnlyQuery = z.infer<typeof LatestOnlyQuerySchema>;
/** User ID query schema */
export declare const UserIdQuerySchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export type UserIdQuery = z.infer<typeof UserIdQuerySchema>;
/** Student ID query schema */
export declare const StudentIdQuerySchema: z.ZodObject<{
    studentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: string;
}, {
    studentId: string;
}>;
export type StudentIdQuery = z.infer<typeof StudentIdQuerySchema>;
//# sourceMappingURL=common.schema.d.ts.map