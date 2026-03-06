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

  monaco.editor.defineTheme(CLASSIFI_PLAGIARISM_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0f172a",
      "editorGutter.background": "#0f172a",
      "diffEditor.insertedTextBackground": "#10b9814d",
      "diffEditor.insertedLineBackground": "#10b98126",
      "diffEditor.removedTextBackground": "#f43f5e4d",
      "diffEditor.removedLineBackground": "#f43f5e26",
    },
  })

  monaco.editor.defineTheme(CLASSIFI_PLAGIARISM_LIGHT_THEME, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editorGutter.background": "#ffffff",
      "editorLineNumber.foreground": "#94a3b8",
      "editorLineNumber.activeForeground": "#475569",
      "editor.lineHighlightBackground": "#f8fafc",
      "editor.selectionBackground": "#bfdbfe80",
      "editor.inactiveSelectionBackground": "#dbeafe66",
      "editorIndentGuide.background1": "#e2e8f0",
      "editorIndentGuide.activeBackground1": "#cbd5e1",
      "diffEditor.insertedTextBackground": "#10b98133",
      "diffEditor.insertedLineBackground": "#10b9811f",
      "diffEditor.removedTextBackground": "#f43f5e2b",
      "diffEditor.removedLineBackground": "#f43f5e14",
    },
  })

  areThemesDefined = true
}
