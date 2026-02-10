/**
 * Shared Utility Functions
 * Common utilities used across services.
 */

import { v4 as uuidv4 } from "uuid"
import type { ClassRepository } from "../repositories/class.repository.js"
import { BadRequestError } from "./errors.js"

/**
 * Generate a unique class code.
 * Creates an 8-character uppercase alphanumeric code and verifies uniqueness.
 *
 * @param classRepo - ClassRepository instance to check for existing codes
 * @returns A unique class code
 */
export async function generateUniqueClassCode(
  classRepo: ClassRepository,
): Promise<string> {
  let code: string
  let exists = true

  while (exists) {
    // Generate 8-character uppercase alphanumeric code
    code = uuidv4().substring(0, 8).toUpperCase()
    exists = await classRepo.checkClassCodeExists(code)
  }

  return code!
}

/**
 * Parse and validate a positive integer from a string.
 * Performs strict validation to ensure the entire string is numeric before parsing.
 * Throws a BadRequestError if the value is not a valid positive integer.
 *
 * @param value - The string value to parse
 * @param fieldName - The name of the field (for error messages)
 * @returns The parsed positive integer
 * @throws BadRequestError if the value is not a valid positive integer
 */
export function parsePositiveInt(
  value: string | undefined,
  fieldName: string,
): number {
  // Strict validation: ensure the entire string is numeric
  if (!value || !/^\d+$/.test(value)) {
    throw new BadRequestError(`${fieldName} must be a positive integer`)
  }

  const parsed = parseInt(value, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive integer`)
  }

  return parsed
}
/**
 * Parse a numeric ID parameter.
 * Throws a BadRequestError if the value is not a valid positive integer.
 *
 * @param value - The string value to parse
 * @param paramName - The name of the parameter (for error messages)
 * @returns The parsed number
 * @throws BadRequestError if the value is not a valid number
 */
export function parseNumericParam(value: string, paramName: string): number {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed <= 0) {
    throw new BadRequestError(`Invalid ${paramName} ID`)
  }
  return parsed
}

/**
 * Format a full name from first and last name.
 *
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Formatted full name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * Compute fullName for objects with firstName and lastName.
 *
 * @param obj - Object with firstName and lastName properties
 * @returns The original object with fullName added
 */
export function addFullName<T extends { firstName: string; lastName: string }>(
  obj: T,
): T & { fullName: string } {
  return {
    ...obj,
    fullName: formatFullName(obj.firstName, obj.lastName),
  }
}

/**
 * Parse and validate a date string.
 * Throws a BadRequestError if the date is invalid.
 *
 * @param dateValue - The date string or Date object to parse
 * @param fieldName - The name of the field (for error messages)
 * @returns A valid Date object
 * @throws BadRequestError if the date is invalid
 */
export function parseDate(dateValue: string | Date, fieldName: string): Date {
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) {
    throw new BadRequestError(`Invalid ${fieldName}`)
  }
  return date
}

/**
 * Parse and validate an optional date string.
 * Returns null if the value is undefined or null.
 * Throws a BadRequestError if the date is invalid.
 *
 * @param dateValue - The optional date string or Date object to parse
 * @param fieldName - The name of the field (for error messages)
 * @returns A valid Date object or null
 * @throws BadRequestError if the date is invalid
 */
export function parseOptionalDate(
  dateValue: string | Date | null | undefined,
  fieldName: string,
): Date | null {
  if (dateValue === null || dateValue === undefined) {
    return null
  }
  return parseDate(dateValue, fieldName)
}

/**
 * Filter out undefined values from an object.
 * Returns a new object with only defined properties.
 *
 * @param obj - The object to filter
 * @returns A new object with undefined values removed
 */
export function filterUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
