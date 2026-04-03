const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  java: "java",
  py: "python",
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  cs: "csharp",
  rb: "ruby",
  go: "go",
  rs: "rust",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  scala: "scala",
}

/**
 * Detects the programming language from a filename based on its extension.
 *
 * @param filename - The name of the file including its extension.
 * @returns The detected language identifier, or "plaintext" if unknown.
 */
export function detectLanguageFromFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || ""

  return EXTENSION_TO_LANGUAGE[extension] || "plaintext"
}
