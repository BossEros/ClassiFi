/**
 * Calculates the percentage from grade and maxGrade.
 *
 * @param grade - The grade received
 * @param maxGrade - The maximum possible grade
 * @returns Percentage as a number (0-100)
 */
export function getGradePercentage(
  grade: number | null | undefined,
  maxGrade: number = 100,
): number {
  if (grade === null || grade === undefined || maxGrade === 0) {
    return 0
  }
  return (grade / maxGrade) * 100
}

/**
 * Returns Tailwind color class based on grade percentage.
 *
 * @param percentage - Grade percentage (0-100)
 * @returns Tailwind color class string
 */
export function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-green-500"
  if (percentage >= 80) return "text-teal-500"
  if (percentage >= 70) return "text-amber-500"
  if (percentage >= 60) return "text-orange-500"
  return "text-red-500"
}

/**
 * Formats grade as a string (e.g., "95/100" or "N/A").
 *
 * @param grade - The grade received
 * @param maxGrade - The maximum possible grade
 * @returns Formatted grade string
 */
export function formatGrade(
  grade: number | null | undefined,
  maxGrade: number = 100,
): string {
  if (grade === null || grade === undefined) {
    return "N/A"
  }
  return `${grade}/${maxGrade}`
}
