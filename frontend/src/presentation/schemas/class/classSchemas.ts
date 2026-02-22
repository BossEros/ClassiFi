import { z } from "zod"
import {
  validateAcademicYear,
  validateClassDescription,
  validateClassName,
} from "@/business/validation/classValidation"
import { DAY_ABBREVIATIONS } from "@/presentation/constants/schedule.constants"
import type { DayOfWeek } from "@/shared/types/class"

const dayOfWeekValues = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const satisfies readonly DayOfWeek[]

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function parseTimeToMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(":").map(Number)

  return hours * 60 + minutes
}

const classNameSchema = z.string().superRefine((classNameValue, context) => {
  const classNameError = validateClassName(classNameValue)

  if (classNameError) {
    context.addIssue({
      code: "custom",
      message: classNameError,
    })
  }
})

const descriptionSchema = z
  .string()
  .superRefine((descriptionValue, context) => {
    const descriptionError = validateClassDescription(descriptionValue)

    if (descriptionError) {
      context.addIssue({
        code: "custom",
        message: descriptionError,
      })
    }
  })

const academicYearSchema = z
  .string()
  .superRefine((academicYearValue, context) => {
    const academicYearError = validateAcademicYear(academicYearValue)

    if (academicYearError) {
      context.addIssue({
        code: "custom",
        message: academicYearError,
      })
    }
  })

const yearLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
])

const semesterSchema = z.union([z.literal(1), z.literal(2)])

/**
 * Class schedule schema for teacher class form and other class flows.
 */
export const classScheduleSchema = z
  .object({
    days: z.array(z.enum(dayOfWeekValues)).min(1, {
      message: "At least one schedule day is required",
    }),
    startTime: z
      .string()
      .min(1, "Schedule start time is required")
      .regex(timePattern, {
        message: "Invalid time format for startTime",
      }),
    endTime: z
      .string()
      .min(1, "Schedule end time is required")
      .regex(timePattern, {
        message: "Invalid time format for endTime",
      }),
  })
  .superRefine((scheduleValue, context) => {
    const startMinutes = parseTimeToMinutes(scheduleValue.startTime)
    const endMinutes = parseTimeToMinutes(scheduleValue.endTime)

    if (endMinutes <= startMinutes) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      })
    }
  })

/**
 * Teacher class form schema for create/edit class page.
 */
export const teacherClassFormSchema = z.object({
  className: classNameSchema,
  description: descriptionSchema,
  classCode: z.string().min(1, "Class code is required"),
  yearLevel: yearLevelSchema,
  semester: semesterSchema,
  academicYear: academicYearSchema,
  schedule: classScheduleSchema,
})

/**
 * Join class modal schema.
 */
export const joinClassFormSchema = z.object({
  classCode: z.string().superRefine((classCodeValue, context) => {
    const normalizedClassCode = classCodeValue.trim()

    if (!normalizedClassCode) {
      context.addIssue({
        code: "custom",
        message: "Please enter a class code",
      })
      return
    }

    if (
      normalizedClassCode.length < 6 ||
      normalizedClassCode.length > 8
    ) {
      context.addIssue({
        code: "custom",
        message: "Class code must be 6-8 characters",
      })
    }
  }),
})

/**
 * Admin create/edit class modal schema.
 */
export const adminClassFormSchema = z
  .object({
    className: classNameSchema,
    description: descriptionSchema,
    teacherId: z.string().min(1, "Please select a teacher"),
    yearLevel: yearLevelSchema,
    semester: semesterSchema,
    academicYear: academicYearSchema,
    scheduleDays: z
      .array(z.string())
      .min(1, "At least one schedule day is required")
      .superRefine((scheduleDaysValue, context) => {
        const hasInvalidDay = scheduleDaysValue.some(
          (scheduleDayValue) =>
            !DAY_ABBREVIATIONS.includes(scheduleDayValue as (typeof DAY_ABBREVIATIONS)[number]),
        )

        if (hasInvalidDay) {
          context.addIssue({
            code: "custom",
            message: "At least one schedule day is required",
          })
        }
      }),
    startTime: z
      .string()
      .min(1, "Schedule start time is required")
      .regex(timePattern, {
        message: "Invalid time format for startTime",
      }),
    endTime: z
      .string()
      .min(1, "Schedule end time is required")
      .regex(timePattern, {
        message: "Invalid time format for endTime",
      }),
  })
  .superRefine((adminClassValue, context) => {
    const startMinutes = parseTimeToMinutes(adminClassValue.startTime)
    const endMinutes = parseTimeToMinutes(adminClassValue.endTime)

    if (endMinutes <= startMinutes) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      })
    }
  })

export type TeacherClassFormValues = z.infer<typeof teacherClassFormSchema>
export type JoinClassFormValues = z.infer<typeof joinClassFormSchema>
export type AdminClassFormValues = z.infer<typeof adminClassFormSchema>
