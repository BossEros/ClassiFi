import React from "react"

interface OriginalityBadgeProps {
  /** Originality score (0-1, where 1 = 100% original) */
  originalityScore: number
  /** Badge size */
  size?: "sm" | "md" | "lg"
  /** Show tooltip on hover */
  showTooltip?: boolean
}

/**
 * Displays an originality score badge with color-coded visual feedback.
 *
 * Renders a styled badge showing the originality percentage (inverse of similarity score)
 * with color coding to indicate plagiarism risk levels. The badge uses a traffic light
 * color scheme: red for high risk, yellow for moderate concern, and green for likely
 * original work.
 *
 * @param originalityScore - The originality score as a decimal between 0 and 1, where 1 represents 100% original work and 0 represents no originality. This is the inverse of the similarity score.
 * @param size - The size variant of the badge. Accepts "sm" (small), "md" (medium), or "lg" (large). Defaults to "md".
 * @param showTooltip - Whether to display an explanatory tooltip on hover. When true, shows a help cursor and tooltip text explaining originality scoring. Defaults to true.
 * @returns A React element rendering the originality badge with appropriate styling and optional tooltip.
 */
export const OriginalityBadge: React.FC<OriginalityBadgeProps> = ({
  originalityScore,
  size = "md",
  showTooltip = true,
}) => {
  const percentage = Math.round(originalityScore * 100)

  const getColor = (): string => {
    if (originalityScore < 0.3) return "#ef4444" // red
    if (originalityScore < 0.6) return "#f59e0b" // yellow/amber
    return "#22c55e" // green
  }

  const getBackgroundColor = (): string => {
    if (originalityScore < 0.3) return "rgba(239, 68, 68, 0.15)"
    if (originalityScore < 0.6) return "rgba(245, 158, 11, 0.15)"
    return "rgba(34, 197, 94, 0.15)"
  }

  const sizes: Record<
    string,
    { fontSize: string; padding: string; height: string }
  > = {
    sm: { fontSize: "12px", padding: "2px 6px", height: "20px" },
    md: { fontSize: "14px", padding: "4px 10px", height: "25px" },
    lg: { fontSize: "16px", padding: "6px 14px", height: "30px" },
  }

  const tooltipText =
    "Originality measures uniqueness compared to other submissions. Low originality may indicate similar approaches, not necessarily plagiarism."

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    borderRadius: "9999px",
    fontWeight: 600,
    color: getColor(),
    backgroundColor: getBackgroundColor(),
    border: `1px solid ${getColor()}`,
    ...sizes[size],
    position: "relative",
    cursor: showTooltip ? "help" : "default",
  }

  return (
    <span style={style} title={showTooltip ? tooltipText : undefined}>
      <span>{percentage}%</span>
      <span style={{ fontWeight: 400, opacity: 0.8 }}>original</span>
    </span>
  )
}

export default OriginalityBadge
