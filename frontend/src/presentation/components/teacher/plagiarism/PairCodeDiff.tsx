import React, { useRef, useEffect } from "react"
import * as monaco from "monaco-editor"
import type { FileData } from "./types"
import {
  CLASSIFI_PLAGIARISM_DARK_THEME,
  CLASSIFI_PLAGIARISM_LIGHT_THEME,
  ensurePlagiarismMonacoThemes,
} from "./monacoDarkTheme"

interface PairCodeDiffProps {
  /** Left file (original) */
  leftFile: FileData
  /** Right file (modified) */
  rightFile: FileData
  /** Programming language for syntax highlighting */
  language?: string
  /** Height of the diff editor */
  height?: string | number
  /** Visual theme variant for comparison chrome. */
  variant?: "dark" | "light"
}

/**
 * Monaco diff editor showing differences between two files.
 * This is a React port of Dolos's PairCodeDiff.vue component.
 *
 * Shows a side-by-side diff view highlighting:
 * - Added lines (green)
 * - Removed lines (red)
 * - Unchanged lines (normal)
 */
export const PairCodeDiff: React.FC<PairCodeDiffProps> = ({
  leftFile,
  rightFile,
  language = "java",
  height = 480,
  variant = "dark",
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const isLight = variant === "light"
  const legendTextColor = isLight ? "#475569" : "#cbd5e1"

  useEffect(() => {
    if (!editorRef.current) return

    // Create models for both files
    const originalModel = monaco.editor.createModel(leftFile.content, language)
    const modifiedModel = monaco.editor.createModel(rightFile.content, language)

    ensurePlagiarismMonacoThemes()

    // Create diff editor and capture it locally for cleanup
    const editor = monaco.editor.createDiffEditor(editorRef.current, {
      enableSplitViewResizing: true,
      readOnly: true,
      automaticLayout: true,
      renderLineHighlight: "none",
      renderOverviewRuler: false,
      renderIndicators: false,
      contextmenu: false,
      theme: isLight
        ? CLASSIFI_PLAGIARISM_LIGHT_THEME
        : CLASSIFI_PLAGIARISM_DARK_THEME,
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      renderSideBySide: true,
      originalEditable: false,
    })

    // Assign to ref for external access
    diffEditorRef.current = editor

    editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    // Cleanup - dispose the exact editor created by this effect
    return () => {
      originalModel.dispose()
      modifiedModel.dispose()
      editor.dispose()
    }
  }, [isLight, leftFile.content, rightFile.content, language])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* File headers - no gap, with center divider to match Monaco's internal divider */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.08)",
            borderRadius: "6px 0 0 0",
            borderBottom: isLight
              ? "1px solid #cbd5e1"
              : "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            fontWeight: 500,
            color: isLight ? "#0f172a" : "#fff",
          }}
        >
          {leftFile.filename}
          <span
            style={{
              marginLeft: "8px",
              color: isLight ? "#64748b" : "#9ca3af",
              fontWeight: 400,
            }}
          >
            ({leftFile.lineCount} lines)
          </span>
        </div>
        {/* Center divider */}
        <div
          style={{
            backgroundColor: isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.2)",
          }}
        />
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.08)",
            borderRadius: "0 6px 0 0",
            borderBottom: isLight
              ? "1px solid #cbd5e1"
              : "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            fontWeight: 500,
            color: isLight ? "#0f172a" : "#fff",
          }}
        >
          {rightFile.filename}
          <span
            style={{
              marginLeft: "8px",
              color: isLight ? "#64748b" : "#9ca3af",
              fontWeight: 400,
            }}
          >
            ({rightFile.lineCount} lines)
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          padding: "8px 12px",
          backgroundColor: isLight ? "#f8fafc" : "rgba(255, 255, 255, 0.05)",
          borderBottom: isLight
            ? "1px solid #e2e8f0"
            : "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              padding: "2px 8px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(5, 150, 105, 0.24)",
              color: "#047857",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Added
          </span>
          <span style={{ color: legendTextColor, fontSize: "12px" }}>
            Emerald marks code present only in the right file.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              padding: "2px 8px",
              backgroundColor: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(225, 29, 72, 0.24)",
              color: "#be123c",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Removed
          </span>
          <span style={{ color: legendTextColor, fontSize: "12px" }}>
            Rose marks code missing from the right file.
          </span>
        </div>
      </div>

      {/* Diff editor */}
      <div
        ref={editorRef}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: "0 0 6px 6px",
          overflow: "hidden",
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
        }}
      />
    </div>
  )
}

export default PairCodeDiff
