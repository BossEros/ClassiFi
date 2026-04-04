/**
 * Maximum file size for submissions (10MB).
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed file extensions by programming language.
 */
export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  python: [".py", ".ipynb"],
  java: [".java", ".jar"],
  c: [".c", ".h"],
}

/**
 * Validates a file before submission.
 *
 * @param file - The file to validate.
 * @param programmingLanguage - The expected programming language.
 * @returns A validation error message, or null if the file is valid.
 */
export function validateFile(file: File, programmingLanguage: string): string | null {
  if (!file) {
    return "Please select a file to submit"
  }

  if (file.size === 0) {
    return "File is empty"
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return `File size exceeds maximum allowed (${maxMB}MB)`
  }

  const fileName = file.name.toLowerCase()
  const lastDotIndex = fileName.lastIndexOf(".")
  const fileExt = lastDotIndex === -1 ? "" : fileName.substring(lastDotIndex)

  const languageKey = programmingLanguage.toLowerCase()
  const allowedExts = ALLOWED_EXTENSIONS[languageKey]

  if (!allowedExts) {
    return `Unsupported programming language: ${programmingLanguage}`
  }

  if (!allowedExts.includes(fileExt)) {
    return `Invalid file type. Expected ${allowedExts.join(", ")} for ${programmingLanguage}`
  }

  return null
}
