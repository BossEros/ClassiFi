/**
 * Shared Utility Functions
 * Common utilities used across services.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ClassRepository } from '../repositories/class.repository.js';

/**
 * Generate a unique class code.
 * Creates an 8-character uppercase alphanumeric code and verifies uniqueness.
 * 
 * @param classRepo - ClassRepository instance to check for existing codes
 * @returns A unique class code
 */
export async function generateUniqueClassCode(classRepo: ClassRepository): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
        // Generate 8-character uppercase alphanumeric code
        code = uuidv4().substring(0, 8).toUpperCase();
        exists = await classRepo.checkClassCodeExists(code);
    }

    return code!;
}

/**
 * Parse a numeric ID parameter.
 * Throws an error if the value is not a valid positive integer.
 * 
 * @param value - The string value to parse
 * @param paramName - The name of the parameter (for error messages)
 * @returns The parsed number
 * @throws Error if the value is not a valid number
 */
export function parseNumericParam(value: string, paramName: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${paramName} ID`);
    }
    return parsed;
}

/**
 * Format a full name from first and last name.
 * 
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Formatted full name
 */
export function formatFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
}

/**
 * Compute fullName for objects with firstName and lastName.
 * 
 * @param obj - Object with firstName and lastName properties
 * @returns The original object with fullName added
 */
export function addFullName<T extends { firstName: string; lastName: string }>(
    obj: T
): T & { fullName: string } {
    return {
        ...obj,
        fullName: formatFullName(obj.firstName, obj.lastName),
    };
}
