import { Options } from "./options.js";
import { FingerprintIndex } from "./algorithm/fingerprintIndex.js";
import { TokenizedFile } from "./file/tokenizedFile.js";
import { Pair } from "./algorithm/pair.js";
import { Fragment } from "./algorithm/fragment.js";
import { ProgrammingLanguage } from "./language.js";

/**
 * Analysis report containing all results.
 */
export class Report {
    constructor(
        public readonly options: Options,
        public readonly language: ProgrammingLanguage | null,
        public readonly files: TokenizedFile[],
        public readonly index: FingerprintIndex,
        public readonly name?: string,
        public readonly warnings: string[] = []
    ) { }

    /**
     * Get all pairs sorted by similarity (descending).
     */
    public getPairs(): Pair[] {
        return this.index.allPairs("similarity");
    }

    /**
     * Get top N most similar pairs.
     */
    public getTopPairs(n: number): Pair[] {
        return this.getPairs().slice(0, n);
    }

    /**
     * Get pairs with similarity above a threshold.
     */
    public getSuspiciousPairs(threshold = 0.5): Pair[] {
        return this.getPairs().filter(p => p.similarity >= threshold);
    }

    /**
     * Get fragments for a specific pair.
     */
    public getFragments(pair: Pair): Fragment[] {
        return pair.buildFragments();
    }

    /**
     * Get a summary of the analysis.
     */
    public getSummary(): ReportSummary {
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

/**
 * Summary statistics for an analysis.
 */
export interface ReportSummary {
    totalFiles: number;
    totalPairs: number;
    suspiciousPairs: number;
    averageSimilarity: number;
    maxSimilarity: number;
    language: string;
    warnings: string[];
}
