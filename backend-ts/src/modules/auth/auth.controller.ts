import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AuthService } from "@/modules/auth/auth.service.js"
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  VerifyRequestSchema,
  type RegisterRequest,
  type LoginRequest,
  type ForgotPasswordRequest,
  type VerifyRequest,
} from "@/modules/auth/auth.schema.js"
import { ApiError } from "@/api/middlewares/error-handler.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { validateBody } from "@/api/plugins/zod-validation.js"

/**
 * Registers all authentication-related routes under /api/v1/auth/*.
 * Handles user registration, login, token verification, password reset,
 * and logout operations.
 *
 * @param app - Fastify application instance to register routes on.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = container.resolve<AuthService>(DI_TOKENS.services.auth)

  /**
   * POST /register
   * Register a new user
   */
  app.post("/register", {
    preHandler: validateBody(RegisterRequestSchema),
    handler: async (request, reply) => {
      const { confirmPassword: _confirmPassword, ...userRegistrationData } =
        request.validatedBody as RegisterRequest

      const registrationResult =
        await authService.registerUser(userRegistrationData)

      return reply.status(201).send({
        success: true,
        message: "Registration successful",
        user: registrationResult.userData,
        token: registrationResult.token,
      })
    },
  })

  /**
   * POST /login
   * Login with email and password
   */
  app.post("/login", {
    preHandler: validateBody(LoginRequestSchema),
    handler: async (request, reply) => {
      const { email: userEmail, password: userPassword } =
        request.validatedBody as LoginRequest

      const loginResult = await authService.loginUser(userEmail, userPassword)

      return reply.send({
        success: true,
        message: "Login successful",
        user: loginResult.userData,
        token: loginResult.token,
      })
    },
  })

  /**
   * POST /verify
   * Verify access token
   */
  app.post("/verify", {
    preHandler: validateBody(VerifyRequestSchema),
    handler: async (request, reply) => {
      const { token: accessToken } = request.validatedBody as VerifyRequest

      if (!accessToken) {
        throw new ApiError("Token is required", 400)
      }

      const verifiedUserData = await authService.verifyToken(accessToken)

      return reply.send({
        success: true,
        message: "Token is valid",
        user: verifiedUserData,
      })
    },
  })

  /**
   * POST /forgot-password
   * Request password reset email
   */
  app.post("/forgot-password", {
    preHandler: validateBody(ForgotPasswordRequestSchema),
    handler: async (request, reply) => {
      const { email: userEmail } =
        request.validatedBody as ForgotPasswordRequest

      await authService.requestPasswordReset(userEmail)

      return reply.send({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      })
    },
  })

  /**
   * POST /logout
   * Logout user
   */
  app.post("/logout", {
    handler: async (_request, reply) => {
      return reply.send({
        success: true,
        message: "Logout successful. Clear session on client.",
      })
    },
  })
}
