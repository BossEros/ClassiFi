import type { Assignment } from "@/modules/assignments/assignment.model.js"

/** Result of matching a candidate assignment against a source assignment */
export interface MatchedAssignment {
  assignment: Assignment
  nameSimilarity: number
}

/** Default threshold for assignment name similarity (Dice coefficient) */
export const DEFAULT_NAME_SIMILARITY_THRESHOLD = 0.8

/**
 * Normalize an assignment name for comparison.
 * Lowercases, strips punctuation, and collapses whitespace.
 *
 * @param name - The raw assignment name.
 * @returns The normalized name string.
 */
export function normalizeAssignmentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Compute the Dice coefficient (bigram overlap) between two strings.
 * Returns 1.0 for identical strings, 0.0 for completely different strings.
 *
 * @param text1 - The first string to compare.
 * @param text2 - The second string to compare.
 * @returns A similarity score in the range `[0, 1]`.
 */
export function calculateNameSimilarity(text1: string, text2: string): number {
  const normalizedText1 = normalizeAssignmentName(text1)
  const normalizedText2 = normalizeAssignmentName(text2)

  if (normalizedText1 === normalizedText2) return 1.0
  if (normalizedText1.length < 2 || normalizedText2.length < 2) return 0.0

  const bigramsA = extractBigrams(normalizedText1)
  const bigramsB = extractBigrams(normalizedText2)

  let intersectionCount = 0
  const bigramsBCopy = new Map(bigramsB)

  for (const [bigram, countA] of bigramsA) {
    const countB = bigramsBCopy.get(bigram)

    if (countB !== undefined && countB > 0) {
      const matchCount = Math.min(countA, countB)
      intersectionCount += matchCount
      bigramsBCopy.set(bigram, countB - matchCount)
    }
  }

  const totalBigrams = sumMapValues(bigramsA) + sumMapValues(bigramsB)

  return (2 * intersectionCount) / totalBigrams
}

/**
 * Find assignments that match a source assignment by programming language and name similarity.
 * Filters by exact language match, then by name similarity above the threshold.
 *
 * @param sourceAssignment - The source assignment to match against.
 * @param candidateAssignments - Assignments from other classes to check.
 * @param threshold - Minimum Dice coefficient for name matching (default 0.8).
 * @returns Matched assignments sorted by name similarity descending.
 */
export function findMatchingAssignments(
  sourceAssignment: Assignment,
  candidateAssignments: Assignment[],
  threshold: number = DEFAULT_NAME_SIMILARITY_THRESHOLD,
): MatchedAssignment[] {
  const matchedAssignments: MatchedAssignment[] = []

  for (const candidate of candidateAssignments) {
    if (candidate.id === sourceAssignment.id) continue
    if (candidate.programmingLanguage !== sourceAssignment.programmingLanguage) continue

    const nameSimilarity = calculateNameSimilarity(
      sourceAssignment.assignmentName,
      candidate.assignmentName,
    )

    if (nameSimilarity >= threshold) {
      matchedAssignments.push({ assignment: candidate, nameSimilarity })
    }
  }

  return matchedAssignments.sort(
    (a, b) => b.nameSimilarity - a.nameSimilarity,
  )
}

/**
 * Extract character bigrams from a string into a frequency map.
 *
 * @param text - The input string.
 * @returns A map of bigram → count.
 */
function extractBigrams(text: string): Map<string, number> {
  const bigrams = new Map<string, number>()

  for (let i = 0; i < text.length - 1; i += 1) {
    const bigram = text.substring(i, i + 2)
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1)
  }

  return bigrams
}

/**
 * Sum all values in a number map.
 *
 * @param map - The map to sum values from.
 * @returns The total of all values.
 */
function sumMapValues(map: Map<string, number>): number {
  let total = 0

  for (const value of map.values()) {
    total += value
  }

  return total
}
