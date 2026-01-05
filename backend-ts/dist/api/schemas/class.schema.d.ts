import { z } from 'zod';
/** Days of the week enum */
export declare const DayOfWeekSchema: z.ZodEnum<{
    monday: "monday";
    tuesday: "tuesday";
    wednesday: "wednesday";
    thursday: "thursday";
    friday: "friday";
    saturday: "saturday";
    sunday: "sunday";
}>;
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
/** Schedule schema for class meetings */
export declare const ScheduleSchema: z.ZodObject<{
    days: z.ZodArray<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    startTime: z.ZodString;
    endTime: z.ZodString;
}, z.core.$strip>;
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
        days: z.ZodArray<z.ZodEnum<{
            monday: "monday";
            tuesday: "tuesday";
            wednesday: "wednesday";
            thursday: "thursday";
            friday: "friday";
            saturday: "saturday";
            sunday: "sunday";
        }>>;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
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
        days: z.ZodArray<z.ZodEnum<{
            monday: "monday";
            tuesday: "tuesday";
            wednesday: "wednesday";
            thursday: "thursday";
            friday: "friday";
            saturday: "saturday";
            sunday: "sunday";
        }>>;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type UpdateClassRequest = z.infer<typeof UpdateClassRequestSchema>;
/** Delete class request schema */
export declare const DeleteClassRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
}, z.core.$strip>;
export type DeleteClassRequest = z.infer<typeof DeleteClassRequestSchema>;
/** Class ID param schema (auto-coerces string to number) */
export declare const ClassIdParamSchema: z.ZodObject<{
    classId: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type ClassIdParam = z.infer<typeof ClassIdParamSchema>;
/** Teacher ID param schema (auto-coerces string to number) */
export declare const TeacherIdParamSchema: z.ZodObject<{
    teacherId: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type TeacherIdParam = z.infer<typeof TeacherIdParamSchema>;
/** Student ID param schema (auto-coerces string to number) */
export declare const StudentIdParamSchema: z.ZodObject<{
    studentId: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type StudentIdParam = z.infer<typeof StudentIdParamSchema>;
/** Get classes query schema */
export declare const GetClassesQuerySchema: z.ZodObject<{
    activeOnly: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetClassesQuery = z.infer<typeof GetClassesQuerySchema>;
/** Get class by ID query schema */
export declare const GetClassByIdQuerySchema: z.ZodObject<{
    teacherId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetClassByIdQuery = z.infer<typeof GetClassByIdQuerySchema>;
/** Teacher ID query schema */
export declare const TeacherIdQuerySchema: z.ZodObject<{
    teacherId: z.ZodString;
}, z.core.$strip>;
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
        days: z.ZodArray<z.ZodEnum<{
            monday: "monday";
            tuesday: "tuesday";
            wednesday: "wednesday";
            thursday: "thursday";
            friday: "friday";
            saturday: "saturday";
            sunday: "sunday";
        }>>;
        startTime: z.ZodString;
        endTime: z.ZodString;
    }, z.core.$strip>;
    createdAt: z.ZodString;
    isActive: z.ZodBoolean;
    studentCount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type ClassResponse = z.infer<typeof ClassResponseSchema>;
/** Student response schema */
export declare const StudentResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
}, z.core.$strip>;
export type StudentResponse = z.infer<typeof StudentResponseSchema>;
/** Success message response schema */
export declare const SuccessMessageSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
}, z.core.$strip>;
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
            days: z.ZodArray<z.ZodEnum<{
                monday: "monday";
                tuesday: "tuesday";
                wednesday: "wednesday";
                thursday: "thursday";
                friday: "friday";
                saturday: "saturday";
                sunday: "sunday";
            }>>;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, z.core.$strip>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
            days: z.ZodArray<z.ZodEnum<{
                monday: "monday";
                tuesday: "tuesday";
                wednesday: "wednesday";
                thursday: "thursday";
                friday: "friday";
                saturday: "saturday";
                sunday: "sunday";
            }>>;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, z.core.$strip>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
            days: z.ZodArray<z.ZodEnum<{
                monday: "monday";
                tuesday: "tuesday";
                wednesday: "wednesday";
                thursday: "thursday";
                friday: "friday";
                saturday: "saturday";
                sunday: "sunday";
            }>>;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, z.core.$strip>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
            days: z.ZodArray<z.ZodEnum<{
                monday: "monday";
                tuesday: "tuesday";
                wednesday: "wednesday";
                thursday: "thursday";
                friday: "friday";
                saturday: "saturday";
                sunday: "sunday";
            }>>;
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, z.core.$strip>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        studentCount: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;
/** Generate code response schema */
export declare const GenerateCodeResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    code: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
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
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ClassStudentsResponse = z.infer<typeof ClassStudentsResponseSchema>;
/** Combined params for student removal (classId + studentId) */
export declare const ClassStudentParamsSchema: z.ZodObject<{
    classId: z.ZodString;
    studentId: z.ZodString;
}, z.core.$strip>;
export type ClassStudentParams = z.infer<typeof ClassStudentParamsSchema>;
//# sourceMappingURL=class.schema.d.ts.map