/**
 * Configuration options for the plagiarism detector.
 */
export interface DetectorOptions {
  /**
   * Programming language to use. If not specified, will try to detect.
   */
  language?: string

  /**
   * Length of k-grams (number of consecutive tokens).
   * Larger values = fewer but more specific matches.
   * Default: 23 (same as Dolos)
   */
  kgramLength?: number

  /**
   * Window size for the Winnow algorithm.
   * Smaller values = more fingerprints, higher precision but slower.
   * Default: 17 (same as Dolos)
   */
  kgramsInWindow?: number

  /**
   * Whether to include k-gram data in fingerprints (for debugging).
   * Default: false
   */
  kgramData?: boolean

  /**
   * Maximum percentage of files a fingerprint can appear in (0-1).
   * Fingerprints in too many files are likely boilerplate.
   * Default: null (no limit)
   */
  maxFingerprintPercentage?: number | null

  /**
   * Maximum number of files a fingerprint can appear in.
   * Alternative to maxFingerprintPercentage.
   * Default: null (no limit)
   */
  maxFingerprintCount?: number | null

  /**
   * Whether to include comments in the analysis.
   * Default: false
   */
  includeComments?: boolean

  /**
   * Minimum fragment length to report.
   * Default: 0
   */
  minFragmentLength?: number

  /**
   * Minimum similarity to include in results (0-1).
   * Default: 0
   */
  minSimilarity?: number
}

/**
 * Resolved options with defaults applied.
 * Default values match Dolos exactly.
 */
export class Options implements Required<
  Omit<DetectorOptions, "maxFingerprintPercentage" | "maxFingerprintCount">
> {
  // Dolos default values
  public static readonly defaultKgramLength = 23
  public static readonly defaultKgramsInWindow = 17
  public static readonly defaultMinFragmentLength = 0
  public static readonly defaultMinSimilarity = 0

  public readonly language: string
  public readonly kgramLength: number
  public readonly kgramsInWindow: number
  public readonly kgramData: boolean
  public readonly maxFingerprintPercentage: number | null
  public readonly maxFingerprintCount: number | null
  public readonly includeComments: boolean
  public readonly minFragmentLength: number
  public readonly minSimilarity: number

  constructor(options: DetectorOptions = {}) {
    this.language = options.language ?? ""
    this.kgramLength = options.kgramLength ?? Options.defaultKgramLength
    this.kgramsInWindow =
      options.kgramsInWindow ?? Options.defaultKgramsInWindow
    this.kgramData = options.kgramData ?? false
    this.maxFingerprintPercentage = options.maxFingerprintPercentage ?? null
    this.maxFingerprintCount = options.maxFingerprintCount ?? null
    this.includeComments = options.includeComments ?? false
    this.minFragmentLength =
      options.minFragmentLength ?? Options.defaultMinFragmentLength
    this.minSimilarity = options.minSimilarity ?? Options.defaultMinSimilarity
  }
}
