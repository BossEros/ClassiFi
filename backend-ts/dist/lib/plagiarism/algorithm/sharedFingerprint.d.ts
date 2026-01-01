import { TokenizedFile } from "../file/tokenizedFile.js";
import { Identifiable } from "../util/identifiable.js";
import { ASTRegion } from "./pairedOccurrence.js";
/**
 * Represents an occurrence of a fingerprint in a specific file.
 */
export interface Occurrence {
    file: TokenizedFile;
    side: ASTRegion;
}
/**
 * A shared fingerprint is a k-gram hash that appears in multiple files.
 * It tracks all occurrences of this fingerprint across files.
 */
export declare class SharedFingerprint extends Identifiable {
    readonly hash: number;
    readonly kgram: Array<string> | null;
    /** Whether this fingerprint is from boilerplate/template code */
    ignored: boolean;
    /** Map from file -> list of occurrences in that file */
    private partMap;
    constructor(hash: number, kgram: Array<string> | null);
    /**
     * Add an occurrence of this fingerprint.
     */
    add(part: Occurrence): void;
    /**
     * Get all occurrences in a specific file.
     */
    occurrencesOf(file: TokenizedFile): Array<Occurrence>;
    /**
     * Get all occurrences across all files.
     */
    allOccurrences(): Array<Occurrence>;
    /**
     * Get all files that contain this fingerprint.
     */
    files(): Array<TokenizedFile>;
    /**
     * Get the number of files containing this fingerprint.
     */
    fileCount(): number;
    /**
     * Check if a specific file contains this fingerprint.
     */
    includesFile(file: TokenizedFile): boolean;
}
//# sourceMappingURL=sharedFingerprint.d.ts.map