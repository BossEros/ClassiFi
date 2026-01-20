# Self-Documenting Code Standards

This rule establishes the standard for "Self-Documenting Code." The primary goal is to name variables, functions, and classes so explicitly that external documentation is largely unnecessary for understanding the _what_ and _how_.

## Core Principles

1.  **Naming is Documentation**: The name of a variable, function, or class should fully describe its intent, scope, and content.
2.  **Verbosity is Preferred over Ambiguity**: Do not abbreviate for brevity's sake if it costs clarity. `getUserProfileByEmail` is infinitely better than `getUser`.
3.  **Boolean Clarity**: Boolean variables and functions should read like questions or statements of fact (e.g., `isValid`, `hasAccess`, `shouldRetry`).

## Guidelines

### 1. Variables

- **Avoid Single Letters**: Never use `i`, `x`, `d` except in very short loops/counters.
- **Content + Structure**: If a variable holds a list of users, name it `userList` or `usersArray`, not just `data`.
- **Units**: If a variable represents time or money, include the unit. `timeoutMs` instead of `timeout`.

### 2. Functions/Methods

- **Verb-Noun Pattern**: Functions do things. Start with a verb.
  - _Bad:_ `user()`
  - _Good:_ `fetchUserProfile()`, `deleteUserAccount()`
- **Specific Actions**: Be precise about the action.
  - _Bad:_ `check()`
  - _Good:_ `validateEmailFormat()`, `verifyUserPermissions()`

### 3. Classes/Interfaces

- **Noun Pattern**: Classes represent things or concepts.
  - _Bad:_ `HandleUsers`
  - _Good:_ `UserManager`, `UserAuthenticationService`

## Examples

**Bad Code (Requires Comments):**

```typescript
// Check if user can enter
// p = permission level
function check(u: User, p: number) {
  // t = time now
  const t = Date.now();
  if (u.a && u.l > p) {
    return true;
  }
  return false;
}
```

**Good Code (Self-Documenting):**

```typescript
function isUserAuthorizedForLevel(
  user: User,
  requiredAccessLevel: number,
): boolean {
  const currentTimestampMs = Date.now();

  const isActiveUser = user.isActive;
  const hasSufficientPrivileges = user.accessLevel > requiredAccessLevel;

  return isActiveUser && hasSufficientPrivileges;
}
```
