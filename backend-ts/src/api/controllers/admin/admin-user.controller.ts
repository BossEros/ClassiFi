/**
 * Admin User Controller
 * Handles user management endpoints.
 */
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
  SuccessResponseSchema,
  type UserFilterQuery,
  type UserParams,
  type UpdateUserRole,
  type UpdateUserDetails,
  type UpdateUserEmail,
  type CreateUser,
} from "../../schemas/admin.schema.js"

export async function adminUserRoutes(app: FastifyInstance): Promise<void> {
  const adminUserService =
    container.resolve<AdminUserService>("AdminUserService")
  const preHandler = [authMiddleware, adminMiddleware]

  // GET /users
  app.get<{ Querystring: UserFilterQuery }>("/users", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "List all users",
      description: "Get paginated list of users with search and filter options",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(UserFilterQuerySchema),
      response: { 200: toJsonSchema(PaginatedUsersResponseSchema) },
    },
    handler: async (request, reply) => {
      const { page, limit, search, role, status } = request.query
      const result = await adminUserService.getAllUsers({
        page,
        limit,
        search,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
      })
      return reply.send({ success: true, ...result })
    },
  })

  // GET /users/:id
  app.get<{ Params: UserParams }>("/users/:id", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Get user details",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const user = await adminUserService.getUserById(request.params.id)
      return reply.send({ success: true, user })
    },
  })

  // POST /users
  app.post<{ Body: CreateUser }>("/users", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Create a new user",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(CreateUserSchema),
      response: { 201: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const user = await adminUserService.createUser(request.body)
      return reply.status(201).send({ success: true, user })
    },
  })

  // PATCH /users/:id/details
  app.patch<{ Params: UserParams; Body: UpdateUserDetails }>(
    "/users/:id/details",
    {
      preHandler,
      schema: {
        tags: ["Admin - Users"],
        summary: "Update user details",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(UserParamsSchema),
        body: toJsonSchema(UpdateUserDetailsSchema),
        response: { 200: toJsonSchema(SingleUserResponseSchema) },
      },
      handler: async (request, reply) => {
        const user = await adminUserService.updateUserDetails(
          request.params.id,
          request.body,
        )
        return reply.send({ success: true, user })
      },
    },
  )

  // PATCH /users/:id/email
  app.patch<{ Params: UserParams; Body: UpdateUserEmail }>("/users/:id/email", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Update user email (account recovery)",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      body: toJsonSchema(UpdateUserEmailSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const user = await adminUserService.updateUserEmail(
        request.params.id,
        request.body.email,
      )
      return reply.send({ success: true, user })
    },
  })

  // PATCH /users/:id/role
  app.patch<{ Params: UserParams; Body: UpdateUserRole }>("/users/:id/role", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Update user role",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      body: toJsonSchema(UpdateUserRoleSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const user = await adminUserService.updateUserRole(
        request.params.id,
        request.body.role,
      )
      return reply.send({ success: true, user })
    },
  })

  // PATCH /users/:id/status
  app.patch<{ Params: UserParams }>("/users/:id/status", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Toggle user status",
      description: "Toggle between active and inactive status",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SingleUserResponseSchema) },
    },
    handler: async (request, reply) => {
      const user = await adminUserService.toggleUserStatus(request.params.id)
      return reply.send({ success: true, user })
    },
  })

  // DELETE /users/:id
  app.delete<{ Params: UserParams }>("/users/:id", {
    preHandler,
    schema: {
      tags: ["Admin - Users"],
      summary: "Delete a user",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(UserParamsSchema),
      response: { 200: toJsonSchema(SuccessResponseSchema) },
    },
    handler: async (request, reply) => {
      await adminUserService.deleteUser(request.params.id)
      return reply.send({ success: true, message: "User deleted successfully" })
    },
  })
}
