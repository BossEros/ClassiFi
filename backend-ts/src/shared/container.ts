import "reflect-metadata"
import { container } from "tsyringe"

// Repositories
import { UserRepository } from "@/modules/users/user.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { EnrollmentRepository } from "@/repositories/enrollment.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { DashboardQueryRepository } from "@/modules/dashboard/dashboard-query.repository.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import { TestCaseRepository } from "@/modules/test-cases/test-case.repository.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { GradebookRepository } from "@/modules/gradebook/gradebook-query.repository.js"
import { NotificationRepository } from "@/modules/notifications/notification.repository.js"
import { NotificationDeliveryRepository } from "@/modules/notifications/notification-delivery.repository.js"
import { NotificationPreferenceRepository } from "@/modules/notifications/notification-preference.repository.js"

// Services
import { AuthService } from "@/modules/auth/auth.service.js"
import { ClassService } from "@/modules/classes/class.service.js"
import { SubmissionService } from "@/modules/submissions/submission.service.js"
import { StudentDashboardService } from "@/modules/dashboard/student-dashboard.service.js"
import { TeacherDashboardService } from "@/modules/dashboard/teacher-dashboard.service.js"
import { PlagiarismService } from "@/modules/plagiarism/plagiarism.service.js"
import { UserService } from "@/modules/users/user.service.js"
import { StorageService } from "@/services/storage.service.js"
import { AssignmentService } from "@/modules/assignments/assignment.service.js"
import { SupabaseAuthAdapter } from "@/services/supabase-auth.adapter.js"
import { Judge0Service } from "@/services/judge0.service.js"
import { CodeTestService } from "@/modules/test-cases/code-test.service.js"
import { TestCaseService } from "@/modules/test-cases/test-case.service.js"
import { CODE_EXECUTOR_TOKEN } from "@/services/interfaces/codeExecutor.interface.js"
import { GradebookService } from "@/modules/gradebook/gradebook.service.js"
import { LatePenaltyService } from "@/services/latePenalty.service.js"
import { EmailService } from "@/services/email/index.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import { NotificationQueueService } from "@/modules/notifications/notification-queue.service.js"
import { NotificationPreferenceService } from "@/modules/notifications/notification-preference.service.js"

// Admin Services (focused, single-responsibility)
import { AdminUserService } from "@/modules/admin/admin-user.service.js"
import { AdminAnalyticsService } from "@/modules/admin/admin-analytics.service.js"
import { AdminClassService } from "@/modules/admin/admin-class.service.js"
import { AdminEnrollmentService } from "@/modules/admin/admin-enrollment.service.js"

// Plagiarism Services
import { PlagiarismDetectorFactory } from "@/services/plagiarism/plagiarism-detector.factory.js"
import { SubmissionFileService } from "@/services/plagiarism/submission-file.service.js"
import { PlagiarismPersistenceService } from "@/services/plagiarism/plagiarism-persistence.service.js"
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
