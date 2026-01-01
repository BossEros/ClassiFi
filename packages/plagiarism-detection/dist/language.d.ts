import { CodeTokenizer } from "./tokenizer/codeTokenizer.js";
import { TokenizerOptions } from "./tokenizer/tokenizer.js";
/**
 * Supported programming languages.
 */
export type LanguageName = "java" | "python" | "c";
/**
 * Represents a programming language with its tree-sitter grammar.
 */
export declare class ProgrammingLanguage {
    readonly name: string;
    readonly extensions: string[];
    readonly grammar: any;
    constructor(name: string, extensions: string[], grammar: any);
    /**
     * Check if a file path matches this language's extensions.
     */
    extensionMatches(path: string): boolean;
    /**
     * Create a tokenizer for this language.
     */
    createTokenizer(options?: TokenizerOptions): CodeTokenizer;
}
/**
 * Registry of supported languages.
 */
export declare class LanguageRegistry {
    private languages;
    /**
     * Register a new language.
     */
    register(language: ProgrammingLanguage): void;
    /**
     * Get a language by name.
     */
    get(name: string): ProgrammingLanguage | undefined;
    /**
     * Get all registered languages.
     */
    all(): ProgrammingLanguage[];
    /**
     * Detect language from file extension.
     */
    detectFromPath(path: string): ProgrammingLanguage | undefined;
}
/**
 * Create the default language registry with Java, Python, and C.
 *
 * @returns A promise that resolves to the language registry
 */
export declare function createDefaultRegistry(): Promise<LanguageRegistry>;
//# sourceMappingURL=language.d.ts.map