/**
 * Resolved options with defaults applied.
 * Default values match Dolos exactly.
 */
export class Options {
    // Dolos default values
    static defaultKgramLength = 23;
    static defaultKgramsInWindow = 17;
    static defaultMinFragmentLength = 0;
    static defaultMinSimilarity = 0;
    language;
    kgramLength;
    kgramsInWindow;
    kgramData;
    maxFingerprintPercentage;
    maxFingerprintCount;
    includeComments;
    minFragmentLength;
    minSimilarity;
    constructor(options = {}) {
        this.language = options.language ?? "";
        this.kgramLength = options.kgramLength ?? Options.defaultKgramLength;
        this.kgramsInWindow = options.kgramsInWindow ?? Options.defaultKgramsInWindow;
        this.kgramData = options.kgramData ?? false;
        this.maxFingerprintPercentage = options.maxFingerprintPercentage ?? null;
        this.maxFingerprintCount = options.maxFingerprintCount ?? null;
        this.includeComments = options.includeComments ?? false;
        this.minFragmentLength = options.minFragmentLength ?? Options.defaultMinFragmentLength;
        this.minSimilarity = options.minSimilarity ?? Options.defaultMinSimilarity;
    }
}
//# sourceMappingURL=options.js.map