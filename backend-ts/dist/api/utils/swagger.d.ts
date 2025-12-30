import { z } from 'zod';
/**
 * Convert Zod schema to JSON Schema for OpenAPI/Swagger documentation.
 * Used by all controllers to define request/response schemas.
 */
export declare const toJsonSchema: (schema: z.ZodType) => object & {
    $schema?: string | undefined;
    definitions?: {
        [key: string]: object;
    } | undefined;
};
//# sourceMappingURL=swagger.d.ts.map