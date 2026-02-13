import { CodeTokenizer } from "./tokenizer/codeTokenizer.js"
import { TokenizerOptions } from "./tokenizer/tokenizer.js"
import { createLogger } from "../../shared/logger.js"

const logger = createLogger("PlagiarismLanguage")

/**
 * Supported programming languages.
 */
export type LanguageName = "java" | "python" | "c"

/**
 * Represents a programming language with its tree-sitter grammar.
 */
export class ProgrammingLanguage {
  constructor(
    public readonly name: string,
    public readonly extensions: string[],
    public readonly grammar: unknown,
  ) {}

  /**
   * Check if a file path matches this language's extensions.
   */
  public extensionMatches(path: string): boolean {
    const ext = path.substring(path.lastIndexOf(".")).toLowerCase()
    return this.extensions.includes(ext)
  }

  /**
   * Create a tokenizer for this language.
   */
  public createTokenizer(options?: TokenizerOptions): CodeTokenizer {
    return new CodeTokenizer(this, options)
  }
}

/**
 * Registry of supported languages.
 */
export class LanguageRegistry {
  private languages: Map<string, ProgrammingLanguage> = new Map()

  /**
   * Register a new language.
   */
  public register(language: ProgrammingLanguage): void {
    this.languages.set(language.name.toLowerCase(), language)
  }

  /**
   * Get a language by name.
   */
  public get(name: string): ProgrammingLanguage | undefined {
    return this.languages.get(name.toLowerCase())
  }

  /**
   * Get all registered languages.
   */
  public all(): ProgrammingLanguage[] {
    return Array.from(this.languages.values())
  }

  /**
   * Detect language from file extension.
   */
  public detectFromPath(path: string): ProgrammingLanguage | undefined {
    for (const lang of this.languages.values()) {
      if (lang.extensionMatches(path)) {
        return lang
      }
    }
    return undefined
  }
}

/**
 * Create the default language registry with Java, Python, and C.
 *
 * @returns A promise that resolves to the language registry
 */
export async function createDefaultRegistry(): Promise<LanguageRegistry> {
  const registry = new LanguageRegistry()

  try {
    // Import tree-sitter grammars dynamically
    const [javaModule, pythonModule, cModule] = await Promise.all([
      import("tree-sitter-java"),
      import("tree-sitter-python"),
      import("tree-sitter-c"),
    ])

    registry.register(
      new ProgrammingLanguage("java", [".java"], javaModule.default),
    )

    registry.register(
      new ProgrammingLanguage("python", [".py"], pythonModule.default),
    )

    registry.register(
      new ProgrammingLanguage("c", [".c", ".h"], cModule.default),
    )
  } catch (error) {
    logger.warn("Failed to load tree-sitter grammars", { error })
    logger.warn(
      "Ensure tree-sitter-java, tree-sitter-python, and tree-sitter-c are installed.",
    )
  }

  return registry
}
