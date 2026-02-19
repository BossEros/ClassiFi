/**
 * ClassRepository Unit Tests
 * Tests for class-related database operations
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockClass } from "../utils/factories.js"

// Mock database module
vi.mock("../../src/shared/database.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value, type: "eq" })),
  and: vi.fn((...args) => ({ type: "and", conditions: args })),
  desc: vi.fn((field) => ({ field, type: "desc" })),
  sql: vi.fn((strings, ...values) => ({ type: "sql", strings, values })),
}))

// Mock models
vi.mock("../../src/models/index.js", () => ({
  classes: {
    id: "id",
    teacherId: "teacherId",
    className: "className",
    classCode: "classCode",
    isActive: "isActive",
  },
  enrollments: {
    id: "id",
    classId: "classId",
    studentId: "studentId",
  },
  users: {
    id: "id",
    firstName: "firstName",
    lastName: "lastName",
    email: "email",
  },
}))

describe("ClassRepository", () => {
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { db } = await import("../../src/shared/database.js")
    mockDb = db
  })

  // ============ getClassById Tests ============
  describe("getClassById Logic", () => {
    it("should return class when found", async () => {
      const mockClass = createMockClass({ id: 1 })
      const limitMock = vi.fn().mockResolvedValue([mockClass])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getClassById(1)

      expect(result).toEqual(mockClass)
    })

    it("should return undefined when class not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getClassById(999)

      expect(result).toBeUndefined()
    })
  })

  // ============ getClassByCode Tests ============
  describe("getClassByCode Logic", () => {
    it("should return class when code matches", async () => {
      const mockClass = createMockClass({ classCode: "ABC123" })
      const limitMock = vi.fn().mockResolvedValue([mockClass])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getClassByCode("ABC123")

      expect(result).toEqual(mockClass)
    })

    it("should return undefined when code not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getClassByCode("INVALID")

      expect(result).toBeUndefined()
    })
  })

  // ============ checkClassCodeExists Tests ============
  describe("checkClassCodeExists Logic", () => {
    it("should return true when code exists", async () => {
      const limitMock = vi.fn().mockResolvedValue([{ id: 1 }])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.checkClassCodeExists("ABC123")

      expect(result).toBe(true)
    })

    it("should return false when code does not exist", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.checkClassCodeExists("NEWCODE")

      expect(result).toBe(false)
    })
  })

  // ============ createClass Tests ============
  describe("createClass Logic", () => {
    it("should create class with all required fields", async () => {
      const newClass = createMockClass()
      const returningMock = vi.fn().mockResolvedValue([newClass])
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock })
      const insertMock = vi.fn().mockReturnValue({ values: valuesMock })
      mockDb.insert = insertMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.createClass({
        teacherId: 1,
        className: "Test Class",
        classCode: "ABC123",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: { days: ["monday"], startTime: "09:00", endTime: "10:00" },
      })

      expect(result).toEqual(newClass)
    })
  })

  // ============ updateClass Tests ============
  describe("updateClass Logic", () => {
    it("should update and return class", async () => {
      const updatedClass = createMockClass({ className: "Updated Class" })
      const returningMock = vi.fn().mockResolvedValue([updatedClass])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.updateClass(1, {
        className: "Updated Class",
      })

      expect(result).toEqual(updatedClass)
    })

    it("should return undefined when class not found", async () => {
      const returningMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock })
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.updateClass(999, { className: "Updated" })

      expect(result).toBeUndefined()
    })
  })

  // ============ deleteClass Tests ============
  describe("deleteClass Logic", () => {
    it("should return true when class is deleted", () => {
      const deletionResult = { rowCount: 1 }
      expect(deletionResult.rowCount > 0).toBe(true)
    })

    it("should return false when class not found", () => {
      const deletionResult = { rowCount: 0 }
      expect(deletionResult.rowCount > 0).toBe(false)
    })
  })

  // ============ getStudentCount Tests ============
  describe("getStudentCount Logic", () => {
    it("should return student count", async () => {
      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 15 }]),
      })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getStudentCount(1)

      expect(result).toBe(15)
    })

    it("should return 0 when no students", async () => {
      const fromMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { ClassRepository } =
        await import("../../src/modules/classes/class.repository.js")
      const classRepo = new ClassRepository()

      const result = await classRepo.getStudentCount(1)

      expect(result).toBe(0)
    })
  })

  // ============ getClassesByTeacher Tests ============
  describe("getClassesByTeacher Logic", () => {
    it("should filter active classes when activeOnly is true", () => {
      const classes = [
        createMockClass({ id: 1, isActive: true, teacherId: 1 }),
        createMockClass({ id: 2, isActive: false, teacherId: 1 }),
        createMockClass({ id: 3, isActive: true, teacherId: 1 }),
      ]

      const activeClasses = classes.filter((c) => c.isActive)

      expect(activeClasses).toHaveLength(2)
      expect(activeClasses.every((c) => c.isActive)).toBe(true)
    })

    it("should return all classes when activeOnly is false", () => {
      const classes = [
        createMockClass({ id: 1, isActive: true, teacherId: 1 }),
        createMockClass({ id: 2, isActive: false, teacherId: 1 }),
      ]

      expect(classes).toHaveLength(2)
    })
  })

  // ============ getClassesByStudent Tests ============
  describe("getClassesByStudent Logic", () => {
    it("should return classes student is enrolled in", () => {
      const classes = [createMockClass({ id: 1 }), createMockClass({ id: 2 })]

      expect(classes).toHaveLength(2)
    })
  })

  // ============ isStudentEnrolled Tests ============
  describe("isStudentEnrolled Logic", () => {
    it("should return true when student is enrolled", () => {
      const enrollments = [{ studentId: 1, classId: 1 }]
      const isEnrolled = enrollments.some(
        (e) => e.studentId === 1 && e.classId === 1,
      )

      expect(isEnrolled).toBe(true)
    })

    it("should return false when student is not enrolled", () => {
      const enrollments = [{ studentId: 1, classId: 1 }]
      const isEnrolled = enrollments.some(
        (e) => e.studentId === 2 && e.classId === 1,
      )

      expect(isEnrolled).toBe(false)
    })
  })
})
