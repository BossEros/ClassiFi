import React, { useState } from "react"
import type { FilePair, MatchFragment } from "./types"
import { PairCodeEditor } from "./PairCodeEditor"
import { useIsTabletOrBelow } from "@/presentation/hooks/shared/useMediaQuery"

interface PairComparisonProps {
  /** The file pair to compare */
  pair: FilePair
  /** Programming language for syntax highlighting */
  language?: string
  /** Height of each code editor */
  editorHeight?: string | number
  /** Visual theme variant for comparison chrome. */
  variant?: "dark" | "light"
}
/**
 * Side-by-side code comparison view with highlighted matching fragments.
 *
 * This is the main component for displaying plagiarism detection results.
 * It shows two code editors side by side with synchronized selection and
 * highlighting of matching code regions.
 *
 * This is a React port of Dolos's CompareCard.vue component.
 */
export const PairComparison: React.FC<PairComparisonProps> = ({
  pair,
  language = "java",
  editorHeight = 480,
  variant = "dark",
}) => {
  const [selectedFragment, setSelectedFragment] =
    useState<MatchFragment | null>(null)
  const [hoveredFragment, setHoveredFragment] = useState<MatchFragment | null>(
    null,
  )
  const isLight = variant === "light"
  const isTabletOrBelow = useIsTabletOrBelow()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Side-by-side editors (stacked on mobile) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isTabletOrBelow ? "1fr" : "1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Left editor */}
        <div
          style={{
            backgroundColor: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            border: isLight
              ? "1px solid #cbd5e1"
              : "1px solid rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
          }}
        >
          <PairCodeEditor
            side="left"
            file={pair.leftFile}
            fragments={pair.fragments}
            selectedFragment={selectedFragment}
            hoveredFragment={hoveredFragment}
            onFragmentSelect={setSelectedFragment}
            onFragmentHover={setHoveredFragment}
            language={language}
            height={editorHeight}
            variant={variant}
          />
        </div>

        {/* Right editor */}
        <div
          style={{
            backgroundColor: isLight ? "#ffffff" : "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            border: isLight
              ? "1px solid #cbd5e1"
              : "1px solid rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
          }}
        >
          <PairCodeEditor
            side="right"
            file={pair.rightFile}
            fragments={pair.fragments}
            selectedFragment={selectedFragment}
            hoveredFragment={hoveredFragment}
            onFragmentSelect={setSelectedFragment}
            onFragmentHover={setHoveredFragment}
            language={language}
            height={editorHeight}
            variant={variant}
          />
        </div>
      </div>

      <div
        style={{
          padding: "8px 12px",
          backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.05)",
          borderRadius: "6px",
          fontSize: "13px",
          color: isLight ? "#64748b" : "#9ca3af",
          border: isLight ? "1px solid #e2e8f0" : undefined,
        }}
      >
        <strong style={{ color: isLight ? "#0f172a" : "#fff" }}>Tip:</strong>{" "}
        Shared fragments are highlighted in sky blue. Click any highlighted
        block to lock in a stronger outline and keep both editors centered on
        the same region.
      </div>
    </div>
  )
}

export default PairComparison
