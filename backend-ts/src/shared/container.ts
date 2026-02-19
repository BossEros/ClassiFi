import "reflect-metadata"
import { container } from "tsyringe"

// Repositories
import { UserRepository } from "../repositories/user.repository.js"
import { ClassRepository } from "../repositories/class.repository.js"
import { AssignmentRepository } from "../repositories/assignment.repository.js"
import { EnrollmentRepository } from "../repositories/enrollment.repository.js"
import { SubmissionRepository } from "../repositories/submission.repository.js"
import { DashboardQueryRepository } from "../repositories/dashboard-query.repository.js"
import { SimilarityRepository } from "../repositories/similarity.repository.js"
import { TestCaseRepository } from "../repositories/test-case.repository.js"
import { TestResultRepository } from "../repositories/testResult.repository.js"
import { GradebookRepository } from "../repositories/gradebook.repository.js"
import { NotificationRepository } from "../repositories/notification.repository.js"
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository.js"
import { NotificationPreferenceRepository } from "../repositories/notification-preference.repository.js"

// Services
import { AuthService } from "../services/auth.service.js"
import { ClassService } from "../services/class.service.js"
import { SubmissionService } from "../services/submission.service.js"
import { StudentDashboardService } from "../services/student-dashboard.service.js"
import { TeacherDashboardService } from "../services/teacher-dashboard.service.js"
import { PlagiarismService } from "../services/plagiarism.service.js"
import { UserService } from "../services/user.service.js"
import { StorageService } from "../services/storage.service.js"
import { AssignmentService } from "../services/assignment.service.js"
import { SupabaseAuthAdapter } from "../services/supabase-auth.adapter.js"
import { Judge0Service } from "../services/judge0.service.js"
import { CodeTestService } from "../services/code-test.service.js"
import { TestCaseService } from "../services/test-case.service.js"
import { CODE_EXECUTOR_TOKEN } from "../services/interfaces/codeExecutor.interface.js"
import { GradebookService } from "../services/gradebook.service.js"
import { LatePenaltyService } from "../services/latePenalty.service.js"
import { EmailService } from "../services/email/index.js"
import { NotificationService } from "../services/notification/notification.service.js"
import { NotificationQueueService } from "../services/notification/queue.service.js"
import { NotificationPreferenceService } from "../services/notification/preference.service.js"

// Admin Services (focused, single-responsibility)
import { AdminUserService } from "../services/admin/admin-user.service.js"
import { AdminAnalyticsService } from "../services/admin/admin-analytics.service.js"
import { AdminClassService } from "../services/admin/admin-class.service.js"
import { AdminEnrollmentService } from "../services/admin/admin-enrollment.service.js"

// Plagiarism Services
import { PlagiarismDetectorFactory } from "../services/plagiarism/plagiarism-detector.factory.js"
import { SubmissionFileService } from "../services/plagiarism/submission-file.service.js"
import { PlagiarismPersistenceService } from "../services/plagiarism/plagiarism-persistence.service.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

// Register repositories as singletons
container.registerSingleton(DI_TOKENS.repositories.user, UserRepository)
container.registerSingleton(DI_TOKENS.repositories.class, ClassRepository)
container.registerSingleton(
  DI_TOKENS.repositories.assignment,
  AssignmentRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.enrollment,
  EnrollmentRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.submission,
  SubmissionRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.dashboardQuery,
  DashboardQueryRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.similarity,
  SimilarityRepository,
)
container.registerSingleton(DI_TOKENS.repositories.testCase, TestCaseRepository)
container.registerSingleton(
  DI_TOKENS.repositories.testResult,
  TestResultRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.gradebook,
  GradebookRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.notification,
  NotificationRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.notificationDelivery,
  NotificationDeliveryRepository,
)
container.registerSingleton(
  DI_TOKENS.repositories.notificationPreference,
  NotificationPreferenceRepository,
)

// Register infrastructure adapters as singletons
container.registerSingleton(DI_TOKENS.adapters.supabaseAuth, SupabaseAuthAdapter)

// Register services as singletons
container.registerSingleton(DI_TOKENS.services.storage, StorageService)
container.registerSingleton(DI_TOKENS.services.assignment, AssignmentService)
container.registerSingleton(DI_TOKENS.services.auth, AuthService)
container.registerSingleton(DI_TOKENS.services.class, ClassService)
container.registerSingleton(DI_TOKENS.services.submission, SubmissionService)
container.registerSingleton(
  DI_TOKENS.services.studentDashboard,
  StudentDashboardService,
)
container.registerSingleton(
  DI_TOKENS.services.teacherDashboard,
  TeacherDashboardService,
)
container.registerSingleton(DI_TOKENS.services.plagiarism, PlagiarismService)
container.registerSingleton(DI_TOKENS.services.user, UserService)
container.registerSingleton(DI_TOKENS.services.gradebook, GradebookService)
container.registerSingleton(DI_TOKENS.services.latePenalty, LatePenaltyService)
container.registerSingleton(DI_TOKENS.services.email, EmailService)
container.registerSingleton(
  DI_TOKENS.services.notificationQueue,
  NotificationQueueService,
)
container.registerSingleton(
  DI_TOKENS.services.notificationPreference,
  NotificationPreferenceService,
)
container.registerSingleton(DI_TOKENS.services.notification, NotificationService)

// Register code execution services
container.registerSingleton(CODE_EXECUTOR_TOKEN, Judge0Service)
container.registerSingleton(DI_TOKENS.services.codeTest, CodeTestService)
container.registerSingleton(DI_TOKENS.services.testCase, TestCaseService)

// Register focused admin services as singletons
container.registerSingleton(DI_TOKENS.services.adminUser, AdminUserService)
container.registerSingleton(
  DI_TOKENS.services.adminAnalytics,
  AdminAnalyticsService,
)
container.registerSingleton(DI_TOKENS.services.adminClass, AdminClassService)
container.registerSingleton(
  DI_TOKENS.services.adminEnrollment,
  AdminEnrollmentService,
)

// Register Plagiarism component services
container.registerSingleton(
  DI_TOKENS.services.plagiarismDetectorFactory,
  PlagiarismDetectorFactory,
)
container.registerSingleton(DI_TOKENS.services.submissionFile, SubmissionFileService)
container.registerSingleton(
  DI_TOKENS.services.plagiarismPersistence,
  PlagiarismPersistenceService,
)

export { container }
