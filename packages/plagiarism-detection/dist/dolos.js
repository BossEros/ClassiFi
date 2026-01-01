"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlagiarismDetector = void 0;
const report_js_1 = require("./report.js");
const options_js_1 = require("./options.js");
const fingerprintIndex_js_1 = require("./algorithm/fingerprintIndex.js");
const file_js_1 = require("./file/file.js");
const language_js_1 = require("./language.js");
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
class PlagiarismDetector {
    options;
    languageRegistry = null;
    language = null;
    index = null;
    constructor(customOptions) {
        this.options = new options_js_1.Options(customOptions);
    }
    /**
     * Initialize the detector with language support.
     * Called automatically on first analysis if not called manually.
     */
    async initialize() {
        if (this.languageRegistry === null) {
            this.languageRegistry = await (0, language_js_1.createDefaultRegistry)();
        }
    }
    /**
     * Analyze an array of files for plagiarism.
     *
     * @param files Array of File objects to analyze
     * @param ignoredFile Optional template/boilerplate file to ignore
     * @returns Report with analysis results
     */
    async analyze(files, ignoredFile) {
        await this.initialize();
        const warnings = [];
        // Determine language
        if (this.options.language && this.languageRegistry) {
            this.language = this.languageRegistry.get(this.options.language) ?? null;
            if (!this.language) {
                throw new Error(`Unsupported language: ${this.options.language}. Supported: java, python, c`);
            }
        }
        else if (this.languageRegistry && files.length > 0) {
            // Auto-detect from first file
            this.language = this.languageRegistry.detectFromPath(files[0].path) ?? null;
            if (this.language) {
                warnings.push(`Detected language as ${this.language.name} based on file extension.`);
            }
        }
        if (!this.language) {
            throw new Error("Could not determine language. Please specify language option.");
        }
        // Create tokenizer and index
        const tokenizer = this.language.createTokenizer({
            includeComments: this.options.includeComments
        });
        this.index = new fingerprintIndex_js_1.FingerprintIndex(this.options.kgramLength, this.options.kgramsInWindow, this.options.kgramData);
        // Filter files by language extension
        const filteredFiles = files.filter(file => this.language?.extensionMatches(file.path));
        const diff = files.length - filteredFiles.length;
        if (diff > 0) {
            warnings.push(`${diff} files were ignored because they don't match the ${this.language.name} extension.`);
        }
        // Validate file count
        if (filteredFiles.length < 2) {
            throw new Error("You need to supply at least two files to analyze.");
        }
        // Configure max fingerprint file count
        let maxFingerprintFileCount;
        if (this.options.maxFingerprintCount != null) {
            maxFingerprintFileCount = this.options.maxFingerprintCount;
        }
        else if (this.options.maxFingerprintPercentage != null) {
            maxFingerprintFileCount = this.options.maxFingerprintPercentage * filteredFiles.length;
        }
        this.index.updateMaxFingerprintFileCount(maxFingerprintFileCount);
        // Tokenize all files
        const tokenizedFiles = [];
        for (const file of filteredFiles) {
            try {
                tokenizedFiles.push(tokenizer.tokenizeFile(file));
            }
            catch (error) {
                warnings.push(`Failed to tokenize ${file.filename}: ${error}`);
            }
        }
        // Add files to index
        this.index.addFiles(tokenizedFiles);
        // Add ignored file if provided
        if (ignoredFile) {
            try {
                const tokenizedIgnored = tokenizer.tokenizeFile(ignoredFile);
                this.index.addIgnoredFile(tokenizedIgnored);
            }
            catch (error) {
                warnings.push(`Failed to process ignored file: ${error}`);
            }
        }
        return new report_js_1.Report(this.options, this.language, tokenizedFiles, this.index, undefined, warnings);
    }
    /**
     * Analyze source code strings directly (convenience method).
     *
     * @param sources Map of filename to source code content
     * @returns Report with analysis results
     */
    async analyzeStrings(sources) {
        const files = [];
        for (const [path, content] of sources) {
            files.push(new file_js_1.File(path, content));
        }
        return this.analyze(files);
    }
}
exports.PlagiarismDetector = PlagiarismDetector;
//# sourceMappingURL=dolos.js.map