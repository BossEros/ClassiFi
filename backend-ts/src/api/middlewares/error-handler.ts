import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ApiError } from "@/shared/errors.js"
import { createLogger } from "@/shared/logger.js"

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/shared/errors.js"

const logger = createLogger("ErrorHandler")

/** Global error handler for Fastify */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error instanceof ApiError ? error.statusCode : 500
  const message = error.message || "Internal Server Error"

  // Preserve current behavior: detailed logging in development
  if (process.env.ENVIRONMENT === "development") {
    logger.error("Request handling error", {
      statusCode,
      message,
      stack: error.stack,
    })
  }

  reply.status(statusCode).send({
    success: false,
    message,
    error: process.env.ENVIRONMENT === "development" ? error.stack : undefined,
  })
}
