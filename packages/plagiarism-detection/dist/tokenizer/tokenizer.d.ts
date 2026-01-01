import { File } from "../file/file.js";
import { TokenizedFile } from "../file/tokenizedFile.js";
import { Region } from "../util/region.js";
/**
 * A token with its source location.
 */
export interface Token {
    token: string;
    location: Region;
}
/**
 * Options for tokenization.
 */
export interface TokenizerOptions {
    includeComments?: boolean;
}
/**
 * Abstract base class for tokenizers.
 * Subclasses implement language-specific parsing.
 */
export declare abstract class Tokenizer {
    readonly languageName: string;
    protected readonly options: TokenizerOptions;
    constructor(languageName: string, options?: TokenizerOptions);
    /**
     * Generate tokens from source code text.
     */
    abstract generateTokens(text: string): Token[];
    /**
     * Tokenize a file and return a TokenizedFile.
     */
    tokenizeFile(file: File): TokenizedFile;
    /**
     * Tokenize text and return both tokens and position mappings.
     */
    tokenizeWithMapping(text: string): [string[], Region[]];
    /**
     * Helper to create a Token object.
     */
    protected newToken(token: string, location: Region): Token;
}
//# sourceMappingURL=tokenizer.d.ts.map