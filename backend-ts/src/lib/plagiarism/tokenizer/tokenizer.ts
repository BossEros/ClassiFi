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
export abstract class Tokenizer {
    protected readonly options: TokenizerOptions;

    constructor(
        public readonly languageName: string,
        options: TokenizerOptions = {}
    ) {
        this.options = options;
    }

    /**
     * Generate tokens from source code text.
     */
    public abstract generateTokens(text: string): Token[];

    /**
     * Tokenize a file and return a TokenizedFile.
     */
    public tokenizeFile(file: File): TokenizedFile {
        const [ast, mapping] = this.tokenizeWithMapping(file.content);
        return new TokenizedFile(file, ast, mapping);
    }

    /**
     * Tokenize text and return both tokens and position mappings.
     */
    public tokenizeWithMapping(text: string): [string[], Region[]] {
        const resultTokens: Array<string> = [];
        const positionMapping: Array<Region> = [];

        for (const { token, location } of this.generateTokens(text)) {
            resultTokens.push(token);
            positionMapping.push(location);
        }

        return [resultTokens, positionMapping];
    }

    /**
     * Helper to create a Token object.
     */
    protected newToken(token: string, location: Region): Token {
        return { token, location };
    }
}
