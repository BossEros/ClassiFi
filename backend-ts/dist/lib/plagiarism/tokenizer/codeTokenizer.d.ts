import { Token, Tokenizer, TokenizerOptions } from "./tokenizer.js";
import { ProgrammingLanguage } from "../language.js";
/**
 * Tokenizer that uses tree-sitter for AST-based parsing.
 * This is the recommended tokenizer for source code plagiarism detection.
 */
export declare class CodeTokenizer extends Tokenizer {
    private readonly parser;
    /**
     * Create a new CodeTokenizer for a specific language.
     *
     * @param language The programming language to parse
     * @param options Tokenization options
     */
    constructor(language: ProgrammingLanguage, options?: TokenizerOptions);
    /**
     * Parse source code into a stringified AST.
     */
    tokenize(text: string): string;
    /**
     * Generate tokens from source code.
     * Each AST node becomes tokens: "(", node_type, children..., ")"
     */
    generateTokens(text: string): Token[];
    /**
     * Recursively tokenize an AST node and its children.
     */
    private tokenizeNode;
}
//# sourceMappingURL=codeTokenizer.d.ts.map