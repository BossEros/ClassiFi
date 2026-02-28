import { describe, expect, it } from "vitest"
import {
  adminClassFormSchema,
  joinClassFormSchema,
  teacherClassFormSchema,
} from "@/presentation/schemas/class/classSchemas"

describe("classSchemas", () => {
  describe("teacherClassFormSchema", () => {
    it("accepts valid teacher class form values", () => {
      const parseResult = teacherClassFormSchema.safeParse({
        className: "Introduction to Programming",
        description: "Core programming concepts",
        classCode: "ABC123",
        yearLevel: 1,
        semester: 1,
        academicYear: "2025-2026",
        schedule: {
          days: ["monday", "wednesday"],
          startTime: "08:00",
          endTime: "09:30",
        },
      })

      expect(parseResult.success).toBe(true)
    })

    it("rejects invalid schedule range", () => {
      const parseResult = teacherClassFormSchema.safeParse({
        className: "Data Structures",
        description: "",
        classCode: "DEF456",
        yearLevel: 2,
        semester: 1,
        academicYear: "2025-2026",
        schedule: {
          days: ["monday"],
          startTime: "10:00",
          endTime: "09:30",
        },
      })

      expect(parseResult.success).toBe(false)
      expect(parseResult.error?.issues[0]?.message).toBe(
        "End time must be after start time",
      )
    })

    it("rejects invalid academic year", () => {
      const parseResult = teacherClassFormSchema.safeParse({
        className: "Algorithms",
        description: "",
        classCode: "GHI789",
        yearLevel: 3,
        semester: 2,
        academicYear: "2025-2027",
        schedule: {
          days: ["tuesday"],
          startTime: "10:00",
          endTime: "11:30",
        },
      })

      expect(parseResult.success).toBe(false)
      expect(parseResult.error?.issues[0]?.message).toBe(
        "End year must be exactly one year after start year",
      )
    })
  })

  describe("joinClassFormSchema", () => {
    it("accepts valid class code length", () => {
      const parseResult = joinClassFormSchema.safeParse({
        classCode: "ABC123",
      })

      expect(parseResult.success).toBe(true)
    })

    it("rejects blank class code", () => {
      const parseResult = joinClassFormSchema.safeParse({
        classCode: "   ",
      })

      expect(parseResult.success).toBe(false)
      expect(parseResult.error?.issues[0]?.message).toBe(
        "Please enter a class code",
      )
    })

    it("rejects invalid class code length", () => {
      const parseResult = joinClassFormSchema.safeParse({
        classCode: "ABC",
      })

      expect(parseResult.success).toBe(false)
      expect(parseResult.error?.issues[0]?.message).toBe(
        "Class code must be 6-8 characters",
      )
    })
  })

  describe("adminClassFormSchema", () => {
    it("accepts valid admin class form values", () => {
      const parseResult = adminClassFormSchema.safeParse({
        className: "Operating Systems",
        description: "OS concepts",
        teacherId: "10",
        yearLevel: 4,
        semester: 2,
        academicYear: "2025-2026",
        scheduleDays: ["Mon", "Wed"],
        startTime: "13:00",
        endTime: "14:30",
      })

      expect(parseResult.success).toBe(true)
    })

    it("rejects missing teacher and schedule day", () => {
      const parseResult = adminClassFormSchema.safeParse({
        className: "Networks",
        description: "",
        teacherId: "",
        yearLevel: 2,
        semester: 1,
        academicYear: "2025-2026",
        scheduleDays: [],
        startTime: "08:00",
        endTime: "09:00",
      })

      expect(parseResult.success).toBe(false)
      expect(
        parseResult.error?.issues.some(
          (issue) => issue.message === "Please select a teacher",
        ),
      ).toBe(true)
      expect(
        parseResult.error?.issues.some(
          (issue) => issue.message === "At least one schedule day is required",
        ),
      ).toBe(true)
    })
  })
})
