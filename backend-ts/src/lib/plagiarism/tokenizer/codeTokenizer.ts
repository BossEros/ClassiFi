import Parser, { SyntaxNode } from "tree-sitter";
import { Region } from "../util/region.js";
import { Token, Tokenizer, TokenizerOptions } from "./tokenizer.js";
import { ProgrammingLanguage } from "../language.js";

/**
 * Tokenizer that uses tree-sitter for AST-based parsing.
 * This is the recommended tokenizer for source code plagiarism detection.
 */
export class CodeTokenizer extends Tokenizer {
    private readonly parser: Parser;

    /**
     * Create a new CodeTokenizer for a specific language.
     * 
     * @param language The programming language to parse
     * @param options Tokenization options
     */
    constructor(language: ProgrammingLanguage, options?: TokenizerOptions) {
        super(language.name, options);
        this.parser = new Parser();
        this.parser.setLanguage(language.grammar);
    }

    /**
     * Parse source code into a stringified AST.
     */
    public tokenize(text: string): string {
        const tree = this.parser.parse(text, undefined, {
            bufferSize: Math.max(32 * 1024, text.length * 2)
        });
        return tree.rootNode.toString();
    }

    /**
     * Generate tokens from source code.
     * Each AST node becomes tokens: "(", node_type, children..., ")"
     */
    public generateTokens(text: string): Token[] {
        const tree = this.parser.parse(text, undefined, {
            bufferSize: Math.max(32 * 1024, text.length * 2)
        });
        const tokens: Token[] = [];
        this.tokenizeNode(tree.rootNode, tokens);
        return tokens;
    }

    /**
     * Recursively tokenize an AST node and its children.
     */
    private tokenizeNode(node: SyntaxNode, tokens: Token[]): [number, number] {
        const location = new Region(
            node.startPosition.row,
            node.startPosition.column,
            node.endPosition.row,
            node.endPosition.column
        );

        // Optionally skip comments
        const includeToken = !node.type.includes("comment") || this.options.includeComments;

        if (includeToken) {
            tokens.push(this.newToken("(", location));
            tokens.push(this.newToken(node.type, location));
        }

        // Process children
        for (const child of node.namedChildren) {
            const [childStartRow, childStartCol] = this.tokenizeNode(child, tokens);

            // Adjust parent region based on child position
            if (
                childStartRow < location.endRow ||
                (childStartRow === location.endRow && childStartCol < location.endCol)
            ) {
                location.endRow = childStartRow;
                location.endCol = childStartCol;
            }
        }

        if (includeToken) {
            tokens.push(this.newToken(")", location));
        }

        return [location.startRow, location.startCol];
    }
}
