---
trigger: always_on
---

# TypeScript Best Practices

Always follow these TypeScript best practices when writing code:

## Type Safety

- Enable `strict: true` in `tsconfig.json` — this is non-negotiable
- Never use `any` — use `unknown` with type guards instead
- Use explicit types at module boundaries (function params/returns), infer internally
- Use lowercase primitives (`string`, `number`, `boolean`), not wrapper objects (`String`, `Number`)

## Type Definitions

- Prefer **interfaces** for object shapes (extensible, better tooling)
- Use **type aliases** for unions, intersections, and utility compositions
- Use **string literal unions** instead of plain `string` for known values
- Use **discriminated unions** for state management (e.g., `{ status: "loading" } | { status: "error"; error: string }`)
- Use **`as const`** for immutable arrays/objects to get narrow literal types
- Adhere to TypeScript best practices by avoiding any types

## Runtime Safety

- Use **type guards** (`x is T`) for runtime type checking
- Use **optional chaining** (`?.`) and **nullish coalescing** (`??`) for null safety
- Create **custom error classes** with typed properties for better error handling

## Utility Types

- Use `Partial<T>` for optional properties
- Use `Pick<T, Keys>` to select specific properties
- Use `Omit<T, Keys>` to exclude properties
- Use `Readonly<T>` for immutability
- Use `Record<K, V>` for typed dictionaries

## Code Quality

- Prefer **const objects with `as const`** over enums (less runtime overhead)
- Use **composition over inheritance** for types
- Document complex types with JSDoc comments
- Configure ESLint with `@typescript-eslint` for enforcement
