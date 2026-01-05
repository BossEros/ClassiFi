import { TokenizedFile } from "../file/tokenizedFile.js";
import { Identifiable } from "../util/identifiable.js";
import { ASTRegion } from "./astRegion.js";

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
export class SharedFingerprint extends Identifiable {
    /** Whether this fingerprint is from boilerplate/template code */
    public ignored: boolean = false;

    /** Map from file -> list of occurrences in that file */
    private partMap: Map<TokenizedFile, Array<Occurrence>> = new Map();

    constructor(
        public readonly hash: number,
        public readonly kgram: Array<string> | null
    ) {
        super();
    }

    /**
     * Add an occurrence of this fingerprint.
     */
    public add(part: Occurrence): void {
        const parts = this.partMap.get(part.file) || [];
        if (parts.length === 0) {
            this.partMap.set(part.file, parts);
        }
        parts.push(part);
    }

    /**
     * Get all occurrences in a specific file.
     */
    public occurrencesOf(file: TokenizedFile): Array<Occurrence> {
        return this.partMap.get(file) || [];
    }

    /**
     * Get all occurrences across all files.
     */
    public allOccurrences(): Array<Occurrence> {
        return Array.from(this.partMap.values()).flat();
    }

    /**
     * Get all files that contain this fingerprint.
     */
    public files(): Array<TokenizedFile> {
        return Array.from(this.partMap.keys());
    }

    /**
     * Get the number of files containing this fingerprint.
     */
    public fileCount(): number {
        return this.partMap.size;
    }

    /**
     * Check if a specific file contains this fingerprint.
     */
    public includesFile(file: TokenizedFile): boolean {
        return this.partMap.has(file);
    }
}
