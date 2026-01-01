import { HashFilter } from "../hashing/hashFilter.js";
import { Range } from "../util/range.js";
import { Region } from "../util/region.js";
import { WinnowFilter } from "../hashing/winnowFilter.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { SharedFingerprint, Occurrence } from "./sharedFingerprint.js";
import { Pair } from "./pair.js";
import { FileEntry } from "./types.js";
import { assert, assertDefined } from "../util/utils.js";

export type Hash = number;
export { FileEntry } from "./types.js";

/**
 * The FingerprintIndex is the main comparison engine.
 * 
 * It:
 * 1. Generates fingerprints from tokenized files using the Winnow algorithm
 * 2. Builds an inverted index mapping fingerprint hashes to files
 * 3. Identifies shared fingerprints between files
 * 4. Can generate Pairs for comparison between any two files
 */
export class FingerprintIndex {
    /** The hash filter (Winnow algorithm) */
    private readonly hashFilter: HashFilter;

    /** Map of file ID to FileEntry */
    private readonly files: Map<number, FileEntry>;

    /** Map of ignored files (template/boilerplate) */
    private readonly ignoredFiles: Map<number, FileEntry>;

    /** The main index: hash -> SharedFingerprint */
    private readonly index: Map<Hash, SharedFingerprint>;

    /** Manually ignored hashes */
    private readonly ignoredHashes: Set<number>;

    /**
     * Create a new FingerprintIndex.
     * 
     * @param kgramLength Length of each k-gram (number of tokens)
     * @param kgramsInWindow Window size for Winnow algorithm
     * @param kgramData Whether to store the actual token data
     * @param maxFingerprintFileCount Ignore fingerprints appearing in more files
     */
    constructor(
        private readonly kgramLength: number,
        private readonly kgramsInWindow: number,
        kgramData?: boolean,
        private maxFingerprintFileCount = Number.MAX_SAFE_INTEGER
    ) {
        this.hashFilter = new WinnowFilter(this.kgramLength, this.kgramsInWindow, kgramData);
        this.files = new Map<number, FileEntry>();
        this.ignoredFiles = new Map<number, FileEntry>();
        this.index = new Map<Hash, SharedFingerprint>();
        this.ignoredHashes = new Set<number>();
    }

    /**
     * Add files to be analyzed.
     */
    public addFiles(tokenizedFiles: TokenizedFile[]): Map<Hash, SharedFingerprint> {
        for (const f of tokenizedFiles) {
            assert(!this.files.has(f.id), `File already analyzed: ${f.path}`);
        }

        for (const file of tokenizedFiles) {
            const entry: FileEntry = {
                file,
                kgrams: [],
                isIgnored: false,
                shared: new Set<SharedFingerprint>(),
                ignored: new Set<SharedFingerprint>()
            };

            this.files.set(file.id, entry);
            this.addEntry(entry);
        }

        return this.index;
    }

    /**
     * Add a file that should be ignored (template/boilerplate code).
     * Any fingerprints from this file will be marked as ignored.
     */
    public addIgnoredFile(file: TokenizedFile): void {
        assert(!this.ignoredFiles.has(file.id), `File already ignored: ${file.path}`);

        const entry: FileEntry = {
            file,
            kgrams: [],
            isIgnored: true,
            shared: new Set<SharedFingerprint>(),
            ignored: new Set<SharedFingerprint>()
        };

        this.ignoredFiles.set(file.id, entry);
        this.addEntry(entry);
    }

    /**
     * Process a file entry and add its fingerprints to the index.
     */
    private addEntry(entry: FileEntry): void {
        const file = entry.file;
        let kgram = 0;

        for (const { data, hash, start, stop } of this.hashFilter.fingerprints(file.tokens)) {
            // Add k-gram range to file entry
            entry.kgrams.push(new Range(start, stop));

            // Validate ordering (sanity check)
            assert(
                Region.isInOrder(file.mapping[start], file.mapping[stop]) ||
                file.tokens[stop] === ")",
                `Invalid ordering in ${file.path}`
            );

            const location = Region.merge(file.mapping[start], file.mapping[stop]);

            const part: Occurrence = {
                file,
                side: { index: kgram, start, stop, data, location }
            };

            // Get or create SharedFingerprint for this hash
            let shared: SharedFingerprint | undefined = this.index.get(hash);
            if (!shared) {
                shared = new SharedFingerprint(hash, data);
                this.index.set(hash, shared);
            }

            shared.add(part);

            // Check if this fingerprint should be ignored
            if (
                entry.isIgnored ||
                shared.fileCount() > this.maxFingerprintFileCount ||
                this.ignoredHashes.has(hash)
            ) {
                this.ignoreSharedFingerprint(shared);
            } else {
                entry.shared.add(shared);
            }

            kgram += 1;
        }
    }

    /**
     * Mark a shared fingerprint as ignored.
     */
    private ignoreSharedFingerprint(shared: SharedFingerprint): void {
        shared.ignored = true;
        for (const other of shared.files()) {
            if (!this.ignoredFiles.has(other.id)) {
                const otherEntry = this.files.get(other.id)!;
                otherEntry.shared.delete(shared);
                otherEntry.ignored.add(shared);
            }
        }
    }

    /**
     * Un-ignore a shared fingerprint.
     */
    private unIgnoreSharedFingerprint(shared: SharedFingerprint): void {
        shared.ignored = false;
        for (const other of shared.files()) {
            const otherEntry = this.files.get(other.id)!;
            otherEntry.ignored.delete(shared);
            otherEntry.shared.add(shared);
        }
    }

    /**
     * Manually add hashes to ignore (e.g., common patterns).
     */
    public addIgnoredHashes(hashes: Array<Hash>): void {
        for (const hash of hashes) {
            this.ignoredHashes.add(hash);
            const shared = this.index.get(hash);
            if (shared) {
                this.ignoreSharedFingerprint(shared);
            }
        }
    }

    /**
     * Update the max fingerprint file count threshold.
     */
    public updateMaxFingerprintFileCount(maxFingerprintFileCount: number | undefined): void {
        if (maxFingerprintFileCount === this.maxFingerprintFileCount) return;

        this.maxFingerprintFileCount = maxFingerprintFileCount || Number.MAX_SAFE_INTEGER;

        for (const shared of this.index.values()) {
            if (!this.ignoredHashes.has(shared.hash)) {
                if (shared.fileCount() > this.maxFingerprintFileCount && !shared.ignored) {
                    this.ignoreSharedFingerprint(shared);
                } else if (shared.fileCount() <= this.maxFingerprintFileCount && shared.ignored) {
                    this.unIgnoreSharedFingerprint(shared);
                }
            }
        }
    }

    /**
     * Get all shared fingerprints.
     */
    public sharedFingerprints(): Array<SharedFingerprint> {
        return Array.from(this.index.values());
    }

    /**
     * Get all file entries.
     */
    public entries(): Array<FileEntry> {
        return Array.from(this.files.values());
    }

    /**
     * Get all ignored file entries.
     */
    public ignoredEntries(): Array<FileEntry> {
        return Array.from(this.ignoredFiles.values());
    }

    /**
     * Get a Pair for comparing two specific files.
     */
    public getPair(file1: TokenizedFile, file2: TokenizedFile): Pair {
        const entry1 = this.files.get(file1.id);
        const entry2 = this.files.get(file2.id);
        assertDefined(entry1, `File not found in index: ${file1.path}`);
        assertDefined(entry2, `File not found in index: ${file2.path}`);
        return new Pair(entry1, entry2);
    }

    /**
     * Get all pairs of files, optionally sorted.
     */
    public allPairs(sortBy?: string): Array<Pair> {
        const pairs: Pair[] = [];
        const entries = Array.from(this.files.values());

        // Generate all unique pairs
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                pairs.push(new Pair(entries[i], entries[j]));
            }
        }

        // Sort if requested
        if (sortBy) {
            type SortFn = (a: Pair, b: Pair) => number;
            const sortOptions: Record<string, SortFn> = {
                "total overlap": (a, b) => b.overlap - a.overlap,
                "longest fragment": (a, b) => b.longest - a.longest,
                similarity: (a, b) => b.similarity - a.similarity,
            };

            const sortFn = sortOptions[sortBy.toLowerCase()] || sortOptions["similarity"];
            pairs.sort(sortFn);
        }

        return pairs;
    }
}
