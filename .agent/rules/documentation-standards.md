# Documentation Standards

This rule enforces a comprehensive, structured, and informative documentation style for all functions and API endpoints using JSDoc/TSDoc.

## Core Principles

1.  **Completeness**: Every exported function and API endpoint must include full documentation.
2.  **Structured Information**: Always use `@param` and `@returns` tags to clearly break down inputs and outputs. This provides a consistent "API reference" feel.
3.  **Informative Descriptions**: Even for "obvious" parameters, provide a clean, descriptive sentence.
    - _Bad:_ `@param id - id`
    - _Good:_ `@param id - Unique identifier of the user to retrieve.`

## JSDoc/TSDoc Guidelines for Functions

- **Summary**: A clear, concise sentence describing the function's primary action.
- **@param**: Must be present for **every** parameter. usage: `@param parameterName - Description of the parameter`.
- **@returns**: Must be present for every function that returns a value (not void). usage: `@returns Description of the returned data`.

### Example

```typescript
/**
 * Retrieves the submission history for a specific student and assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param studentId - The unique identifier of the student.
 * @returns An object containing the list of past submissions.
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number
): Promise<SubmissionHistoryResponse> {
  ...
}

/**
 * Calculates the final grade based on weighted components.
 *
 * @param scores - Array of individual component scores.
 * @param weights - Array of weights corresponding to each score (must sum to 1.0).
 * @returns The calculated final weighted grade.
 */
export function calculateGrade(scores: number[], weights: number[]): number {
  ...
}
```

## API Endpoint Documentation Guidelines

Every API endpoint must include:

1. **Endpoint Comment**: Multi-line comment block with HTTP method, path, and summary
2. **Fastify Schema**: Complete schema with tags, summary, description, security, and response types

### Endpoint Comment Format

```typescript
/**
 * {METHOD} {PATH}
 * {Summary description}
 */
```

### Examples

#### Complete Example with Error Responses

```typescript
/**
 * GET /users/:id
 * Get user details by ID
 */
app.get<{ Params: UserParams }>("/users/:id", {
  preHandler: [authMiddleware],
  schema: {
    tags: ["Users"],
    summary: "Get user details by ID",
    description: "Retrieves detailed information for a specific user",
    security: [{ bearerAuth: [] }],
    params: toJsonSchema(UserParamsSchema),
    response: {
      200: toJsonSchema(UserResponseSchema),
      400: {
        description: "Invalid user ID format",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Invalid user ID" },
        },
      },
      401: {
        description: "Authentication required",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Unauthorized" },
        },
      },
      403: {
        description: "Insufficient permissions to view user",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Forbidden" },
        },
      },
      404: {
        description: "User not found",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "User not found" },
        },
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Internal server error" },
        },
      },
    },
  },
  handler: async (request, reply) => {
    // Implementation
  },
});
```

#### Simplified Examples

```typescript
/**
 * POST /classes
 * Create a new class
 */
app.post<{ Body: CreateClass }>("/classes", {
  preHandler: [authMiddleware],
  schema: {
    tags: ["Classes"],
    summary: "Create a new class",
    description: "Creates a new class with the specified details",
    security: [{ bearerAuth: [] }],
    body: toJsonSchema(CreateClassSchema),
    response: {
      201: toJsonSchema(ClassResponseSchema),
      400: toJsonSchema(ErrorResponseSchema),
      401: toJsonSchema(ErrorResponseSchema),
      500: toJsonSchema(ErrorResponseSchema),
    },
  },
  handler: async (request, reply) => {
    // Implementation
  },
});

/**
 * PATCH /users/:id/role
 * Update user role
 */
app.patch<{ Params: UserParams; Body: UpdateRole }>("/users/:id/role", {
  preHandler: [authMiddleware, adminMiddleware],
  schema: {
    tags: ["Admin - Users"],
    summary: "Update user role",
    description: "Changes a user's role in the system",
    security: [{ bearerAuth: [] }],
    params: toJsonSchema(UserParamsSchema),
    body: toJsonSchema(UpdateRoleSchema),
    response: {
      200: toJsonSchema(UserResponseSchema),
      400: toJsonSchema(ErrorResponseSchema),
      401: toJsonSchema(ErrorResponseSchema),
      403: toJsonSchema(ErrorResponseSchema),
      404: toJsonSchema(ErrorResponseSchema),
      500: toJsonSchema(ErrorResponseSchema),
    },
  },
  handler: async (request, reply) => {
    // Implementation
  },
});

/**
 * DELETE /assignments/:id
 * Delete an assignment
 */
app.delete<{ Params: AssignmentParams }>("/assignments/:id", {
  preHandler: [authMiddleware],
  schema: {
    tags: ["Assignments"],
    summary: "Delete an assignment",
    description: "Permanently deletes an assignment and all associated data",
    security: [{ bearerAuth: [] }],
    params: toJsonSchema(AssignmentParamsSchema),
    response: {
      200: toJsonSchema(SuccessResponseSchema),
      401: toJsonSchema(ErrorResponseSchema),
      403: toJsonSchema(ErrorResponseSchema),
      404: toJsonSchema(ErrorResponseSchema),
      500: toJsonSchema(ErrorResponseSchema),
    },
  },
  handler: async (request, reply) => {
    // Implementation
  },
});
```

### Common Error Response Codes

Include these error codes based on endpoint requirements:

- **400 Bad Request**: Invalid input data or malformed request
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but lacks required permissions
- **404 Not Found**: Requested resource does not exist
- **500 Internal Server Error**: Unexpected server-side error

### Endpoint Documentation Checklist

- [ ] Endpoint comment includes method, path, and summary
- [ ] Tags match the feature domain
- [ ] Summary is action-oriented and clear
- [ ] Description provides additional context
- [ ] Security requirements are specified
- [ ] All input schemas (params, query, body) are documented
- [ ] Response schemas include success and common error codes
