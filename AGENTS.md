# ClassiFi Agent Guidelines

This document is the **primary operational playbook** for AI agents working on ClassiFi. Strict adherence to these guidelines ensures code quality, architectural integrity, and system stability.

## 1. 📚 Documentation First

Before making any changes, **YOU MUST** understand the architecture of the specific module you are working on.

- **Frontend**: Read `frontend/documentation.md` (Clean Architecture: Presentation -> Business -> Data)
- **Backend**: Read `backend-ts/documentation.md` (Controller-Service-Repository Pattern)

> **Rule**: Do not invent new patterns. Follow the existing architecture documented in these files.

## 2. 🛠️ Tech Stack & Key Libraries

| Context      | Core Tech                       | Key Libraries                                                                                 |
| :----------- | :------------------------------ | :-------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, TypeScript      | `tailwindcss` (v4), `lucide-react`, `@monaco-editor/react`, `supabase-js`, `react-router-dom` |
| **Backend**  | Node.js, Fastify, TypeScript    | `drizzle-orm`, `tsyringe` (DI), `zod` (Validation), `vitest`                                  |
| **Testing**  | Vitest (Unit), Playwright (E2E) | -                                                                                             |

## 3. 🚨 Core Rules (Mandatory)

1.  **Conform to Architecture**:
    - **Frontend**: Components must utilize _Services_ for logic. Never import Repositories or API clients directly into UI components.
    - **Backend**: Controllers handle HTTP -> Services handle Business Logic -> Repositories handle DB.
2.  **Systematic Workflow**:
    - **Plan**: Always create an `implementation_plan.md` for non-trivial tasks.
    - **Implement**: Write SOLID, DRY code with descriptive variable, method, and class names so the implementation is self-explanatory.
    - **Verify**: Never assume code works. Verify with the specific commands below.
3.  **Research & Guidance**:
    - Use **Context7 MCP** for library-specific best practices.
    - Use **Exa/Perplexity** to resolve error messages or finding modern implementation patterns.

## 4. 🤖 Agent Workflow

### Phase 1: Exploration & Context

- [ ] Read `AGENTS.md` (this file).
- [ ] Read the specific folder's `documentation.md`.
- [ ] Explore relevant existing code using `view_file` to match the style.

### Phase 2: Execution

- [ ] Create a checklist in `task.md` (or update the user's task tracker).
- [ ] Implement changes systematically.
- [ ] **Reuse Code**: Check `shared/` directories in both frontend and backend before writing new utilities.

### Phase 3: Verification (CRITICAL)

You must run these commands to verify your work.

**Frontend (`/frontend`)**

```bash
npm run build   # MUST PASS: Checks for TypeScript type errors and builds
npm run lint    # Optional: Checks for code style issues
npm test        # Optional: Runs unit tests
```

**Backend (`/backend-ts`)**

```bash
npm run typecheck # MUST PASS: Checks for TypeScript errors
npm test        # MUST PASS: Runs unit tests
```

> **Failure Protocol**: If verification fails, stop, analyze the error, fix it, and re-verify. Do not proceed until the build/test passes.

### Phase 4: Documentation

- [ ] If you added a new feature, API, or architectural component, **UPDATE** the relevant `documentation.md` file immediately.

## 5. 📝 Code Quality Standards

### 5.1 Foundational Principles

- **SOLID Principles**: Always apply Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication by extracting reusable functions and utilities.
- **Check Shared Utilities**: Before writing new utility functions, check `shared/` directories in both frontend and backend.

### 5.2 API Security & Data Handling

1. **Don't Expose Internal Errors**: Never return database errors, stack traces, or tool failures to users. Log them internally, show users a simple message like "Something went wrong".
2. **Always Use DTOs (Data Transfer Objects)**: Map incoming request data to DTOs. This prevents unexpected fields, improves validation, and protects domain logic.
3. **Validate All Incoming Data**: Never trust client input. Validate types, formats, lengths, and required fields - always.
4. **Separate Business Logic from Controllers**: Controllers should handle requests. Services should handle logic. This makes your code easier to test and maintain.

### 5.3 Self-Documenting Code

Code should be self-explanatory through clear naming conventions:

**Variables:**
- Avoid single letters (except short loop counters)
- Include content + structure: `userList`, `usersArray` (not just `data`)
- Include units: `timeoutMs`, `priceUsd`

**Functions:**
- Use verb-noun pattern: `fetchUserProfile()`, `deleteUserAccount()`
- Be specific: `validateEmailFormat()` (not `check()`)
- Booleans should read like questions: `isValid`, `hasAccess`, `shouldRetry`

**Classes:**
- Use noun pattern: `UserManager`, `UserAuthenticationService`

**Example:**
```typescript
// ❌ Bad
function check(u: User, p: number) {
  const t = Date.now();
  if (u.a && u.l > p) return true;
  return false;
}

// ✅ Good
function isUserAuthorizedForLevel(
  user: User,
  requiredAccessLevel: number
): boolean {
  const currentTimestampMs = Date.now();
  const isActiveUser = user.isActive;
  const hasSufficientPrivileges = user.accessLevel > requiredAccessLevel;

  return isActiveUser && hasSufficientPrivileges;
}
```

### 5.4 TypeScript Best Practices

**Type Safety:**
- Enable `strict: true` in `tsconfig.json`
- **Never use `any` — always use specific types instead**
- Use explicit types at module boundaries, infer internally
- Use lowercase primitives (`string`, `number`, `boolean`)

**Type Hierarchy (from best to worst):**
1. **Specific types/interfaces** - Define exact structure (preferred)
2. **Generics** - For reusable type-safe code
3. **Union types** - When multiple specific types are possible
4. **Discriminated unions** - For state management with type narrowing
5. **`unknown` with type guards** - Only for truly unknown external data (must validate immediately)
6. **`any`** - ❌ Never use (disables type checking)

**Type Definitions:**
- Prefer **interfaces** for object shapes (extensible, better tooling)
- Use **type aliases** for unions, intersections, and utility compositions
- Use **string literal unions** instead of plain `string` for known values
- Use **discriminated unions** for state management
- Use **`as const`** for immutable arrays/objects

**Type Organization & Colocation:**
- **Colocate types with their usage** - Keep types close to where they're used (principle of colocation)
- **Avoid "god files"** - Don't create massive centralized type files that become hard to navigate
- **Layer-specific types stay in their layer**:
  - Database models & enums → `src/models/` (exported via `models/index.ts`)
  - Repository DTOs (operation-specific) → Keep in repository files
  - Service interfaces → Keep in service files
  - API contracts (request/response) → `src/api/schemas/` (Zod schemas)
  - Shared domain types (used across 3+ files) → `src/shared/types.ts`
- **When to centralize**: Only move types to shared locations when they're genuinely reused across multiple layers or features

**Example Structure:**
```typescript
// ✅ Good - Colocated types
// src/repositories/assignment.repository.ts
export interface CreateAssignmentData { /* ... */ }
export interface UpdateAssignmentData { /* ... */ }
export class AssignmentRepository {
  async create(data: CreateAssignmentData) { /* ... */ }
}

// ✅ Good - Shared domain types
// src/models/assignment.model.ts
export type ProgrammingLanguage = "python" | "java" | "c"
export interface LatePenaltyConfig { /* ... */ }

// ❌ Bad - Unnecessary centralization
// src/types/all-types.ts (500+ lines of unrelated types)
```

**Example:**
```typescript
// ❌ Bad - using any
function process(data: any) {
  return data.value.toUpperCase();
}

// ✅ Good - using specific type
interface Data {
  value: string;
}

function process(data: Data) {
  return data.value.toUpperCase();
}

// ✅ Best - using discriminated union for multiple types
type Result = 
  | { status: 'success'; data: Data }
  | { status: 'error'; error: string };

function handleResult(result: Result) {
  if (result.status === 'success') {
    return result.data.value; // TypeScript knows data exists
  }
  return result.error; // TypeScript knows error exists
}

// ⚠️ Acceptable - unknown for external data (validate immediately)
function parseExternal(input: unknown): Data {
  if (isValidData(input)) {
    return input; // Now typed as Data
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is Data {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as Data).value === 'string'
  );
}
```

**Runtime Safety:**
- Use **type guards** (`x is T`) for runtime type checking
- Use **optional chaining** (`?.`) and **nullish coalescing** (`??`)
- Create **custom error classes** with typed properties

**Utility Types:**
- `Partial<T>` for optional properties
- `Pick<T, Keys>` to select specific properties
- `Omit<T, Keys>` to exclude properties
- `Readonly<T>` for immutability
- `Record<K, V>` for typed dictionaries

### 5.5 Documentation Standards (JSDoc/TSDoc)

#### Function Documentation

Every exported function must include a full JSDoc block:

**Required Elements:**
- **Summary**: Clear, concise sentence describing the function's action
- **@param**: Must be present for every parameter with descriptive text
- **@returns**: Must be present for non-void functions

**Example:**
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
  // Implementation
}
```

#### API Endpoint Documentation

Every API endpoint must include comprehensive Fastify schema documentation:

**Required Elements:**
- **Endpoint comment**: Multi-line comment block with HTTP method, path, and summary for better readability
- **tags**: Array with category (e.g., `["Admin - Users"]`, `["Classes"]`)
- **summary**: Brief description of what the endpoint does
- **description**: (Optional) Additional context or usage notes
- **security**: Authentication requirements (e.g., `[{ bearerAuth: [] }]`)
- **params/querystring/body**: Zod schema converted via `toJsonSchema()`
- **response**: Expected response schemas by status code

**Example:**
```typescript
/**
 * GET /classes/:id/students
 * Get enrolled students in a class
 */
app.get<{ Params: ClassParams }>("/classes/:id/students", {
  preHandler: [authMiddleware],
  schema: {
    tags: ["Classes"],
    summary: "Get enrolled students in a class",
    description: "Returns list of students with enrollment details",
    security: [{ bearerAuth: [] }],
    params: toJsonSchema(ClassParamsSchema),
    response: {
      200: toJsonSchema(EnrolledStudentsResponseSchema),
    },
  },
  handler: async (request, reply) => {
    const students = await classService.getEnrolledStudents(request.params.id);
    return reply.send({ success: true, students });
  },
});

/**
 * POST /submissions
 * Submit an assignment
 */
app.post<{ Body: CreateSubmission }>("/submissions", {
  preHandler: [authMiddleware, uploadMiddleware],
  schema: {
    tags: ["Submissions"],
    summary: "Submit an assignment",
    description: "Upload code file for assignment submission",
    security: [{ bearerAuth: [] }],
    body: toJsonSchema(CreateSubmissionSchema),
    response: {
      201: toJsonSchema(SubmissionResponseSchema),
    },
  },
  handler: async (request, reply) => {
    const submission = await submissionService.submitAssignment(request.body);
    return reply.status(201).send({ success: true, submission });
  },
});
```

**Endpoint Comment Format:**
```typescript
/**
 * {METHOD} {PATH}
 * {Summary description}
 */

// Examples:
/**
 * GET /users/:id
 * Get user details by ID
 */

/**
 * POST /classes
 * Create a new class
 */

/**
 * PATCH /users/:id/role
 * Update user role
 */

/**
 * DELETE /assignments/:id
 * Delete an assignment
 */
```

**Endpoint Documentation Checklist:**
- [ ] Endpoint comment block includes method, path, and summary
- [ ] Tags match the feature domain
- [ ] Summary is action-oriented and clear
- [ ] Security requirements are specified
- [ ] All input schemas (params, query, body) are documented
- [ ] Response schemas include success and common error codes
- [ ] Description added for complex or non-obvious endpoints

### 5.6 Code Formatting & Spacing

**Vertical Spacing:**
- Add blank lines between different logical blocks
- Add blank lines around control flow (`if`, `for`, `while`, `switch`, `try/catch`)
- Add blank line before final `return` statement
- Separate variable declarations from logic

**Function Signatures:**
- **Single line** (preferred): If signature is short (< 80-100 chars)
- **Multi-line**: Only if line is too long, has complex types, or many parameters (3+)

**Example:**
```typescript
// ✅ Good (simple)
async function getUser(id: number): Promise<User> {
  const user = await db.getUser(id);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// ✅ Good (complex/long)
function createUser(
  name: string,
  email: string,
  preferences: { theme: string; notifications: boolean }
): User {
  // Implementation
}
```

## 6. 🔍 Research & Problem Solving

When you encounter issues or need guidance:

1. **Library Best Practices**: Use **Context7 MCP** or **Ref MCP** for library-specific documentation and patterns
2. **Error Resolution**: Use **Exa MCP** or **Perplexity MCP** for searching solutions to error messages
3. **Modern Patterns**: Use web search tools to find current implementation patterns and best practices

### 6.1 MCP-First Tool Routing (Mandatory)

Use MCP tools by default whenever a task depends on external knowledge, third-party services, or platform operations.

1. **Library/framework docs**:
   - First choice: **Context7 MCP**
   - Fallback: **Ref MCP**
2. **General web search / current facts**:
   - First choice: **Exa MCP** (`web_search_exa`)
   - Fallback: **Perplexity MCP**
3. **Code examples and API usage patterns**:
   - First choice: **Exa MCP** (`get_code_context_exa`)
   - Fallback: **Context7 MCP** for official docs examples
4. **Error investigation and debugging research**:
   - First choice: **Exa MCP**
   - Second opinion: **Perplexity MCP**
5. **Documentation lookup from known URLs or doc indexes**:
   - Use **Ref MCP** (`ref_search_documentation`, `ref_read_url`)
6. **Supabase tasks (DB, functions, branches, advisories)**:
   - Use **Supabase MCP** directly instead of ad-hoc SQL or guessed commands
7. **Render deployment/ops tasks**:
   - Use **Render MCP** directly for services, logs, and metrics
8. **Notion tasks (search, pages, comments, databases)**:
   - Use **Notion MCP** directly
9. **UI generation/edit tasks**:
   - Use **Stitch MCP** directly
10. **Automated test planning/generation flows**:
    - Use **TestSprite MCP** according to project state and config rules

- Prefer MCP over manual web browsing whenever an MCP can solve the task.
- Choose the MCP that is closest to the task domain before trying generic search.
- If a chosen MCP fails, retry with a domain-appropriate fallback MCP, then continue.

## 7. 🔑 Test Credentials

Use these accounts for browser-based testing or login flows.

| Role        | Email                   | Password     |
| :---------- | :---------------------- | :----------- |
| **Teacher** | `namisvilan@gmail.com`  | `Qwerty123!` |
| **Student** | `marfiezeros@gmail.com` | `Qwerty123!` |
