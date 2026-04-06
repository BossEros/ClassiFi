import { Report } from "@/lib/plagiarism/report.js"
import { Options, DetectorOptions } from "@/lib/plagiarism/options.js"
import { FingerprintIndex } from "@/lib/plagiarism/algorithm/fingerprintIndex.js"
import { File } from "@/lib/plagiarism/file/file.js"
import { TokenizedFile } from "@/lib/plagiarism/file/tokenizedFile.js"
import {
  ProgrammingLanguage,
  LanguageRegistry,
  createDefaultRegistry,
} from "@/lib/plagiarism/language.js"

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
export class PlagiarismDetector {
  public readonly options: Options

  private languageRegistry: LanguageRegistry | null = null
  private language: ProgrammingLanguage | null = null
  private index: FingerprintIndex | null = null

  constructor(customOptions?: DetectorOptions) {
    this.options = new Options(customOptions)
  }

  /**
   * Initialize the detector with language support.
   * Called automatically on first analysis if not called manually.
   */
  public async initialize(): Promise<void> {
    if (this.languageRegistry === null) {
      this.languageRegistry = await createDefaultRegistry()
    }
  }

  /**
   * Analyze an array of files for plagiarism.
   *
   * @param files Array of File objects to analyze
   * @param ignoredFile Optional template/boilerplate file to ignore
   * @returns Report with analysis results
   */
  public async analyze(
    files: Array<File>,
    ignoredFile?: File,
  ): Promise<Report> {
    await this.initialize()
    const warnings: string[] = []

    // STEP 1: Resolve the programming language — must be explicitly specified.
    if (!this.options.language) {
      throw new Error("Could not determine language. Please specify language option.")
    }

    this.language = this.languageRegistry!.get(this.options.language) ?? null
    if (!this.language) {
      throw new Error(`Unsupported language: ${this.options.language}. Supported: java, python, c`)
    }

    // STEP 2: Initialize the AST tokenizer and create a fresh fingerprint index
    const tokenizer = this.language.createTokenizer({
      includeComments: this.options.includeComments,
    })

    this.index = new FingerprintIndex(
      this.options.kgramLength,
      this.options.kgramsInWindow,
      this.options.kgramData,
    )

    // STEP 3: Validate there are enough files to form at least one comparison pair
    if (files.length < 2) {
      throw new Error("You need to supply at least two files to analyze.")
    }

    // STEP 4: Configure the fingerprint frequency threshold
    // Fingerprints appearing in more files than this limit are treated as common boilerplate and suppressed.
    let maxFingerprintFileCount: number | undefined
    
    if (this.options.maxFingerprintCount != null) {
      maxFingerprintFileCount = this.options.maxFingerprintCount
    } else if (this.options.maxFingerprintPercentage != null) {
      maxFingerprintFileCount = this.options.maxFingerprintPercentage * files.length
    }
    this.index.updateMaxFingerprintFileCount(maxFingerprintFileCount)

    // STEP 5: Tokenize each file into an AST-based token sequence
    // Failures are non-fatal — the file is skipped with a warning so partial results are still returned.
    const tokenizedFiles: TokenizedFile[] = []
    for (const file of files) {
      try {
        tokenizedFiles.push(tokenizer.tokenizeFile(file))
      } catch (error) {
        warnings.push(`Failed to tokenize ${file.filename}: ${error}`)
      }
    }

    // STEP 6: Add all tokenized files to the fingerprint index to build the comparison matrix
    this.index.addFiles(tokenizedFiles)

    // STEP 7: Register the template/boilerplate file so its fingerprints are excluded from matches
    if (ignoredFile) {
      try {
        const tokenizedIgnored = tokenizer.tokenizeFile(ignoredFile)
        this.index.addIgnoredFile(tokenizedIgnored)
      } catch (error) {
        warnings.push(`Failed to process ignored file: ${error}`)
      }
    }

    return new Report(
      this.options,
      this.language,
      tokenizedFiles,
      this.index,
      undefined,
      warnings,
    )
  }

  /**
   * Analyze source code strings directly (convenience method).
   *
   * @param sources Map of filename to source code content
   * @returns Report with analysis results
   */
  public async analyzeStrings(sources: Map<string, string>): Promise<Report> {
    const files: File[] = []
    for (const [path, content] of sources) {
      files.push(new File(path, content))
    }
    return this.analyze(files)
  }
}
