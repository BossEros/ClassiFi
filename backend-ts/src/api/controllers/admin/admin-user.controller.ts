import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminUserService } from "../../../services/admin/admin-user.service.js"
import { authMiddleware } from "../../middlewares/auth.middleware.js"
import { adminMiddleware } from "../../middlewares/admin.middleware.js"
import { toJsonSchema } from "../../utils/swagger.js"
import {
  UserFilterQuerySchema,
  UserParamsSchema,
  UpdateUserRoleSchema,
  UpdateUserDetailsSchema,
  UpdateUserEmailSchema,
  CreateUserSchema,
  PaginatedUsersResponseSchema,
  SingleUserResponseSchema,
  TeachersListResponseSchema,
  SuccessResponseSchema,
  type UserFilterQuery,
  type UserParams,
  type UpdateUserRole,
  type UpdateUserDetails,
  type UpdateUserEmail,
  type CreateUser,
} from "../../schemas/admin.schema.js"
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
  const adminUserService =
    container.resolve<AdminUserService>(DI_TOKENS.services.adminUser)
  const preHandlerMiddlewares = [authMiddleware, adminMiddleware]

  /**
   * GET /users
   * List all users with filtering
   */
  app.get<{ Querystring: UserFilterQuery }>("/users", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "List all users with filtering",
      description:
        "Retrieves a paginated list of users with optional search and filter options by role and status",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(UserFilterQuerySchema),
      response: { 200: toJsonSchema(PaginatedUsersResponseSchema) },
    },
    handler: async (request, reply) => {
      const { page, limit, search, role, status } = request.query

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
    schema: {
      tags: ["Admin - Users"],
      summary: "Get all teachers",
      description:
        "Retrieves a list of all users with teacher role for use in selection dropdowns",
      security: [{ bearerAuth: [] }],
      response: { 200: toJsonSchema(TeachersListResponseSchema) },
    },
    handler: async (_request, reply) => {
      const teachersList = await adminUserService.getAllTeachers()

      return reply.send({ success: true, teachers: teachersList })
    },
  })

  /**
   * GET /users/:id
   * Get user details by ID
   */
  app.get<{ Params: UserParams }>("/users/:id", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Get user details by ID",
      description: "Retrieves detailed information for a specific user",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const userId = request.params.id

      const userDetails = await adminUserService.getUserById(userId)

      return reply.send({ success: true, user: userDetails })
    },
  })

  /**
   * POST /users
   * Create a new user
   */
  app.post<{ Body: CreateUser }>("/users", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Create a new user",
      description: "Creates a new user account with specified role and details",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(CreateUserSchema),
      response: { 201: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const newUserData = request.body

      const createdUser = await adminUserService.createUser(newUserData)

      return reply.status(201).send({ success: true, user: createdUser })
    },
  })

  /**
   * PATCH /users/:id/details
   * Update user profile details
   */
  app.patch<{ Params: UserParams; Body: UpdateUserDetails }>(
    "/users/:id/details",
    {
      preHandler: preHandlerMiddlewares,
      schema: {
        tags: ["Admin - Users"],
        summary: "Update user profile details",
        description:
          "Updates user profile information such as first name, last name, and avatar URL",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(UserParamsSchema),
        body: toJsonSchema(UpdateUserDetailsSchema),
        response: { 200: toJsonSchema(SingleUserResponseSchema) },
      },
      handler: async (request, reply) => {
        const userId = request.params.id
        const updatedDetailsData = request.body

        const updatedUser = await adminUserService.updateUserDetails(
          userId,
          updatedDetailsData,
        )

        return reply.send({ success: true, user: updatedUser })
      },
    },
  )

  /**
   * PATCH /users/:id/email
   * Update user email address
   */
  app.patch<{ Params: UserParams; Body: UpdateUserEmail }>("/users/:id/email", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Update user email address",
      description:
        "Updates a user's email address for account recovery purposes",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      body: toJsonSchema(UpdateUserEmailSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const userId = request.params.id
      const newEmailAddress = request.body.email

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
  app.patch<{ Params: UserParams; Body: UpdateUserRole }>("/users/:id/role", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Update user role",
      description:
        "Changes a user's role (e.g., student, teacher, admin) in the system",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      body: toJsonSchema(UpdateUserRoleSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const userId = request.params.id
      const newUserRole = request.body.role

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
  app.patch<{ Params: UserParams }>("/users/:id/status", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Toggle user account status",
      description:
        "Toggles a user's account status between active and inactive",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const userId = request.params.id

      const updatedUser = await adminUserService.toggleUserStatus(userId)

      return reply.send({ success: true, user: updatedUser })
    },
  })

  /**
   * DELETE /users/:id
   * Delete a user account
   */
  app.delete<{ Params: UserParams }>("/users/:id", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Users"],
      summary: "Delete a user account",
      description: "Permanently deletes a user account and all associated data",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SuccessResponseSchema) },
    },
    handler: async (request, reply) => {
      const userId = request.params.id

      await adminUserService.deleteUser(userId)

      return reply.send({ success: true, message: "User deleted successfully" })
    },
  })
}