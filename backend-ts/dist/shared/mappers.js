export function toUserDTO(user) {
    return {
        id: user.id,
        supabaseUserId: user.supabaseUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}
export function toClassDTO(classData, extras) {
    return {
        id: classData.id,
        teacherId: classData.teacherId,
        className: classData.className,
        classCode: classData.classCode,
        description: classData.description,
        yearLevel: classData.yearLevel,
        semester: classData.semester,
        academicYear: classData.academicYear,
        schedule: classData.schedule,
        createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
        isActive: classData.isActive ?? true,
        ...extras,
    };
}
export function toAssignmentDTO(assignment, extras) {
    return {
        id: assignment.id,
        classId: assignment.classId,
        assignmentName: assignment.assignmentName,
        description: assignment.description,
        programmingLanguage: assignment.programmingLanguage,
        deadline: assignment.deadline?.toISOString() ?? '',
        allowResubmission: assignment.allowResubmission ?? true,
        maxAttempts: assignment.maxAttempts ?? null,
        createdAt: assignment.createdAt?.toISOString() ?? new Date().toISOString(),
        isActive: assignment.isActive ?? true,
        ...extras,
    };
}
export function toSubmissionDTO(submission, extras) {
    return {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        fileName: submission.fileName,
        filePath: submission.filePath,
        fileSize: submission.fileSize,
        submissionNumber: submission.submissionNumber,
        submittedAt: submission.submittedAt?.toISOString() ?? new Date().toISOString(),
        isLatest: submission.isLatest ?? false,
        ...extras,
    };
}
export function toStudentDTO(user) {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
    };
}
export function toDashboardClassDTO(classData, extras) {
    return {
        id: classData.id,
        className: classData.className,
        classCode: classData.classCode,
        description: classData.description,
        yearLevel: classData.yearLevel,
        semester: classData.semester,
        academicYear: classData.academicYear,
        schedule: classData.schedule,
        createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
        isActive: classData.isActive ?? true,
        ...extras,
    };
}
/** Configuration for plagiarism detection */
export const PLAGIARISM_CONFIG = {
    /** Default similarity threshold for flagging suspicious pairs */
    DEFAULT_THRESHOLD: 0.5,
    /** Default k-gram length for fingerprinting */
    DEFAULT_KGRAM_LENGTH: 23,
    /** Default number of k-grams in a window */
    DEFAULT_KGRAMS_IN_WINDOW: 17,
    /** Minimum number of files required for analysis */
    MINIMUM_FILES_REQUIRED: 2,
};
/** Supported languages for plagiarism detection */
export const PLAGIARISM_LANGUAGE_MAP = {
    python: 'python',
    java: 'java',
    c: 'c',
};
/** Convert a Pair to PlagiarismPairDTO */
export function toPlagiarismPairDTO(pair, resultId) {
    return {
        id: resultId ?? pair.id,
        leftFile: {
            id: pair.leftFile.id,
            path: pair.leftFile.path,
            filename: pair.leftFile.filename,
            lineCount: pair.leftFile.lineCount,
            studentId: pair.leftFile.info?.studentId,
            studentName: pair.leftFile.info?.studentName,
        },
        rightFile: {
            id: pair.rightFile.id,
            path: pair.rightFile.path,
            filename: pair.rightFile.filename,
            lineCount: pair.rightFile.lineCount,
            studentId: pair.rightFile.info?.studentId,
            studentName: pair.rightFile.info?.studentName,
        },
        structuralScore: pair.similarity,
        semanticScore: 0,
        hybridScore: 0,
        overlap: pair.overlap,
        longest: pair.longest,
    };
}
/** Convert a Fragment to PlagiarismFragmentDTO */
export function toPlagiarismFragmentDTO(fragment, index) {
    return {
        id: index,
        leftSelection: {
            startRow: fragment.leftSelection.startRow,
            startCol: fragment.leftSelection.startCol,
            endRow: fragment.leftSelection.endRow,
            endCol: fragment.leftSelection.endCol,
        },
        rightSelection: {
            startRow: fragment.rightSelection.startRow,
            startCol: fragment.rightSelection.startCol,
            endRow: fragment.rightSelection.endRow,
            endCol: fragment.rightSelection.endCol,
        },
        length: fragment.length,
    };
}
//# sourceMappingURL=mappers.js.map