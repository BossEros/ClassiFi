import { describe, it, expect } from "vitest"
import type { Schedule } from "@/shared/types/class"
import {
  validateClassName,
  validateClassDescription,
  validateClassCode,
  validateClassJoinCode,
  validateYearLevel,
  validateSemester,
  validateAcademicYear,
  validateSchedule,
  validateCreateClassData,
  validateClassField,
} from "@/business/validation/classValidation"

describe("classValidation", () => {
  // ============ validateClassName Tests ============
  describe("validateClassName", () => {
    it("should return null for valid class name", () => {
      expect(validateClassName("Introduction to Programming")).toBeNull()
    })

    it("should return error for empty class name", () => {
      expect(validateClassName("")).toBe("Class name is required")
    })

    it("should return error for whitespace-only class name", () => {
      expect(validateClassName("   ")).toBe("Class name is required")
    })

    it("should return null for single character class name", () => {
      expect(validateClassName("A")).toBeNull()
    })

    it("should return null for 100 character class name", () => {
      const className = "A".repeat(100)
      expect(validateClassName(className)).toBeNull()
    })

    it("should return error for class name exceeding 100 characters", () => {
      const className = "A".repeat(101)
      expect(validateClassName(className)).toBe(
        "Class name must not exceed 100 characters",
      )
    })

    it("should trim whitespace and validate", () => {
      expect(validateClassName("  Valid Name  ")).toBeNull()
    })
  })

  // ============ validateClassDescription Tests ============
  describe("validateClassDescription", () => {
    it("should return null for valid description", () => {
      expect(
        validateClassDescription("This is a valid class description."),
      ).toBeNull()
    })

    it("should return null for empty description (optional field)", () => {
      expect(validateClassDescription("")).toBeNull()
    })

    it("should return null for 1000 character description", () => {
      const description = "A".repeat(1000)
      expect(validateClassDescription(description)).toBeNull()
    })

    it("should return error for description exceeding 1000 characters", () => {
      const description = "A".repeat(1001)
      expect(validateClassDescription(description)).toBe(
        "Description must not exceed 1000 characters",
      )
    })

    it("should trim whitespace and validate", () => {
      expect(validateClassDescription("  Description  ")).toBeNull()
    })
  })

  // ============ validateClassCode Tests ============
  describe("validateClassCode", () => {
    it("returns null for non-empty class code", () => {
      expect(validateClassCode("ABC123")).toBeNull()
    })

    it("returns error for empty class code", () => {
      expect(validateClassCode("")).toBe("Class code is required")
      expect(validateClassCode("   ")).toBe("Class code is required")
    })
  })

  // ============ validateClassJoinCode Tests ============
  describe("validateClassJoinCode", () => {
    it("returns null for valid 6-8 char alphanumeric join code", () => {
      expect(validateClassJoinCode("ABC123")).toBeNull()
      expect(validateClassJoinCode("AB12CD34")).toBeNull()
    })

    it("returns error for empty join code", () => {
      expect(validateClassJoinCode("")).toBe("Class code is required")
    })

    it("returns error for invalid join code format", () => {
      expect(validateClassJoinCode("ABC")).toBe(
        "Invalid class code format. Please enter a 6-8 character alphanumeric code.",
      )
      expect(validateClassJoinCode("ABC12!")).toBe(
        "Invalid class code format. Please enter a 6-8 character alphanumeric code.",
      )
    })
  })

  // ============ validateYearLevel Tests ============
  describe("validateYearLevel", () => {
    it("returns null for valid year levels", () => {
      expect(validateYearLevel(1)).toBeNull()
      expect(validateYearLevel(4)).toBeNull()
    })

    it("returns error for invalid year levels", () => {
      expect(validateYearLevel(0)).toBe("Year level must be 1, 2, 3, or 4")
      expect(validateYearLevel(5)).toBe("Year level must be 1, 2, 3, or 4")
    })
  })

  // ============ validateSemester Tests ============
  describe("validateSemester", () => {
    it("returns null for valid semesters", () => {
      expect(validateSemester(1)).toBeNull()
      expect(validateSemester(2)).toBeNull()
    })

    it("returns error for invalid semesters", () => {
      expect(validateSemester(0)).toBe("Semester must be 1 or 2")
      expect(validateSemester(3)).toBe("Semester must be 1 or 2")
    })
  })

  // ============ validateAcademicYear Tests ============
  describe("validateAcademicYear", () => {
    it("returns null for valid academic year", () => {
      expect(validateAcademicYear("2024-2025")).toBeNull()
    })

    it("returns errors for invalid academic year values", () => {
      expect(validateAcademicYear("")).toBe("Academic year is required")
      expect(validateAcademicYear("2024/2025")).toBe(
        "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)",
      )
      expect(validateAcademicYear("2024-2026")).toBe(
        "End year must be exactly one year after start year",
      )
    })
  })

  // ============ validateSchedule Tests ============
  describe("validateSchedule", () => {
    const validSchedule: Schedule = {
      days: ["monday"],
      startTime: "08:00",
      endTime: "10:00",
    }

    it("returns null for valid schedule", () => {
      expect(validateSchedule(validSchedule)).toBeNull()
    })

    it("returns required errors for missing schedule fields", () => {
      expect(validateSchedule(undefined)).toBe("Schedule is required")
      expect(validateSchedule({ ...validSchedule, days: [] })).toBe(
        "At least one schedule day is required",
      )
      expect(validateSchedule({ ...validSchedule, startTime: "" })).toBe(
        "Schedule start time is required",
      )
      expect(validateSchedule({ ...validSchedule, endTime: "" })).toBe(
        "Schedule end time is required",
      )
    })

    it("returns errors for invalid schedule time format and ordering", () => {
      expect(validateSchedule({ ...validSchedule, startTime: "8:00" })).toBe(
        "Invalid time format for startTime",
      )
      expect(validateSchedule({ ...validSchedule, endTime: "10:0" })).toBe(
        "Invalid time format for endTime",
      )
      expect(
        validateSchedule({
          ...validSchedule,
          startTime: "10:00",
          endTime: "09:59",
        }),
      ).toBe("Schedule end time must be after start time")
    })
  })

  // ============ validateCreateClassData Tests ============
  describe("validateCreateClassData", () => {
    type CreateClassInput = Parameters<typeof validateCreateClassData>[0]

    it("should return valid result for correct data", () => {
      const result = validateCreateClassData({
        className: "Data Structures",
        description: "Learn about data structures and algorithms.",
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return valid result with empty description", () => {
      const result = validateCreateClassData({
        className: "Programming 101",
        description: "",
      })

      expect(result.isValid).toBe(true)
    })

    it("should return valid result when all optional validated fields are provided", () => {
      const result = validateCreateClassData({
        className: "Data Structures",
        description: "Learn data structures",
        classCode: "ABC123",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: {
          days: ["monday", "wednesday"],
          startTime: "09:00",
          endTime: "10:00",
        },
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return errors for empty class name", () => {
      const result = validateCreateClassData({
        className: "",
        description: "Some description",
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.find((e) => e.field === "className")?.message).toBe(
        "Class name is required",
      )
    })

    it("should return multiple errors when all fields are invalid", () => {
      const invalidData = {
        className: "",
        description: "A".repeat(1001),
        classCode: "",
        yearLevel: 5,
        semester: 3,
        academicYear: "2024-2026",
        schedule: {
          days: [],
          startTime: "09:00",
          endTime: "10:00",
        },
      } as unknown as CreateClassInput

      const result = validateCreateClassData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.find((e) => e.field === "className")).toBeDefined()
      expect(result.errors.find((e) => e.field === "description")).toBeDefined()
      expect(result.errors.find((e) => e.field === "classCode")).toBeDefined()
      expect(result.errors.find((e) => e.field === "yearLevel")).toBeDefined()
      expect(result.errors.find((e) => e.field === "semester")).toBeDefined()
      expect(
        result.errors.find((e) => e.field === "academicYear"),
      ).toBeDefined()
      expect(result.errors.find((e) => e.field === "schedule")).toBeDefined()
    })
  })

  // ============ validateClassField Tests ============
  describe("validateClassField", () => {
    it("should validate className field", () => {
      expect(validateClassField("className", "")).toBe("Class name is required")
      expect(validateClassField("className", "Valid")).toBeNull()
    })

    it("should validate description field", () => {
      expect(validateClassField("description", "A".repeat(1001))).toBe(
        "Description must not exceed 1000 characters",
      )
      expect(validateClassField("description", "Valid")).toBeNull()
    })

    it("should validate class code and join-format related fields", () => {
      expect(validateClassField("classCode", "")).toBe("Class code is required")
      expect(validateClassField("classCode", "ABC123")).toBeNull()
    })

    it("should validate year level, semester, and academic year fields", () => {
      expect(validateClassField("yearLevel", 5)).toBe(
        "Year level must be 1, 2, 3, or 4",
      )
      expect(validateClassField("semester", 3)).toBe("Semester must be 1 or 2")
      expect(validateClassField("academicYear", "2024-2026")).toBe(
        "End year must be exactly one year after start year",
      )
    })

    it("should validate schedule field", () => {
      expect(
        validateClassField("schedule", {
          days: ["monday"],
          startTime: "11:00",
          endTime: "10:00",
        }),
      ).toBe("Schedule end time must be after start time")
    })

    it("should return null for unknown field", () => {
      expect(validateClassField("unknownField", "value")).toBeNull()
    })
  })
})
