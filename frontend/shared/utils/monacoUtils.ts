/**
 * Maps backend programming language format to Monaco Editor language identifier
 * @param language - Programming language string from backend
 * @returns Monaco Editor language identifier
 */
export function getMonacoLanguage(language: string): string {
  if (!language) return "plaintext"

  const normalized = language.toLowerCase()
  if (normalized === "c") return "c"
  if (normalized === "cpp" || normalized === "c++") return "cpp"
  if (normalized === "python" || normalized === "py") return "python"
  if (normalized === "java") return "java"
  if (normalized === "javascript" || normalized === "js") return "javascript"
  if (normalized === "typescript" || normalized === "ts") return "typescript"

  return "plaintext"
}
