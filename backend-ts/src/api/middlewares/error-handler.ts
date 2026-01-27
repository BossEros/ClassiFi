import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"

import { ApiError } from "@/shared/errors.js"

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from "@/shared/errors.js"

/** Global error handler for Fastify */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error instanceof ApiError ? error.statusCode : 500
  const message = error.message || "Internal Server Error"

  // Log error in development
  if (process.env.ENVIRONMENT === "development") {
    console.error(`[ERROR] ${statusCode} - ${message}`)
    console.error(error.stack)
  }

  reply.status(statusCode).send({
    success: false,
    message,
    error: process.env.ENVIRONMENT === "development" ? error.stack : undefined,
  })
}
