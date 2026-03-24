import * as monaco from "monaco-editor"

export const CLASSIFI_PLAGIARISM_DARK_THEME = "classifi-plagiarism-dark"
export const CLASSIFI_PLAGIARISM_LIGHT_THEME = "classifi-plagiarism-light"

let areThemesDefined = false

/**
 * Defines the shared plagiarism Monaco themes once.
 * Safe to call from both match and diff editors.
 */
export function ensurePlagiarismMonacoThemes(): void {
  if (areThemesDefined) {
    return
  }

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
    "diffEditor.insertedTextBackground": "#10b98147",
    "diffEditor.insertedTextBorder": "#05966999",
    "diffEditor.insertedLineBackground": "#10b9811f",
    "diffEditor.removedTextBackground": "#f43f5e40",
    "diffEditor.removedTextBorder": "#e11d4899",
    "diffEditor.removedLineBackground": "#f43f5e1a",
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
    "diffEditor.insertedTextBackground": "#10b98147",
    "diffEditor.insertedTextBorder": "#05966980",
    "diffEditor.insertedLineBackground": "#10b9811f",
    "diffEditor.removedTextBackground": "#f43f5e3d",
    "diffEditor.removedTextBorder": "#e11d4873",
    "diffEditor.removedLineBackground": "#f43f5e1a",
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

  areThemesDefined = true
}
