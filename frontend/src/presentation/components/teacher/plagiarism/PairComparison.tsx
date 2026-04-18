import React, { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react"
import { PairCodeEditor } from "./PairCodeEditor"
import type { FilePair, MatchFragment } from "./types"
import { useIsTabletOrBelow } from "@/presentation/hooks/shared/useMediaQuery"
import {
  formatTimeDifference,
  getTemporalOrder,
} from "@/presentation/utils/timeUtils"

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

  // Sort fragments by length descending so the strongest match is navigated to first.
  const sortedByStrength = useMemo(
    () => [...pair.fragments].sort((leftFragment, rightFragment) => rightFragment.length - leftFragment.length),
    [pair.fragments],
  )

  const totalFragments = sortedByStrength.length

  const selectedFragmentIndex = useMemo(() => {
    if (!selectedFragment) return -1
    return sortedByStrength.findIndex(
      (fragment) => fragment.id === selectedFragment.id,
    )
  }, [selectedFragment, sortedByStrength])

  const navigateToFragment = (fragmentIndex: number) => {
    const fragment = sortedByStrength[fragmentIndex]
    if (fragment) setSelectedFragment(fragment)
  }

  const handlePreviousFragment = () => {
    if (totalFragments === 0) return

    if (selectedFragmentIndex <= 0) {
      navigateToFragment(totalFragments - 1)
    } else {
      navigateToFragment(selectedFragmentIndex - 1)
    }
  }

  const handleNextFragment = () => {
    if (totalFragments === 0) return

    if (
      selectedFragmentIndex === -1 ||
      selectedFragmentIndex >= totalFragments - 1
    ) {
      navigateToFragment(0)
    } else {
      navigateToFragment(selectedFragmentIndex + 1)
    }
  }

  const temporalOrder = getTemporalOrder(
    pair.leftFile.submittedAt,
    pair.rightFile.submittedAt,
  )

  const timeDiffMs =
    pair.leftFile.submittedAt && pair.rightFile.submittedAt
      ? Math.abs(
          new Date(pair.leftFile.submittedAt).getTime() -
            new Date(pair.rightFile.submittedAt).getTime(),
        )
      : 0

  const earlierStudentName =
    temporalOrder === "left"
      ? pair.leftFile.studentName
      : temporalOrder === "right"
        ? pair.rightFile.studentName
        : null

  const labelColor = isLight ? "#64748b" : "#9ca3af"
  const valueColor = isLight ? "#0f172a" : "#f1f5f9"
  const borderColor = isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)"
  const bgColor = isLight ? "#f8fafc" : "rgba(255,255,255,0.05)"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Temporal analysis banner */}
      {temporalOrder && earlierStudentName && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            backgroundColor: isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)",
            borderRadius: "8px",
            border: isLight
              ? "1px solid #bbf7d0"
              : "1px solid rgba(52, 211, 153, 0.20)",
            fontSize: "13px",
            color: isLight ? "#15803d" : "#6ee7b7",
          }}
        >
          <Clock3 size={16} />
          <span>
            <strong>{earlierStudentName}</strong> submitted{" "}
            <strong>{formatTimeDifference(timeDiffMs)}</strong> before{" "}
            <strong>
              {temporalOrder === "left"
                ? pair.rightFile.studentName
                : pair.leftFile.studentName}
            </strong>
          </span>
        </div>
      )}

      {/* Fragment navigation bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 14px",
          backgroundColor: bgColor,
          borderRadius: "8px",
          border: `1px solid ${borderColor}`,
          fontSize: "13px",
        }}
      >
        {/* Fragment navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handlePreviousFragment}
            disabled={totalFragments === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              border: `1px solid ${borderColor}`,
              background: "transparent",
              cursor: totalFragments === 0 ? "not-allowed" : "pointer",
              color: labelColor,
              opacity: totalFragments === 0 ? 0.4 : 1,
            }}
            aria-label="Previous fragment"
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ color: labelColor }}>
            {totalFragments === 0 ? (
              <span>No fragments</span>
            ) : selectedFragmentIndex === -1 ? (
              <span>
                <strong style={{ color: valueColor }}>{totalFragments}</strong>{" "}
                matching fragment{totalFragments !== 1 ? "s" : ""}
              </span>
            ) : (
              <span>
                Fragment{" "}
                <strong style={{ color: valueColor }}>
                  {selectedFragmentIndex + 1}
                </strong>
                {" / "}
                <strong style={{ color: valueColor }}>{totalFragments}</strong>
              </span>
            )}
          </span>
          <button
            onClick={handleNextFragment}
            disabled={totalFragments === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              border: `1px solid ${borderColor}`,
              background: "transparent",
              cursor: totalFragments === 0 ? "not-allowed" : "pointer",
              color: labelColor,
              opacity: totalFragments === 0 ? 0.4 : 1,
            }}
            aria-label="Next fragment"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

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
            submittedFirst={
              temporalOrder === null ? null : temporalOrder === "left"
            }
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
            submittedFirst={
              temporalOrder === null ? null : temporalOrder === "right"
            }
          />
        </div>
      </div>

      <div
        style={{
          padding: "8px 12px",
          backgroundColor: bgColor,
          borderRadius: "6px",
          fontSize: "13px",
          color: labelColor,
          border: isLight ? `1px solid ${borderColor}` : undefined,
        }}
      >
        <strong style={{ color: valueColor }}>Tip:</strong>{" "}
        Shared fragments are highlighted in sky blue. Click any highlighted
        block or use the arrows above to navigate between matches. Counts are
        based on matched structural fingerprints from the detector, so a
        smaller count can still span more visible lines of code. Fragments are
        ordered strongest first.
      </div>
    </div>
  )
}

export default PairComparison
