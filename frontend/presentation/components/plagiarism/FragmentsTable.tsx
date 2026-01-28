import React from "react"
import type { MatchFragment, CodeRegion } from "./types"

interface FragmentsTableProps {
  fragments: MatchFragment[]
  selectedFragment: MatchFragment | null
  onFragmentSelect: (fragment: MatchFragment) => void
}

/**
 * Table displaying all matching fragments with line numbers.
 * Click a row to select and scroll to that fragment.
 */
export const FragmentsTable: React.FC<FragmentsTableProps> = ({
  fragments,
  selectedFragment,
  onFragmentSelect,
}) => {
  const formatRegion = (region: CodeRegion): string => {
    if (region.startRow === region.endRow) {
      return `Line ${region.startRow + 1}`
    }
    return `Lines ${region.startRow + 1}-${region.endRow + 1}`
  }

  if (fragments.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
        No matching fragments found.
      </div>
    )
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#f5f5f5",
              borderBottom: "2px solid #e0e0e0",
            }}
          >
            <th style={{ padding: "10px", textAlign: "left" }}>#</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Left File</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Right File</th>
            <th style={{ padding: "10px", textAlign: "right" }}>Size</th>
          </tr>
        </thead>
        <tbody>
          {fragments.map((fragment, index) => {
            const isSelected = selectedFragment?.id === fragment.id
            return (
              <tr
                key={fragment.id}
                onClick={() => onFragmentSelect(fragment)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onFragmentSelect(fragment)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                style={{
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? "rgba(26, 188, 156, 0.15)"
                    : "transparent",
                  borderBottom: "1px solid #e0e0e0",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(60, 115, 168, 0.1)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }
                }}              >
                <td style={{ padding: "10px", fontWeight: 500 }}>
                  {index + 1}
                </td>
                <td style={{ padding: "10px" }}>
                  {formatRegion(fragment.leftSelection)}
                </td>
                <td style={{ padding: "10px" }}>
                  {formatRegion(fragment.rightSelection)}
                </td>
                <td style={{ padding: "10px", textAlign: "right" }}>
                  {fragment.length} k-grams
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default FragmentsTable
