import type {
  FastifyRequest,
  FastifyReply,
  preHandlerHookHandler,
} from "fastify"
import { ForbiddenError } from "@/api/middlewares/error-handler.js"


export const adminMiddleware: preHandlerHookHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  // Ensure user is authenticated first
  if (!request.user) {
    throw new ForbiddenError("Authentication required")
  }

  // Check for admin role
  if (request.user.role !== "admin") {
    throw new ForbiddenError("Admin access required")
  }
}
