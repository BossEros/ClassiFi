/**
 * Validates that an ID is a positive number
 * @param id - The ID to validate
 * @param fieldName - Name of the field for error message (e.g., 'class', 'teacher', 'student')
 * @throws Error if ID is invalid
 */
export function validateId(
  id: number | undefined | null,
  fieldName: string,
): void {
  if (!id || id <= 0) {
    throw new Error(`Invalid ${fieldName} ID`)
  }
}

/**
 * Validates multiple IDs at once
 * @param ids - Object with fieldName as key and id as value
 * @throws Error if any ID is invalid
 */
export function validateIds(
  ids: Record<string, number | undefined | null>,
): void {
  for (const [fieldName, id] of Object.entries(ids)) {
    validateId(id, fieldName)
  }
}
