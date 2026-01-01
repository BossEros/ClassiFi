/**
 * A paired occurrence represents a matching k-gram between two files.
 * It tracks the position in both files.
 */
export class PairedOccurrence {
    left;
    right;
    fingerprint;
    constructor(left, right, fingerprint) {
        this.left = left;
        this.right = right;
        this.fingerprint = fingerprint;
    }
}
//# sourceMappingURL=pairedOccurrence.js.map