import { ASTRegion } from "./astRegion.js";
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
export declare class PairedOccurrence {
    readonly left: ASTRegion;
    readonly right: ASTRegion;
    readonly fingerprint: SharedFingerprintRef;
    constructor(left: ASTRegion, right: ASTRegion, fingerprint: SharedFingerprintRef);
}
//# sourceMappingURL=pairedOccurrence.d.ts.map