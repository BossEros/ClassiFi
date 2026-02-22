import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminUserService } from "@/modules/admin/admin-user.service.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import {
  validateQuery,
  validateParams,
  validateBody,
} from "@/api/plugins/zod-validation.js"
import {
  UserFilterQuerySchema,
  UserParamsSchema,
  UpdateUserRoleSchema,
  UpdateUserDetailsSchema,
  UpdateUserEmailSchema,
  CreateUserSchema,
  type UserFilterQuery,
  type UserParams,
  type UpdateUserRole,
  type UpdateUserDetails,
  type UpdateUserEmail,
  type CreateUser,
} from "@/modules/admin/admin.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers admin user management routes for user CRUD operations.
 *
 * Provides endpoints for administrators to create, read, update, and delete users,
 * as well as manage user roles, status, and retrieve teacher lists.
 * All routes require authentication and admin privileges.
 *
 * @param app - The Fastify application instance to register routes on.
 * @returns A promise that resolves when all routes are registered.
 */
export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  const adminUserService = container.resolve<AdminUserService>(
    DI_TOKENS.services.adminUser,
  )
  const preHandlerMiddlewares = [adminMiddleware]

  /**
   * GET /users
   * List all users with filtering
   */
  app.get("/users", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateQuery(UserFilterQuerySchema),
    ],
    handler: async (request, reply) => {
      const { page, limit, search, role, status } =
        request.validatedQuery as UserFilterQuery

      const normalizedRole = role === "all" ? undefined : role
      const normalizedStatus = status === "all" ? undefined : status

      const paginatedUsersResult = await adminUserService.getAllUsers({
        page,
        limit,
        search,
        role: normalizedRole,
        status: normalizedStatus,
      })

      return reply.send({ success: true, ...paginatedUsersResult })
    },
  })

  /**
   * GET /users/teachers
   * Get all teachers
   */
  app.get("/users/teachers", {
    preHandler: preHandlerMiddlewares,
    handler: async (_request, reply) => {
      const teachersList = await adminUserService.getAllTeachers()

      return reply.send({ success: true, teachers: teachersList })
    },
  })

  /**
   * GET /users/:id
   * Get user details by ID
   */
  app.get("/users/:id", {
    preHandler: [...preHandlerMiddlewares, validateParams(UserParamsSchema)],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams

      const userDetails = await adminUserService.getUserById(userId)

      return reply.send({ success: true, user: userDetails })
    },
  })

  /**
   * POST /users
   * Create a new user
   */
  app.post("/users", {
    preHandler: [...preHandlerMiddlewares, validateBody(CreateUserSchema)],
    handler: async (request, reply) => {
      const newUserData = request.validatedBody as CreateUser

      const createdUser = await adminUserService.createUser(newUserData)

      return reply.status(201).send({ success: true, user: createdUser })
    },
  })

  /**
   * PATCH /users/:id/details
   * Update user profile details
   */
  app.patch("/users/:id/details", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(UserParamsSchema),
      validateBody(UpdateUserDetailsSchema),
    ],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams
      const updatedDetailsData = request.validatedBody as UpdateUserDetails

      const updatedUser = await adminUserService.updateUserDetails(
        userId,
        updatedDetailsData,
      )

      return reply.send({ success: true, user: updatedUser })
    },
  })

  /**
   * PATCH /users/:id/email
   * Update user email address
   */
  app.patch("/users/:id/email", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(UserParamsSchema),
      validateBody(UpdateUserEmailSchema),
    ],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams
      const { email: newEmailAddress } =
        request.validatedBody as UpdateUserEmail

      const updatedUser = await adminUserService.updateUserEmail(
        userId,
        newEmailAddress,
      )

      return reply.send({ success: true, user: updatedUser })
    },
  })

  /**
   * PATCH /users/:id/role
   * Update user role
   */
  app.patch("/users/:id/role", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(UserParamsSchema),
      validateBody(UpdateUserRoleSchema),
    ],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams
      const { role: newUserRole } = request.validatedBody as UpdateUserRole

      const updatedUser = await adminUserService.updateUserRole(
        userId,
        newUserRole,
      )

      return reply.send({ success: true, user: updatedUser })
    },
  })

  /**
   * PATCH /users/:id/status
   * Toggle user account status
   */
  app.patch("/users/:id/status", {
    preHandler: [...preHandlerMiddlewares, validateParams(UserParamsSchema)],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams

      const updatedUser = await adminUserService.toggleUserStatus(userId)

      return reply.send({ success: true, user: updatedUser })
    },
  })

  /**
   * DELETE /users/:id
   * Delete a user account
   */
  app.delete("/users/:id", {
    preHandler: [...preHandlerMiddlewares, validateParams(UserParamsSchema)],
    handler: async (request, reply) => {
      const { id: userId } = request.validatedParams as UserParams

      await adminUserService.deleteUser(userId)

      return reply.send({ success: true, message: "User deleted successfully" })
    },
  })
}
