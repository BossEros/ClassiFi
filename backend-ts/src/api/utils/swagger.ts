import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

/**
 * Convert Zod schema to JSON Schema for OpenAPI/Swagger documentation.
 * Used by all controllers to define request/response schemas.
 */
export const toJsonSchema = (schema: z.ZodType<any>) =>
  zodToJsonSchema(schema as any, { target: "openApi3" })
