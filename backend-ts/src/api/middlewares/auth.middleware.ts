import type {
  FastifyRequest,
  FastifyReply,
  preHandlerHookHandler,
} from "fastify"
import { container } from "tsyringe"
import { AuthService } from "@/modules/auth/auth.service.js"
import { UnauthorizedError } from "@/api/middlewares/error-handler.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/** Extended request type with user info */
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: number
      supabaseUserId: string | null
      email: string
      firstName: string
      lastName: string
      role: string
    }
  }
}

export const authMiddleware: preHandlerHookHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    throw new UnauthorizedError("Authorization header is required")
  }

  // Split Bearer and Token
  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new UnauthorizedError("Invalid authorization header format")
  }

  // Extract token
  const token = parts[1]

  try {
    const authService = container.resolve<AuthService>(DI_TOKENS.services.auth)
    const userData = await authService.verifyToken(token)

    // Attach user to request
    request.user = userData
  } catch {
    throw new UnauthorizedError("Invalid or expired token")
  }
}
