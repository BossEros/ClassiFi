import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { authRoutes } from "@/api/controllers/auth.controller.js";
import { classRoutes } from "@/api/controllers/class.controller.js";
import { assignmentRoutes } from "@/api/controllers/assignment.controller.js";
import { submissionRoutes } from "@/api/controllers/submission.controller.js";
import { studentDashboardRoutes } from "@/api/controllers/student-dashboard.controller.js";
import { teacherDashboardRoutes } from "@/api/controllers/teacher-dashboard.controller.js";
import { plagiarismRoutes } from "@/api/controllers/plagiarism.controller.js";
import { userRoutes } from "@/api/controllers/user.controller.js";
import { adminRoutes } from "@/api/controllers/admin.controller.js";
import { testCaseRoutes } from "@/api/controllers/testCase.controller.js";
import { gradebookRoutes } from "@/api/controllers/gradebook.controller.js";
import { authMiddleware } from "@/api/middlewares/auth.middleware.js";

/**
 * Protected routes wrapper - applies auth middleware to all routes
 */
async function protectedRoutes(app: FastifyInstance): Promise<void> {
  // Add auth middleware to all routes in this scope
  app.addHook("preHandler", authMiddleware);

  // Class routes - /api/v1/classes/*
  await app.register(classRoutes, { prefix: "/classes" });

  // Assignment routes - /api/v1/assignments/*
  await app.register(assignmentRoutes, { prefix: "/assignments" });

  // Submission routes - /api/v1/submissions/*
  await app.register(submissionRoutes, { prefix: "/submissions" });

  // Student dashboard routes - /api/v1/student/dashboard/*
  await app.register(studentDashboardRoutes, { prefix: "/student/dashboard" });

  // Teacher dashboard routes - /api/v1/teacher/dashboard/*
  await app.register(teacherDashboardRoutes, { prefix: "/teacher/dashboard" });

  // Plagiarism detection routes - /api/v1/plagiarism/*
  await app.register(plagiarismRoutes, { prefix: "/plagiarism" });

  // User account routes - /api/v1/user/*
  await app.register(userRoutes, { prefix: "/user" });

  // Admin routes - /api/v1/admin/* (admin middleware applied in controller)
  await app.register(adminRoutes, { prefix: "/admin" });

  // Test case and code testing routes - /api/v1/*
  await app.register(testCaseRoutes);

  // Gradebook routes - /api/v1/gradebook/*
  await app.register(gradebookRoutes, { prefix: "/gradebook" });
}

/** API v1 routes aggregator */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
  // Auth routes - /api/v1/auth/* (public, no auth required)
  await app.register(authRoutes, { prefix: "/auth" });

  // Protected routes (require authentication)
  await app.register(protectedRoutes);
}
