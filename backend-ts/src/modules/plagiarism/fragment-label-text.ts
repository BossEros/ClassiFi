const MAX_FRAGMENT_REASON_LENGTH = 360

/**
 * Normalizes an AI-provided fragment explanation into one display sentence.
 *
 * @param reason - Raw provider reason text.
 * @param fallbackReason - Fallback text to use when the provider reason is empty.
 * @returns A single punctuated sentence suitable for fragment hover text.
 */
export function normalizeFragmentReasonSentence(
  reason: string | undefined,
  fallbackReason: string,
): string {
  const trimmedReason = (reason ?? fallbackReason).trim()
  const punctuatedReason = /[.!?]$/.test(trimmedReason)
    ? trimmedReason
    : `${trimmedReason}.`

  if (punctuatedReason.length <= MAX_FRAGMENT_REASON_LENGTH) {
    return punctuatedReason
  }

  return truncateSentenceAtWordBoundary(
    punctuatedReason,
    MAX_FRAGMENT_REASON_LENGTH,
  )
}

function truncateSentenceAtWordBoundary(sentence: string, maxLength: number): string {
  const truncatedSentence = sentence.slice(0, maxLength - 1)
  const lastWhitespaceIndex = truncatedSentence.lastIndexOf(" ")
  const trimmedSentence =
    lastWhitespaceIndex > maxLength * 0.7
      ? truncatedSentence.slice(0, lastWhitespaceIndex)
      : truncatedSentence

  return `${trimmedSentence.trimEnd()}.`
}
