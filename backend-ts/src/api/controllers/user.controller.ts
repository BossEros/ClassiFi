import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { UserService } from "../../services/user.service.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { toJsonSchema } from "../utils/swagger.js"
import { SuccessMessageSchema } from "../schemas/common.schema.js"
import { toUserDTO } from "../../shared/mappers.js"
import { z } from "zod"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const UpdateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .max(2048, "Avatar URL must not exceed 2048 characters")
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const parsedUrl = new URL(url)
          return parsedUrl.protocol === "https:"
        } catch {
          return false
        }
      },
      { message: "Avatar URL must use HTTPS protocol" },
    ),
})

type UpdateAvatarRequest = z.infer<typeof UpdateAvatarSchema>

const UserDTOSchema = z.object({
  id: z.number(),
  supabaseUserId: z.string().nullable(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
})

const GetMeResponseSchema = z.object({
  success: z.boolean(),
  user: UserDTOSchema,
})

const ErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

/**
 * Registers user routes for profile management, avatar updates, and account deletion.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function userRoutes(app: FastifyInstance): Promise<void> {
  const userService = container.resolve<UserService>(DI_TOKENS.services.user)

  /**
   * GET /me
   * Get current user's profile
   */
  app.get("/me", {
    preHandler: [authMiddleware],
    schema: {
      tags: ["User"],
      summary: "Get current user profile",
      description:
        "Returns the authenticated user's profile information including name, email, and role",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(GetMeResponseSchema),
        404: toJsonSchema(ErrorResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const authenticatedUserId = request.user!.id

      const currentUser = await userService.getUserById(authenticatedUserId)

      if (!currentUser) {
        return reply.status(404).send({
          success: false,
          message: "User not found",
        })
      }

      return reply.send({
        success: true,
        user: toUserDTO(currentUser),
      })
    },
  })

  /**
   * PATCH /me/avatar
   * Update the current user's avatar URL
   */
  app.patch<{ Body: UpdateAvatarRequest }>("/me/avatar", {
    preHandler: [authMiddleware],
    schema: {
      tags: ["User"],
      summary: "Update user avatar URL",
      description:
        "Updates the authenticated user's profile picture by providing a new avatar URL",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(UpdateAvatarSchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const authenticatedUserId = request.user!.id
      const { avatarUrl: newAvatarUrl } = request.body

      await userService.updateAvatarUrl(authenticatedUserId, newAvatarUrl)

      return reply.send({
        success: true,
        message: "Avatar updated successfully.",
      })
    },
  })

  /**
   * DELETE /me
   * Delete the current user's account
   */
  app.delete("/me", {
    preHandler: [authMiddleware],
    schema: {
      tags: ["User"],
      summary: "Delete current user account",
      description:
        "Permanently deletes the authenticated user's account and all associated data. This action cannot be undone.",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const authenticatedUserId = request.user!.id

      await userService.deleteAccount(authenticatedUserId)

      return reply.send({
        success: true,
        message: "Your account has been permanently deleted.",
      })
    },
  })
}