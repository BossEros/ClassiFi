import { HashFilter } from "./hashFilter.js";
import { RollingHash } from "./rollingHash.js";
/**
 * Winnow algorithm for fingerprint selection.
 *
 * This is the core algorithm for plagiarism detection.
 * It selects a subset of k-gram hashes (fingerprints) that:
 * 1. Guarantees at least one fingerprint per window
 * 2. Reduces total fingerprints compared to all k-grams
 * 3. Is local (only depends on the window, not global position)
 *
 * Based on: http://theory.stanford.edu/~aiken/publications/papers/sigmod03.pdf
 * (Winnowing: Local Algorithms for Document Fingerprinting)
 */
export class WinnowFilter extends HashFilter {
    k;
    windowSize;
    /**
     * Create a Winnow filter.
     *
     * @param k The k-gram size (number of consecutive tokens per hash)
     * @param windowSize The window size for the winnow algorithm
     * @param kgramData Whether to include the actual token data in fingerprints
     */
    constructor(k, windowSize, kgramData = false) {
        super(kgramData);
        this.k = k;
        this.windowSize = windowSize;
    }
    /**
     * Generate fingerprints using the Winnow algorithm.
     *
     * The algorithm works as follows:
     * 1. Compute rolling hashes for all k-grams
     * 2. Maintain a sliding window of hashes
     * 3. For each window position, select the rightmost minimum hash
     * 4. Output a fingerprint only when the minimum changes
     */
    fingerprints(tokens) {
        const hash = new RollingHash(this.k);
        let window = [];
        let filePos = -1 * this.k;
        let bufferPos = 0;
        let minPos = 0;
        const buffer = new Array(this.windowSize).fill(Number.MAX_SAFE_INTEGER);
        const fingerprints = [];
        // Process each token
        for (const [hashedToken, token] of this.hashTokens(tokens)) {
            filePos++;
            window = window.slice(-this.k + 1);
            window.push(token);
            // Skip until we have enough tokens for a k-gram
            if (filePos < 0) {
                hash.nextHash(hashedToken);
                continue;
            }
            bufferPos = (bufferPos + 1) % this.windowSize;
            buffer[bufferPos] = hash.nextHash(hashedToken);
            if (minPos === bufferPos) {
                // Previous minimum is no longer in window
                // Scan for new rightmost minimum
                for (let i = (bufferPos + 1) % this.windowSize; i !== bufferPos; i = (i + 1) % this.windowSize) {
                    if (buffer[i] <= buffer[minPos]) {
                        minPos = i;
                    }
                }
                const offset = (minPos - bufferPos - this.windowSize) % this.windowSize;
                const start = filePos + offset;
                fingerprints.push({
                    data: this.kgramData ? tokens.slice(start, start + this.k) : null,
                    hash: buffer[minPos],
                    start,
                    stop: start + this.k - 1,
                });
            }
            else {
                // Previous minimum still in window
                // Check if new hash is smaller or equal
                if (buffer[bufferPos] <= buffer[minPos]) {
                    minPos = bufferPos;
                    const start = filePos + ((minPos - bufferPos - this.windowSize) % this.windowSize);
                    fingerprints.push({
                        data: this.kgramData ? tokens.slice(start, start + this.k) : null,
                        hash: buffer[minPos],
                        start,
                        stop: start + this.k - 1,
                    });
                }
            }
        }
        return fingerprints;
    }
}
//# sourceMappingURL=winnowFilter.js.map