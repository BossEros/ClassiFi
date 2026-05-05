import React, { useRef, useEffect, useCallback } from "react"
import * as monaco from "monaco-editor"
import type { FileData, MatchFragment, CodeRegion } from "./types"
import { MATCH_COLORS } from "./types"
import {
  CLASSIFI_PLAGIARISM_DARK_THEME,
  CLASSIFI_PLAGIARISM_LIGHT_THEME,
  ensurePlagiarismMonacoThemes,
} from "./monacoDarkTheme"

interface PairCodeEditorProps {
  /** Which side of the comparison (left or right file) */
  side: "left" | "right"
  /** The file to display */
  file: FileData
  /** All matching fragments for this pair */
  fragments: MatchFragment[]
  /** Ignored k-gram regions (optional) */
  ignoredRegions?: CodeRegion[]
  /** Currently selected fragment */
  selectedFragment: MatchFragment | null
  /** Currently hovered fragment */
  hoveredFragment: MatchFragment | null
  /** Callback when a fragment is selected */
  onFragmentSelect: (fragment: MatchFragment | null) => void
  /** Callback when hovering over a fragment */
  onFragmentHover: (fragment: MatchFragment | null) => void
  /** Programming language for syntax highlighting */
  language?: string
  /** Editor height */
  height?: string | number
  /** Visual theme variant for comparison chrome. */
  variant?: "dark" | "light"
  /** Whether this file was submitted first in the pair */
  submittedFirst?: boolean | null
}

/**
 * Code editor with highlighted matching fragments.
 * Uses Monaco editor for syntax highlighting and navigation.
 *
 * Features:
 * - Click to select fragment
 * - Hover highlighting
 * - Tab/Shift+Tab to cycle through fragments
 * - Synchronized scrolling when selecting from other editor
 * - Smallest-match-first selection when overlapping
 */
export const PairCodeEditor: React.FC<PairCodeEditorProps> = ({
  side,
  file,
  fragments,
  ignoredRegions = [],
  selectedFragment,
  hoveredFragment,
  onFragmentSelect,
  onFragmentHover,
  language = "java",
  height = "480px",
  variant = "dark",
  submittedFirst,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])
  const isLight = variant === "light"

  // Sort fragments by start position
  const sortedFragments = [...fragments].sort((a, b) => {
    const aRegion = side === "left" ? a.leftSelection : a.rightSelection
    const bRegion = side === "left" ? b.leftSelection : b.rightSelection
    return (
      (aRegion.startRow - bRegion.startRow) * 10000 +
      (aRegion.startCol - bRegion.startCol)
    )
  })

  // Get the region for this side from a fragment
  const getRegion = useCallback(
    (fragment: MatchFragment): CodeRegion => {
      return side === "left" ? fragment.leftSelection : fragment.rightSelection
    },
    [side],
  )

  // Find fragment at a cursor position (smallest-match-first)
  const getFragmentAtPosition = useCallback(
    (lineNumber: number, column: number): MatchFragment | null => {
      let smallestMatch: MatchFragment | null = null
      let smallestMatchLength = Number.MAX_SAFE_INTEGER

      for (const fragment of sortedFragments) {
        const region = getRegion(fragment)
        // Check if row is within range
        const inRowRange =
          region.startRow + 1 <= lineNumber && lineNumber <= region.endRow + 1
        if (!inRowRange) continue

        // Check column range
        let inColRange = true
        // For single-line fragments, both constraints must be satisfied
        if (
          lineNumber === region.startRow + 1 &&
          lineNumber === region.endRow + 1
        ) {
          inColRange =
            column >= region.startCol + 1 && column <= region.endCol + 1
        } else {
          // For multi-line fragments, check start and end separately
          if (lineNumber === region.startRow + 1) {
            inColRange = column >= region.startCol + 1
          }
          if (lineNumber === region.endRow + 1) {
            inColRange = column <= region.endCol + 1
          }
        }

        if (!inColRange) continue

        // Check if this is the smallest match
        const length =
          (region.endRow - region.startRow + 1) * 10000 +
          (region.endCol - region.startCol + 1)
        if (length < smallestMatchLength) {
          smallestMatch = fragment
          smallestMatchLength = length
        }
      }

      return smallestMatch
    },
    [sortedFragments, getRegion],
  )

  // Build selections for multi-line fragments
  const buildSelections = useCallback(() => {
    const selections: Array<{
      fragment: MatchFragment | "ignored"
      range: monaco.IRange
      isWholeLine: boolean
    }> = []

    for (const fragment of sortedFragments) {
      const region = getRegion(fragment)

      // If 1-2 lines, single selection
      if (
        region.startRow === region.endRow ||
        region.startRow === region.endRow - 1
      ) {
        selections.push({
          fragment,
          range: {
            startLineNumber: region.startRow + 1,
            startColumn: region.startCol + 1,
            endLineNumber: region.endRow + 1,
            endColumn: region.endCol + 1,
          },
          isWholeLine: false,
        })
      } else {
        // First line (partial)
        selections.push({
          fragment,
          range: {
            startLineNumber: region.startRow + 1,
            startColumn: region.startCol + 1,
            endLineNumber: region.startRow + 1,
            endColumn: Number.MAX_SAFE_INTEGER,
          },
          isWholeLine: false,
        })
        // Middle lines (whole lines)
        selections.push({
          fragment,
          range: {
            startLineNumber: region.startRow + 2,
            startColumn: 0,
            endLineNumber: region.endRow,
            endColumn: Number.MAX_SAFE_INTEGER,
          },
          isWholeLine: true,
        })
        // Last line (partial)
        selections.push({
          fragment,
          range: {
            startLineNumber: region.endRow + 1,
            startColumn: 0,
            endLineNumber: region.endRow + 1,
            endColumn: region.endCol + 1,
          },
          isWholeLine: false,
        })
      }
    }

    // Add ignored regions
    for (const ignored of ignoredRegions) {
      selections.push({
        fragment: "ignored",
        range: {
          startLineNumber: ignored.startRow + 1,
          startColumn: ignored.startCol + 1,
          endLineNumber: ignored.endRow + 1,
          endColumn: ignored.endCol + 1,
        },
        isWholeLine: false,
      })
    }

    return selections
  }, [sortedFragments, ignoredRegions, getRegion])

  // Compare fragments for equality
  const areFragmentsEqual = (
    a: MatchFragment | null,
    b: MatchFragment | null,
  ): boolean => {
    if (!a || !b) return false
    return (
      a.leftSelection.startRow === b.leftSelection.startRow &&
      a.leftSelection.endRow === b.leftSelection.endRow &&
      a.leftSelection.startCol === b.leftSelection.startCol &&
      a.leftSelection.endCol === b.leftSelection.endCol &&
      a.rightSelection.startRow === b.rightSelection.startRow &&
      a.rightSelection.endRow === b.rightSelection.endRow &&
      a.rightSelection.startCol === b.rightSelection.startCol &&
      a.rightSelection.endCol === b.rightSelection.endCol
    )
  }

  // Update decorations when selection/hover changes
  const updateDecorations = useCallback(() => {
    if (!editorRef.current) return

    const selections = buildSelections()
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = []

    for (const sel of selections) {
      let className = "plagiarism-match"

      if (sel.fragment === "ignored") {
        className = "plagiarism-match-ignored"
      } else {
        if (areFragmentsEqual(sel.fragment, selectedFragment)) {
          className = "plagiarism-match-selected"
        } else if (areFragmentsEqual(sel.fragment, hoveredFragment)) {
          className = "plagiarism-match-hover"
        }
      }

      newDecorations.push({
        range: sel.range,
        options: {
          className,
          isWholeLine: sel.isWholeLine,
          hoverMessage:
            sel.fragment !== "ignored" && sel.fragment.explanation
              ? {
                  value: `**${sel.fragment.explanation.label}**\n\n${sel.fragment.explanation.reasons.join("\n")}`,
                }
              : undefined,
        },
      })
    }

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    )
  }, [buildSelections, selectedFragment, hoveredFragment])

  // Scroll to selected fragment
  const scrollToFragment = useCallback(
    (fragment: MatchFragment) => {
      if (!editorRef.current) return

      const region = getRegion(fragment)
      editorRef.current.revealPositionInCenter(
        {
          lineNumber: region.startRow + 1,
          column: region.startCol + 1,
        },
        monaco.editor.ScrollType.Smooth,
      )
    },
    [getRegion],
  )

  const showSelectedFragmentHover = useCallback(
    (fragment: MatchFragment) => {
      if (!editorRef.current || !fragment.explanation) return

      const region = getRegion(fragment)
      editorRef.current.setPosition({
        lineNumber: region.startRow + 1,
        column: Math.max(region.startCol + 1, 1),
      })
      editorRef.current.trigger(
        "classifi.fragmentExplanation",
        "editor.action.showHover",
        undefined,
      )
    },
    [getRegion],
  )

  // Initialize editor (only depends on file content and language)
  useEffect(() => {
    if (!containerRef.current) return

    ensurePlagiarismMonacoThemes()

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: file.content,
      language,
      theme: isLight
        ? CLASSIFI_PLAGIARISM_LIGHT_THEME
        : CLASSIFI_PLAGIARISM_DARK_THEME,
      readOnly: true,
      automaticLayout: true,
      smoothScrolling: true,
      renderLineHighlight: "none",
      renderValidationDecorations: "off",
      minimap: { enabled: false },
      contextmenu: false,
      scrollBeyondLastLine: false,
    })

    return () => {
      editorRef.current?.dispose()
    }
  }, [file.content, isLight, language])

  // Register event handlers (runs when handlers or dependencies change)
  useEffect(() => {
    if (!editorRef.current) return

    const disposables: monaco.IDisposable[] = []

    // Handle click to select fragment
    disposables.push(
      editorRef.current.onDidChangeCursorPosition((e) => {
        if (!e.position?.lineNumber) return
        const fragment = getFragmentAtPosition(
          e.position.lineNumber,
          e.position.column,
        )
        onFragmentSelect(fragment)
      }),
    )

    // Handle hover
    disposables.push(
      editorRef.current.onMouseMove((e) => {
        if (!e.target?.position) {
          onFragmentHover(null)
          return
        }

        const fragment = getFragmentAtPosition(
          e.target.position.lineNumber,
          e.target.position.column,
        )
        onFragmentHover(fragment)
      }),
    )

    // Handle mouse leave
    disposables.push(
      editorRef.current.onMouseLeave(() => {
        onFragmentHover(null)
      }),
    )

    // Tab to go to next match
    disposables.push(
      editorRef.current.addAction({
        id: "match-next",
        label: "Go to next match",
        keybindings: [monaco.KeyCode.Tab],
        run: () => {
          if (sortedFragments.length === 0) return

          const currentIndex = selectedFragment
            ? sortedFragments.findIndex((f) =>
                areFragmentsEqual(f, selectedFragment),
              )
            : -1
          const nextIndex =
            currentIndex === -1 || currentIndex === sortedFragments.length - 1
              ? 0
              : currentIndex + 1
          const nextFragment = sortedFragments[nextIndex]

          scrollToFragment(nextFragment)
          onFragmentSelect(nextFragment)
        },
      }),
    )

    // Shift+Tab to go to previous match
    disposables.push(
      editorRef.current.addAction({
        id: "match-previous",
        label: "Go to previous match",
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Tab],
        run: () => {
          if (sortedFragments.length === 0) return

          const currentIndex = selectedFragment
            ? sortedFragments.findIndex((f) =>
                areFragmentsEqual(f, selectedFragment),
              )
            : 0
          const prevIndex =
            currentIndex === -1 || currentIndex === 0
              ? sortedFragments.length - 1
              : currentIndex - 1
          const prevFragment = sortedFragments[prevIndex]

          scrollToFragment(prevFragment)
          onFragmentSelect(prevFragment)
        },
      }),
    )

    return () => {
      disposables.forEach((d) => d.dispose())
    }
  }, [
    file.content,
    language,
    getFragmentAtPosition,
    scrollToFragment,
    onFragmentSelect,
    onFragmentHover,
    sortedFragments,
    selectedFragment,
  ])

  // Update decorations when fragments/selection changes
  useEffect(() => {
    updateDecorations()
  }, [updateDecorations])

  // Scroll to selected fragment when it changes (if not focused)
  useEffect(() => {
    if (selectedFragment && !editorRef.current?.hasTextFocus()) {
      scrollToFragment(selectedFragment)
    }
  }, [selectedFragment, scrollToFragment])

  useEffect(() => {
    if (!selectedFragment?.explanation || hoveredFragment) return

    const animationFrameId = window.requestAnimationFrame(() => {
      showSelectedFragmentHover(selectedFragment)
    })

    return () => window.cancelAnimationFrame(animationFrameId)
  }, [hoveredFragment, selectedFragment, showSelectedFragmentHover])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* File info header */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.08)",
          borderBottom: isLight
            ? "1px solid #cbd5e1"
            : "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: "14px",
          fontWeight: 500,
          color: isLight ? "#0f172a" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          {file.studentName && (
            <span style={{ fontWeight: 600 }}>{file.studentName}</span>
          )}
          {file.studentName && (
            <span style={{ color: isLight ? "#94a3b8" : "#64748b" }}>·</span>
          )}
          <span style={{ fontWeight: file.studentName ? 400 : 500 }}>{file.filename}</span>
          <span
            style={{
              marginLeft: "4px",
              color: isLight ? "#64748b" : "#9ca3af",
              fontWeight: 400,
            }}
          >
            ({file.lineCount} lines)
          </span>
        </div>
        {submittedFirst === true && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: isLight ? "rgba(16, 185, 129, 0.10)" : "rgba(16, 185, 129, 0.15)",
              color: isLight ? "#047857" : "#34d399",
              border: isLight ? "1px solid rgba(5, 150, 105, 0.20)" : "1px solid rgba(52, 211, 153, 0.25)",
              whiteSpace: "nowrap",
            }}
          >
            Submitted first
          </span>
        )}
        {submittedFirst === false && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: isLight ? "rgba(148, 163, 184, 0.10)" : "rgba(148, 163, 184, 0.12)",
              color: isLight ? "#64748b" : "#94a3b8",
              border: isLight ? "1px solid rgba(148, 163, 184, 0.20)" : "1px solid rgba(148, 163, 184, 0.25)",
              whiteSpace: "nowrap",
            }}
          >
            Submitted later
          </span>
        )}
      </div>

      {/* Editor container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: typeof height === "number" ? `${height}px` : height,
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
        }}
      />

      {/* CSS for decorations */}
      <style>{`
        .plagiarism-match {
          background-color: ${MATCH_COLORS.match};
        }
        .plagiarism-match-hover {
          background-color: ${MATCH_COLORS.matchHover};
          box-shadow: inset 0 0 0 1px ${MATCH_COLORS.matchHoverOutline};
        }
        .plagiarism-match-selected {
          background-color: ${MATCH_COLORS.matchSelected};
          box-shadow: inset 0 0 0 1px ${MATCH_COLORS.matchSelectedOutline};
        }
        .plagiarism-match-ignored {
          background-color: ${MATCH_COLORS.matchIgnored};
          box-shadow: inset 0 0 0 1px ${MATCH_COLORS.matchIgnoredOutline};
        }
      `}</style>
    </div>
  )
}

export default PairCodeEditor
