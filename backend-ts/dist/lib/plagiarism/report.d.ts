import { Options } from "./options.js";
import { FingerprintIndex } from "./algorithm/fingerprintIndex.js";
import { TokenizedFile } from "./file/tokenizedFile.js";
import { Pair } from "./algorithm/pair.js";
import { Fragment } from "./algorithm/fragment.js";
import { ProgrammingLanguage } from "./language.js";
/**
 * Analysis report containing all results.
 */
export declare class Report {
    readonly options: Options;
    readonly language: ProgrammingLanguage | null;
    readonly files: TokenizedFile[];
    readonly index: FingerprintIndex;
    readonly name?: string | undefined;
    readonly warnings: string[];
    constructor(options: Options, language: ProgrammingLanguage | null, files: TokenizedFile[], index: FingerprintIndex, name?: string | undefined, warnings?: string[]);
    /**
     * Get all pairs sorted by similarity (descending).
     */
    getPairs(): Pair[];
    /**
     * Get top N most similar pairs.
     */
    getTopPairs(n: number): Pair[];
    /**
     * Get pairs with similarity above a threshold.
     */
    getSuspiciousPairs(threshold?: number): Pair[];
    /**
     * Get fragments for a specific pair.
     */
    getFragments(pair: Pair): Fragment[];
    /**
     * Get a summary of the analysis.
     */
    getSummary(): ReportSummary;
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
//# sourceMappingURL=report.d.ts.map