import type { FastifyInstance } from 'fastify';
import { authRoutes } from '../../controllers/auth.controller.js';
import { classRoutes } from '../../controllers/class.controller.js';
import { assignmentRoutes } from '../../controllers/assignment.controller.js';
import { submissionRoutes } from '../../controllers/submission.controller.js';
import { studentDashboardRoutes } from '../../controllers/student-dashboard.controller.js';
import { teacherDashboardRoutes } from '../../controllers/teacher-dashboard.controller.js';

/** API v1 routes aggregator */
export async function apiV1Routes(app: FastifyInstance): Promise<void> {
    // Auth routes - /api/v1/auth/*
    await app.register(authRoutes, { prefix: '/auth' });

    // Class routes - /api/v1/classes/*
    await app.register(classRoutes, { prefix: '/classes' });

    // Assignment routes - /api/v1/assignments/*
    await app.register(assignmentRoutes, { prefix: '/assignments' });

    // Submission routes - /api/v1/submissions/*
    await app.register(submissionRoutes, { prefix: '/submissions' });

    // Student dashboard routes - /api/v1/student/dashboard/*
    await app.register(studentDashboardRoutes, { prefix: '/student/dashboard' });

    // Teacher dashboard routes - /api/v1/teacher/dashboard/*
    await app.register(teacherDashboardRoutes, { prefix: '/teacher/dashboard' });
}
