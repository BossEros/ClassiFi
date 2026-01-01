import { Fingerprint, HashFilter } from "./hashFilter.js";
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
export declare class WinnowFilter extends HashFilter {
    private readonly k;
    private readonly windowSize;
    /**
     * Create a Winnow filter.
     *
     * @param k The k-gram size (number of consecutive tokens per hash)
     * @param windowSize The window size for the winnow algorithm
     * @param kgramData Whether to include the actual token data in fingerprints
     */
    constructor(k: number, windowSize: number, kgramData?: boolean);
    /**
     * Generate fingerprints using the Winnow algorithm.
     *
     * The algorithm works as follows:
     * 1. Compute rolling hashes for all k-grams
     * 2. Maintain a sliding window of hashes
     * 3. For each window position, select the rightmost minimum hash
     * 4. Output a fingerprint only when the minimum changes
     */
    fingerprints(tokens: string[]): Array<Fingerprint>;
}
//# sourceMappingURL=winnowFilter.d.ts.map