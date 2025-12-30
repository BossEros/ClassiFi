import { z } from 'zod';
/** Days of the week enum */
export declare const DayOfWeekSchema: z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>;
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
/** Schedule schema for class meetings */
export declare const ScheduleSchema: z.ZodObject<{
    days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
    startTime: z.ZodString;
    endTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
    startTime: string;
    endTime: string;
}, {
    days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
    startTime: string;
    endTime: string;
}>;
export type Schedule = z.infer<typeof ScheduleSchema>;
/** Create class request schema */
export declare const CreateClassRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    className: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    classCode: z.ZodString;
    yearLevel: z.ZodNumber;
    semester: z.ZodNumber;
    academicYear: z.ZodString;
    schedule: z.ZodObject<{
        days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    className: string;
    classCode: string;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    };
    description?: string | undefined;
}, {
    teacherId: number;
    className: string;
    classCode: string;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    };
    description?: string | undefined;
}>;
export type CreateClassRequest = z.infer<typeof CreateClassRequestSchema>;
/** Update class request schema */
export declare const UpdateClassRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    className: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    yearLevel: z.ZodOptional<z.ZodNumber>;
    semester: z.ZodOptional<z.ZodNumber>;
    academicYear: z.ZodOptional<z.ZodString>;
    schedule: z.ZodOptional<z.ZodObject<{
        days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    className?: string | undefined;
    description?: string | null | undefined;
    yearLevel?: number | undefined;
    semester?: number | undefined;
    academicYear?: string | undefined;
    schedule?: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    } | undefined;
    isActive?: boolean | undefined;
}, {
    teacherId: number;
    className?: string | undefined;
    description?: string | null | undefined;
    yearLevel?: number | undefined;
    semester?: number | undefined;
    academicYear?: string | undefined;
    schedule?: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    } | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateClassRequest = z.infer<typeof UpdateClassRequestSchema>;
/** Delete class request schema */
export declare const DeleteClassRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
}, {
    teacherId: number;
}>;
export type DeleteClassRequest = z.infer<typeof DeleteClassRequestSchema>;
/** Class ID param schema (auto-coerces string to number) */
export declare const ClassIdParamSchema: z.ZodObject<{
    classId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    classId: number;
}, {
    classId: number;
}>;
export type ClassIdParam = z.infer<typeof ClassIdParamSchema>;
/** Teacher ID param schema (auto-coerces string to number) */
export declare const TeacherIdParamSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
}, {
    teacherId: number;
}>;
export type TeacherIdParam = z.infer<typeof TeacherIdParamSchema>;
/** Student ID param schema (auto-coerces string to number) */
export declare const StudentIdParamSchema: z.ZodObject<{
    studentId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    studentId: number;
}, {
    studentId: number;
}>;
export type StudentIdParam = z.infer<typeof StudentIdParamSchema>;
/** Get classes query schema */
export declare const GetClassesQuerySchema: z.ZodObject<{
    activeOnly: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    activeOnly?: string | undefined;
}, {
    activeOnly?: string | undefined;
}>;
export type GetClassesQuery = z.infer<typeof GetClassesQuerySchema>;
/** Get class by ID query schema */
export declare const GetClassByIdQuerySchema: z.ZodObject<{
    teacherId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    teacherId?: string | undefined;
}, {
    teacherId?: string | undefined;
}>;
export type GetClassByIdQuery = z.infer<typeof GetClassByIdQuerySchema>;
/** Teacher ID query schema */
export declare const TeacherIdQuerySchema: z.ZodObject<{
    teacherId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    teacherId: string;
}, {
    teacherId: string;
}>;
export type TeacherIdQuery = z.infer<typeof TeacherIdQuerySchema>;
/** Class response schema */
export declare const ClassResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    teacherId: z.ZodNumber;
    className: z.ZodString;
    classCode: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    yearLevel: z.ZodNumber;
    semester: z.ZodNumber;
    academicYear: z.ZodString;
    schedule: z.ZodObject<{
        days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }, {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    }>;
    createdAt: z.ZodString;
    isActive: z.ZodBoolean;
    studentCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: string;
    teacherId: number;
    className: string;
    classCode: string;
    description: string | null;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    };
    isActive: boolean;
    studentCount?: number | undefined;
}, {
    id: number;
    createdAt: string;
    teacherId: number;
    className: string;
    classCode: string;
    description: string | null;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: {
        days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
        startTime: string;
        endTime: string;
    };
    isActive: boolean;
    studentCount?: number | undefined;
}>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
/** Student response schema */
export declare const StudentResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}, {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
/** Success message response schema */
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
/** Create class response schema */
export declare const CreateClassResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    class: z.ZodObject<{
        id: z.ZodNumber;
        teacherId: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        yearLevel: z.ZodNumber;
        semester: z.ZodNumber;
        academicYear: z.ZodString;
        schedule: z.ZodObject<{
            days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}>;
export type CreateClassResponse = z.infer<typeof CreateClassResponseSchema>;
/** Get class response schema */
export declare const GetClassResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    class: z.ZodObject<{
        id: z.ZodNumber;
        teacherId: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        yearLevel: z.ZodNumber;
        semester: z.ZodNumber;
        academicYear: z.ZodString;
        schedule: z.ZodObject<{
            days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}>;
export type GetClassResponse = z.infer<typeof GetClassResponseSchema>;
/** Update class response schema */
export declare const UpdateClassResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    class: z.ZodObject<{
        id: z.ZodNumber;
        teacherId: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        yearLevel: z.ZodNumber;
        semester: z.ZodNumber;
        academicYear: z.ZodString;
        schedule: z.ZodObject<{
            days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}, {
    message: string;
    success: true;
    class: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    };
}>;
export type UpdateClassResponse = z.infer<typeof UpdateClassResponseSchema>;
/** Class list response schema */
export declare const ClassListResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    classes: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        teacherId: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        yearLevel: z.ZodNumber;
        semester: z.ZodNumber;
        academicYear: z.ZodString;
        schedule: z.ZodObject<{
            days: z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }, {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        }>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    classes: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }[];
    success: true;
}, {
    message: string;
    classes: {
        id: number;
        createdAt: string;
        teacherId: number;
        className: string;
        classCode: string;
        description: string | null;
        yearLevel: number;
        semester: number;
        academicYear: string;
        schedule: {
            days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
            startTime: string;
            endTime: string;
        };
        isActive: boolean;
        studentCount?: number | undefined;
    }[];
    success: true;
}>;
export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;
/** Generate code response schema */
export declare const GenerateCodeResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    code: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    success: true;
}, {
    code: string;
    message: string;
    success: true;
}>;
export type GenerateCodeResponse = z.infer<typeof GenerateCodeResponseSchema>;
/** Class students response schema */
export declare const ClassStudentsResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    students: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        username: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }, {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    students: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }[];
}, {
    message: string;
    success: true;
    students: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
    }[];
}>;
export type ClassStudentsResponse = z.infer<typeof ClassStudentsResponseSchema>;
/** Combined params for student removal (classId + studentId) */
export declare const ClassStudentParamsSchema: z.ZodObject<{
    classId: z.ZodString;
    studentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    classId: string;
    studentId: string;
}, {
    classId: string;
    studentId: string;
}>;
export type ClassStudentParams = z.infer<typeof ClassStudentParamsSchema>;
//# sourceMappingURL=class.schema.d.ts.map