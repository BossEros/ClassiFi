/**
 * Analysis report containing all results.
 */
export class Report {
    options;
    language;
    files;
    index;
    name;
    warnings;
    constructor(options, language, files, index, name, warnings = []) {
        this.options = options;
        this.language = language;
        this.files = files;
        this.index = index;
        this.name = name;
        this.warnings = warnings;
    }
    /**
     * Get all pairs sorted by similarity (descending).
     */
    getPairs() {
        return this.index.allPairs("similarity");
    }
    /**
     * Get top N most similar pairs.
     */
    getTopPairs(n) {
        return this.getPairs().slice(0, n);
    }
    /**
     * Get pairs with similarity above a threshold.
     */
    getSuspiciousPairs(threshold = 0.5) {
        return this.getPairs().filter(p => p.similarity >= threshold);
    }
    /**
     * Get fragments for a specific pair.
     */
    getFragments(pair) {
        return pair.buildFragments();
    }
    /**
     * Get a summary of the analysis.
     */
    getSummary() {
        const pairs = this.getPairs();
        const suspicious = this.getSuspiciousPairs(0.5);
        return {
            totalFiles: this.files.length,
            totalPairs: pairs.length,
            suspiciousPairs: suspicious.length,
            averageSimilarity: pairs.length > 0
                ? pairs.reduce((sum, p) => sum + p.similarity, 0) / pairs.length
                : 0,
            maxSimilarity: pairs.length > 0 ? pairs[0].similarity : 0,
            language: this.language?.name ?? "unknown",
            warnings: this.warnings
        };
    }
}
//# sourceMappingURL=report.js.map