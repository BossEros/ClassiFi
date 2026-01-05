import { ASTRegion } from "./astRegion.js";

// Re-export for backward compatibility
export type { ASTRegion };

/**
 * Forward declaration to avoid circular imports.
 */
export interface SharedFingerprintRef {
    hash: number;
}

/**
 * A paired occurrence represents a matching k-gram between two files.
 * It tracks the position in both files.
 */
export class PairedOccurrence {
    constructor(
        public readonly left: ASTRegion,
        public readonly right: ASTRegion,
        public readonly fingerprint: SharedFingerprintRef
    ) { }
}
