import React, { useRef, useEffect } from "react"
import * as monaco from "monaco-editor"
import type { FileData, MatchFragment, CodeRegion } from "./types"
import {
  CLASSIFI_PLAGIARISM_DARK_THEME,
  CLASSIFI_PLAGIARISM_LIGHT_THEME,
  DIFF_VIEW_COLORS,
  ensurePlagiarismMonacoThemes,
} from "./monacoDarkTheme"
import {
  buildDiffFragmentExplanation,
  extractSelectedCode,
} from "./diffFragmentExplanation"
import {
  PLAGIARISM_MONACO_HOVER_CSS,
  SHOULD_SHOW_NATIVE_MONACO_HOVER_MESSAGES,
  formatFragmentExplanationHoverMessage,
} from "./fragmentExplanationHover"
import { FragmentExplanationWidget, type FragmentExplanationWidgetContent } from "./fragmentExplanationWidget"
import { useIsTabletOrBelow } from "@/presentation/hooks/shared/useMediaQuery"
import { getTemporalOrder } from "@/presentation/utils/timeUtils"

interface PairCodeDiffProps {
  /** Left file (original) */
  leftFile: FileData
  /** Right file (modified) */
  rightFile: FileData
  /** Matching fragments to explain in the diff view */
  fragments?: MatchFragment[]
  /** Programming language for syntax highlighting */
  language?: string
  /** Height of the diff editor */
  height?: string | number
  /** Visual theme variant for comparison chrome. */
  variant?: "dark" | "light"
}

/**
 * Monaco diff editor showing differences between two files.
 *
 * Shows a side-by-side diff view highlighting:
 * - Code only in the right submission (yellow-green Monaco inserted color)
 * - Removed lines (red)
 * - Unchanged lines (normal)
 */
export const PairCodeDiff: React.FC<PairCodeDiffProps> = ({
  leftFile,
  rightFile,
  fragments = [],
  language = "java",
  height = 480,
  variant = "dark",
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const isLight = variant === "light"
  const legendTextColor = isLight ? "#475569" : "#cbd5e1"
  const isTabletOrBelow = useIsTabletOrBelow()
  const temporalOrder = getTemporalOrder(leftFile.submittedAt, rightFile.submittedAt)

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
      renderSideBySide: !isTabletOrBelow,
      originalEditable: false,
      fixedOverflowWidgets: true,
    })

    // Assign to ref for external access
    diffEditorRef.current = editor

    editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    const originalEditor = editor.getOriginalEditor()
    const modifiedEditor = editor.getModifiedEditor()
    const originalExplanationWidget = new FragmentExplanationWidget(
      originalEditor,
      "classifi-diff-original-fragment-explanation",
    )
    const modifiedExplanationWidget = new FragmentExplanationWidget(
      modifiedEditor,
      "classifi-diff-modified-fragment-explanation",
    )
    const diffExplanationTargets = fragments.flatMap((fragment) => {
      if (fragment.diffExplanationTargets?.length) {
        return fragment.diffExplanationTargets
      }

      return [
        {
          targetId: `${fragment.id}:fallback`,
          leftSelection: fragment.leftSelection,
          rightSelection: fragment.rightSelection,
          explanation:
            fragment.diffExplanation ??
            buildDiffFragmentExplanation({
              leftContent: leftFile.content,
              rightContent: rightFile.content,
              leftSelection: fragment.leftSelection,
              rightSelection: fragment.rightSelection,
            }),
        },
      ]
    })
    const changedDiffExplanationTargets = diffExplanationTargets.filter((target) =>
      hasChangedSelectedCode({
        leftContent: leftFile.content,
        rightContent: rightFile.content,
        leftSelection: target.leftSelection,
        rightSelection: target.rightSelection,
      }),
    )
    const leftDecorations = changedDiffExplanationTargets.map((target) =>
      createFragmentHoverDecoration(target.leftSelection, target.explanation),
    )
    const rightDecorations = changedDiffExplanationTargets.map((target) =>
      createFragmentHoverDecoration(target.rightSelection, target.explanation),
    )
    const originalDecorationIds = originalEditor.deltaDecorations([], leftDecorations)
    const modifiedDecorationIds = modifiedEditor.deltaDecorations([], rightDecorations)
    const leftHoverTargets = changedDiffExplanationTargets.map((target) => ({
      region: target.leftSelection,
      explanation: target.explanation,
    }))
    const rightHoverTargets = changedDiffExplanationTargets.map((target) => ({
      region: target.rightSelection,
      explanation: target.explanation,
    }))
    const disposables: monaco.IDisposable[] = [
      originalEditor.onMouseMove((event) => {
        const lineNumber = event.target?.position?.lineNumber
        if (!lineNumber) {
          originalExplanationWidget.hide()
          return
        }

        const hoverTarget = getDiffHoverTargetAtLine(leftHoverTargets, lineNumber)
        showDiffExplanationWidget(originalExplanationWidget, hoverTarget)
      }),
      modifiedEditor.onMouseMove((event) => {
        const lineNumber = event.target?.position?.lineNumber
        if (!lineNumber) {
          modifiedExplanationWidget.hide()
          return
        }

        const hoverTarget = getDiffHoverTargetAtLine(rightHoverTargets, lineNumber)
        showDiffExplanationWidget(modifiedExplanationWidget, hoverTarget)
      }),
      originalEditor.onMouseLeave(() => {
        originalExplanationWidget.hide()
      }),
      modifiedEditor.onMouseLeave(() => {
        modifiedExplanationWidget.hide()
      }),
    ]

    // Cleanup - dispose the exact editor created by this effect
    return () => {
      disposables.forEach((disposable) => disposable.dispose())
      originalExplanationWidget.dispose()
      modifiedExplanationWidget.dispose()
      originalEditor.deltaDecorations(originalDecorationIds, [])
      modifiedEditor.deltaDecorations(modifiedDecorationIds, [])
      originalModel.dispose()
      modifiedModel.dispose()
      editor.dispose()
    }
  }, [fragments, isLight, isTabletOrBelow, leftFile.content, rightFile.content, language])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* File headers - no gap, with center divider to match Monaco's internal divider */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isTabletOrBelow ? "1fr" : "1fr 1px 1fr",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            {leftFile.studentName && (
              <span style={{ fontWeight: 600 }}>{leftFile.studentName}</span>
            )}
            {leftFile.studentName && (
              <span style={{ color: isLight ? "#94a3b8" : "#64748b" }}>·</span>
            )}
            <span style={{ fontWeight: leftFile.studentName ? 400 : 500 }}>{leftFile.filename}</span>
            <span style={{ marginLeft: "4px", color: isLight ? "#64748b" : "#9ca3af", fontWeight: 400 }}>
              ({leftFile.lineCount} lines)
            </span>
          </div>
          {temporalOrder === "left" && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: isLight ? "rgba(16, 185, 129, 0.10)" : "rgba(16, 185, 129, 0.15)", color: isLight ? "#047857" : "#34d399", border: isLight ? "1px solid rgba(5, 150, 105, 0.20)" : "1px solid rgba(52, 211, 153, 0.25)", whiteSpace: "nowrap" }}>
              Submitted first
            </span>
          )}
          {temporalOrder === "right" && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: isLight ? "rgba(148, 163, 184, 0.10)" : "rgba(148, 163, 184, 0.12)", color: isLight ? "#64748b" : "#94a3b8", border: isLight ? "1px solid rgba(148, 163, 184, 0.20)" : "1px solid rgba(148, 163, 184, 0.25)", whiteSpace: "nowrap" }}>
              Submitted later
            </span>
          )}
        </div>
        {/* Center divider */}
        {!isTabletOrBelow && (
          <div
            style={{
              backgroundColor: isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.2)",
            }}
          />
        )}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            {rightFile.studentName && (
              <span style={{ fontWeight: 600 }}>{rightFile.studentName}</span>
            )}
            {rightFile.studentName && (
              <span style={{ color: isLight ? "#94a3b8" : "#64748b" }}>·</span>
            )}
            <span style={{ fontWeight: rightFile.studentName ? 400 : 500 }}>{rightFile.filename}</span>
            <span style={{ marginLeft: "4px", color: isLight ? "#64748b" : "#9ca3af", fontWeight: 400 }}>
              ({rightFile.lineCount} lines)
            </span>
          </div>
          {temporalOrder === "right" && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: isLight ? "rgba(16, 185, 129, 0.10)" : "rgba(16, 185, 129, 0.15)", color: isLight ? "#047857" : "#34d399", border: isLight ? "1px solid rgba(5, 150, 105, 0.20)" : "1px solid rgba(52, 211, 153, 0.25)", whiteSpace: "nowrap" }}>
              Submitted first
            </span>
          )}
          {temporalOrder === "left" && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: isLight ? "rgba(148, 163, 184, 0.10)" : "rgba(148, 163, 184, 0.12)", color: isLight ? "#64748b" : "#94a3b8", border: isLight ? "1px solid rgba(148, 163, 184, 0.20)" : "1px solid rgba(148, 163, 184, 0.25)", whiteSpace: "nowrap" }}>
              Submitted later
            </span>
          )}
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
              backgroundColor: DIFF_VIEW_COLORS.addedBadgeBackground,
              border: `1px solid ${DIFF_VIEW_COLORS.addedBadgeBorder}`,
              color: DIFF_VIEW_COLORS.addedBadgeText,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Yellow-Green
          </span>
          <span style={{ color: legendTextColor, fontSize: "12px" }}>
            Yellow-green marks code present only in the right file.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              padding: "2px 8px",
              backgroundColor: DIFF_VIEW_COLORS.removedBadgeBackground,
              border: `1px solid ${DIFF_VIEW_COLORS.removedBadgeBorder}`,
              color: DIFF_VIEW_COLORS.removedBadgeText,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Removed
          </span>
          <span style={{ color: legendTextColor, fontSize: "12px" }}>
            Red marks code missing from the right file.
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
      <style>{PLAGIARISM_MONACO_HOVER_CSS}</style>
    </div>
  )
}

export default PairCodeDiff

function createFragmentHoverDecoration(
  region: CodeRegion,
  explanation: { label: string; reasons: string[] },
): monaco.editor.IModelDeltaDecoration {
  return {
    range: {
      startLineNumber: region.startRow + 1,
      startColumn: region.startCol + 1,
      endLineNumber: region.endRow + 1,
      endColumn: region.endCol + 1,
    },
    options: {
      hoverMessage: SHOULD_SHOW_NATIVE_MONACO_HOVER_MESSAGES
        ? {
            value: formatFragmentExplanationHoverMessage(explanation),
          }
        : undefined,
    },
  }
}

interface DiffHoverTarget {
  region: CodeRegion
  explanation: FragmentExplanationWidgetContent
}

function getDiffHoverTargetAtLine(
  targets: DiffHoverTarget[],
  lineNumber: number,
): DiffHoverTarget | null {
  let smallestTarget: DiffHoverTarget | null = null
  let smallestTargetLength = Number.MAX_SAFE_INTEGER

  for (const target of targets) {
    const isInsideLineRange =
      target.region.startRow + 1 <= lineNumber &&
      lineNumber <= target.region.endRow + 1

    if (!isInsideLineRange) continue

    const targetLength =
      (target.region.endRow - target.region.startRow + 1) * 10000 +
      (target.region.endCol - target.region.startCol + 1)

    if (targetLength < smallestTargetLength) {
      smallestTarget = target
      smallestTargetLength = targetLength
    }
  }

  return smallestTarget
}

function showDiffExplanationWidget(
  widget: FragmentExplanationWidget,
  target: DiffHoverTarget | null,
): void {
  if (!target) {
    widget.hide()
    return
  }

  widget.show({
    explanation: target.explanation,
    lineNumber: target.region.startRow + 1,
    column: target.region.startCol + 1,
  })
}

interface HasChangedSelectedCodeInput {
  leftContent: string
  rightContent: string
  leftSelection: CodeRegion
  rightSelection: CodeRegion
}

function hasChangedSelectedCode(input: HasChangedSelectedCodeInput): boolean {
  const leftSnippet = normalizeSnippetLineEndings(
    extractSelectedCode(input.leftContent, input.leftSelection),
  )
  const rightSnippet = normalizeSnippetLineEndings(
    extractSelectedCode(input.rightContent, input.rightSelection),
  )

  return leftSnippet !== rightSnippet
}

function normalizeSnippetLineEndings(snippet: string): string {
  return snippet.replace(/\r\n/g, "\n")
}
