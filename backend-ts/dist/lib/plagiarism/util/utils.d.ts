/**
 * Assertion helper function.
 * Throws an error if the condition is false.
 */
export declare function assert(condition: boolean, message: string): asserts condition;
/**
 * Assert that a value is defined (not undefined or null).
 */
export declare function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T;
/**
 * Find the closest matching key from a record.
 * Returns undefined if no match found.
 */
export declare function closestMatch<T>(key: string, options: Record<string, T>): T | undefined;
//# sourceMappingURL=utils.d.ts.map