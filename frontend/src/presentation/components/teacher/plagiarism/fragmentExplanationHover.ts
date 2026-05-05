interface FragmentHoverExplanation {
  label: string
  reasons: string[]
}

export const PLAGIARISM_MONACO_HOVER_CSS = `
  .monaco-hover {
    max-width: min(520px, calc(100vw - 48px)) !important;
    z-index: 10000 !important;
  }

  .monaco-hover .monaco-hover-content,
  .monaco-hover .hover-contents,
  .monaco-hover .markdown-hover,
  .monaco-hover .hover-row,
  .monaco-hover .rendered-markdown {
    max-width: min(520px, calc(100vw - 48px)) !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: normal !important;
  }

  .monaco-hover code {
    white-space: normal !important;
    overflow-wrap: anywhere !important;
  }
`

export function formatFragmentExplanationHoverMessage(
  explanation: FragmentHoverExplanation,
): string {
  const explanationSentence = formatFragmentExplanationSentence(explanation)

  return explanationSentence
    ? `**${explanation.label}**\n\n${explanationSentence}`
    : `**${explanation.label}**`
}

export function formatFragmentExplanationSentence(
  explanation: FragmentHoverExplanation,
): string {
  const trimmedReason = (explanation.reasons[0] ?? "").trim()

  if (!trimmedReason) return trimmedReason

  return /[.!?]$/.test(trimmedReason) ? trimmedReason : `${trimmedReason}.`
}
