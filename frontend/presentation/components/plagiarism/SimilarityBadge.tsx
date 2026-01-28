import React from "react"

interface SimilarityBadgeProps {
  /** Similarity value (0-1) */
  similarity: number
  /** Badge size */
  size?: "small" | "medium" | "large"
  /** Show "similar" label */
  showLabel?: boolean
  /** Show as progress bar instead of badge */
  asProgress?: boolean
}

/**
 * Badge displaying similarity percentage with color coding.
 *
 * Colors match Dolos exactly:
 * - Green (< 50%): Low similarity, likely original
 * - Yellow/Warning (50-75%): Moderate similarity, needs review
 * - Red/Error (>= 75%): High similarity, likely plagiarism
 */
export const SimilarityBadge: React.FC<SimilarityBadgeProps> = ({
  similarity,
  size = "medium",
  showLabel = true,
  asProgress = false,
}) => {
  const percentage = Math.round(similarity * 100)

  // Determine color based on similarity level (same as Dolos)
  const getColor = (): string => {
    if (similarity >= 0.75) return "#ef4444" // error (red)
    if (similarity >= 0.5) return "#f59e0b" // warning (amber/yellow)
    return "#22c55e" // success (green)
  }

  const getBackgroundColor = (): string => {
    if (similarity >= 0.75) return "rgba(239, 68, 68, 0.15)"
    if (similarity >= 0.5) return "rgba(245, 158, 11, 0.15)"
    return "rgba(34, 197, 94, 0.15)"
  }

  const sizes: Record<
    string,
    { fontSize: string; padding: string; height: string }
  > = {
    small: { fontSize: "12px", padding: "2px 6px", height: "20px" },
    medium: { fontSize: "14px", padding: "4px 10px", height: "25px" },
    large: { fontSize: "16px", padding: "6px 14px", height: "30px" },
  }

  // Progress bar style (like Dolos v-progress-linear)
  if (asProgress) {
    const color = getColor()
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "100px",
            height: sizes[size].height,
            backgroundColor: "#e5e7eb",
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
          }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% similarity`}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: color,
              borderRadius: "16px",
              transition: "width 0.3s ease",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontWeight: 600,
              fontSize: sizes[size].fontSize,
              color: similarity >= 0.75 ? "#fff" : "#374151",
            }}
          >
            {percentage}%
          </span>
        </div>{" "}
      </div>
    )
  }

  // Badge style
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
  }

  return (
    <span style={style}>
      <span>{percentage}%</span>
      {showLabel && (
        <span style={{ fontWeight: 400, opacity: 0.8 }}>similar</span>
      )}
    </span>
  )
}

export default SimilarityBadge
