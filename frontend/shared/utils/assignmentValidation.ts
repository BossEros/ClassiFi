/**
 * Maximum file size for submissions (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file extensions by programming language
 */
export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  python: [".py", ".ipynb"],
  java: [".java", ".jar"],
  c: [".c", ".h"],
};

/**
 * Validates a file before submission
 *
 * @param file - File to validate
 * @param programmingLanguage - Expected programming language
 * @returns Validation error message or null if valid
 */
export function validateFile(
  file: File,
  programmingLanguage: string,
): string | null {
  // Check if file exists
  if (!file) {
    return "Please select a file to submit";
  }

  // Check file size
  if (file.size === 0) {
    return "File is empty";
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    return `File size exceeds maximum allowed (${maxMB}MB)`;
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const lastDotIndex = fileName.lastIndexOf(".");
  const fileExt = lastDotIndex === -1 ? "" : fileName.substring(lastDotIndex);

  const allowedExts =
    ALLOWED_EXTENSIONS[programmingLanguage.toLowerCase()] || [];

  if (!allowedExts.includes(fileExt)) {
    return `Invalid file type. Expected ${allowedExts.join(
      ", ",
    )} for ${programmingLanguage}`;
  }

  return null;
}
