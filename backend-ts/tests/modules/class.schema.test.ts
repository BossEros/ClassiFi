import { describe, expect, it } from "vitest"
import {
  AcademicYearSchema,
  ClassIdParamSchema,
  ClassResponseSchema,
  ClassStudentParamsSchema,
  CreateClassRequestSchema,
  DayOfWeekSchema,
  GetClassByIdQuerySchema,
  GetClassesQuerySchema,
  ScheduleSchema,
  StudentIdParamSchema,
  StudentResponseSchema,
  TeacherIdParamSchema,
  TeacherIdQuerySchema,
  UpdateClassRequestSchema,
} from "../../src/modules/classes/class.schema.js"

describe("Class Schemas", () => {
  const validSchedule = {
    days: ["monday", "wednesday"],
    startTime: "09:00",
    endTime: "10:30",
  } as const

  describe("DayOfWeekSchema", () => {
    it("accepts valid day values", () => {
      const parseResult = DayOfWeekSchema.safeParse("friday")
      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid day values", () => {
      const parseResult = DayOfWeekSchema.safeParse("weekday")
      expect(parseResult.success).toBe(false)
    })
  })

  describe("AcademicYearSchema", () => {
    it("accepts valid consecutive academic year", () => {
      const parseResult = AcademicYearSchema.safeParse("2024-2025")
      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid format", () => {
      const parseResult = AcademicYearSchema.safeParse("2024/2025")
      expect(parseResult.success).toBe(false)
    })

    it("rejects non-consecutive academic years", () => {
      const parseResult = AcademicYearSchema.safeParse("2024-2026")
      expect(parseResult.success).toBe(false)
    })
  })

  describe("ScheduleSchema", () => {
    it("accepts valid schedule", () => {
      const parseResult = ScheduleSchema.safeParse(validSchedule)
      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid HH:MM format", () => {
      const parseResult = ScheduleSchema.safeParse({
        ...validSchedule,
        startTime: "9:00",
      })
      expect(parseResult.success).toBe(false)
    })

    it("rejects when endTime is not after startTime", () => {
      const parseResult = ScheduleSchema.safeParse({
        ...validSchedule,
        startTime: "10:30",
        endTime: "10:30",
      })
      expect(parseResult.success).toBe(false)
    })
  })

  describe("CreateClassRequestSchema", () => {
    it("accepts valid payload", () => {
      const parseResult = CreateClassRequestSchema.safeParse({
        teacherId: 1,
        className: "Programming 101",
        description: "Intro to programming",
        classCode: "ABCD1234",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: validSchedule,
      })
      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid classCode length", () => {
      const parseResult = CreateClassRequestSchema.safeParse({
        teacherId: 1,
        className: "Programming 101",
        classCode: "SHORT",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: validSchedule,
      })
      expect(parseResult.success).toBe(false)
    })
  })

  describe("UpdateClassRequestSchema", () => {
    it("accepts optional partial payload with nullable description", () => {
      const parseResult = UpdateClassRequestSchema.safeParse({
        teacherId: 1,
        description: null,
        isActive: false,
      })
      expect(parseResult.success).toBe(true)
    })

    it("rejects out-of-range semester", () => {
      const parseResult = UpdateClassRequestSchema.safeParse({
        teacherId: 1,
        semester: 3,
      })
      expect(parseResult.success).toBe(false)
    })
  })

  describe("Param and Query Schemas", () => {
    it("coerces classId/teacherId/studentId params", () => {
      expect(ClassIdParamSchema.parse({ classId: "10" }).classId).toBe(10)
      expect(TeacherIdParamSchema.parse({ teacherId: "11" }).teacherId).toBe(11)
      expect(StudentIdParamSchema.parse({ studentId: "12" }).studentId).toBe(12)
    })

    it("coerces teacherId query and keeps optional query fields", () => {
      expect(TeacherIdQuerySchema.parse({ teacherId: "9" }).teacherId).toBe(9)
      expect(GetClassesQuerySchema.parse({ activeOnly: "true" }).activeOnly).toBe("true")
      expect(GetClassByIdQuerySchema.parse({})).toEqual({})
    })

    it("coerces combined class/student params", () => {
      const parsed = ClassStudentParamsSchema.parse({
        classId: "7",
        studentId: "8",
      })

      expect(parsed).toEqual({ classId: 7, studentId: 8 })
    })
  })

  describe("Response Schemas", () => {
    it("accepts class response with optional fields", () => {
      const parseResult = ClassResponseSchema.safeParse({
        id: 1,
        teacherId: 2,
        className: "Programming 101",
        classCode: "ABCD1234",
        description: null,
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: validSchedule,
        createdAt: "2025-01-01T00:00:00.000Z",
        isActive: true,
        studentCount: 30,
        teacherName: "John Doe",
      })
      expect(parseResult.success).toBe(true)
    })

    it("accepts student response", () => {
      const parseResult = StudentResponseSchema.safeParse({
        id: 20,
        email: "student@classifi.com",
        firstName: "Student",
        lastName: "User",
      })
      expect(parseResult.success).toBe(true)
    })
  })
})
