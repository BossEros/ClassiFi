"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairedOccurrence = void 0;
/**
 * A paired occurrence represents a matching k-gram between two files.
 * It tracks the position in both files.
 */
class PairedOccurrence {
    left;
    right;
    fingerprint;
    constructor(left, right, fingerprint) {
        this.left = left;
        this.right = right;
        this.fingerprint = fingerprint;
    }
}
exports.PairedOccurrence = PairedOccurrence;
//# sourceMappingURL=pairedOccurrence.js.map