"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FingerprintIndex = void 0;
const range_js_1 = require("../util/range.js");
const region_js_1 = require("../util/region.js");
const winnowFilter_js_1 = require("../hashing/winnowFilter.js");
const sharedFingerprint_js_1 = require("./sharedFingerprint.js");
const pair_js_1 = require("./pair.js");
const utils_js_1 = require("../util/utils.js");
/**
 * The FingerprintIndex is the main comparison engine.
 *
 * It:
 * 1. Generates fingerprints from tokenized files using the Winnow algorithm
 * 2. Builds an inverted index mapping fingerprint hashes to files
 * 3. Identifies shared fingerprints between files
 * 4. Can generate Pairs for comparison between any two files
 */
class FingerprintIndex {
    kgramLength;
    kgramsInWindow;
    maxFingerprintFileCount;
    /** The hash filter (Winnow algorithm) */
    hashFilter;
    /** Map of file ID to FileEntry */
    files;
    /** Map of ignored files (template/boilerplate) */
    ignoredFiles;
    /** The main index: hash -> SharedFingerprint */
    index;
    /** Manually ignored hashes */
    ignoredHashes;
    /**
     * Create a new FingerprintIndex.
     *
     * @param kgramLength Length of each k-gram (number of tokens)
     * @param kgramsInWindow Window size for Winnow algorithm
     * @param kgramData Whether to store the actual token data
     * @param maxFingerprintFileCount Ignore fingerprints appearing in more files
     */
    constructor(kgramLength, kgramsInWindow, kgramData, maxFingerprintFileCount = Number.MAX_SAFE_INTEGER) {
        this.kgramLength = kgramLength;
        this.kgramsInWindow = kgramsInWindow;
        this.maxFingerprintFileCount = maxFingerprintFileCount;
        this.hashFilter = new winnowFilter_js_1.WinnowFilter(this.kgramLength, this.kgramsInWindow, kgramData);
        this.files = new Map();
        this.ignoredFiles = new Map();
        this.index = new Map();
        this.ignoredHashes = new Set();
    }
    /**
     * Add files to be analyzed.
     */
    addFiles(tokenizedFiles) {
        for (const f of tokenizedFiles) {
            (0, utils_js_1.assert)(!this.files.has(f.id), `File already analyzed: ${f.path}`);
        }
        for (const file of tokenizedFiles) {
            const entry = {
                file,
                kgrams: [],
                isIgnored: false,
                shared: new Set(),
                ignored: new Set()
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
    addIgnoredFile(file) {
        (0, utils_js_1.assert)(!this.ignoredFiles.has(file.id), `File already ignored: ${file.path}`);
        const entry = {
            file,
            kgrams: [],
            isIgnored: true,
            shared: new Set(),
            ignored: new Set()
        };
        this.ignoredFiles.set(file.id, entry);
        this.addEntry(entry);
    }
    /**
     * Process a file entry and add its fingerprints to the index.
     */
    addEntry(entry) {
        const file = entry.file;
        let kgram = 0;
        for (const { data, hash, start, stop } of this.hashFilter.fingerprints(file.tokens)) {
            // Add k-gram range to file entry
            entry.kgrams.push(new range_js_1.Range(start, stop));
            // Validate ordering (sanity check)
            (0, utils_js_1.assert)(region_js_1.Region.isInOrder(file.mapping[start], file.mapping[stop]) ||
                file.tokens[stop] === ")", `Invalid ordering in ${file.path}`);
            const location = region_js_1.Region.merge(file.mapping[start], file.mapping[stop]);
            const part = {
                file,
                side: { index: kgram, start, stop, data, location }
            };
            // Get or create SharedFingerprint for this hash
            let shared = this.index.get(hash);
            if (!shared) {
                shared = new sharedFingerprint_js_1.SharedFingerprint(hash, data);
                this.index.set(hash, shared);
            }
            shared.add(part);
            // Check if this fingerprint should be ignored
            if (entry.isIgnored ||
                shared.fileCount() > this.maxFingerprintFileCount ||
                this.ignoredHashes.has(hash)) {
                this.ignoreSharedFingerprint(shared);
            }
            else {
                entry.shared.add(shared);
            }
            kgram += 1;
        }
    }
    /**
     * Mark a shared fingerprint as ignored.
     */
    ignoreSharedFingerprint(shared) {
        shared.ignored = true;
        for (const other of shared.files()) {
            if (!this.ignoredFiles.has(other.id)) {
                const otherEntry = this.files.get(other.id);
                otherEntry.shared.delete(shared);
                otherEntry.ignored.add(shared);
            }
        }
    }
    /**
     * Un-ignore a shared fingerprint.
     */
    unIgnoreSharedFingerprint(shared) {
        shared.ignored = false;
        for (const other of shared.files()) {
            const otherEntry = this.files.get(other.id);
            otherEntry.ignored.delete(shared);
            otherEntry.shared.add(shared);
        }
    }
    /**
     * Manually add hashes to ignore (e.g., common patterns).
     */
    addIgnoredHashes(hashes) {
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
    updateMaxFingerprintFileCount(maxFingerprintFileCount) {
        if (maxFingerprintFileCount === this.maxFingerprintFileCount)
            return;
        this.maxFingerprintFileCount = maxFingerprintFileCount || Number.MAX_SAFE_INTEGER;
        for (const shared of this.index.values()) {
            if (!this.ignoredHashes.has(shared.hash)) {
                if (shared.fileCount() > this.maxFingerprintFileCount && !shared.ignored) {
                    this.ignoreSharedFingerprint(shared);
                }
                else if (shared.fileCount() <= this.maxFingerprintFileCount && shared.ignored) {
                    this.unIgnoreSharedFingerprint(shared);
                }
            }
        }
    }
    /**
     * Get all shared fingerprints.
     */
    sharedFingerprints() {
        return Array.from(this.index.values());
    }
    /**
     * Get all file entries.
     */
    entries() {
        return Array.from(this.files.values());
    }
    /**
     * Get all ignored file entries.
     */
    ignoredEntries() {
        return Array.from(this.ignoredFiles.values());
    }
    /**
     * Get a Pair for comparing two specific files.
     */
    getPair(file1, file2) {
        const entry1 = this.files.get(file1.id);
        const entry2 = this.files.get(file2.id);
        (0, utils_js_1.assertDefined)(entry1, `File not found in index: ${file1.path}`);
        (0, utils_js_1.assertDefined)(entry2, `File not found in index: ${file2.path}`);
        return new pair_js_1.Pair(entry1, entry2);
    }
    /**
     * Get all pairs of files, optionally sorted.
     */
    allPairs(sortBy) {
        const pairs = [];
        const entries = Array.from(this.files.values());
        // Generate all unique pairs
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                pairs.push(new pair_js_1.Pair(entries[i], entries[j]));
            }
        }
        // Sort if requested
        if (sortBy) {
            const sortOptions = {
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
exports.FingerprintIndex = FingerprintIndex;
//# sourceMappingURL=fingerprintIndex.js.map