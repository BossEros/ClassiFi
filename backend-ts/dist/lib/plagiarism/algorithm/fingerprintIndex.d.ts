import { TokenizedFile } from "../file/tokenizedFile.js";
import { SharedFingerprint } from "./sharedFingerprint.js";
import { Pair } from "./pair.js";
import { FileEntry } from "./types.js";
export type Hash = number;
/**
 * The FingerprintIndex is the main comparison engine.
 *
 * It:
 * 1. Generates fingerprints from tokenized files using the Winnow algorithm
 * 2. Builds an inverted index mapping fingerprint hashes to files
 * 3. Identifies shared fingerprints between files
 * 4. Can generate Pairs for comparison between any two files
 */
export declare class FingerprintIndex {
    private readonly kgramLength;
    private readonly kgramsInWindow;
    private maxFingerprintFileCount;
    /** The hash filter (Winnow algorithm) */
    private readonly hashFilter;
    /** Map of file ID to FileEntry */
    private readonly files;
    /** Map of ignored files (template/boilerplate) */
    private readonly ignoredFiles;
    /** The main index: hash -> SharedFingerprint */
    private readonly index;
    /** Manually ignored hashes */
    private readonly ignoredHashes;
    /**
     * Create a new FingerprintIndex.
     *
     * @param kgramLength Length of each k-gram (number of tokens)
     * @param kgramsInWindow Window size for Winnow algorithm
     * @param kgramData Whether to store the actual token data
     * @param maxFingerprintFileCount Ignore fingerprints appearing in more files
     */
    constructor(kgramLength: number, kgramsInWindow: number, kgramData?: boolean, maxFingerprintFileCount?: number);
    /**
     * Add files to be analyzed.
     */
    addFiles(tokenizedFiles: TokenizedFile[]): Map<Hash, SharedFingerprint>;
    /**
     * Add a file that should be ignored (template/boilerplate code).
     * Any fingerprints from this file will be marked as ignored.
     */
    addIgnoredFile(file: TokenizedFile): void;
    /**
     * Process a file entry and add its fingerprints to the index.
     */
    private addEntry;
    /**
     * Mark a shared fingerprint as ignored.
     */
    private ignoreSharedFingerprint;
    /**
     * Un-ignore a shared fingerprint.
     */
    private unIgnoreSharedFingerprint;
    /**
     * Manually add hashes to ignore (e.g., common patterns).
     */
    addIgnoredHashes(hashes: Array<Hash>): void;
    /**
     * Update the max fingerprint file count threshold.
     */
    updateMaxFingerprintFileCount(maxFingerprintFileCount: number | undefined): void;
    /**
     * Get all shared fingerprints.
     */
    sharedFingerprints(): Array<SharedFingerprint>;
    /**
     * Get all file entries.
     */
    entries(): Array<FileEntry>;
    /**
     * Get all ignored file entries.
     */
    ignoredEntries(): Array<FileEntry>;
    /**
     * Get a Pair for comparing two specific files.
     */
    getPair(file1: TokenizedFile, file2: TokenizedFile): Pair;
    /**
     * Get all pairs of files, optionally sorted.
     */
    allPairs(sortBy?: string): Array<Pair>;
}
//# sourceMappingURL=fingerprintIndex.d.ts.map