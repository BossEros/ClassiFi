"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeTokenizer = void 0;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const region_js_1 = require("../util/region.js");
const tokenizer_js_1 = require("./tokenizer.js");
/**
 * Tokenizer that uses tree-sitter for AST-based parsing.
 * This is the recommended tokenizer for source code plagiarism detection.
 */
class CodeTokenizer extends tokenizer_js_1.Tokenizer {
    parser;
    /**
     * Create a new CodeTokenizer for a specific language.
     *
     * @param language The programming language to parse
     * @param options Tokenization options
     */
    constructor(language, options) {
        super(language.name, options);
        this.parser = new tree_sitter_1.default();
        this.parser.setLanguage(language.grammar);
    }
    /**
     * Parse source code into a stringified AST.
     */
    tokenize(text) {
        const tree = this.parser.parse(text, undefined, {
            bufferSize: Math.max(32 * 1024, text.length * 2)
        });
        return tree.rootNode.toString();
    }
    /**
     * Generate tokens from source code.
     * Each AST node becomes tokens: "(", node_type, children..., ")"
     */
    generateTokens(text) {
        const tree = this.parser.parse(text, undefined, {
            bufferSize: Math.max(32 * 1024, text.length * 2)
        });
        const tokens = [];
        this.tokenizeNode(tree.rootNode, tokens);
        return tokens;
    }
    /**
     * Recursively tokenize an AST node and its children.
     */
    tokenizeNode(node, tokens) {
        const location = new region_js_1.Region(node.startPosition.row, node.startPosition.column, node.endPosition.row, node.endPosition.column);
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
            if (childStartRow < location.endRow ||
                (childStartRow === location.endRow && childStartCol < location.endCol)) {
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
exports.CodeTokenizer = CodeTokenizer;
//# sourceMappingURL=codeTokenizer.js.map