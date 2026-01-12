/**
 * Admin Controller (Aggregator)
 * Aggregates all admin-related controllers.
 * Kept for backward compatibility with route registration.
 */
import type { FastifyInstance } from 'fastify';
import { adminUserRoutes } from './admin/admin-user.controller.js';
import { adminAnalyticsRoutes } from './admin/admin-analytics.controller.js';
import { adminClassRoutes } from './admin/admin-class.controller.js';
import { adminEnrollmentRoutes } from './admin/admin-enrollment.controller.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
    // Register sub-controllers
    // These will inherit the '/admin' prefix from the parent registration
    await app.register(adminUserRoutes);
    await app.register(adminAnalyticsRoutes);
    await app.register(adminClassRoutes);
    await app.register(adminEnrollmentRoutes);
}
