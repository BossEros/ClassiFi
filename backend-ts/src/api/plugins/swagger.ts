/**
 * Swagger/OpenAPI Configuration
 * Provides API documentation at /docs
 */
import type { FastifyInstance } from "fastify"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { settings } from "@/shared/config.js"
/** Configure Swagger documentation */
export async function setupSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: settings.appName,
        description: "ClassiFi Backend API - TypeScript Implementation",
        version: settings.appVersion,
      },
      servers: [
        {
          url: `http://localhost:${settings.port}`,
          description: "Development server",
        },
      ],
      tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Classes", description: "Class management endpoints" },
        { name: "Assignments", description: "Assignment management endpoints" },
        { name: "Submissions", description: "Submission management endpoints" },
        {
          name: "Student Dashboard",
          description: "Student dashboard endpoints",
        },
        {
          name: "Teacher Dashboard",
          description: "Teacher dashboard endpoints",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
  })
}
