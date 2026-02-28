import * as monaco from "monaco-editor"

export const CLASSIFI_PLAGIARISM_DARK_THEME = "classifi-plagiarism-dark"

let isThemeDefined = false

/**
 * Defines the shared plagiarism Monaco dark theme once.
 * Safe to call from both match and diff editors.
 */
export function ensurePlagiarismMonacoDarkTheme(): void {
  if (isThemeDefined) {
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

  isThemeDefined = true
}
