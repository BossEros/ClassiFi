import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AuthService } from "@/services/auth.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { SuccessMessageSchema } from "@/api/schemas/common.schema.js"
import {
  RegisterRequestSchemaForDocs,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  AuthResponseSchema,
  VerifyRequestSchema,
  type RegisterRequest,
  type LoginRequest,
  type ForgotPasswordRequest,
  type VerifyRequest,
} from "../schemas/auth.schema.js"
import { ApiError } from "../middlewares/error-handler.js"

/**
 * Registers all authentication-related routes under /api/v1/auth/*.
 * Handles user registration, login, token verification, password reset,
 * and logout operations.
 *
 * @param app - Fastify application instance to register routes on.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = container.resolve<AuthService>("AuthService")

  /**
   * POST /register
   * Register a new user
   */
  app.post<{ Body: RegisterRequest }>("/register", {
    schema: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates a new user account with email and password authentication",
      body: toJsonSchema(RegisterRequestSchemaForDocs),
      response: {
        201: toJsonSchema(AuthResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { confirmPassword: _confirmPassword, ...userRegistrationData } =
        request.body

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
  app.post<{ Body: LoginRequest }>("/login", {
    schema: {
      tags: ["Auth"],
      summary: "Login with email and password",
      description: "Authenticates a user and returns an access token",
      body: toJsonSchema(LoginRequestSchema),
      response: {
        200: toJsonSchema(AuthResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { email: userEmail, password: userPassword } = request.body

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
  app.post<{ Body: VerifyRequest }>("/verify", {
    schema: {
      tags: ["Auth"],
      summary: "Verify access token",
      description:
        "Validates a Supabase access token and returns user information",
      body: toJsonSchema(VerifyRequestSchema),
    },
    handler: async (request, reply) => {
      const { token: accessToken } = request.body

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
  app.post<{ Body: ForgotPasswordRequest }>("/forgot-password", {
    schema: {
      tags: ["Auth"],
      summary: "Request password reset email",
      description: "Sends a password reset link to the user's email address",
      body: toJsonSchema(ForgotPasswordRequestSchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const { email: userEmail } = request.body

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
    schema: {
      tags: ["Auth"],
      summary: "Logout user",
      description:
        "Logout endpoint (actual session clearing happens client-side)",
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (_request, reply) => {
      return reply.send({
        success: true,
        message: "Logout successful. Clear session on client.",
      })
    },
  })
}
