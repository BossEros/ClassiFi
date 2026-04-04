/**
 * Normalizes an optional class description for create requests.
 * Empty or whitespace-only values are omitted from the payload.
 *
 * @param description - The raw description value from the form.
 * @returns A trimmed description string, or undefined when empty.
 */
export function normalizeClassDescriptionForCreate(
  description: string | null | undefined,
): string | undefined {
  const trimmedDescription = description?.trim() ?? ""

  return trimmedDescription ? trimmedDescription : undefined
}

/**
 * Normalizes an optional class description for update requests.
 * `undefined` means "leave unchanged" while `null` means "clear the value".
 *
 * @param description - The raw description value from the form or update payload.
 * @returns A trimmed description string, null when explicitly cleared, or undefined when untouched.
 */
export function normalizeClassDescriptionForUpdate(
  description: string | null | undefined,
): string | null | undefined {
  if (description === undefined) {
    return undefined
  }

  if (description === null) {
    return null
  }

  const trimmedDescription = description.trim()

  return trimmedDescription ? trimmedDescription : null
}
