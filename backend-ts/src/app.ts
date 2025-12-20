import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import 'reflect-metadata';
import { settings } from './shared/config.js';
import { errorHandler } from './api/middlewares/error-handler.js';
import { apiV1Routes } from './api/routes/v1/index.js';
import { setupSwagger } from './api/plugins/swagger.js';
import zodValidation from './api/plugins/zod-validation.js';

// Initialize DI container
import './shared/container.js';

/** Create and configure Fastify application */
export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: settings.debug,
    });

    // Register CORS
    await app.register(cors, {
        origin: settings.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Register multipart for file uploads
    await app.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
        },
    });

    // Register Zod validation plugin
    await app.register(zodValidation);

    // Register Swagger documentation
    await setupSwagger(app);

    // Global error handler
    app.setErrorHandler(errorHandler);

    // Health check endpoint
    app.get('/health', async () => ({
        status: 'healthy',
        environment: settings.environment,
    }));

    // Root endpoint
    app.get('/', async () => ({
        name: settings.appName,
        version: settings.appVersion,
        status: 'running',
        environment: settings.environment,
        docs: '/docs',
    }));

    // Register API v1 routes
    await app.register(apiV1Routes, { prefix: `${settings.apiPrefix}/v1` });

    return app;
}
