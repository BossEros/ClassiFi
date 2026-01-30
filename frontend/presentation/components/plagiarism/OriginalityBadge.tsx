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
 * Badge displaying originality percentage with color coding.
 * Originality is the inverse of similarity - higher scores indicate more original work.
 *
 * Color scheme:
 * - Red (< 30%): High plagiarism risk
 * - Yellow (30-60%): Moderate concern
 * - Green (> 60%): Likely original
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
