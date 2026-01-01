/**
 * Configuration options for the plagiarism detector.
 */
export interface DetectorOptions {
    /**
     * Programming language to use. If not specified, will try to detect.
     */
    language?: string;
    /**
     * Length of k-grams (number of consecutive tokens).
     * Larger values = fewer but more specific matches.
     * Default: 23 (same as Dolos)
     */
    kgramLength?: number;
    /**
     * Window size for the Winnow algorithm.
     * Smaller values = more fingerprints, higher precision but slower.
     * Default: 17 (same as Dolos)
     */
    kgramsInWindow?: number;
    /**
     * Whether to include k-gram data in fingerprints (for debugging).
     * Default: false
     */
    kgramData?: boolean;
    /**
     * Maximum percentage of files a fingerprint can appear in (0-1).
     * Fingerprints in too many files are likely boilerplate.
     * Default: null (no limit)
     */
    maxFingerprintPercentage?: number | null;
    /**
     * Maximum number of files a fingerprint can appear in.
     * Alternative to maxFingerprintPercentage.
     * Default: null (no limit)
     */
    maxFingerprintCount?: number | null;
    /**
     * Whether to include comments in the analysis.
     * Default: false
     */
    includeComments?: boolean;
    /**
     * Minimum fragment length to report.
     * Default: 0
     */
    minFragmentLength?: number;
    /**
     * Minimum similarity to include in results (0-1).
     * Default: 0
     */
    minSimilarity?: number;
}
/**
 * Resolved options with defaults applied.
 * Default values match Dolos exactly.
 */
export declare class Options implements Required<Omit<DetectorOptions, 'maxFingerprintPercentage' | 'maxFingerprintCount'>> {
    static readonly defaultKgramLength = 23;
    static readonly defaultKgramsInWindow = 17;
    static readonly defaultMinFragmentLength = 0;
    static readonly defaultMinSimilarity = 0;
    readonly language: string;
    readonly kgramLength: number;
    readonly kgramsInWindow: number;
    readonly kgramData: boolean;
    readonly maxFingerprintPercentage: number | null;
    readonly maxFingerprintCount: number | null;
    readonly includeComments: boolean;
    readonly minFragmentLength: number;
    readonly minSimilarity: number;
    constructor(options?: DetectorOptions);
}
//# sourceMappingURL=options.d.ts.map