import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { UserService } from "@/modules/users/user.service.js"
import { validateBody } from "@/api/plugins/zod-validation.js"
import { toUserDTO } from "@/modules/users/user.mapper.js"
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
  app.patch("/me/avatar", {
    preHandler: validateBody(UpdateAvatarSchema),
    handler: async (request, reply) => {
      const authenticatedUserId = request.user!.id
      const { avatarUrl: newAvatarUrl } =
        request.validatedBody as UpdateAvatarRequest

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
