/**
 * DTO Mappers
 * Convert between database entities and API response objects
 */
export function toUserDTO(user) {
    return {
        id: user.id,
        supabaseUserId: user.supabaseUserId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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
        username: user.username,
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
        createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
        ...extras,
    };
}
//# sourceMappingURL=mappers.js.map