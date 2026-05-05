export type FragmentExplanationCategory =
  | "library_import"
  | "identifier_names"
  | "control_flow"
  | "function_structure"
  | "code_structure"
  | "comment_text"

export interface FragmentExplanation {
  category: FragmentExplanationCategory
  label: string
  reasons: string[]
}

export interface FragmentCodeSelection {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface ExplainMatchedFragmentInput {
  leftContent: string
  rightContent: string
  leftSelection: FragmentCodeSelection
  rightSelection: FragmentCodeSelection
}

const FALLBACK_EXPLANATION: FragmentExplanation = {
  category: "code_structure",
  label: "Matched Code Structure",
  reasons: ["The detector matched these fragments by structural code tokens"],
}

const KEYWORDS = new Set([
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
 * Creates a neutral, deterministic explanation for why two matched fragments are notable.
 *
 * @param input - Full file contents and fragment ranges for both sides of a match.
 * @returns A short label and supporting reasons suitable for UI and PDF evidence.
 */
export function explainMatchedFragment(
  input: ExplainMatchedFragmentInput,
): FragmentExplanation {
  const leftSnippet = extractSelectedCode(input.leftContent, input.leftSelection)
  const rightSnippet = extractSelectedCode(input.rightContent, input.rightSelection)

  const sharedImports = getSharedValues(
    extractImportedLibraries(leftSnippet),
    extractImportedLibraries(rightSnippet),
  )
  if (sharedImports.length > 0) {
    return {
      category: "library_import",
      label: "Same Library Import",
      reasons: [`Both fragments import ${formatValueList(sharedImports)}`],
    }
  }

  const sharedControlFlow = getSharedValues(
    extractControlFlowPatterns(leftSnippet),
    extractControlFlowPatterns(rightSnippet),
  )
  if (sharedControlFlow.length > 0) {
    return {
      category: "control_flow",
      label: "Same Control Flow Structure",
      reasons: [`Both fragments use ${formatValueList(sharedControlFlow)}`],
    }
  }

  if (hasFunctionStructure(leftSnippet) && hasFunctionStructure(rightSnippet)) {
    return {
      category: "function_structure",
      label: "Same Function Structure",
      reasons: ["Both fragments define a function or method"],
    }
  }

  const sharedIdentifiers = getSharedValues(
    extractIdentifiers(leftSnippet),
    extractIdentifiers(rightSnippet),
  )
  if (sharedIdentifiers.length > 0) {
    return {
      category: "identifier_names",
      label: "Shared Identifier Names",
      reasons: [`Both fragments use ${formatValueList(sharedIdentifiers)}`],
    }
  }

  return FALLBACK_EXPLANATION
}

function extractSelectedCode(content: string, selection: FragmentCodeSelection): string {
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

function extractImportedLibraries(snippet: string): string[] {
  const libraries = new Set<string>()

  for (const line of snippet.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    const javaImportMatch = /^import\s+([A-Za-z_][\w.]*(?:\.\*)?)\s*;?$/.exec(trimmedLine)
    const pythonImportMatch = /^import\s+([A-Za-z_][\w.]*)/.exec(trimmedLine)
    const pythonFromImportMatch = /^from\s+([A-Za-z_][\w.]*)\s+import\s+/.exec(trimmedLine)
    const cIncludeMatch = /^#\s*include\s*[<"]([^>"]+)[>"]/.exec(trimmedLine)

    const importedLibrary =
      javaImportMatch?.[1] ??
      pythonImportMatch?.[1] ??
      pythonFromImportMatch?.[1] ??
      cIncludeMatch?.[1]

    if (importedLibrary) {
      libraries.add(importedLibrary)
    }
  }

  return Array.from(libraries).sort()
}

function extractControlFlowPatterns(snippet: string): string[] {
  const patterns: string[] = []

  if (/\bfor\b/.test(snippet)) patterns.push("for-loop")
  if (/\bwhile\b/.test(snippet)) patterns.push("while-loop")
  if (/\bif\b|\belse\s+if\b|\belif\b/.test(snippet)) patterns.push("conditional logic")
  if (/\bswitch\b|\bcase\b/.test(snippet)) patterns.push("switch branch")

  return patterns
}

function hasFunctionStructure(snippet: string): boolean {
  return (
    /\bdef\s+[A-Za-z_][\w]*\s*\(/.test(snippet) ||
    /\bfunction\s+[A-Za-z_][\w]*\s*\(/.test(snippet) ||
    /\b[A-Za-z_][\w<>]*\s+[A-Za-z_][\w]*\s*\([^)]*\)\s*\{?/.test(snippet)
  )
}

function extractIdentifiers(snippet: string): string[] {
  const identifiers = new Set<string>()
  const identifierPattern = /\b[A-Za-z_][A-Za-z0-9_]*\b/g

  for (const match of snippet.matchAll(identifierPattern)) {
    const identifier = match[0]
    const normalizedIdentifier = identifier.toLowerCase()

    if (!KEYWORDS.has(normalizedIdentifier) && !/^[A-Z_]+$/.test(identifier)) {
      identifiers.add(identifier)
    }
  }

  return Array.from(identifiers).sort((left, right) => left.localeCompare(right))
}

function getSharedValues(leftValues: string[], rightValues: string[]): string[] {
  const rightValueSet = new Set(rightValues)

  return leftValues.filter((value) => rightValueSet.has(value))
}

function formatValueList(values: string[]): string {
  const visibleValues = values.slice(0, 4)

  if (visibleValues.length === 1) return visibleValues[0]
  if (visibleValues.length === 2) return `${visibleValues[0]} and ${visibleValues[1]}`

  return visibleValues.join(", ")
}
