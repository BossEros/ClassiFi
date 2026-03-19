import type { FastifyInstance } from "fastify"
import { authRoutes } from "@/modules/auth/index.js"
import { classRoutes } from "@/modules/classes/index.js"
import { assignmentRoutes } from "@/modules/assignments/index.js"
import { submissionRoutes } from "@/modules/submissions/index.js"
import {
  studentDashboardRoutes,
  teacherDashboardRoutes,
} from "@/modules/dashboard/index.js"
import { plagiarismRoutes } from "@/modules/plagiarism/index.js"
import { userRoutes } from "@/modules/users/index.js"
import { adminRoutes } from "@/modules/admin/index.js"
import { codeTestRoutes, testCaseRoutes } from "@/modules/test-cases/index.js"
import { gradebookRoutes } from "@/modules/gradebook/index.js"
import { moduleClassRoutes, moduleRoutes } from "@/modules/modules/index.js"
import {
  notificationRoutes,
} from "@/modules/notifications/index.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"

/**
 * Protected routes wrapper - applies auth middleware to all routes
 */
async function protectedRoutes(app: FastifyInstance): Promise<void> {
  // Add auth middleware to all routes in this scope
  app.addHook("preHandler", authMiddleware)

  // Class routes - /api/v1/classes/*
  await app.register(classRoutes, { prefix: "/classes" })

  // Module routes nested under classes - /api/v1/classes/:classId/modules/*
  await app.register(moduleClassRoutes, { prefix: "/classes" })

  // Module standalone routes - /api/v1/modules/*
  await app.register(moduleRoutes, { prefix: "/modules" })

  // Assignment routes - /api/v1/assignments/*
  await app.register(assignmentRoutes, { prefix: "/assignments" })

  // Submission routes - /api/v1/submissions/*
  await app.register(submissionRoutes, { prefix: "/submissions" })

  // Student dashboard routes - /api/v1/student/dashboard/*
  await app.register(studentDashboardRoutes, { prefix: "/student/dashboard" })

  // Teacher dashboard routes - /api/v1/teacher/dashboard/*
  await app.register(teacherDashboardRoutes, { prefix: "/teacher/dashboard" })

  // Plagiarism detection routes - /api/v1/plagiarism/*
  await app.register(plagiarismRoutes, { prefix: "/plagiarism" })

  // User account routes - /api/v1/user/*
  await app.register(userRoutes, { prefix: "/user" })

  // Admin routes - /api/v1/admin/* (admin middleware applied in controller)
  await app.register(adminRoutes, { prefix: "/admin" })

  // Test case CRUD routes - /api/v1/test-cases/*
  await app.register(testCaseRoutes, { prefix: "/test-cases" })

  // Code testing routes - /api/v1/code/*
  await app.register(codeTestRoutes, { prefix: "/code" })

  // Gradebook routes - /api/v1/gradebook/*
  await app.register(gradebookRoutes, { prefix: "/gradebook" })

  // Notification routes - /api/v1/notifications/*
  await app.register(notificationRoutes, { prefix: "/notifications" })
}

/** API v1 routes aggregator */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
  // Auth routes - /api/v1/auth/* (public, no auth required)
  await app.register(authRoutes, { prefix: "/auth" })

  // Protected routes (require authentication)
  await app.register(protectedRoutes)
}
