import { Report } from "./report.js";
import { Options, DetectorOptions } from "./options.js";
import { File } from "./file/file.js";
/**
 * PlagiarismDetector - Main entry point for source code plagiarism detection.
 *
 * This class implements the Winnow fingerprinting algorithm for detecting
 * similar code between multiple source files.
 *
 * @example
 * ```typescript
 * const detector = new PlagiarismDetector({ language: 'java' });
 * const report = await detector.analyze(files);
 *
 * for (const pair of report.getSuspiciousPairs(0.5)) {
 *   console.log(`${pair.leftFile.filename} <-> ${pair.rightFile.filename}: ${pair.similarity}`);
 * }
 * ```
 */
export declare class PlagiarismDetector {
    readonly options: Options;
    private languageRegistry;
    private language;
    private index;
    constructor(customOptions?: DetectorOptions);
    /**
     * Initialize the detector with language support.
     * Called automatically on first analysis if not called manually.
     */
    initialize(): Promise<void>;
    /**
     * Analyze an array of files for plagiarism.
     *
     * @param files Array of File objects to analyze
     * @param ignoredFile Optional template/boilerplate file to ignore
     * @returns Report with analysis results
     */
    analyze(files: Array<File>, ignoredFile?: File): Promise<Report>;
    /**
     * Analyze source code strings directly (convenience method).
     *
     * @param sources Map of filename to source code content
     * @returns Report with analysis results
     */
    analyzeStrings(sources: Map<string, string>): Promise<Report>;
}
//# sourceMappingURL=dolos.d.ts.map