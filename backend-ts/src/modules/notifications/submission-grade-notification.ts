/**
 * Builds the dashboard URL used by submission-grade notifications.
 *
 * @param frontendUrl - The configured frontend origin.
 * @param assignmentId - The assignment identifier.
 * @returns Absolute dashboard URL for the assignment details page.
 */
export function buildSubmissionNotificationUrl(
  frontendUrl: string,
  assignmentId: number,
): string {
  return `${frontendUrl}/dashboard/assignments/${assignmentId}`
}

/**
 * Formats the lateness duration for student-facing notifications.
 *
 * @param hoursLate - Decimal hours between deadline and submission time.
 * @returns Human-readable sentence such as "You submitted 5 hours late".
 */
export function formatSubmissionLatenessText(hoursLate: number): string {
  const roundedMinutesLate = Math.max(1, Math.round(hoursLate * 60))
  const wholeHoursLate = Math.floor(roundedMinutesLate / 60)
  const remainingMinutesLate = roundedMinutesLate % 60
  const durationParts: string[] = []

  if (wholeHoursLate > 0) {
    durationParts.push(
      `${wholeHoursLate} ${wholeHoursLate === 1 ? "hour" : "hours"}`,
    )
  }

  if (remainingMinutesLate > 0) {
    durationParts.push(
      `${remainingMinutesLate} ${remainingMinutesLate === 1 ? "minute" : "minutes"}`,
    )
  }

  return `You submitted ${durationParts.join(" ")} late`
}
