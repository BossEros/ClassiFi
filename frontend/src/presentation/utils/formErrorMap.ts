import type { FieldErrors, FieldValues } from "react-hook-form"
import type { ZodIssue } from "zod"

/**
 * Converts a Zod issue path to a dot-notated form field path.
 *
 * @param issuePath - Zod issue path.
 * @returns Dot-notated path.
 */
function toDotPath(issuePath: ZodIssue["path"]): string {
  if (issuePath.length === 0) {
    return "general"
  }

  return issuePath.join(".")
}

/**
 * Converts Zod issues to a record keyed by field path.
 *
 * @param issues - Zod issues from failed parse.
 * @returns A record of first error message per field.
 */
export function mapZodIssuesToFieldErrors(
  issues: readonly ZodIssue[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  for (const issue of issues) {
    const fieldPath = toDotPath(issue.path)

    if (!fieldErrors[fieldPath]) {
      fieldErrors[fieldPath] = issue.message
    }
  }

  return fieldErrors
}

/**
 * Returns a field error message from nested React Hook Form errors.
 *
 * @param errors - React Hook Form errors object.
 * @param fieldPath - Dot-notated field path.
 * @returns Field error message or undefined.
 */
export function getFieldErrorMessage<TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues>,
  fieldPath: string,
): string | undefined {
  const pathSegments = fieldPath.split(".")
  let currentNode: unknown = errors

  for (const segment of pathSegments) {
    if (!currentNode || typeof currentNode !== "object") {
      return undefined
    }

    if (!(segment in currentNode)) {
      return undefined
    }

    currentNode = (currentNode as Record<string, unknown>)[segment]
  }

  if (!currentNode || typeof currentNode !== "object") {
    return undefined
  }

  const maybeMessage = (currentNode as { message?: unknown }).message

  return typeof maybeMessage === "string" ? maybeMessage : undefined
}
