import React, { useRef, useEffect } from "react"
import * as monaco from "monaco-editor"
import type { FileData } from "./types"

interface PairCodeDiffProps {
  /** Left file (original) */
  leftFile: FileData
  /** Right file (modified) */
  rightFile: FileData
  /** Programming language for syntax highlighting */
  language?: string
  /** Height of the diff editor */
  height?: string | number
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
  height = 500,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    // Create models for both files
    const originalModel = monaco.editor.createModel(leftFile.content, language)
    const modifiedModel = monaco.editor.createModel(rightFile.content, language)

    // Create diff editor
    diffEditorRef.current = monaco.editor.createDiffEditor(editorRef.current, {
      enableSplitViewResizing: true,
      readOnly: true,
      automaticLayout: true,
      renderLineHighlight: "none",
      contextmenu: false,
      theme: "vs-dark",
      scrollBeyondLastLine: false,
      minimap: { enabled: false },
      renderSideBySide: true,
      originalEditable: false,
    })

    diffEditorRef.current.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    // Cleanup
    return () => {
      originalModel.dispose()
      modifiedModel.dispose()
      diffEditorRef.current?.dispose()
    }
  }, [leftFile.content, rightFile.content, language])

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
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: "6px 0 0 0",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
          }}
        >
          {leftFile.filename}
          <span
            style={{ marginLeft: "8px", color: "#9ca3af", fontWeight: 400 }}
          >
            ({leftFile.lineCount} lines)
          </span>
        </div>
        {/* Center divider */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          }}
        />
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            borderRadius: "0 6px 0 0",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
          }}
        >
          {rightFile.filename}
          <span
            style={{ marginLeft: "8px", color: "#9ca3af", fontWeight: 400 }}
          >
            ({rightFile.lineCount} lines)
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
        }}
      />
    </div>
  )
}

export default PairCodeDiff
