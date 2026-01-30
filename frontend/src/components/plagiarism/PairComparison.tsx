import React, { useState } from "react"
import type { FilePair, MatchFragment } from "./types"
import { PairCodeEditor } from "./PairCodeEditor"

interface PairComparisonProps {
  /** The file pair to compare */
  pair: FilePair
  /** Programming language for syntax highlighting */
  language?: string
  /** Height of each code editor */
  editorHeight?: string | number
  /** Show fragments table below editors */
  showFragmentsTable?: boolean
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
  editorHeight = 500,
}) => {
  const [selectedFragment, setSelectedFragment] =
    useState<MatchFragment | null>(null)
  const [hoveredFragment, setHoveredFragment] = useState<MatchFragment | null>(
    null,
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Side-by-side editors */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Left editor */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
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
          />
        </div>

        {/* Right editor */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
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
          />
        </div>
      </div>

      {/* Keyboard shortcuts hint - dark theme */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#9ca3af",
        }}
      >
        <strong style={{ color: "#fff" }}>Tip:</strong> Matching code fragments
        are highlighted in blue. Click on highlighted code to select a fragment.
        Both editors will scroll to show the matching region.
      </div>
    </div>
  )
}

export default PairComparison
