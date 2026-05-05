import { createHash } from "node:crypto"
import { injectable } from "tsyringe"
import { z } from "zod"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import {
  createAiFragmentLabelBatchJsonSchema,
  createConfiguredAiFragmentLabelProvider,
  type AiFragmentLabelBatchItem,
  type AiFragmentLabelProvider,
} from "@/modules/plagiarism/ai-fragment-label-provider.js"
import {
  explainMatchedFragment,
  type FragmentCodeSelection,
  type FragmentExplanation,
} from "@/modules/plagiarism/plagiarism-fragment-explanation.js"
import { normalizeFragmentReasonSentence } from "@/modules/plagiarism/fragment-label-text.js"

export interface ExplainMatchFragmentBatchItem {
  fragmentId: number
  leftSelection: FragmentCodeSelection
  rightSelection: FragmentCodeSelection
}

export interface ExplainMatchFragmentsInput {
  leftContent: string
  rightContent: string
  fragments: ExplainMatchFragmentBatchItem[]
  language?: string
}

interface MatchFragmentExplanationServiceOptions {
  enabled?: boolean
  provider?: AiFragmentLabelProvider
  minimumConfidence?: number
  cacheMaxEntries?: number
}

interface MatchFragmentTarget {
  targetId: string
  fragmentId: number
  leftSelection: FragmentCodeSelection
  rightSelection: FragmentCodeSelection
  leftSnippet: string
  rightSnippet: string
  leftContextSnippet: string
  rightContextSnippet: string
  isCommentOnly: boolean
}

const logger = createLogger("MatchFragmentExplanationService")
const DEFAULT_MINIMUM_CONFIDENCE = 0.7
const DEFAULT_CACHE_MAX_ENTRIES = 250
const MATCH_CONTEXT_RADIUS_LINES = 3
const MATCH_EXPLANATION_CATEGORIES = [
  "library_import",
  "identifier_names",
  "control_flow",
  "function_structure",
  "code_structure",
  "comment_text",
] as const
const MATCH_LABEL_SYSTEM_INSTRUCTIONS = [
  "You label matched code fragments for teachers reviewing similarity evidence.",
  "Return neutral evidence only. Do not accuse either student or infer intent.",
  "Describe why the two highlighted fragments look similar based only on visible code.",
  "Be concrete: name exact identifiers, function names, literals, operators, or control structures when they are visible.",
  "Avoid vague role-only wording like 'the accumulator' or 'the dictionary' unless you also name the exact code text.",
  "For renamed identifiers, include compact mappings such as `roman_dict` -> `values`, `total` -> `result`, and `i` -> `index`.",
  "If several details changed, name the most important two to four exact details instead of summarizing generically.",
  "Use a concise label and exactly one simple explanation sentence.",
  "The sentence should be specific, plain-language, and no more than about 35 words.",
  "Do not over-explain; keep the sentence direct and professional.",
] as const

const AiMatchFragmentExplanationSchema = z
  .object({
    category: z.enum(MATCH_EXPLANATION_CATEGORIES),
    label: z.string().trim().min(1).max(80),
    reasons: z.array(z.string().trim().min(1).max(500)).min(1).max(1),
    confidence: z.number().min(0).max(1),
    source: z.literal("ai"),
  })
  .strict()

/**
 * Produces Match View fragment explanations with AI when available and deterministic fallback otherwise.
 */
@injectable()
export class MatchFragmentExplanationService {
  private readonly enabled: boolean
  private readonly provider: AiFragmentLabelProvider | null
  private readonly minimumConfidence: number
  private readonly cacheMaxEntries: number
  private readonly explanationsByPairCacheKey = new Map<
    string,
    Map<number, FragmentExplanation>
  >()

  constructor(options: MatchFragmentExplanationServiceOptions = {}) {
    this.enabled = options.enabled ?? settings.aiFragmentLabelsEnabled
    this.provider = options.provider ?? createConfiguredAiFragmentLabelProvider()
    this.minimumConfidence =
      options.minimumConfidence ?? DEFAULT_MINIMUM_CONFIDENCE
    this.cacheMaxEntries =
      options.cacheMaxEntries ?? DEFAULT_CACHE_MAX_ENTRIES
  }

  /**
   * Explains all Match View fragments for one opened comparison pair.
   *
   * @param input - Full file contents and all matched fragment ranges for the pair.
   * @returns A map keyed by fragment ID with AI labels where valid and fallback labels otherwise.
   */
  async explainMatchFragments(
    input: ExplainMatchFragmentsInput,
  ): Promise<Map<number, FragmentExplanation>> {
    const matchTargets = buildMatchFragmentTargets(input)
    const fallbackExplanations = buildFallbackExplanationMap(input, matchTargets)
    const cacheKey = createMatchExplanationCacheKey(input)

    if (matchTargets.length === 0) {
      return fallbackExplanations
    }

    if (!this.enabled || !this.provider) {
      return fallbackExplanations
    }

    const cachedExplanations = this.explanationsByPairCacheKey.get(cacheKey)

    if (cachedExplanations) {
      return cloneExplanationMap(cachedExplanations)
    }

    const providerTargets = matchTargets.filter((target) => !target.isCommentOnly)

    if (providerTargets.length === 0) {
      this.setCachedExplanations(cacheKey, fallbackExplanations)

      return fallbackExplanations
    }

    try {
      const providerExplanations = await this.provider.generateLabels({
        taskName: "match_view_fragment_labels",
        language: input.language,
        fragments: providerTargets.map((target) => ({
          targetId: target.targetId,
          leftSnippet: target.leftSnippet,
          rightSnippet: target.rightSnippet,
          leftContextSnippet: target.leftContextSnippet,
          rightContextSnippet: target.rightContextSnippet,
        })),
        systemInstructions: [...MATCH_LABEL_SYSTEM_INSTRUCTIONS],
        responseFormatName: "match_fragment_explanations",
        jsonSchema: createAiFragmentLabelBatchJsonSchema({
          categories: MATCH_EXPLANATION_CATEGORIES,
          labelDescription:
            "A short neutral teacher-facing similarity label in title case. Keep it under eight words.",
          reasonDescription:
            "Exactly one simple, professional sentence explaining why the fragments look similar. Name exact identifiers, functions, literals, operators, or control structures when visible. Prefer compact mappings like `oldName` -> `newName` for renamed identifiers. Do not accuse either student or over-explain.",
          includeArrayBounds: true,
        }),
      })
      const mergedExplanations = mergeProviderExplanationsWithFallbacks({
        fallbackExplanations,
        matchTargets,
        providerExplanations,
        minimumConfidence: this.minimumConfidence,
      })

      this.setCachedExplanations(cacheKey, mergedExplanations)

      return cloneExplanationMap(mergedExplanations)
    } catch (error) {
      logger.warn("AI match explanation batch failed; using fallback", {
        error: serializeProviderError(error),
      })
      this.setCachedExplanations(cacheKey, fallbackExplanations)

      return fallbackExplanations
    }
  }

  private setCachedExplanations(
    cacheKey: string,
    explanationsByFragmentId: Map<number, FragmentExplanation>,
  ): void {
    if (this.cacheMaxEntries <= 0) return

    this.explanationsByPairCacheKey.set(
      cacheKey,
      cloneExplanationMap(explanationsByFragmentId),
    )

    while (this.explanationsByPairCacheKey.size > this.cacheMaxEntries) {
      const oldestCacheKey = this.explanationsByPairCacheKey.keys().next().value

      if (!oldestCacheKey) return

      this.explanationsByPairCacheKey.delete(oldestCacheKey)
    }
  }
}

function buildMatchFragmentTargets(
  input: ExplainMatchFragmentsInput,
): MatchFragmentTarget[] {
  return input.fragments.map((fragment) => {
    const leftSnippet = extractSelectedCode(input.leftContent, fragment.leftSelection)
    const rightSnippet = extractSelectedCode(input.rightContent, fragment.rightSelection)

    return {
      targetId: `${fragment.fragmentId}`,
      fragmentId: fragment.fragmentId,
      leftSelection: fragment.leftSelection,
      rightSelection: fragment.rightSelection,
      leftSnippet,
      rightSnippet,
      leftContextSnippet: extractContextSnippet(
        input.leftContent,
        fragment.leftSelection,
        MATCH_CONTEXT_RADIUS_LINES,
      ),
      rightContextSnippet: extractContextSnippet(
        input.rightContent,
        fragment.rightSelection,
        MATCH_CONTEXT_RADIUS_LINES,
      ),
      isCommentOnly: isCommentOnlyTarget(leftSnippet, rightSnippet, input.language),
    }
  })
}

function buildFallbackExplanationMap(
  input: ExplainMatchFragmentsInput,
  matchTargets: MatchFragmentTarget[],
): Map<number, FragmentExplanation> {
  return new Map(
    matchTargets.map((target) => [
      target.fragmentId,
      target.isCommentOnly
        ? buildCommentOnlyMatchExplanation()
        : explainMatchedFragment({
            leftContent: input.leftContent,
            rightContent: input.rightContent,
            leftSelection: target.leftSelection,
            rightSelection: target.rightSelection,
          }),
    ]),
  )
}

function mergeProviderExplanationsWithFallbacks(input: {
  fallbackExplanations: Map<number, FragmentExplanation>
  matchTargets: MatchFragmentTarget[]
  providerExplanations: AiFragmentLabelBatchItem[]
  minimumConfidence: number
}): Map<number, FragmentExplanation> {
  const mergedExplanations = cloneExplanationMap(input.fallbackExplanations)
  const matchTargetByTargetId = new Map(
    input.matchTargets.map((target) => [target.targetId, target]),
  )

  for (const providerExplanation of input.providerExplanations) {
    const matchTarget = matchTargetByTargetId.get(providerExplanation.targetId)

    if (!matchTarget || matchTarget.isCommentOnly) continue

    const parsedExplanation = AiMatchFragmentExplanationSchema.safeParse(
      providerExplanation.explanation,
    )

    if (!parsedExplanation.success) {
      logger.warn("AI match explanation item failed validation", {
        targetId: providerExplanation.targetId,
        issues: parsedExplanation.error.issues,
      })

      continue
    }

    if (parsedExplanation.data.confidence < input.minimumConfidence) {
      logger.warn("AI match explanation below confidence threshold", {
        targetId: providerExplanation.targetId,
        confidence: parsedExplanation.data.confidence,
        minimumConfidence: input.minimumConfidence,
      })

      continue
    }

    mergedExplanations.set(
      matchTarget.fragmentId,
      normalizeMatchFragmentExplanation(parsedExplanation.data),
    )
  }

  return mergedExplanations
}

function normalizeMatchFragmentExplanation(
  explanation: z.infer<typeof AiMatchFragmentExplanationSchema>,
): FragmentExplanation {
  return {
    category: explanation.category,
    label: explanation.label.trim(),
    reasons: [
      normalizeFragmentReasonSentence(explanation.reasons[0], explanation.label),
    ],
  }
}

function buildCommentOnlyMatchExplanation(): FragmentExplanation {
  return {
    category: "comment_text",
    label: "Matched Comment Text",
    reasons: [
      "Both matched fragments are comments; executable code is not matched here.",
    ],
  }
}

function isCommentOnlyTarget(
  leftSnippet: string,
  rightSnippet: string,
  language?: string,
): boolean {
  return (
    isCommentOnlySnippet(leftSnippet, language) &&
    isCommentOnlySnippet(rightSnippet, language)
  )
}

function isCommentOnlySnippet(snippet: string, language?: string): boolean {
  const meaningfulLines = snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (meaningfulLines.length === 0) return false

  return meaningfulLines.every((line) => isCommentOnlyLine(line, language))
}

function isCommentOnlyLine(line: string, language?: string): boolean {
  const normalizedLanguage = language?.toLowerCase()

  if (normalizedLanguage === "python") return line.startsWith("#")

  if (normalizedLanguage === "java" || normalizedLanguage === "c") {
    return (
      line.startsWith("//") ||
      line.startsWith("/*") ||
      line.startsWith("*") ||
      line.endsWith("*/")
    )
  }

  return (
    line.startsWith("//") ||
    line.startsWith("#") ||
    line.startsWith("/*") ||
    line.startsWith("*") ||
    line.endsWith("*/")
  )
}

function extractSelectedCode(
  content: string,
  selection: FragmentCodeSelection,
): string {
  const lines = content.split(/\r?\n/)
  const selectedLines = lines.slice(selection.startRow, selection.endRow + 1)

  if (selectedLines.length === 0) return ""

  const lastSelectedLineIndex = selectedLines.length - 1

  if (selectedLines.length === 1) {
    const selectedLine = selectedLines[0] ?? ""
    const endCol = Number.isFinite(selection.endCol)
      ? selection.endCol
      : selectedLine.length

    return selectedLine.slice(selection.startCol, endCol)
  }

  selectedLines[0] = selectedLines[0]?.slice(selection.startCol) ?? ""

  const endCol = Number.isFinite(selection.endCol)
    ? selection.endCol
    : selectedLines[lastSelectedLineIndex]?.length
  selectedLines[lastSelectedLineIndex] =
    selectedLines[lastSelectedLineIndex]?.slice(0, endCol) ?? ""

  return selectedLines.join("\n")
}

function extractContextSnippet(
  content: string,
  selection: FragmentCodeSelection,
  radiusLines: number,
): string {
  const lines = content.split(/\r?\n/)
  const startRow = Math.max(0, selection.startRow - radiusLines)
  const endRow = Math.min(lines.length - 1, selection.endRow + radiusLines)
  const contextLines: string[] = []

  for (let row = startRow; row <= endRow; row += 1) {
    const marker = row >= selection.startRow && row <= selection.endRow ? ">" : " "
    contextLines.push(`${marker} ${row + 1}: ${lines[row] ?? ""}`)
  }

  return contextLines.join("\n")
}

function createMatchExplanationCacheKey(input: ExplainMatchFragmentsInput): string {
  const cachePayload = {
    language: input.language ?? "unknown",
    leftContent: input.leftContent,
    rightContent: input.rightContent,
    fragments: input.fragments,
  }

  return createHash("sha256")
    .update(JSON.stringify(cachePayload))
    .digest("hex")
}

function cloneExplanationMap(
  explanationsByFragmentId: Map<number, FragmentExplanation>,
): Map<number, FragmentExplanation> {
  return new Map(
    Array.from(explanationsByFragmentId.entries()).map(
      ([fragmentId, explanation]) => [
        fragmentId,
        {
          ...explanation,
          reasons: [...explanation.reasons],
        },
      ],
    ),
  )
}

function serializeProviderError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return { value: error }
}
