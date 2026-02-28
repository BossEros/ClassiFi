import Fastify, { FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import multipart from "@fastify/multipart"
import "reflect-metadata"
import { settings } from "@/shared/config.js"
import { errorHandler } from "@/api/middlewares/error-handler.js"
import { apiV1Routes } from "@/api/routes/v1/index.js"
import { setupSwagger } from "@/api/plugins/swagger.js"
import { container } from "@/shared/container.js"
import zodValidationPlugin from "@/api/plugins/zod-validation.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import type { PlagiarismAutoAnalysisService } from "@/modules/plagiarism/plagiarism-auto-analysis.service.js"

export async function buildApp(): Promise<FastifyInstance> {
  const plagiarismAutoAnalysisService = container.resolve<PlagiarismAutoAnalysisService>(
    DI_TOKENS.services.plagiarismAutoAnalysis,
  )

  plagiarismAutoAnalysisService.start()

  const app = Fastify({
    logger: settings.debug,
    requestTimeout: (settings.testExecutionTimeoutSeconds + 5) * 1000,
  })

  // Register CORS
  await app.register(cors, {
    origin: settings.allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // Register Swagger documentation
  await setupSwagger(app)

  // Global error handler
  app.setErrorHandler(errorHandler)

  // Health check endpoint
  app.get("/health", async () => ({
    status: "healthy",
    environment: settings.environment,
  }))

  // Root endpoint
  app.get("/", async () => ({
    name: settings.appName,
    version: settings.appVersion,
    status: "running",
    environment: settings.environment,
    docs: "/docs",
  }))

  // Register Zod validation plugin
  await app.register(zodValidationPlugin)

  // Register API v1 routes
  await app.register(apiV1Routes, { prefix: `${settings.apiPrefix}/v1` })
  app.addHook("onClose", async () => {
    plagiarismAutoAnalysisService.stop()
  })

  return app
}
