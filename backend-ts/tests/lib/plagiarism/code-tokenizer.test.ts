import { describe, expect, it } from "vitest"
import javaGrammar from "tree-sitter-java"
import pythonGrammar from "tree-sitter-python"
import cGrammar from "tree-sitter-c"
import { ProgrammingLanguage } from "../../../src/lib/plagiarism/language.js"
import { CodeTokenizer } from "../../../src/lib/plagiarism/tokenizer/codeTokenizer.js"

const pythonLanguage = new ProgrammingLanguage("python", [".py"], pythonGrammar)
const javaLanguage = new ProgrammingLanguage("java", [".java"], javaGrammar)
const cLanguage = new ProgrammingLanguage("c", [".c"], cGrammar)

describe("CodeTokenizer", () => {
  it("normalizes Python identifiers and literals while preserving operators", () => {
    const tokenizer = new CodeTokenizer(pythonLanguage)
    const [tokens] = tokenizer.tokenizeWithMapping(
      "total = first + second\nflag = True\nvalue = None\nname = \"Ada\" # trailing comment\n",
    )

    expect(tokens).toContain("IDENT")
    expect(tokens).toContain("BOOL")
    expect(tokens).toContain("NULL")
    expect(tokens).toContain("STR")
    expect(tokens).toContain("=")
    expect(tokens).toContain("+")
    expect(tokens).not.toContain("total")
    expect(tokens).not.toContain("comment")
  })

  it("normalizes Java identifiers and numeric/string literals", () => {
    const tokenizer = new CodeTokenizer(javaLanguage)
    const [tokens] = tokenizer.tokenizeWithMapping(`
      class Example {
        int computeScore(int firstValue, int secondValue) {
          int totalScore = firstValue + secondValue;
          return totalScore + 42;
        }
      }
    `)

    expect(tokens).toContain("IDENT")
    expect(tokens).toContain("NUM")
    expect(tokens).toContain("=")
    expect(tokens).toContain("+")
    expect(tokens).not.toContain("computeScore")
    expect(tokens).not.toContain("totalScore")
  })

  it("preserves C operator coordinates for mapped highlights", () => {
    const tokenizer = new CodeTokenizer(cLanguage)
    const [tokens, mapping] = tokenizer.tokenizeWithMapping(
      "int compute(){ int total = first + second; return total; }",
    )

    const plusTokenIndex = tokens.findIndex((token) => token === "+")

    expect(plusTokenIndex).toBeGreaterThan(-1)
    expect(mapping[plusTokenIndex]).toMatchObject({
      startRow: 0,
      startCol: 33,
      endRow: 0,
      endCol: 34,
    })
  })
})
