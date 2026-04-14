/**
 * IT-008: Assignment Creation Notifies Students
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that creating an assignment notifies enrolled students.
 * Expected Result: The enrolled students receives a notification.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-008 Integration Test Pass - Assignment Creation Notifies Students
 * Suggested Figure Title (System UI): Assignment Management UI - Student Receiving New Assignment Notification 
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("IT-008: Assignment Creation Notifies Students", () => {
  let assignmentService: AssignmentService
  let mockNotificationRepo: any
  let mockEmailService: any
  let mockAssignmentRepo: any
  let mockClassRepo: any
  let mockEnrollmentRepo: any

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

    const mockUserRepo = {
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

    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }
    mockClassRepo = { getClassById: vi.fn() }
    mockEnrollmentRepo = { getEnrolledStudentsWithInfo: vi.fn(), isEnrolled: vi.fn() }

    container.registerInstance("NotificationRepository", mockNotificationRepo)
    container.registerInstance("UserRepository", mockUserRepo)
    container.registerInstance("EmailService", mockEmailService)
    container.registerInstance("AssignmentRepository", mockAssignmentRepo)
    container.registerInstance("ClassRepository", mockClassRepo)
    container.registerInstance("EnrollmentRepository", mockEnrollmentRepo)
    container.registerInstance("SubmissionRepository", {} as any)
    container.registerInstance("StorageService", { deleteAssignmentInstructionsImage: vi.fn() } as any)
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
    container.registerInstance("SimilarityPenaltyService", {
      syncAssignmentPenaltyState: vi.fn(),
    } as any)

    const notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo as any,
      mockEmailService,
    )
    container.registerInstance("NotificationService", notificationService)

    assignmentService = container.resolve(AssignmentService)

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
  })

  afterEach(() => {
    container.clearInstances()
  })

  it("should notify all enrolled students after creating an assignment", async () => {
    mockAssignmentRepo.createAssignment.mockResolvedValue({
      id: 1,
      classId: 1,
      teacherId: 1,
      assignmentName: "Test Assignment",
      createdAt: new Date(),
      isActive: true,
      deadline: new Date("2026-12-31"),
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

    await assignmentService.createAssignment({
      classId: 1,
      teacherId: 1,
      moduleId: 1,
      assignmentName: "Test Assignment",
      instructions: "Test instructions",
      programmingLanguage: "python",
      deadline: new Date("2026-12-31"),
      allowResubmission: true,
      maxAttempts: null,
      templateCode: null,
      totalScore: 100,
      scheduledDate: null,
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      instructionsImageUrl: null,
      enableSimilarityPenalty: false,
      similarityPenaltyConfig: null,
    })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockNotificationRepo.create).toHaveBeenCalledTimes(2)
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2)
  })
})
