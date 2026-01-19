/**
 * Admin Class Controller
 * Handles class management endpoints.
 */
import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { AdminClassService } from "../../../services/admin/admin-class.service.js";
import { AdminUserService } from "../../../services/admin/admin-user.service.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminMiddleware } from "../../middlewares/admin.middleware.js";
import { toJsonSchema } from "../../utils/swagger.js";
import {
  ClassFilterQuerySchema,
  ClassParamsSchema,
  CreateClassSchema,
  UpdateClassSchema,
  ReassignTeacherSchema,
  PaginatedClassesResponseSchema,
  SingleClassResponseSchema,
  TeachersListResponseSchema,
  SuccessResponseSchema,
  type ClassFilterQuery,
  type ClassParams,
  type CreateClass,
  type UpdateClass,
  type ReassignTeacher,
} from "../../schemas/admin.schema.js";

export async function adminClassRoutes(app: FastifyInstance): Promise<void> {
  const adminClassService =
    container.resolve<AdminClassService>("AdminClassService");
  const adminUserService =
    container.resolve<AdminUserService>("AdminUserService");
  const preHandler = [authMiddleware, adminMiddleware];

  // GET /classes
  app.get<{ Querystring: ClassFilterQuery }>("/classes", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "List all classes",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(ClassFilterQuerySchema),
      response: { 200: toJsonSchema(PaginatedClassesResponseSchema) },
    },
    handler: async (request, reply) => {
      const {
        page,
        limit,
        search,
        teacherId,
        status,
        yearLevel,
        semester,
        academicYear,
      } = request.query;
      const result = await adminClassService.getAllClasses({
        page,
        limit,
        search,
        teacherId,
        status: status === "all" ? undefined : status,
        yearLevel,
        semester,
        academicYear,
      });
      return reply.send({ success: true, ...result });
    },
  });

  // GET /classes/:id
  app.get<{ Params: ClassParams }>("/classes/:id", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Get class details",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const classData = await adminClassService.getClassById(request.params.id);
      return reply.send({ success: true, class: classData });
    },
  });

  // POST /classes
  app.post<{ Body: CreateClass }>("/classes", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Create a new class",
      description: "Admin can create a class and assign any teacher",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(CreateClassSchema),
      response: { 201: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const classData = await adminClassService.createClass({
        teacherId: request.body.teacherId,
        className: request.body.className,
        yearLevel: request.body.yearLevel,
        semester: request.body.semester,
        academicYear: request.body.academicYear,
        schedule: request.body.schedule,
        description: request.body.description,
      });
      return reply.status(201).send({
        success: true,
        class: {
          ...classData,
          teacherName: "Unknown", // Will be populated on fetch if needed
        },
      });
    },
  });

  // PUT /classes/:id
  app.put<{ Params: ClassParams; Body: UpdateClass }>("/classes/:id", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Update a class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      body: toJsonSchema(UpdateClassSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      await adminClassService.updateClass(
        request.params.id,
        request.body as any,
      );
      const fullClass = await adminClassService.getClassById(request.params.id);
      return reply.send({ success: true, class: fullClass });
    },
  });

  // DELETE /classes/:id
  app.delete<{ Params: ClassParams }>("/classes/:id", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Delete a class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SuccessResponseSchema) },
    },
    handler: async (request, reply) => {
      await adminClassService.deleteClass(request.params.id);
      return reply.send({
        success: true,
        message: "Class deleted successfully",
      });
    },
  });

  // PATCH /classes/:id/reassign
  app.patch<{ Params: ClassParams; Body: ReassignTeacher }>(
    "/classes/:id/reassign",
    {
      preHandler,
      schema: {
        tags: ["Admin - Classes"],
        summary: "Reassign class teacher",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassParamsSchema),
        body: toJsonSchema(ReassignTeacherSchema),
        response: { 200: toJsonSchema(SingleClassResponseSchema) },
      },
      handler: async (request, reply) => {
        await adminClassService.reassignClassTeacher(
          request.params.id,
          request.body.teacherId,
        );
        const fullClass = await adminClassService.getClassById(
          request.params.id,
        );
        return reply.send({ success: true, class: fullClass });
      },
    },
  );

  // PATCH /classes/:id/archive
  app.patch<{ Params: ClassParams }>("/classes/:id/archive", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Archive a class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      await adminClassService.archiveClass(request.params.id);
      const fullClass = await adminClassService.getClassById(request.params.id);
      return reply.send({ success: true, class: fullClass });
    },
  });

  // GET /teachers
  app.get("/teachers", {
    preHandler,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Get all teachers",
      description: "For use in teacher selection dropdowns",
      security: [{ bearerAuth: [] }],
      response: { 200: toJsonSchema(TeachersListResponseSchema) },
    },
    handler: async (_request, reply) => {
      const teachers = await adminUserService.getAllTeachers();
      return reply.send({ success: true, teachers });
    },
  });

  // GET /classes/:id/assignments
  app.get<{ Params: ClassParams }>("/classes/:id/assignments", {
    preHandler,
    schema: {
      tags: ["Admin - Enrollment"], // Tag kept as Enrollment/Class related
      summary: "Get class assignments",
      description: "Get all assignments for a specific class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
    },
    handler: async (request, reply) => {
      const assignments = await adminClassService.getClassAssignments(
        request.params.id,
      );
      return reply.send({ success: true, assignments });
    },
  });
}
