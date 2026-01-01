import { Region } from "../util/region.js";
/**
 * Information about one side of a paired occurrence (matching k-gram).
 */
export interface ASTRegion {
    /** Start index in the AST token array */
    start: number;
    /** Stop index (inclusive) in the AST token array */
    stop: number;
    /** Index of when this k-gram was outputted by the HashFilter */
    index: number;
    /** The source code region (line/column) for this k-gram */
    location: Region;
    /** Optional: the actual token data */
    data: Array<string> | null;
}
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