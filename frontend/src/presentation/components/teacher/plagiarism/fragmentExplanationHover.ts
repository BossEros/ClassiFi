interface FragmentHoverExplanation {
  label: string
  reasons: string[]
}

export const SHOULD_SHOW_NATIVE_MONACO_HOVER_MESSAGES = false

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

  .classifi-fragment-explanation-widget {
    box-sizing: border-box;
    width: max-content;
    min-width: min(280px, calc(100vw - 48px));
    max-width: min(520px, calc(100vw - 48px));
    padding: 8px 10px;
    border: 1px solid #c8c8c8;
    border-radius: 6px;
    background: #f3f3f3;
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.18),
      0 2px 6px rgba(15, 23, 42, 0.12);
    color: #1e1e1e;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 14px;
    line-height: 1.5;
    pointer-events: none;
    white-space: normal;
    overflow-wrap: anywhere;
    z-index: 10000;
  }

  .classifi-fragment-explanation-widget__label {
    margin-bottom: 4px;
    color: #1e1e1e;
    font-weight: 700;
  }

  .classifi-fragment-explanation-widget__reason {
    color: #3b3b3b;
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
