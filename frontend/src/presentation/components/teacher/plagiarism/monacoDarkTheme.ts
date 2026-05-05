import * as monaco from "monaco-editor"

export const CLASSIFI_PLAGIARISM_DARK_THEME = "classifi-plagiarism-dark"
export const CLASSIFI_PLAGIARISM_LIGHT_THEME = "classifi-plagiarism-light"

export const DIFF_VIEW_COLORS = {
  addedTextBackground: "#9ccc2c40",
  addedTextBorder: "#00000000",
  addedLineBackground: "#9bb95533",
  addedGutterBackground: "#9bb95533",
  addedOverviewForeground: "#9bb955cc",
  addedBadgeBackground: "rgba(155, 185, 85, 0.20)",
  addedBadgeBorder: "rgba(155, 185, 85, 0.38)",
  addedBadgeText: "#52650f",
  removedTextBackground: "#ff000033",
  removedTextBorder: "#00000000",
  removedLineBackground: "#ff000033",
  removedGutterBackground: "#ff000033",
  removedOverviewForeground: "#ff0000cc",
  removedBadgeBackground: "rgba(239, 68, 68, 0.16)",
  removedBadgeBorder: "rgba(185, 28, 28, 0.28)",
  removedBadgeText: "#b91c1c",
} as const

/**
 * Defines or refreshes the shared plagiarism Monaco themes.
 * Safe to call from both match and diff editors.
 */
export function ensurePlagiarismMonacoThemes(): void {
  const darkDiffColors = {
    "editor.background": "#0f172a",
    "editorGutter.background": "#0f172a",
    "editorLineNumber.foreground": "#64748b",
    "editorLineNumber.activeForeground": "#e2e8f0",
    "editor.lineHighlightBackground": "#111c31",
    "editor.selectionBackground": "#38bdf833",
    "editor.inactiveSelectionBackground": "#38bdf822",
    "editorIndentGuide.background1": "#1e293b",
    "editorIndentGuide.activeBackground1": "#334155",
    "diffEditor.insertedTextBackground": DIFF_VIEW_COLORS.addedTextBackground,
    "diffEditor.insertedTextBorder": DIFF_VIEW_COLORS.addedTextBorder,
    "diffEditor.insertedLineBackground": DIFF_VIEW_COLORS.addedLineBackground,
    "diffEditorGutter.insertedLineBackground": DIFF_VIEW_COLORS.addedGutterBackground,
    "diffEditorOverview.insertedForeground": DIFF_VIEW_COLORS.addedOverviewForeground,
    "diffEditor.removedTextBackground": DIFF_VIEW_COLORS.removedTextBackground,
    "diffEditor.removedTextBorder": DIFF_VIEW_COLORS.removedTextBorder,
    "diffEditor.removedLineBackground": DIFF_VIEW_COLORS.removedLineBackground,
    "diffEditorGutter.removedLineBackground": DIFF_VIEW_COLORS.removedGutterBackground,
    "diffEditorOverview.removedForeground": DIFF_VIEW_COLORS.removedOverviewForeground,
  } as const

  const lightDiffColors = {
    "editor.background": "#ffffff",
    "editorGutter.background": "#ffffff",
    "editorLineNumber.foreground": "#94a3b8",
    "editorLineNumber.activeForeground": "#334155",
    "editor.lineHighlightBackground": "#f8fafc",
    "editor.selectionBackground": "#bae6fd80",
    "editor.inactiveSelectionBackground": "#dbeafe66",
    "editorIndentGuide.background1": "#e2e8f0",
    "editorIndentGuide.activeBackground1": "#cbd5e1",
    "diffEditor.insertedTextBackground": DIFF_VIEW_COLORS.addedTextBackground,
    "diffEditor.insertedTextBorder": DIFF_VIEW_COLORS.addedTextBorder,
    "diffEditor.insertedLineBackground": DIFF_VIEW_COLORS.addedLineBackground,
    "diffEditorGutter.insertedLineBackground": DIFF_VIEW_COLORS.addedGutterBackground,
    "diffEditorOverview.insertedForeground": DIFF_VIEW_COLORS.addedOverviewForeground,
    "diffEditor.removedTextBackground": DIFF_VIEW_COLORS.removedTextBackground,
    "diffEditor.removedTextBorder": DIFF_VIEW_COLORS.removedTextBorder,
    "diffEditor.removedLineBackground": DIFF_VIEW_COLORS.removedLineBackground,
    "diffEditorGutter.removedLineBackground": DIFF_VIEW_COLORS.removedGutterBackground,
    "diffEditorOverview.removedForeground": DIFF_VIEW_COLORS.removedOverviewForeground,
  } as const

  monaco.editor.defineTheme(CLASSIFI_PLAGIARISM_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: darkDiffColors,
  })

  monaco.editor.defineTheme(CLASSIFI_PLAGIARISM_LIGHT_THEME, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: lightDiffColors,
  })
}
