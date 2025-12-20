/**
 * Swagger/OpenAPI Configuration
 * Provides API documentation at /docs
 */
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { settings } from '../../shared/config.js';

/** Configure Swagger documentation */
export async function setupSwagger(app: FastifyInstance): Promise<void> {
    await app.register(swagger, {
        openapi: {
            info: {
                title: settings.appName,
                description: 'ClassiFi Backend API - TypeScript Implementation',
                version: settings.appVersion,
            },
            servers: [
                {
                    url: `http://localhost:${settings.port}`,
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'Auth', description: 'Authentication endpoints' },
                { name: 'Classes', description: 'Class management endpoints' },
                { name: 'Assignments', description: 'Assignment management endpoints' },
                { name: 'Submissions', description: 'Submission management endpoints' },
                { name: 'Student Dashboard', description: 'Student dashboard endpoints' },
                { name: 'Teacher Dashboard', description: 'Teacher dashboard endpoints' },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
                schemas: {
                    Error: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string' },
                        },
                    },
                    User: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            supabaseUserId: { type: 'string', nullable: true },
                            username: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            role: { type: 'string', enum: ['student', 'teacher', 'admin'] },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Class: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            teacherId: { type: 'integer' },
                            className: { type: 'string' },
                            classCode: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                            isActive: { type: 'boolean' },
                            studentCount: { type: 'integer' },
                        },
                    },
                    Assignment: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            classId: { type: 'integer' },
                            assignmentName: { type: 'string' },
                            description: { type: 'string' },
                            programmingLanguage: { type: 'string', enum: ['python', 'java'] },
                            deadline: { type: 'string', format: 'date-time' },
                            allowResubmission: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            isActive: { type: 'boolean' },
                        },
                    },
                    Submission: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            assignmentId: { type: 'integer' },
                            studentId: { type: 'integer' },
                            fileName: { type: 'string' },
                            filePath: { type: 'string' },
                            fileSize: { type: 'integer' },
                            submissionNumber: { type: 'integer' },
                            submittedAt: { type: 'string', format: 'date-time' },
                            isLatest: { type: 'boolean' },
                        },
                    },
                },
            },
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
        staticCSP: true,
    });
}
