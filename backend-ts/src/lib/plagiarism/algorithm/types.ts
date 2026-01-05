import { Range } from "../util/range.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { SharedFingerprint } from "./sharedFingerprint.js";

// Re-export ASTRegion for convenience
export type { ASTRegion } from "./astRegion.js";

/**
 * Entry for a file in the index.
 * Shared between FingerprintIndex and Pair to avoid circular imports.
 */
export interface FileEntry {
    file: TokenizedFile;
    kgrams: Array<Range>;
    shared: Set<SharedFingerprint>;
    ignored: Set<SharedFingerprint>;
    isIgnored: boolean;
}

