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
  it("tokenizes Python source into AST node types and source mappings", () => {
    const tokenizer = new CodeTokenizer(pythonLanguage)
    const [tokens, mapping] = tokenizer.tokenizeWithMapping(
      "total = first + second\nflag = True\nvalue = None\nname = \"Ada\" # trailing comment\n",
    )

    expect(tokens).toContain("module")
    expect(tokens).toContain("assignment")
    expect(tokens).toContain("identifier")
    expect(tokens).toContain("binary_operator")
    expect(tokens).toContain("true")
    expect(tokens).toContain("none")
    expect(tokens).toContain("string_content")
    expect(tokens).not.toContain("total")
    expect(tokens).not.toContain("comment")

    const firstIdentifierIndex = tokens.findIndex((token) => token === "identifier")

    expect(firstIdentifierIndex).toBeGreaterThan(-1)
    expect(mapping[firstIdentifierIndex]).toMatchObject({
      startRow: 0,
      startCol: 0,
      endRow: 0,
      endCol: 5,
    })
  })

  it("tokenizes Java source into structural AST nodes", () => {
    const tokenizer = new CodeTokenizer(javaLanguage)
    const [tokens] = tokenizer.tokenizeWithMapping(`
      class Example {
        int computeScore(int firstValue, int secondValue) {
          int totalScore = firstValue + secondValue;
          return totalScore + 42;
        }
      }
    `)

    expect(tokens).toContain("program")
    expect(tokens).toContain("class_declaration")
    expect(tokens).toContain("method_declaration")
    expect(tokens).toContain("identifier")
    expect(tokens).toContain("binary_expression")
    expect(tokens).toContain("decimal_integer_literal")
    expect(tokens).not.toContain("computeScore")
    expect(tokens).not.toContain("totalScore")
  })

  it("preserves C identifier coordinates for mapped highlights", () => {
    const tokenizer = new CodeTokenizer(cLanguage)
    const [tokens, mapping] = tokenizer.tokenizeWithMapping(
      "int compute(){ int total = first + second; return total; }",
    )

    const functionNameTokenIndex = tokens.findIndex(
      (token, index) => token === "identifier" && mapping[index]?.startCol === 4,
    )

    expect(tokens).toContain("translation_unit")
    expect(tokens).toContain("function_definition")
    expect(tokens).toContain("binary_expression")
    expect(tokens).not.toContain("+")
    expect(functionNameTokenIndex).toBeGreaterThan(-1)
    expect(mapping[functionNameTokenIndex]).toMatchObject({
      startRow: 0,
      startCol: 4,
      endRow: 0,
      endCol: 11,
    })
  })
})
