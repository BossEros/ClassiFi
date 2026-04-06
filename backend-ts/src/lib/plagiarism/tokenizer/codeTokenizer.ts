import Parser, { SyntaxNode } from "tree-sitter"
import { Region } from "@/lib/plagiarism/util/region.js"
import {
  Token,
  Tokenizer,
  TokenizerOptions,
} from "@/lib/plagiarism/tokenizer/tokenizer.js"
import { ProgrammingLanguage } from "@/lib/plagiarism/language.js"

/**
 * Tokenizer that uses tree-sitter for AST-based parsing.
 * This is the recommended tokenizer for source code plagiarism detection.
 */
export class CodeTokenizer extends Tokenizer {
  private readonly parser: Parser

  /**
   * Create a new CodeTokenizer for a specific language.
   *
   * @param language The programming language to parse
   * @param options Tokenization options
   */
  constructor(language: ProgrammingLanguage, options?: TokenizerOptions) {
    super(language.name, options)
    this.parser = new Parser()
    this.parser.setLanguage(
      language.grammar as Parameters<Parser["setLanguage"]>[0],
    )
  }

  /**
   * Parse source code into a stringified AST.
   */
  public tokenize(text: string): string {
    const tree = this.parser.parse(text, undefined, {
      bufferSize: Math.max(32 * 1024, text.length * 2),
    })
    return tree.rootNode.toString()
  }

  /**
   * Generate tokens from source code.
   * Each AST node becomes tokens: "(", node_type, children..., ")"
   */
  public generateTokens(text: string): Token[] {
    // STEP 1: Parse the source code into an AST using tree-sitter.
    // The buffer size is tuned to handle large files without truncation.
    const tree = this.parser.parse(text, undefined, {
      bufferSize: Math.max(32 * 1024, text.length * 2),
    })

    // STEP 2: Walk the AST recursively and convert every node into tokens.
    // The result is a flat list of tokens representing the full structure of the file.
    const tokens: Token[] = []
    this.tokenizeNode(tree.rootNode, tokens)

    return tokens
  }

  /**
   * Recursively tokenize an AST node and its children.
   */
  private tokenizeNode(node: SyntaxNode, tokens: Token[]): [number, number] {
    // STEP 1: Capture this node's source location (start row/col to end row/col).
    // This is saved so we can later highlight exactly where the match appears in the file.
    const location = new Region(
      node.startPosition.row,
      node.startPosition.column,
      node.endPosition.row,
      node.endPosition.column,
    )

    // STEP 2: Decide whether to include this node.
    // Comment nodes are skipped by default — they don't affect code structure.
    const includeToken =
      !node.type.includes("comment") || this.options.includeComments

    // STEP 3: Emit an opening "(" and the node type as two tokens.
    // e.g. a method declaration emits: "("  "method_declaration"
    // Variable names and values are NOT emitted — only structure matters.
    if (includeToken) {
      tokens.push(this.newToken("(", location))
      tokens.push(this.newToken(node.type, location))
    }

    // STEP 4: Recurse into all named child nodes (skips punctuation/whitespace).
    // Each child emits its own "( type ... )" block nested inside the parent.
    for (const child of node.namedChildren) {
      const [childStartRow, childStartCol] = this.tokenizeNode(child, tokens)

      // Adjust the parent's end location to where the first child starts.
      // This tightens the source region for more accurate highlighting.
      if (
        childStartRow < location.endRow ||
        (childStartRow === location.endRow && childStartCol < location.endCol)
      ) {
        location.endRow = childStartRow
        location.endCol = childStartCol
      }
    }

    // STEP 5: Emit the closing ")" to close this node's block.
    // Final token sequence for a node looks like: "(" "method_declaration" ... ")"
    if (includeToken) {
      tokens.push(this.newToken(")", location))
    }

    return [location.startRow, location.startCol]
  }
}
