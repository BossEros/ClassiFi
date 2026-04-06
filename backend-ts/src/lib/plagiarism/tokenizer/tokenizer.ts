import { File } from "@/lib/plagiarism/file/file.js"
import { TokenizedFile } from "@/lib/plagiarism/file/tokenizedFile.js"
import { Region } from "@/lib/plagiarism/util/region.js"

/**
 * A token with its source location.
 */
export interface Token {
  token: string
  location: Region
}

/**
 * Options for tokenization.
 */
export interface TokenizerOptions {
  includeComments?: boolean
}

/**
 * Abstract base class for tokenizers.
 * Subclasses implement language-specific parsing.
 */
export abstract class Tokenizer {
  protected readonly options: TokenizerOptions

  constructor(
    public readonly languageName: string,
    options: TokenizerOptions = {},
  ) {
    this.options = options
  }

  /**
   * Generate tokens from source code text.
   */
  public abstract generateTokens(text: string): Token[]

  /**
   * Tokenize a file and return a TokenizedFile.
   */
  public tokenizeFile(file: File): TokenizedFile {
    // STEP 1: Extract the raw source code from the file and tokenize it.
    // This produces two parallel arrays: the token strings and their source locations.
    const [ast, mapping] = this.tokenizeWithMapping(file.content)

    // STEP 2: Wrap everything into a TokenizedFile — the file, its tokens, and the location map.
    // This is what the FingerprintIndex receives for Winnowing.
    return new TokenizedFile(file, ast, mapping)
  }

  /**
   * Tokenize text and return both tokens and position mappings.
   */
  public tokenizeWithMapping(text: string): [string[], Region[]] {
    const resultTokens: Array<string> = []
    const positionMapping: Array<Region> = []

    // STEP 1: Call the language-specific generateTokens() (implemented by CodeTokenizer).
    // It returns a flat list of { token, location } objects.
    for (const { token, location } of this.generateTokens(text)) {
      // STEP 2: Split each token into two separate parallel arrays.
      // resultTokens[i] is the token string, positionMapping[i] is where it appeared in the source.
      // This mapping is later used to highlight matching regions in the UI.
      resultTokens.push(token)
      positionMapping.push(location)
    }

    return [resultTokens, positionMapping]
  }

  /**
   * Helper to create a Token object.
   */
  protected newToken(token: string, location: Region): Token {
    return { token, location }
  }
}
