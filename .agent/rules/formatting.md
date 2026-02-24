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

- **Single Line (Preferred):** Keep function parameters on a single line instead of separating each parameter onto its own line. Do not unnecessarily wrap parameters; only break them if the line becomes unreasonably long (typically > 100 chars). This keeps the code looking clean and organized.

## Variable Declarations

- **Single Line (Preferred):** Always write variable declarations and assignments on a single line if they can fit reasonably within the line length limit (typically < 80-100 chars). Do not break statements after the equals sign (`=`) unnecessarily.
- **Multi-Line:** Only split variables and assignments across multiple lines if the expression is naturally too long to fit on a single line or if breaking it improves readability.

## Imports

- **Single Line (Preferred):** Keep imports on a single line instead of destructuring each imported element onto its own line. Do not unnecessarily wrap imports; only break them if the line becomes unreasonably long. This keeps the import block looking clean and organized.

## Example (Function Signatures)

```typescript
// bad
function createUser(
  name: string,
  email: string,
  preferences: { theme: string; notifications: boolean }
): User {
  ...
}

// good
function createUser(name: string, email: string, preferences: { theme: string; notifications: boolean }): User {
  ...
}
```

## Example (Imports)

```typescript
// bad
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/card"

// good
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/card"
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
