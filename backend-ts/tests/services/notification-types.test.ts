import { describe, it, expect } from "vitest"
import { NOTIFICATION_TYPES } from "../../src/modules/notifications/notification.types.js"

describe("Notification Types Registry", () => {
  describe("ASSIGNMENT_CREATED", () => {
    const config = NOTIFICATION_TYPES.ASSIGNMENT_CREATED
    const testData = {
      assignmentTitle: "Homework 1",
      className: "CS 101",
      dueDate: "2024-12-31",
      assignmentUrl: "https://app.com/assignments/1",
      assignmentId: 1,
      classId: 1,
    }

    it("should generate correct title", () => {
      const title = config.titleTemplate(testData)
      expect(title).toBe("CS 101: New Assignment Posted")
    })

    it("should generate correct message", () => {
      const message = config.messageTemplate(testData)
      expect(message).toContain("Homework 1")
      expect(message).toContain("2024-12-31")
    })

    it("should generate email template", () => {
      const email = config.emailTemplate!(testData)
      expect(email).toContain("New Assignment Posted")
      expect(email).toContain("CS 101")
      expect(email).toContain("Homework 1")
    })

    it("should have correct channels", () => {
      expect(config.channels).toEqual(["EMAIL", "IN_APP"])
    })

    it("should generate correct metadata", () => {
      const metadata = config.metadata!(testData)
      expect(metadata).toEqual({
        assignmentId: 1,
        assignmentTitle: "Homework 1",
        className: "CS 101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "https://app.com/assignments/1",
      })
    })
  })

  describe("SUBMISSION_GRADED", () => {
    const config = NOTIFICATION_TYPES.SUBMISSION_GRADED
    const testData = {
      assignmentTitle: "Homework 1",
      grade: 85,
      maxGrade: 100,
      submissionUrl: "https://app.com/submissions/1",
      submissionId: 1,
      assignmentId: 1,
      reason: "automatic_grade" as const,
    }

    it("should generate correct title", () => {
      const title = config.titleTemplate(testData)
      expect(title).toBe("Assignment Graded")
    })

    it("should generate correct message with grade", () => {
      const message = config.messageTemplate(testData)
      expect(message).toContain("Homework 1")
      expect(message).toContain("85/100")
    })

    it("should generate email template with score", () => {
      const email = config.emailTemplate!(testData)
      expect(email).toContain("Your Assignment Has Been Graded")
      expect(email).toContain("85/100")
    })

    it("should generate correct metadata", () => {
      const metadata = config.metadata!(testData)
      expect(metadata).toEqual({
        submissionId: 1,
        assignmentId: 1,
        assignmentTitle: "Homework 1",
        grade: 85,
        maxGrade: 100,
        submissionUrl: "https://app.com/submissions/1",
        reason: "automatic_grade",
        previousGrade: undefined,
        deductedPoints: undefined,
        similarityPercentage: undefined,
        latenessText: undefined,
        matchedStudentNames: undefined,
      })
    })

    it("should generate manual-grade messaging", () => {
      expect(
        config.titleTemplate({ ...testData, reason: "manual_grade" }),
      ).toBe("Teacher Grade Posted")
      expect(
        config.messageTemplate({ ...testData, reason: "manual_grade" }),
      ).toContain("Your teacher graded your submission")
    })

    it("should generate grade-override messaging", () => {
      const overrideData = {
        ...testData,
        reason: "grade_override" as const,
        previousGrade: 70,
        grade: 90,
      }

      expect(config.titleTemplate(overrideData)).toBe(
        "Score Updated by Your Teacher",
      )
      expect(config.messageTemplate(overrideData)).toContain("from 70/100 to 90/100")
    })

    it("should generate late-penalty messaging with lateness context", () => {
      const latePenaltyData = {
        ...testData,
        reason: "late_penalty_applied" as const,
        previousGrade: 90,
        grade: 80,
        latenessText: "You submitted 5 hours late",
      }

      expect(config.titleTemplate(latePenaltyData)).toBe("Late Penalty Applied")
      expect(config.messageTemplate(latePenaltyData)).toContain(
        "You submitted 5 hours late",
      )
    })

    it("should generate similarity deduction messaging when requested", () => {
      const similarityUpdateData = {
        ...testData,
        reason: "similarity_deduction" as const,
        previousGrade: 85,
        deductedPoints: 21,
        grade: 64,
        similarityPercentage: 100,
        matchedStudentNames: ["Alice Student", "Bob Student"],
      }

      expect(config.titleTemplate(similarityUpdateData)).toBe(
        "Score Updated After Similarity Review",
      )
      expect(config.messageTemplate(similarityUpdateData)).toContain("100% source code similarity")
      expect(config.messageTemplate(similarityUpdateData)).toContain(
        "Alice Student and Bob Student",
      )
      expect(config.messageTemplate(similarityUpdateData)).toContain("85/100")
      expect(config.messageTemplate(similarityUpdateData)).toContain("64/100")
    })
  })

  describe("CLASS_ANNOUNCEMENT", () => {
    const config = NOTIFICATION_TYPES.CLASS_ANNOUNCEMENT
    const testData = {
      className: "CS 101",
      message: "Class cancelled tomorrow",
      classId: 1,
    }

    it("should generate correct title", () => {
      const title = config.titleTemplate(testData)
      expect(title).toBe("Announcement: CS 101")
    })

    it("should use message as notification message", () => {
      const message = config.messageTemplate(testData)
      expect(message).toBe("Class cancelled tomorrow")
    })
  })

  describe("DEADLINE_REMINDER", () => {
    const config = NOTIFICATION_TYPES.DEADLINE_REMINDER
    const testData = {
      assignmentTitle: "Final Project",
      dueDate: "2024-12-31",
      assignmentUrl: "https://app.com/assignments/1",
      assignmentId: 1,
    }

    it("should generate correct title", () => {
      const title = config.titleTemplate(testData)
      expect(title).toBe("Assignment Deadline Reminder")
    })

    it("should generate reminder message", () => {
      const message = config.messageTemplate(testData)
      expect(message).toContain("Don't forget")
      expect(message).toContain("Final Project")
      expect(message).toContain("2024-12-31")
    })
  })

  describe("ENROLLMENT_CONFIRMED", () => {
    const config = NOTIFICATION_TYPES.ENROLLMENT_CONFIRMED
    const testData = {
      className: "CS 101",
      instructorName: "Dr. Smith",
      classUrl: "https://app.com/classes/1",
      classId: 1,
      enrollmentId: 1,
    }

    it("should generate correct title", () => {
      const title = config.titleTemplate(testData)
      expect(title).toBe("Enrolled in CS 101")
    })

    it("should generate enrollment confirmation message", () => {
      const message = config.messageTemplate(testData)
      expect(message).toContain("successfully enrolled")
      expect(message).toContain("CS 101")
    })

    it("should generate email with instructor info", () => {
      const email = config.emailTemplate!(testData)
      expect(email).toContain("Welcome to CS 101")
      expect(email).toContain("Dr. Smith")
    })
  })

  describe("Registry completeness", () => {
    it("should have all required notification types", () => {
      const requiredTypes = [
        "ASSIGNMENT_CREATED",
        "SUBMISSION_GRADED",
        "CLASS_ANNOUNCEMENT",
        "DEADLINE_REMINDER",
        "ENROLLMENT_CONFIRMED",
      ]

      requiredTypes.forEach((type) => {
        expect(NOTIFICATION_TYPES[type]).toBeDefined()
      })
    })

    it("should have valid configuration for each type", () => {
      Object.values(NOTIFICATION_TYPES).forEach((config) => {
        expect(config.type).toBeDefined()
        expect(config.titleTemplate).toBeTypeOf("function")
        expect(config.messageTemplate).toBeTypeOf("function")
        expect(config.channels).toBeInstanceOf(Array)
        expect(config.channels.length).toBeGreaterThan(0)
      })
    })
  })
})
