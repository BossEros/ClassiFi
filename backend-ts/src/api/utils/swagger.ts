import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0]

/**
 * Convert Zod schema to JSON Schema for OpenAPI/Swagger documentation.
 * Used by all controllers to define request/response schemas.
 */
export const toJsonSchema = <TSchema extends z.ZodType>(
  schema: TSchema,
): ReturnType<typeof zodToJsonSchema> =>
  zodToJsonSchema(schema as unknown as ZodToJsonSchemaInput, {
    target: "openApi3",
  })
