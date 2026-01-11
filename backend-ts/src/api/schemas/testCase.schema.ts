import { z } from 'zod';

// =============================================================================
// Test Case Schemas
// =============================================================================

/** Create test case request schema */
export const CreateTestCaseRequestSchema = z.object({
    name: z.string().min(1).max(100),
    input: z.string().default(''),
    expectedOutput: z.string().min(1, 'Expected output is required'),
    isHidden: z.boolean().default(false),
    timeLimit: z.number().int().min(1).max(10).default(5),
    sortOrder: z.number().int().min(0).optional(),
});

export type CreateTestCaseRequest = z.infer<typeof CreateTestCaseRequestSchema>;

/** Update test case request schema */
export const UpdateTestCaseRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    input: z.string().optional(),
    expectedOutput: z.string().min(1).optional(),
    isHidden: z.boolean().optional(),
    timeLimit: z.number().int().min(1).max(10).optional(),
    sortOrder: z.number().int().min(0).optional(),
});

export type UpdateTestCaseRequest = z.infer<typeof UpdateTestCaseRequestSchema>;

/** Reorder test cases request schema */
export const ReorderTestCasesRequestSchema = z.object({
    order: z.array(z.object({
        id: z.number().int(),
        sortOrder: z.number().int().min(0),
    })),
});

export type ReorderTestCasesRequest = z.infer<typeof ReorderTestCasesRequestSchema>;

/** Test case response schema */
export const TestCaseResponseSchema = z.object({
    id: z.number(),
    assignmentId: z.number(),
    name: z.string(),
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean(),
    timeLimit: z.number(),
    sortOrder: z.number(),
    createdAt: z.string(),
});

export type TestCaseResponse = z.infer<typeof TestCaseResponseSchema>;

// =============================================================================
// Test Result Schemas
// =============================================================================

/** Run tests preview request schema */
export const RunTestsPreviewRequestSchema = z.object({
    sourceCode: z.string().min(1, 'Source code is required'),
    language: z.enum(['python', 'java', 'c']),
    assignmentId: z.number().int().min(1),
});

export type RunTestsPreviewRequest = z.infer<typeof RunTestsPreviewRequestSchema>;

/** Test result detail schema */
export const TestResultDetailSchema = z.object({
    testCaseId: z.number(),
    name: z.string(),
    status: z.string(),
    isHidden: z.boolean(),
    executionTimeMs: z.number(),
    memoryUsedKb: z.number(),
    input: z.string().optional(),
    expectedOutput: z.string().optional(),
    actualOutput: z.string().optional(),
    errorMessage: z.string().optional(),
});

export type TestResultDetail = z.infer<typeof TestResultDetailSchema>;

/** Test execution summary schema */
export const TestExecutionSummarySchema = z.object({
    submissionId: z.number().optional(),
    passed: z.number(),
    total: z.number(),
    percentage: z.number(),
    results: z.array(TestResultDetailSchema),
});

export type TestExecutionSummary = z.infer<typeof TestExecutionSummarySchema>;

// =============================================================================
// Param Schemas
// =============================================================================

/** Assignment ID param schema */
export const AssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});

export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>;

/** Test case ID param schema */
export const TestCaseIdParamSchema = z.object({
    testCaseId: z.string(),
});

export type TestCaseIdParam = z.infer<typeof TestCaseIdParamSchema>;

/** Submission ID param schema */
export const SubmissionIdParamSchema = z.object({
    submissionId: z.string(),
});

export type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/** Get test cases response schema */
export const GetTestCasesResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    testCases: z.array(TestCaseResponseSchema),
});

export type GetTestCasesResponse = z.infer<typeof GetTestCasesResponseSchema>;

/** Create test case response schema */
export const CreateTestCaseResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    testCase: TestCaseResponseSchema,
});

export type CreateTestCaseResponse = z.infer<typeof CreateTestCaseResponseSchema>;

/** Test results response schema */
export const TestResultsResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    data: TestExecutionSummarySchema,
});

export type TestResultsResponse = z.infer<typeof TestResultsResponseSchema>;
