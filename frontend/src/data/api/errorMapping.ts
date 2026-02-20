/**
 * Error handling utilities for consistent error responses
 */

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false
  message: string
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = void> {
  success: true
  message?: string
  data?: T
}

/**
 * Combined response type
 */
export type ApiResponse<T = void> = SuccessResponse<T> | ErrorResponse

/**
 * Removes technical status-code decorations from user-facing error text.
 *
 * @param message - The raw message that may include transport-level details.
 * @returns A cleaned message suitable for student/teacher UI surfaces.
 */
export function sanitizeUserFacingErrorMessage(message: string): string {
  return message
    .replace(/\s*\(Status:\s*\d{3}\)\s*$/i, "")
    .replace(/\s*\(HTTP\s*\d{3}\)\s*$/i, "")
    .trim()
}

/**
 * Create an error response
 * @param message - Error message
 * @returns Standardized error response
 */
export function errorResponse(message: string): ErrorResponse {
  return { success: false, message }
}

/**
 * Create a success response
 * @param data - Optional data payload
 * @param message - Optional success message
 * @returns Standardized success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
): SuccessResponse<T> {
  return { success: true, message, data }
}

/**
 * Extract error message from unknown error
 * @param error - Unknown error (could be Error, string, or unknown)
 * @param fallback - Fallback message if error cannot be parsed
 * @returns Error message string
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = "An unexpected error occurred",
): string {
  if (error instanceof Error) {
    return sanitizeUserFacingErrorMessage(error.message)
  }
  if (typeof error === "string") {
    return sanitizeUserFacingErrorMessage(error)
  }
  return fallback
}

/**
 * Wrap an async function with standardized error handling
 * @param fn - Async function to wrap
 * @returns Function that catches errors and returns ErrorResponse
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  fallbackMessage: string = "An unexpected error occurred",
): (...args: Args) => Promise<T | ErrorResponse> {
  return async (...args: Args): Promise<T | ErrorResponse> => {
    try {
      return await fn(...args)
    } catch (error) {
      return errorResponse(getErrorMessage(error, fallbackMessage))
    }
  }
}
