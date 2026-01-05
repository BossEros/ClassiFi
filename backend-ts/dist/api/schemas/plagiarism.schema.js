import { z } from 'zod';
// ============================================================================
// Plagiarism Language Enum
// ============================================================================
/** Supported programming languages for plagiarism detection */
export const PlagiarismLanguageSchema = z.enum(['java', 'python', 'c']);
// ============================================================================
// Request Schemas
// ============================================================================
/** File input for plagiarism analysis */
export const PlagiarismFileSchema = z.object({
    id: z.string().optional(),
    path: z.string().min(1),
    content: z.string(),
    studentId: z.string().optional(),
    studentName: z.string().optional(),
});
/** Template file schema */
export const TemplateFileSchema = z.object({
    path: z.string().min(1),
    content: z.string(),
});
/** Analyze request body schema */
export const AnalyzeRequestSchema = z.object({
    files: z.array(PlagiarismFileSchema).min(2),
    language: PlagiarismLanguageSchema,
    templateFile: TemplateFileSchema.optional(),
    threshold: z.number().min(0).max(1).optional(),
    kgramLength: z.number().int().min(1).optional(),
});
// ============================================================================
// Param Schemas
// ============================================================================
/** Report ID param schema */
export const ReportIdParamSchema = z.object({
    reportId: z.string(),
});
/** Assignment ID param schema for plagiarism */
export const PlagiarismAssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});
/** Report and Pair ID params schema */
export const ReportPairParamsSchema = z.object({
    reportId: z.string(),
    pairId: z.string(),
});
/** Result ID param schema */
export const ResultIdParamSchema = z.object({
    resultId: z.string(),
});
// ============================================================================
// Response Schemas
// ============================================================================
/** File response schema */
export const FileResponseSchema = z.object({
    id: z.number(),
    path: z.string(),
    filename: z.string(),
    lineCount: z.number(),
    studentId: z.string().optional(),
    studentName: z.string().optional(),
});
/** Pair response schema */
export const PairResponseSchema = z.object({
    id: z.number(),
    leftFile: FileResponseSchema,
    rightFile: FileResponseSchema,
    structuralScore: z.number(),
    semanticScore: z.number(),
    hybridScore: z.number(),
    overlap: z.number(),
    longest: z.number(),
});
/** Summary response schema */
export const SummaryResponseSchema = z.object({
    totalFiles: z.number(),
    totalPairs: z.number(),
    suspiciousPairs: z.number(),
    averageSimilarity: z.number(),
    maxSimilarity: z.number(),
});
/** Analyze response schema */
export const AnalyzeResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    reportId: z.string(),
    summary: SummaryResponseSchema,
    pairs: z.array(PairResponseSchema),
    warnings: z.array(z.string()),
});
/** Selection schema for fragment positions */
export const SelectionSchema = z.object({
    startRow: z.number(),
    startCol: z.number(),
    endRow: z.number(),
    endCol: z.number(),
});
/** Fragment response schema */
export const FragmentResponseSchema = z.object({
    id: z.number(),
    leftSelection: SelectionSchema,
    rightSelection: SelectionSchema,
    length: z.number(),
});
/** Pair details response schema */
export const PairDetailsResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    pair: PairResponseSchema,
    fragments: z.array(FragmentResponseSchema),
    leftCode: z.string(),
    rightCode: z.string(),
});
/** Get report response schema */
export const GetReportResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    reportId: z.string(),
    summary: SummaryResponseSchema,
    pairs: z.array(PairResponseSchema),
    warnings: z.array(z.string()),
});
/** Result file details schema */
export const ResultFileDetailsSchema = z.object({
    filename: z.string(),
    content: z.string(),
    lineCount: z.number(),
    studentName: z.string(),
});
/** Result details response schema */
export const ResultDetailsResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    result: z.object({
        id: z.number(),
        similarity: z.number(),
        leftFileId: z.number(),
        rightFileId: z.number(),
    }),
    fragments: z.array(z.object({
        id: z.number(),
        leftStartRow: z.number(),
        leftStartCol: z.number(),
        leftEndRow: z.number(),
        leftEndCol: z.number(),
        rightStartRow: z.number(),
        rightStartCol: z.number(),
        rightEndRow: z.number(),
        rightEndCol: z.number(),
        length: z.number(),
    })),
    leftFile: ResultFileDetailsSchema,
    rightFile: ResultFileDetailsSchema,
});
/** Delete report response schema */
export const DeleteReportResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});
/** Error response schema */
export const ErrorResponseSchema = z.object({
    error: z.string(),
});
//# sourceMappingURL=plagiarism.schema.js.map