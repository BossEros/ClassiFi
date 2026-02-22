---
trigger: always_on
---

# Code Formatting & Spacing

To improve readability and visual separation of logic:

## Vertical Spacing

- **Separate Blocks:** Always add a blank line between different "logical blocks" of code within a function.
- **Around Control Flow:** Add a blank line before and after `if`, `for`, `while`, `switch` statements, and `try/catch` blocks.
- **Before Returns:** Always add a blank line before the final `return` statement in a function (unless the function is a one-liner).
- **Around Declarations:** Separate variable declarations from the logic that follows them.

## Function Signatures

- **Single Line (Preferred):** If a function signature (arguments & return type) is short and simple (typically creates a line < 80-100 chars), keep it on a single line.
- **Multi-Line:** Only break parameters onto multiple lines if:
  - The line becomes too long.
  - The parameters include complex inline types or object destructuring.
  - There are many parameters (3+).

## Variable Declarations

- **Single Line (Preferred):** Always write variable declarations and assignments on a single line if they can fit reasonably within the line length limit (typically < 80-100 chars). Do not break statements after the equals sign (`=`) unnecessarily.
- **Multi-Line:** Only split variables and assignments across multiple lines if the expression is naturally too long to fit on a single line or if breaking it improves readability.

## Example

```typescript
// bad (unnecessary split)
function getUser(
  id: number
): User {
  ...
}

// good (simple)
function getUser(id: number): User {
  ...
}

// good (complex/long)
function createUser(
  name: string,
  email: string,
  preferences: { theme: string; notifications: boolean }
): User {
  ...
}
```

## Example (Vertical Spacing)

```typescript
// bad
function processUser(id: number) {
  const user = await db.getUser(id)
  if (!user) {
    throw new Error("No user")
  }
  return user
}

// good
function processUser(id: number) {
  const user = await db.getUser(id)

  if (!user) {
    throw new Error("No user")
  }

  return user
}
```
