import { z } from 'zod';
/** Supported programming languages for plagiarism detection */
export declare const PlagiarismLanguageSchema: z.ZodEnum<{
    python: "python";
    java: "java";
    c: "c";
}>;
export type PlagiarismLanguage = z.infer<typeof PlagiarismLanguageSchema>;
/** File input for plagiarism analysis */
export declare const PlagiarismFileSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    content: z.ZodString;
    studentId: z.ZodOptional<z.ZodString>;
    studentName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PlagiarismFile = z.infer<typeof PlagiarismFileSchema>;
/** Template file schema */
export declare const TemplateFileSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export type TemplateFile = z.infer<typeof TemplateFileSchema>;
/** Analyze request body schema */
export declare const AnalyzeRequestSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        content: z.ZodString;
        studentId: z.ZodOptional<z.ZodString>;
        studentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    language: z.ZodEnum<{
        python: "python";
        java: "java";
        c: "c";
    }>;
    templateFile: z.ZodOptional<z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>>;
    threshold: z.ZodOptional<z.ZodNumber>;
    kgramLength: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
/** Report ID param schema */
export declare const ReportIdParamSchema: z.ZodObject<{
    reportId: z.ZodString;
}, z.core.$strip>;
export type ReportIdParam = z.infer<typeof ReportIdParamSchema>;
/** Assignment ID param schema for plagiarism */
export declare const PlagiarismAssignmentIdParamSchema: z.ZodObject<{
    assignmentId: z.ZodString;
}, z.core.$strip>;
export type PlagiarismAssignmentIdParam = z.infer<typeof PlagiarismAssignmentIdParamSchema>;
/** Report and Pair ID params schema */
export declare const ReportPairParamsSchema: z.ZodObject<{
    reportId: z.ZodString;
    pairId: z.ZodString;
}, z.core.$strip>;
export type ReportPairParams = z.infer<typeof ReportPairParamsSchema>;
/** Result ID param schema */
export declare const ResultIdParamSchema: z.ZodObject<{
    resultId: z.ZodString;
}, z.core.$strip>;
export type ResultIdParam = z.infer<typeof ResultIdParamSchema>;
/** File response schema */
export declare const FileResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    path: z.ZodString;
    filename: z.ZodString;
    lineCount: z.ZodNumber;
    studentId: z.ZodOptional<z.ZodString>;
    studentName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FileResponse = z.infer<typeof FileResponseSchema>;
/** Pair response schema */
export declare const PairResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    leftFile: z.ZodObject<{
        id: z.ZodNumber;
        path: z.ZodString;
        filename: z.ZodString;
        lineCount: z.ZodNumber;
        studentId: z.ZodOptional<z.ZodString>;
        studentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    rightFile: z.ZodObject<{
        id: z.ZodNumber;
        path: z.ZodString;
        filename: z.ZodString;
        lineCount: z.ZodNumber;
        studentId: z.ZodOptional<z.ZodString>;
        studentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    structuralScore: z.ZodNumber;
    semanticScore: z.ZodNumber;
    hybridScore: z.ZodNumber;
    overlap: z.ZodNumber;
    longest: z.ZodNumber;
}, z.core.$strip>;
export type PairResponse = z.infer<typeof PairResponseSchema>;
/** Summary response schema */
export declare const SummaryResponseSchema: z.ZodObject<{
    totalFiles: z.ZodNumber;
    totalPairs: z.ZodNumber;
    suspiciousPairs: z.ZodNumber;
    averageSimilarity: z.ZodNumber;
    maxSimilarity: z.ZodNumber;
}, z.core.$strip>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
/** Analyze response schema */
export declare const AnalyzeResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    reportId: z.ZodString;
    summary: z.ZodObject<{
        totalFiles: z.ZodNumber;
        totalPairs: z.ZodNumber;
        suspiciousPairs: z.ZodNumber;
        averageSimilarity: z.ZodNumber;
        maxSimilarity: z.ZodNumber;
    }, z.core.$strip>;
    pairs: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        leftFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        rightFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        structuralScore: z.ZodNumber;
        semanticScore: z.ZodNumber;
        hybridScore: z.ZodNumber;
        overlap: z.ZodNumber;
        longest: z.ZodNumber;
    }, z.core.$strip>>;
    warnings: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
/** Selection schema for fragment positions */
export declare const SelectionSchema: z.ZodObject<{
    startRow: z.ZodNumber;
    startCol: z.ZodNumber;
    endRow: z.ZodNumber;
    endCol: z.ZodNumber;
}, z.core.$strip>;
export type Selection = z.infer<typeof SelectionSchema>;
/** Fragment response schema */
export declare const FragmentResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    leftSelection: z.ZodObject<{
        startRow: z.ZodNumber;
        startCol: z.ZodNumber;
        endRow: z.ZodNumber;
        endCol: z.ZodNumber;
    }, z.core.$strip>;
    rightSelection: z.ZodObject<{
        startRow: z.ZodNumber;
        startCol: z.ZodNumber;
        endRow: z.ZodNumber;
        endCol: z.ZodNumber;
    }, z.core.$strip>;
    length: z.ZodNumber;
}, z.core.$strip>;
export type FragmentResponse = z.infer<typeof FragmentResponseSchema>;
/** Pair details response schema */
export declare const PairDetailsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    pair: z.ZodObject<{
        id: z.ZodNumber;
        leftFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        rightFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        structuralScore: z.ZodNumber;
        semanticScore: z.ZodNumber;
        hybridScore: z.ZodNumber;
        overlap: z.ZodNumber;
        longest: z.ZodNumber;
    }, z.core.$strip>;
    fragments: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        leftSelection: z.ZodObject<{
            startRow: z.ZodNumber;
            startCol: z.ZodNumber;
            endRow: z.ZodNumber;
            endCol: z.ZodNumber;
        }, z.core.$strip>;
        rightSelection: z.ZodObject<{
            startRow: z.ZodNumber;
            startCol: z.ZodNumber;
            endRow: z.ZodNumber;
            endCol: z.ZodNumber;
        }, z.core.$strip>;
        length: z.ZodNumber;
    }, z.core.$strip>>;
    leftCode: z.ZodString;
    rightCode: z.ZodString;
}, z.core.$strip>;
export type PairDetailsResponse = z.infer<typeof PairDetailsResponseSchema>;
/** Get report response schema */
export declare const GetReportResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    reportId: z.ZodString;
    summary: z.ZodObject<{
        totalFiles: z.ZodNumber;
        totalPairs: z.ZodNumber;
        suspiciousPairs: z.ZodNumber;
        averageSimilarity: z.ZodNumber;
        maxSimilarity: z.ZodNumber;
    }, z.core.$strip>;
    pairs: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        leftFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        rightFile: z.ZodObject<{
            id: z.ZodNumber;
            path: z.ZodString;
            filename: z.ZodString;
            lineCount: z.ZodNumber;
            studentId: z.ZodOptional<z.ZodString>;
            studentName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        structuralScore: z.ZodNumber;
        semanticScore: z.ZodNumber;
        hybridScore: z.ZodNumber;
        overlap: z.ZodNumber;
        longest: z.ZodNumber;
    }, z.core.$strip>>;
    warnings: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type GetReportResponse = z.infer<typeof GetReportResponseSchema>;
/** Result file details schema */
export declare const ResultFileDetailsSchema: z.ZodObject<{
    filename: z.ZodString;
    content: z.ZodString;
    lineCount: z.ZodNumber;
    studentName: z.ZodString;
}, z.core.$strip>;
export type ResultFileDetails = z.infer<typeof ResultFileDetailsSchema>;
/** Result details response schema */
export declare const ResultDetailsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    result: z.ZodObject<{
        id: z.ZodNumber;
        similarity: z.ZodNumber;
        leftFileId: z.ZodNumber;
        rightFileId: z.ZodNumber;
    }, z.core.$strip>;
    fragments: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        leftStartRow: z.ZodNumber;
        leftStartCol: z.ZodNumber;
        leftEndRow: z.ZodNumber;
        leftEndCol: z.ZodNumber;
        rightStartRow: z.ZodNumber;
        rightStartCol: z.ZodNumber;
        rightEndRow: z.ZodNumber;
        rightEndCol: z.ZodNumber;
        length: z.ZodNumber;
    }, z.core.$strip>>;
    leftFile: z.ZodObject<{
        filename: z.ZodString;
        content: z.ZodString;
        lineCount: z.ZodNumber;
        studentName: z.ZodString;
    }, z.core.$strip>;
    rightFile: z.ZodObject<{
        filename: z.ZodString;
        content: z.ZodString;
        lineCount: z.ZodNumber;
        studentName: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ResultDetailsResponse = z.infer<typeof ResultDetailsResponseSchema>;
/** Delete report response schema */
export declare const DeleteReportResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
}, z.core.$strip>;
export type DeleteReportResponse = z.infer<typeof DeleteReportResponseSchema>;
/** Error response schema */
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
}, z.core.$strip>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
//# sourceMappingURL=plagiarism.schema.d.ts.map