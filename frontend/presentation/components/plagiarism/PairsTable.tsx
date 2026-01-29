import React, { useState, useMemo } from "react"
import type { FilePair } from "./types"
import { SimilarityBadge } from "./SimilarityBadge"

type SortKey = "similarity" | "leftFile" | "rightFile" | "longest" | "overlap"
type SortOrder = "asc" | "desc"

// Sort indicator component - defined outside render to avoid recreation
const SortIndicator: React.FC<{
  column: SortKey
  sortKey: SortKey
  sortOrder: SortOrder
}> = ({ column, sortKey, sortOrder }) => {
  if (sortKey !== column) return null
  return (
    <span style={{ marginLeft: "4px" }}>
      {sortOrder === "desc" ? "↓" : "↑"}
    </span>
  )
}

interface PairsTableProps {
  /** Array of file pairs to display */
  pairs: FilePair[]
  /** Callback when a pair is selected */
  onPairSelect: (pair: FilePair) => void
  /** Currently selected pair (for highlighting) */
  selectedPair?: FilePair | null
  /** Number of items per page */
  itemsPerPage?: number
  /** Search filter */
  searchQuery?: string
  /** Callback when search changes */
  onSearchChange?: (query: string) => void
}

/**
 * Table displaying all file pairs with similarity scores.
 * Features sorting, pagination, and search filtering.
 *
 * This is a React port of Dolos's PairsTable.vue component.
 */
export const PairsTable: React.FC<PairsTableProps> = ({
  pairs,
  onPairSelect,
  selectedPair,
  itemsPerPage = 25,
  searchQuery = "",
  onSearchChange,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>("similarity")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Handle search
  const search = onSearchChange ? searchQuery : localSearch
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setLocalSearch(value)
    }
    setCurrentPage(1)
  }

  // Filter and sort pairs
  const filteredPairs = useMemo(() => {
    let result = pairs

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (pair) =>
          pair.leftFile.filename.toLowerCase().includes(lowerSearch) ||
          pair.rightFile.filename.toLowerCase().includes(lowerSearch),
      )
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case "similarity":
          comparison = a.similarity - b.similarity
          break
        case "leftFile":
          comparison = a.leftFile.filename.localeCompare(b.leftFile.filename)
          break
        case "rightFile":
          comparison = a.rightFile.filename.localeCompare(b.rightFile.filename)
          break
        case "longest":
          comparison = a.longest - b.longest
          break
        case "overlap":
          comparison = a.overlap - b.overlap
          break
      }
      return sortOrder === "desc" ? -comparison : comparison
    })

    return result
  }, [pairs, search, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredPairs.length / itemsPerPage)
  const paginatedPairs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPairs.slice(start, start + itemsPerPage)
  }, [filteredPairs, currentPage, itemsPerPage])

  // Handle sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  const headerStyle: React.CSSProperties = {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: 600,
    cursor: "pointer",
    userSelect: "none",
    backgroundColor: "#f5f5f5",
    borderBottom: "2px solid #e0e0e0",
  }

  const cellStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #e0e0e0",
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Search bar */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "300px",
            padding: "8px 12px",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle} onClick={() => handleSort("leftFile")}>
                Left File{" "}
                <SortIndicator
                  column="leftFile"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th style={headerStyle} onClick={() => handleSort("rightFile")}>
                Right File{" "}
                <SortIndicator
                  column="rightFile"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th
                style={{ ...headerStyle, textAlign: "center" }}
                onClick={() => handleSort("similarity")}
              >
                Similarity{" "}
                <SortIndicator
                  column="similarity"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th
                style={{ ...headerStyle, textAlign: "right" }}
                onClick={() => handleSort("longest")}
              >
                Longest Fragment{" "}
                <SortIndicator
                  column="longest"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th
                style={{ ...headerStyle, textAlign: "right" }}
                onClick={() => handleSort("overlap")}
              >
                Total Overlap{" "}
                <SortIndicator
                  column="overlap"
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPairs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ ...cellStyle, textAlign: "center", color: "#666" }}
                >
                  No pairs found.
                </td>
              </tr>
            ) : (
              paginatedPairs.map((pair) => {
                const isSelected = selectedPair?.id === pair.id
                return (
                  <tr
                    key={pair.id}
                    onClick={() => onPairSelect(pair)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? "rgba(26, 188, 156, 0.1)"
                        : "transparent",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(60, 115, 168, 0.05)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <td style={cellStyle}>{pair.leftFile.filename}</td>
                    <td style={cellStyle}>{pair.rightFile.filename}</td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>
                      <SimilarityBadge
                        similarity={pair.similarity}
                        size="small"
                        showLabel={false}
                      />
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {pair.longest} k-grams
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {pair.overlap}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            fontSize: "14px",
          }}
        >
          <span style={{ color: "#666" }}>
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredPairs.length)} of{" "}
            {filteredPairs.length} pairs
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ padding: "6px 12px", color: "#666" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PairsTable
