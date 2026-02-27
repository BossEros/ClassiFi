/**
 * Assertion helper function.
 * Throws an error if the condition is false.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

/**
 * Assert that a value is defined (not undefined or null).
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message: string,
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`Assertion failed: ${message}`)
  }
}
