/**
 * Shared Constants
 *
 * Single source of truth for constants used across the application.
 */

/** Valid programming languages - single source of truth for both type and runtime validation */
export const PROGRAMMING_LANGUAGES = ["python", "java", "c"] as const

/** Programming language type - derived from the PROGRAMMING_LANGUAGES array */
export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number]
