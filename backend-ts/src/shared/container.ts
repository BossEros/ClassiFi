import "reflect-metadata"
import { container } from "tsyringe"

// Repositories
import { UserRepository } from "../repositories/user.repository.js"
import { ClassRepository } from "../repositories/class.repository.js"
import { AssignmentRepository } from "../repositories/assignment.repository.js"
import { EnrollmentRepository } from "../repositories/enrollment.repository.js"
import { SubmissionRepository } from "../repositories/submission.repository.js"
import { SimilarityRepository } from "../repositories/similarity.repository.js"
import { TestCaseRepository } from "../repositories/testCase.repository.js"
import { TestResultRepository } from "../repositories/testResult.repository.js"
import { GradebookRepository } from "../repositories/gradebook.repository.js"
import { NotificationRepository } from "../repositories/notification.repository.js"
import { NotificationDeliveryRepository } from "../repositories/notification-delivery.repository.js"

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
import { CodeTestService } from "../services/codeTest.service.js"
import { TestCaseService } from "../services/test-case.service.js"
import { CODE_EXECUTOR_TOKEN } from "../services/interfaces/codeExecutor.interface.js"
import { GradebookService } from "../services/gradebook.service.js"
import { LatePenaltyService } from "../services/latePenalty.service.js"
import { EmailService } from "../services/email/index.js"
import { NotificationService } from "../services/notification/notification.service.js"
import { NotificationQueueService } from "../services/notification/queue.service.js"

// Admin Services (focused, single-responsibility)
import { AdminUserService } from "../services/admin/admin-user.service.js"
import { AdminAnalyticsService } from "../services/admin/admin-analytics.service.js"
import { AdminClassService } from "../services/admin/admin-class.service.js"
import { AdminEnrollmentService } from "../services/admin/admin-enrollment.service.js"

// Plagiarism Services
import { PlagiarismDetectorFactory } from "../services/plagiarism/plagiarism-detector.factory.js"
import { SubmissionFileService } from "../services/plagiarism/submission-file.service.js"
import { PlagiarismPersistenceService } from "../services/plagiarism/plagiarism-persistence.service.js"

// Register repositories as singletons
container.registerSingleton("UserRepository", UserRepository)
container.registerSingleton("ClassRepository", ClassRepository)
container.registerSingleton("AssignmentRepository", AssignmentRepository)
container.registerSingleton("EnrollmentRepository", EnrollmentRepository)
container.registerSingleton("SubmissionRepository", SubmissionRepository)
container.registerSingleton("SimilarityRepository", SimilarityRepository)
container.registerSingleton("TestCaseRepository", TestCaseRepository)
container.registerSingleton("TestResultRepository", TestResultRepository)
container.registerSingleton("GradebookRepository", GradebookRepository)
container.registerSingleton("NotificationRepository", NotificationRepository)
container.registerSingleton(
  "NotificationDeliveryRepository",
  NotificationDeliveryRepository,
)

// Register infrastructure adapters as singletons
container.registerSingleton("SupabaseAuthAdapter", SupabaseAuthAdapter)

// Register services as singletons
container.registerSingleton("StorageService", StorageService)
container.registerSingleton("AssignmentService", AssignmentService)
container.registerSingleton("AuthService", AuthService)
container.registerSingleton("ClassService", ClassService)
container.registerSingleton("SubmissionService", SubmissionService)
container.registerSingleton("StudentDashboardService", StudentDashboardService)
container.registerSingleton("TeacherDashboardService", TeacherDashboardService)
container.registerSingleton("PlagiarismService", PlagiarismService)
container.registerSingleton("UserService", UserService)
container.registerSingleton("GradebookService", GradebookService)
container.registerSingleton("LatePenaltyService", LatePenaltyService)
container.registerSingleton("EmailService", EmailService)
container.registerSingleton(
  "NotificationQueueService",
  NotificationQueueService,
)
container.registerSingleton("NotificationService", NotificationService)

// Register code execution services
container.registerSingleton(CODE_EXECUTOR_TOKEN, Judge0Service)
container.registerSingleton("CodeTestService", CodeTestService)
container.registerSingleton("TestCaseService", TestCaseService)

// Register focused admin services as singletons
container.registerSingleton("AdminUserService", AdminUserService)
container.registerSingleton("AdminAnalyticsService", AdminAnalyticsService)
container.registerSingleton("AdminClassService", AdminClassService)
container.registerSingleton("AdminEnrollmentService", AdminEnrollmentService)

// Register Plagiarism component services
container.registerSingleton(
  "PlagiarismDetectorFactory",
  PlagiarismDetectorFactory,
)
container.registerSingleton("SubmissionFileService", SubmissionFileService)
container.registerSingleton(
  "PlagiarismPersistenceService",
  PlagiarismPersistenceService,
)

export { container }
