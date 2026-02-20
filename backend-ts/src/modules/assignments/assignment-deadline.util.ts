/**
 * Format an assignment due date for display in notifications.
 * Returns a formatted date string or "No deadline" if the date is null/undefined.
 *
 * @param deadline - The deadline date (string or Date object)
 * @returns Formatted date string or "No deadline"
 */
export function formatAssignmentDueDate(
  deadline: string | Date | null | undefined,
): string {
  if (!deadline) {
    return "No deadline"
  }

  const date = new Date(deadline)

  if (isNaN(date.getTime())) {
    return "Invalid deadline"
  }

  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
