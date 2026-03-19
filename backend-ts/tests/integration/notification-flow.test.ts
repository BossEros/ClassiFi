import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../src/modules/notifications/notification.service.js"
import { GradebookService } from "../../src/modules/gradebook/gradebook.service.js"
import { AssignmentService } from "../../src/modules/assignments/assignment.service.js"
import type { Notification } from "../../src/models/index.js"

vi.mock("../../src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("Notification Flow Integration Tests", () => {
  let notificationService: NotificationService
  let assignmentService: AssignmentService
  let gradebookService: GradebookService
  let mockNotificationRepo: any
  let mockUserRepo: any
  let mockEmailService: any
  let mockAssignmentRepo: any
  let mockClassRepo: any
  let mockEnrollmentRepo: any
  let mockSubmissionRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockNotificationRepo = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    mockUserRepo = {
      getUserById: vi.fn((userId: number) =>
        Promise.resolve({
          id: userId,
          email: `user${userId}@test.com`,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
        }),
      ),
      withContext: vi.fn().mockReturnThis(),
    }

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      getAssignmentsByTeacherId: vi.fn(),
      getAssignmentsByStudentId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }

    mockClassRepo = {
      getClassById: vi.fn(),
      createClass: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
      getClassesByTeacherId: vi.fn(),
      getClassesByStudentId: vi.fn(),
    }

    mockEnrollmentRepo = {
      getEnrolledStudentsWithInfo: vi.fn(),
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
      isStudentEnrolled: vi.fn(),
      isEnrolled: vi.fn(),
    }

    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      createSubmission: vi.fn(),
      getSubmissionsByAssignmentId: vi.fn(),
      getSubmissionsByStudentId: vi.fn(),
      getLatestSubmission: vi.fn(),
      setGradeOverride: vi.fn(),
      getSubmissionHistory: vi.fn(),
      getSubmissionsByAssignment: vi.fn(),
      updateGrade: vi.fn(),
      removeGradeOverride: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    container.registerInstance("NotificationRepository", mockNotificationRepo)
    container.registerInstance("UserRepository", mockUserRepo)
    container.registerInstance("EmailService", mockEmailService)
    container.registerInstance("AssignmentRepository", mockAssignmentRepo)
    container.registerInstance("ClassRepository", mockClassRepo)
    container.registerInstance("EnrollmentRepository", mockEnrollmentRepo)
    container.registerInstance("SubmissionRepository", mockSubmissionRepo)
    container.registerInstance("StorageService", {
      deleteAssignmentInstructionsImage: vi.fn().mockResolvedValue(true),
    } as any)
    container.registerInstance("TestCaseRepository", {} as any)
    container.registerInstance("ModuleRepository", {
      getModuleById: vi.fn().mockResolvedValue({
        id: 1,
        classId: 1,
        name: "Module 1",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as any)
    container.registerInstance("TestResultRepository", {} as any)
    container.registerInstance("LatePenaltyService", {} as any)

    notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo,
      mockEmailService,
    )
    container.registerInstance("NotificationService", notificationService)

    assignmentService = container.resolve(AssignmentService)
    gradebookService = new GradebookService(
      {} as any,
      mockSubmissionRepo,
      mockAssignmentRepo,
      {} as any,
      {} as any,
      notificationService,
    )
  })

  afterEach(() => {
    container.clearInstances()
  })

  it("creates notifications for enrolled students when an assignment is created", async () => {
    const assignmentData = {
      classId: 1,
      teacherId: 1,
      moduleId: 1,
      assignmentName: "Test Assignment",
      instructions: "Test instructions",
      programmingLanguage: "python" as const,
      deadline: new Date("2024-12-31"),
      allowResubmission: true,
      maxAttempts: null,
      templateCode: null,
      totalScore: 100,
      scheduledDate: null,
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      instructionsImageUrl: null,
    }

    mockAssignmentRepo.createAssignment.mockResolvedValue({
      id: 1,
      ...assignmentData,
      createdAt: new Date(),
      isActive: true,
    })
    mockClassRepo.getClassById.mockResolvedValue({
      id: 1,
      teacherId: 1,
      className: "Test Class",
    })
    mockEnrollmentRepo.getEnrolledStudentsWithInfo.mockResolvedValue([
      { user: { id: 10 } },
      { user: { id: 11 } },
    ])
    mockNotificationRepo.create.mockImplementation(async (data: any) => ({
      id: data.userId,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    }))

    const result = await assignmentService.createAssignment(assignmentData)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.id).toBe(1)
    expect(mockNotificationRepo.create).toHaveBeenCalledTimes(2)
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2)
  })

  it("keeps assignment creation successful when notification persistence fails", async () => {
    const assignmentData = {
      classId: 1,
      teacherId: 1,
      moduleId: 1,
      assignmentName: "Test Assignment",
      instructions: "Test instructions",
      programmingLanguage: "python" as const,
      deadline: new Date("2024-12-31"),
      allowResubmission: true,
      maxAttempts: null,
      templateCode: null,
      totalScore: 100,
      scheduledDate: null,
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      instructionsImageUrl: null,
    }

    mockAssignmentRepo.createAssignment.mockResolvedValue({
      id: 1,
      ...assignmentData,
      createdAt: new Date(),
      isActive: true,
    })
    mockClassRepo.getClassById.mockResolvedValue({
      id: 1,
      teacherId: 1,
      className: "Test Class",
    })
    mockEnrollmentRepo.getEnrolledStudentsWithInfo.mockResolvedValue([
      { user: { id: 10 } },
    ])
    mockNotificationRepo.create.mockRejectedValue(new Error("Database error"))

    await expect(
      assignmentService.createAssignment(assignmentData),
    ).resolves.toBeDefined()
  })

  it("creates a grade notification and sends email when a grade is overridden", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue({
      id: 1,
      assignmentId: 1,
      studentId: 10,
    })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      assignmentName: "Test Assignment",
      totalScore: 100,
    })
    mockSubmissionRepo.setGradeOverride.mockResolvedValue(undefined)
    mockNotificationRepo.create.mockImplementation(async (data: any) => ({
      id: 1,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    }))

    await gradebookService.overrideGrade(1, 85, "Great job")

    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        type: "SUBMISSION_GRADED",
      }),
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })

  it("persists an in-app notification and sends email in the direct notification flow", async () => {
    const payload = {
      assignmentId: 1,
      assignmentTitle: "Test Assignment",
      className: "Test Class",
      classId: 1,
      dueDate: "12/31/2024",
      assignmentUrl: "http://localhost:5173/dashboard/assignments/1",
    }

    const mockNotification: Notification = {
      id: 1,
      userId: 1,
      type: "ASSIGNMENT_CREATED",
      title: "Test Class: New Assignment Posted",
      message:
        'Your teacher has posted a new assignment "Test Assignment" in Test Class, due on 12/31/2024.',
      metadata: payload,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    }

    mockNotificationRepo.create.mockResolvedValue(mockNotification)

    const notification = await notificationService.createNotification(
      1,
      "ASSIGNMENT_CREATED",
      payload,
    )

    expect(notification).toEqual(mockNotification)
    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        metadata: payload,
      }),
    )
    await notificationService.sendEmailNotificationIfEnabled(
      1,
      "ASSIGNMENT_CREATED",
      payload,
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })
})
