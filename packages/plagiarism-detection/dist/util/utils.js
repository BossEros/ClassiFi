"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.assertDefined = assertDefined;
exports.closestMatch = closestMatch;
/**
 * Assertion helper function.
 * Throws an error if the condition is false.
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
/**
 * Assert that a value is defined (not undefined or null).
 */
function assertDefined(value, message) {
    if (value === undefined || value === null) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
/**
 * Find the closest matching key from a record.
 * Returns undefined if no match found.
 */
function closestMatch(key, options) {
    // Exact match
    if (key in options) {
        return options[key];
    }
    // Case-insensitive match
    const lowerKey = key.toLowerCase();
    for (const [optionKey, value] of Object.entries(options)) {
        if (optionKey.toLowerCase() === lowerKey) {
            return value;
        }
    }
    // Partial match
    for (const [optionKey, value] of Object.entries(options)) {
        if (optionKey.toLowerCase().includes(lowerKey) || lowerKey.includes(optionKey.toLowerCase())) {
            return value;
        }
    }
    return undefined;
}
//# sourceMappingURL=utils.js.map