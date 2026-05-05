import type { CodeRegion } from "./types"

export type DiffFragmentExplanationCategory =
  | "identifier_renaming"
  | "conditional_added"
  | "conditional_removed"
  | "loop_condition_changed"
  | "output_logic_changed"
  | "code_added"
  | "code_removed"
  | "comment_changed"
  | "code_changed"

export interface DiffFragmentExplanation {
  category: DiffFragmentExplanationCategory
  label: string
  reasons: string[]
}

interface BuildDiffFragmentExplanationInput {
  leftContent: string
  rightContent: string
  leftSelection: CodeRegion
  rightSelection: CodeRegion
}

interface CodeToken {
  kind: "identifier" | "keyword" | "number" | "string" | "symbol"
  value: string
}

const FALLBACK_DIFF_EXPLANATION: DiffFragmentExplanation = {
  category: "code_changed",
  label: "Highlighted Code Difference",
  reasons: [
    "This highlighted region contains code that differs between the two submissions.",
  ],
}

const CODE_KEYWORDS = new Set([
  "abstract",
  "and",
  "as",
  "auto",
  "boolean",
  "break",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "def",
  "default",
  "do",
  "double",
  "elif",
  "else",
  "enum",
  "except",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "from",
  "if",
  "import",
  "include",
  "int",
  "interface",
  "long",
  "new",
  "not",
  "null",
  "or",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "struct",
  "switch",
  "this",
  "throw",
  "throws",
  "true",
  "try",
  "void",
  "while",
])

/**
 * Builds a deterministic explanation for what changed inside a diff-highlighted fragment.
 *
 * @param input - Full file contents and highlighted ranges for both sides of the diff.
 * @returns A short, teacher-facing explanation of the difference.
 */
export function buildDiffFragmentExplanation(
  input: BuildDiffFragmentExplanationInput,
): DiffFragmentExplanation {
  const leftSnippet = extractSelectedCode(input.leftContent, input.leftSelection)
  const rightSnippet = extractSelectedCode(input.rightContent, input.rightSelection)
  const leftTrimmedSnippet = leftSnippet.trim()
  const rightTrimmedSnippet = rightSnippet.trim()

  if (!leftTrimmedSnippet && rightTrimmedSnippet) {
    return {
      category: "code_added",
      label: "Right File Adds Code",
      reasons: ["The right submission adds code in this highlighted region."],
    }
  }

  if (leftTrimmedSnippet && !rightTrimmedSnippet) {
    return {
      category: "code_removed",
      label: "Right File Removes Code",
      reasons: ["Code from the left submission is missing in the right submission."],
    }
  }

  if (isCommentOnlySnippet(leftSnippet) && isCommentOnlySnippet(rightSnippet)) {
    return {
      category: "comment_changed",
      label: "Comment Text Changed",
      reasons: [
        "Only comment text changes in this highlighted region; executable code is unchanged here.",
      ],
    }
  }

  if (addsConditionalLogic(leftSnippet, rightSnippet)) {
    return {
      category: "conditional_added",
      label: "Right File Adds Conditional Logic",
      reasons: [
        "The right submission adds a conditional branch inside this highlighted region.",
      ],
    }
  }

  if (addsConditionalLogic(rightSnippet, leftSnippet)) {
    return {
      category: "conditional_removed",
      label: "Right File Removes Conditional Logic",
      reasons: [
        "The right submission removes a conditional branch found in the left submission.",
      ],
    }
  }

  const leftTokens = tokenizeCode(leftSnippet)
  const rightTokens = tokenizeCode(rightSnippet)
  const identifierRenames = getIdentifierRenames(leftTokens, rightTokens)

  if (
    isOutputFocusedSnippet(leftSnippet) &&
    isOutputFocusedSnippet(rightSnippet)
  ) {
    return {
      category: "output_logic_changed",
      label: "Output Logic Differs",
      reasons: [
        "The matched area is similar, but the printed or returned value differs.",
      ],
    }
  }

  if (
    hasChangedLoopCondition(leftSnippet, rightSnippet)
  ) {
    return {
      category: "loop_condition_changed",
      label: "Loop Condition Changed",
      reasons: [
        "Both submissions use a loop, but the right submission changes the loop boundary or condition.",
      ],
    }
  }

  if (
    identifierRenames.length > 0 &&
    haveSimilarTokenShapeIgnoringIdentifiers(leftTokens, rightTokens)
  ) {
    return {
      category: "identifier_renaming",
      label: "Identifier Renaming With Same Logic",
      reasons: [
        `The right submission renames ${formatRenameList(identifierRenames)} while preserving the same code shape.`,
      ],
    }
  }

  return FALLBACK_DIFF_EXPLANATION
}

function isCommentOnlySnippet(snippet: string): boolean {
  const meaningfulLines = snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    meaningfulLines.length > 0 &&
    meaningfulLines.every(
      (line) =>
        line.startsWith("//") ||
        line.startsWith("#") ||
        line.startsWith("/*") ||
        line.startsWith("*") ||
        line.endsWith("*/"),
    )
  )
}

function extractSelectedCode(content: string, selection: CodeRegion): string {
  const lines = content.split(/\r?\n/)
  const selectedLines = lines.slice(selection.startRow, selection.endRow + 1)

  if (selectedLines.length === 0) return ""

  const lastSelectedLineIndex = selectedLines.length - 1

  if (selectedLines.length === 1) {
    const selectedLine = selectedLines[0] ?? ""
    const endCol = Number.isFinite(selection.endCol)
      ? selection.endCol
      : selectedLine.length

    return selectedLine.slice(selection.startCol, endCol)
  }

  selectedLines[0] = selectedLines[0]?.slice(selection.startCol) ?? ""

  const endCol = Number.isFinite(selection.endCol)
    ? selection.endCol
    : selectedLines[lastSelectedLineIndex]?.length
  selectedLines[lastSelectedLineIndex] =
    selectedLines[lastSelectedLineIndex]?.slice(0, endCol) ?? ""

  return selectedLines.join("\n")
}

function addsConditionalLogic(baseSnippet: string, comparisonSnippet: string): boolean {
  const baseConditionalCount = countConditionalTokens(baseSnippet)
  const comparisonConditionalCount = countConditionalTokens(comparisonSnippet)

  return comparisonConditionalCount > baseConditionalCount
}

function countConditionalTokens(snippet: string): number {
  const conditionalMatches = snippet.match(/\bif\b|\belif\b|\belse\b|\bswitch\b|\bcase\b/g)

  return conditionalMatches?.length ?? 0
}

function tokenizeCode(snippet: string): CodeToken[] {
  const tokenPattern =
    /(['"][^'"\r\n]*['"]|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|==|!=|<=|>=|&&|\|\||->|[^\s])/g
  const tokens: CodeToken[] = []

  for (const match of snippet.matchAll(tokenPattern)) {
    const value = match[0]
    const normalizedValue = value.toLowerCase()

    if (/^['"]/.test(value)) {
      tokens.push({ kind: "string", value })
    } else if (/^\d/.test(value)) {
      tokens.push({ kind: "number", value })
    } else if (/^[A-Za-z_]/.test(value)) {
      tokens.push({
        kind: CODE_KEYWORDS.has(normalizedValue) ? "keyword" : "identifier",
        value,
      })
    } else {
      tokens.push({ kind: "symbol", value })
    }
  }

  return tokens
}

function isOutputFocusedSnippet(snippet: string): boolean {
  const meaningfulLines = snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    meaningfulLines.length > 0 &&
    meaningfulLines.every((line) => /^return\b|^print\s*\(/.test(line))
  )
}

function haveSimilarTokenShapeIgnoringIdentifiers(
  leftTokens: CodeToken[],
  rightTokens: CodeToken[],
): boolean {
  const leftNonIdentifierSignature = createNonIdentifierSignature(leftTokens)
  const rightNonIdentifierSignature = createNonIdentifierSignature(rightTokens)
  const shorterSignatureLength = Math.min(
    leftNonIdentifierSignature.length,
    rightNonIdentifierSignature.length,
  )

  if (shorterSignatureLength === 0) return true

  let matchingTokenCount = 0

  for (let tokenIndex = 0; tokenIndex < shorterSignatureLength; tokenIndex += 1) {
    if (leftNonIdentifierSignature[tokenIndex] === rightNonIdentifierSignature[tokenIndex]) {
      matchingTokenCount += 1
    }
  }

  return matchingTokenCount / shorterSignatureLength >= 0.75
}

function createNonIdentifierSignature(tokens: CodeToken[]): string[] {
  return tokens
    .filter((token) => token.kind !== "identifier")
    .map((token) => `${token.kind}:${token.value}`)
}

function hasChangedLoopCondition(leftSnippet: string, rightSnippet: string): boolean {
  const leftLoopSignatures = extractLoopSignatures(leftSnippet)
  const rightLoopSignatures = extractLoopSignatures(rightSnippet)

  if (leftLoopSignatures.length === 0 || rightLoopSignatures.length === 0) {
    return false
  }

  if (leftLoopSignatures.length !== rightLoopSignatures.length) {
    return true
  }

  return leftLoopSignatures.some(
    (leftSignature, index) => leftSignature !== rightLoopSignatures[index],
  )
}

function extractLoopSignatures(snippet: string): string[] {
  return snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\bfor\b|\bwhile\b/.test(line))
    .map(createLoopSignature)
}

function createLoopSignature(loopLine: string): string {
  return tokenizeCode(loopLine)
    .map((token) => {
      if (token.kind === "identifier") return "identifier:<name>"

      return `${token.kind}:${token.value}`
    })
    .join("|")
}

function getIdentifierRenames(
  leftTokens: CodeToken[],
  rightTokens: CodeToken[],
): Array<[string, string]> {
  const renameMap = new Map<string, string>()

  for (let tokenIndex = 0; tokenIndex < leftTokens.length; tokenIndex += 1) {
    const leftToken = leftTokens[tokenIndex]
    const rightToken = rightTokens[tokenIndex]

    if (
      leftToken?.kind !== "identifier" ||
      rightToken?.kind !== "identifier" ||
      leftToken.value === rightToken.value
    ) {
      continue
    }

    const existingRightName = renameMap.get(leftToken.value)

    if (!existingRightName) {
      renameMap.set(leftToken.value, rightToken.value)
    }
  }

  return Array.from(renameMap.entries()).slice(0, 4)
}

function formatRenameList(identifierRenames: Array<[string, string]>): string {
  const formattedRenames = identifierRenames.map(
    ([leftName, rightName]) => `${leftName} to ${rightName}`,
  )

  if (formattedRenames.length === 1) return formattedRenames[0]
  if (formattedRenames.length === 2) {
    return `${formattedRenames[0]} and ${formattedRenames[1]}`
  }

  return `${formattedRenames.slice(0, -1).join(", ")}, and ${
    formattedRenames[formattedRenames.length - 1]
  }`
}
