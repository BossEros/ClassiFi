# Documentation Standards

This rule enforces a comprehensive, structured, and informative documentation style for all functions using JSDoc/TSDoc.

## Core Principles

1.  **Completeness**: Every exported function must include a full JSDoc block.
2.  **Structured Information**: Always use `@param` and `@returns` tags to clearly break down inputs and outputs. This provides a consistent "API reference" feel.
3.  **Informative Descriptions**: Even for "obvious" parameters, provide a clean, descriptive sentence.
    - _Bad:_ `@param id - id`
    - _Good:_ `@param id - Unique identifier of the user to retrieve.`

## JSDoc/TSDoc Guidelines

- **Summary**: A clear, concise sentence describing the function's primary action.
- **@param**: Must be present for **every** parameter. usage: `@param parameterName - Description of the parameter`.
- **@returns**: Must be present for every function that returns a value (not void). usage: `@returns Description of the returned data`.

## Example

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
