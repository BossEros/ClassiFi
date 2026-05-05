import { createHash } from "node:crypto"
import { injectable } from "tsyringe"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import {
  DiffFragmentExplanationSchema,
  type DiffFragmentExplanation,
  type DiffFragmentExplanationTarget,
} from "@/modules/plagiarism/diff-fragment-explanation.schema.js"
import {
  buildFallbackDiffFragmentExplanation,
  type DiffCodeSelection,
} from "@/modules/plagiarism/diff-fragment-explanation-fallback.js"
import { normalizeFragmentReasonSentence } from "@/modules/plagiarism/fragment-label-text.js"
import {
  createAiFragmentLabelBatchJsonSchema,
  createConfiguredAiFragmentLabelProvider,
  type AiFragmentLabelBatchItem,
  type AiFragmentLabelProvider,
} from "@/modules/plagiarism/ai-fragment-label-provider.js"

export {
  parseAiFragmentLabelBatchOutput as parseProviderBatchOutput,
} from "@/modules/plagiarism/ai-fragment-label-provider.js"

export interface ExplainDiffFragmentInput {
  leftContent: string
  rightContent: string
  leftSelection: DiffCodeSelection
  rightSelection: DiffCodeSelection
  language?: string
}

export interface ExplainDiffFragmentBatchItem {
  fragmentId: number
  targetId?: string
  leftSelection: DiffCodeSelection
  rightSelection: DiffCodeSelection
  leftContextSnippet?: string
  rightContextSnippet?: string
  isCommentOnly?: boolean
}

export interface ExplainDiffFragmentsInput {
  leftContent: string
  rightContent: string
  fragments: ExplainDiffFragmentBatchItem[]
  language?: string
}

export interface ExplainDiffFragmentTarget {
  targetId: string
  parentFragmentId: number
  leftSelection: DiffCodeSelection
  rightSelection: DiffCodeSelection
  leftContextSnippet: string
  rightContextSnippet: string
  isCommentOnly: boolean
}

export interface DiffExplanationProvider {
  explainBatch(
    input: ExplainDiffFragmentsInput,
  ): Promise<AiFragmentLabelBatchItem[]>
}

interface DiffFragmentExplanationServiceOptions {
  enabled?: boolean
  provider?: DiffExplanationProvider
  minimumConfidence?: number
  cacheMaxEntries?: number
}

const logger = createLogger("DiffFragmentExplanationService")
const DEFAULT_MINIMUM_CONFIDENCE = 0.7
const DEFAULT_CACHE_MAX_ENTRIES = 250
const DIFF_CONTEXT_RADIUS_LINES = 3
const DIFF_LABEL_SYSTEM_INSTRUCTIONS = [
  "You label code diff fragments for teachers reviewing similarity evidence.",
  "Return neutral evidence only. Do not accuse either student.",
  "Use the surrounding context to distinguish executable-code changes from comments or documentation.",
  "If a target changes only a comment, use category comment_changed.",
  "Be concrete: name exact identifiers, function names, literals, operators, or values when they are visible.",
  "For renames or substitutions, write compact left-to-right mappings such as `roman_dict` -> `values`, `total` -> `result`, and `i` -> `index`.",
  "Avoid vague role-only wording like 'the accumulator', 'the dictionary', or 'the index variable' unless you also name the exact code text.",
  "If several details changed, name the most important two to four exact mappings or values instead of summarizing generically.",
  "Use a concise label and exactly one simple explanation sentence.",
  "The sentence should explain the exact difference in plain language and no more than about 35 words.",
  "Do not over-explain; keep the sentence direct and professional.",
] as const

/**
 * Generates stable, validated explanations for highlighted diff fragments.
 *
 * @remarks The AI provider is injected through a small interface so another
 * provider can replace OpenAI without changing plagiarism service code.
 */
@injectable()
export class DiffFragmentExplanationService {
  private readonly enabled: boolean
  private readonly provider: DiffExplanationProvider | null
  private readonly minimumConfidence: number
  private readonly cacheMaxEntries: number
  private readonly explanationsByPairCacheKey = new Map<
    string,
    DiffFragmentExplanationTarget[]
  >()

  constructor(options: DiffFragmentExplanationServiceOptions = {}) {
    this.enabled = options.enabled ?? settings.aiFragmentLabelsEnabled
    this.provider = options.provider ?? createConfiguredDiffExplanationProvider()
    this.minimumConfidence =
      options.minimumConfidence ?? DEFAULT_MINIMUM_CONFIDENCE
    this.cacheMaxEntries =
      options.cacheMaxEntries ?? DEFAULT_CACHE_MAX_ENTRIES
  }

  /**
   * Explains what changed in a matched fragment pair.
   *
   * @param input - Full file contents, selected fragment ranges, and optional language.
   * @returns A validated AI explanation or a deterministic fallback explanation.
   */
  async explainDiffFragment(
    input: ExplainDiffFragmentInput,
  ): Promise<DiffFragmentExplanation> {
    const explanationTargets = await this.explainDiffFragmentTargets({
      leftContent: input.leftContent,
      rightContent: input.rightContent,
      language: input.language,
      fragments: [
        {
          fragmentId: 0,
          leftSelection: input.leftSelection,
          rightSelection: input.rightSelection,
        },
      ],
    })

    const firstTargetExplanation = explanationTargets[0]?.explanation

    if (!firstTargetExplanation || firstTargetExplanation.source === "fallback") {
      return buildFallbackDiffFragmentExplanation(input)
    }

    return firstTargetExplanation
  }

  /**
   * Explains all matched fragments for one opened comparison pair.
   *
   * @param input - Full file contents and every selected fragment range in the pair.
   * @returns A map keyed by fragment ID with AI explanations where valid and fallbacks otherwise.
   */
  async explainDiffFragments(
    input: ExplainDiffFragmentsInput,
  ): Promise<Map<number, DiffFragmentExplanation>> {
    const fallbackExplanationsByFragmentId = buildFallbackExplanationMap(input)
    const explanationTargets = await this.explainDiffFragmentTargets(input)
    const explanationsByFragmentId = new Map(fallbackExplanationsByFragmentId)

    for (const fragment of input.fragments) {
      const firstFragmentTarget = explanationTargets.find(
        (target) => getParentFragmentIdFromTargetId(target.targetId) === fragment.fragmentId,
      )

      if (firstFragmentTarget) {
        const fragmentFallbackExplanation = fallbackExplanationsByFragmentId.get(
          fragment.fragmentId,
        )
        const fragmentExplanation =
          firstFragmentTarget.explanation.source === "fallback"
            ? fragmentFallbackExplanation
            : firstFragmentTarget.explanation

        if (fragmentExplanation) {
          explanationsByFragmentId.set(fragment.fragmentId, fragmentExplanation)
        }
      }
    }

    return explanationsByFragmentId
  }

  /**
   * Explains smaller changed regions inside all matched fragments for one pair.
   *
   * @param input - Full file contents and every selected fragment range in the pair.
   * @returns Smaller explanation targets with source-code ranges for precise Diff View hover labels.
   */
  async explainDiffFragmentTargets(
    input: ExplainDiffFragmentsInput,
  ): Promise<DiffFragmentExplanationTarget[]> {
    const explanationTargets = buildExplanationTargets(input)
    const fallbackTargets = explanationTargets.map((target) =>
      buildFallbackTarget(input, target),
    )

    if (explanationTargets.length === 0) {
      return fallbackTargets
    }

    if (!this.enabled || !this.provider) {
      return fallbackTargets
    }

    const providerTargets = explanationTargets.filter(
      (target) => !target.isCommentOnly,
    )

    if (providerTargets.length === 0) {
      this.setCachedExplanations(createDiffExplanationCacheKey(input), fallbackTargets)

      return fallbackTargets
    }

    const cacheKey = createDiffExplanationCacheKey(input)
    const cachedExplanations = this.explanationsByPairCacheKey.get(cacheKey)

    if (cachedExplanations) {
      return cloneExplanationTargets(cachedExplanations)
    }

    try {
      const providerExplanations = await this.provider.explainBatch({
        ...input,
        fragments: providerTargets.map((target) => ({
          fragmentId: target.parentFragmentId,
          targetId: target.targetId,
          leftSelection: target.leftSelection,
          rightSelection: target.rightSelection,
          leftContextSnippet: target.leftContextSnippet,
          rightContextSnippet: target.rightContextSnippet,
          isCommentOnly: target.isCommentOnly,
        })),
      })
      const validatedTargets = mergeProviderExplanationsWithFallbackTargets({
        fallbackTargets,
        explanationTargets,
        providerExplanations,
        minimumConfidence: this.minimumConfidence,
      })

      this.setCachedExplanations(cacheKey, validatedTargets)

      return cloneExplanationTargets(validatedTargets)
    } catch (error) {
      logger.warn("AI diff explanation batch failed; using fallback", {
        error: serializeProviderError(error),
      })

      this.setCachedExplanations(cacheKey, fallbackTargets)

      return fallbackTargets
    }
  }

  private setCachedExplanations(
    cacheKey: string,
    explanationTargets: DiffFragmentExplanationTarget[],
  ): void {
    if (this.cacheMaxEntries <= 0) return

    this.explanationsByPairCacheKey.set(
      cacheKey,
      cloneExplanationTargets(explanationTargets),
    )

    while (this.explanationsByPairCacheKey.size > this.cacheMaxEntries) {
      const oldestCacheKey = this.explanationsByPairCacheKey.keys().next().value

      if (!oldestCacheKey) return

      this.explanationsByPairCacheKey.delete(oldestCacheKey)
    }
  }
}

/**
 * Groups precise Diff View explanation targets by their parent match fragment ID.
 *
 * @param targets - Fine-grained explanation targets returned by the explanation service.
 * @returns Targets grouped by parent fragment ID.
 */
export function groupDiffExplanationTargetsByFragmentId(
  targets: DiffFragmentExplanationTarget[],
): Map<number, DiffFragmentExplanationTarget[]> {
  const targetsByFragmentId = new Map<number, DiffFragmentExplanationTarget[]>()

  for (const target of targets) {
    const fragmentId = getParentFragmentIdFromTargetId(target.targetId)

    if (fragmentId === null) continue

    const existingTargets = targetsByFragmentId.get(fragmentId) ?? []
    existingTargets.push(target)
    targetsByFragmentId.set(fragmentId, existingTargets)
  }

  return targetsByFragmentId
}

function createConfiguredDiffExplanationProvider(): DiffExplanationProvider | null {
  const aiProvider = createConfiguredAiFragmentLabelProvider()

  if (!aiProvider) return null

  return new SharedDiffExplanationProvider(aiProvider)
}

class SharedDiffExplanationProvider implements DiffExplanationProvider {
  private readonly provider: AiFragmentLabelProvider

  constructor(provider: AiFragmentLabelProvider) {
    this.provider = provider
  }

  explainBatch(
    input: ExplainDiffFragmentsInput,
  ): Promise<AiFragmentLabelBatchItem[]> {
    return this.provider.generateLabels({
      taskName: "diff_view_fragment_labels",
      language: input.language,
      fragments: buildProviderFragmentPayloads(input),
      systemInstructions: [...DIFF_LABEL_SYSTEM_INSTRUCTIONS],
      responseFormatName: "diff_fragment_explanations",
      jsonSchema: createDiffExplanationBatchJsonSchema({
        includeArrayBounds: true,
      }),
    })
  }
}

function createDiffExplanationBatchJsonSchema(options: {
  includeArrayBounds: boolean
}): Record<string, unknown> {
  return createAiFragmentLabelBatchJsonSchema({
    categories: [
      "identifier_renaming",
      "conditional_logic_changed",
      "loop_logic_changed",
      "output_logic_changed",
      "statement_added",
      "statement_removed",
      "comment_changed",
      "code_changed",
    ],
    labelDescription:
      "A short neutral teacher-facing label in title case. Keep it under eight words.",
    reasonDescription:
      "Exactly one simple, professional sentence explaining the exact left-to-right difference. Name exact identifiers, functions, literals, operators, or values when visible. Prefer compact mappings like `oldName` -> `newName`. Do not accuse either student or over-explain.",
    includeArrayBounds: options.includeArrayBounds,
  })
}

function buildFallbackExplanationMap(
  input: ExplainDiffFragmentsInput,
): Map<number, DiffFragmentExplanation> {
  return new Map(
    input.fragments.map((fragment) => [
      fragment.fragmentId,
      buildFallbackDiffFragmentExplanation({
        leftContent: input.leftContent,
        rightContent: input.rightContent,
        leftSelection: fragment.leftSelection,
        rightSelection: fragment.rightSelection,
      }),
    ]),
  )
}

function buildExplanationTargets(
  input: ExplainDiffFragmentsInput,
): ExplainDiffFragmentTarget[] {
  return input.fragments.flatMap((fragment) => {
    const leftLineSegments = getSelectedLineSegments(
      input.leftContent,
      fragment.leftSelection,
    )
    const rightLineSegments = getSelectedLineSegments(
      input.rightContent,
      fragment.rightSelection,
    )
    const targetCount = Math.max(leftLineSegments.length, rightLineSegments.length)
    const targets: ExplainDiffFragmentTarget[] = []

    for (let targetIndex = 0; targetIndex < targetCount; targetIndex += 1) {
      const leftLineSegment = leftLineSegments[targetIndex]
      const rightLineSegment = rightLineSegments[targetIndex]
      const leftText = leftLineSegment?.text ?? ""
      const rightText = rightLineSegment?.text ?? ""

      if (leftText.trim() === rightText.trim()) continue

      const changedRange = getChangedColumnRange(leftText, rightText)
      const leftSelection = createLineTargetSelection(
        leftLineSegment,
        changedRange.leftStart,
        changedRange.leftEnd,
      )
      const rightSelection = createLineTargetSelection(
        rightLineSegment,
        changedRange.rightStart,
        changedRange.rightEnd,
      )

      if (!leftSelection || !rightSelection) continue

      targets.push({
        targetId: `${fragment.fragmentId}:${targetIndex}`,
        parentFragmentId: fragment.fragmentId,
        leftSelection,
        rightSelection,
        leftContextSnippet: extractContextSnippet(
          input.leftContent,
          leftSelection,
          DIFF_CONTEXT_RADIUS_LINES,
        ),
        rightContextSnippet: extractContextSnippet(
          input.rightContent,
          rightSelection,
          DIFF_CONTEXT_RADIUS_LINES,
        ),
        isCommentOnly: isCommentOnlyTarget(
          leftLineSegment?.text ?? "",
          rightLineSegment?.text ?? "",
          input.language,
        ),
      })
    }

    return targets
  })
}

function buildFallbackTarget(
  input: ExplainDiffFragmentsInput,
  target: ExplainDiffFragmentTarget,
): DiffFragmentExplanationTarget {
  if (target.isCommentOnly) {
    return {
      targetId: target.targetId,
      leftSelection: target.leftSelection,
      rightSelection: target.rightSelection,
      explanation: {
        category: "comment_changed",
        label: "Comment Text Changed",
        reasons: [
          "Only comment text changes in this highlighted region; executable code is unchanged here.",
        ],
        confidence: 0.85,
        source: "fallback",
      },
    }
  }

  return {
    targetId: target.targetId,
    leftSelection: target.leftSelection,
    rightSelection: target.rightSelection,
    explanation: buildFallbackDiffFragmentExplanation({
      leftContent: input.leftContent,
      rightContent: input.rightContent,
      leftSelection: target.leftSelection,
      rightSelection: target.rightSelection,
    }),
  }
}

function mergeProviderExplanationsWithFallbackTargets(input: {
  fallbackTargets: DiffFragmentExplanationTarget[]
  explanationTargets: ExplainDiffFragmentTarget[]
  providerExplanations: AiFragmentLabelBatchItem[]
  minimumConfidence: number
}): DiffFragmentExplanationTarget[] {
  const explanationTargetByTargetId = new Map(
    input.explanationTargets.map((target) => [target.targetId, target]),
  )
  const providerExplanationByTargetId = new Map(
    input.providerExplanations.map((providerExplanation) => [
      providerExplanation.targetId,
      providerExplanation,
    ]),
  )

  return input.fallbackTargets.map((fallbackTarget) => {
    const providerExplanation = providerExplanationByTargetId.get(
      fallbackTarget.targetId,
    )

    if (!providerExplanation) return fallbackTarget

    if (!explanationTargetByTargetId.has(providerExplanation.targetId)) {
      logger.warn("AI diff explanation returned unknown target ID", {
        targetId: providerExplanation.targetId,
      })

      return fallbackTarget
    }

    const parsedExplanation = DiffFragmentExplanationSchema.safeParse(
      providerExplanation.explanation,
    )

    if (!parsedExplanation.success) {
      logger.warn("AI diff explanation item failed validation", {
        targetId: providerExplanation.targetId,
        issues: parsedExplanation.error.issues,
      })

      return fallbackTarget
    }

    if (parsedExplanation.data.confidence < input.minimumConfidence) {
      logger.warn("AI diff explanation below confidence threshold", {
        targetId: providerExplanation.targetId,
        confidence: parsedExplanation.data.confidence,
        minimumConfidence: input.minimumConfidence,
      })

      return fallbackTarget
    }

    return {
      ...fallbackTarget,
      explanation: normalizeDiffFragmentExplanation(parsedExplanation.data),
    }
  })
}

function normalizeDiffFragmentExplanation(
  explanation: DiffFragmentExplanation,
): DiffFragmentExplanation {
  return {
    ...explanation,
    label: explanation.label.trim(),
    reasons: [
      normalizeFragmentReasonSentence(explanation.reasons[0], explanation.label),
    ],
  }
}

interface SelectedLineSegment {
  row: number
  startCol: number
  endCol: number
  text: string
}

function getSelectedLineSegments(
  content: string,
  selection: DiffCodeSelection,
): SelectedLineSegment[] {
  const lines = content.split(/\r?\n/)
  const segments: SelectedLineSegment[] = []

  for (let row = selection.startRow; row <= selection.endRow; row += 1) {
    const line = lines[row] ?? ""
    const startCol = row === selection.startRow ? selection.startCol : 0
    const endCol = row === selection.endRow ? selection.endCol : line.length

    segments.push({
      row,
      startCol,
      endCol,
      text: line.slice(startCol, endCol),
    })
  }

  return segments
}

function getChangedColumnRange(
  leftText: string,
  rightText: string,
): {
  leftStart: number
  leftEnd: number
  rightStart: number
  rightEnd: number
} {
  let sharedPrefixLength = 0
  const shortestLength = Math.min(leftText.length, rightText.length)

  while (
    sharedPrefixLength < shortestLength &&
    leftText[sharedPrefixLength] === rightText[sharedPrefixLength]
  ) {
    sharedPrefixLength += 1
  }

  let sharedSuffixLength = 0

  while (
    sharedSuffixLength < shortestLength - sharedPrefixLength &&
    leftText[leftText.length - 1 - sharedSuffixLength] ===
      rightText[rightText.length - 1 - sharedSuffixLength]
  ) {
    sharedSuffixLength += 1
  }

  return {
    leftStart: sharedPrefixLength,
    leftEnd: Math.max(sharedPrefixLength, leftText.length - sharedSuffixLength),
    rightStart: sharedPrefixLength,
    rightEnd: Math.max(sharedPrefixLength, rightText.length - sharedSuffixLength),
  }
}

function createLineTargetSelection(
  segment: SelectedLineSegment | undefined,
  relativeStartCol: number,
  relativeEndCol: number,
): DiffCodeSelection | null {
  if (!segment) return null

  const startCol = segment.startCol + relativeStartCol
  const endCol = segment.startCol + Math.max(relativeEndCol, relativeStartCol + 1)

  return {
    startRow: segment.row,
    startCol,
    endRow: segment.row,
    endCol: Math.min(endCol, segment.endCol),
  }
}

function isCommentOnlyTarget(
  leftLineSegmentText: string,
  rightLineSegmentText: string,
  language?: string,
): boolean {
  return (
    isCommentOnlyLineSegment(leftLineSegmentText, language) &&
    isCommentOnlyLineSegment(rightLineSegmentText, language)
  )
}

function isCommentOnlyLineSegment(
  lineSegmentText: string,
  language?: string,
): boolean {
  const trimmedLineSegment = lineSegmentText.trim()

  if (!trimmedLineSegment) return false

  const normalizedLanguage = language?.toLowerCase()

  if (normalizedLanguage === "python") {
    return trimmedLineSegment.startsWith("#")
  }

  if (normalizedLanguage === "java" || normalizedLanguage === "c") {
    return (
      trimmedLineSegment.startsWith("//") ||
      trimmedLineSegment.startsWith("/*") ||
      trimmedLineSegment.startsWith("*") ||
      trimmedLineSegment.endsWith("*/")
    )
  }

  return (
    trimmedLineSegment.startsWith("//") ||
    trimmedLineSegment.startsWith("#") ||
    trimmedLineSegment.startsWith("/*") ||
    trimmedLineSegment.startsWith("*") ||
    trimmedLineSegment.endsWith("*/")
  )
}

function extractContextSnippet(
  content: string,
  selection: DiffCodeSelection,
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

function createDiffExplanationCacheKey(input: ExplainDiffFragmentsInput): string {
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

function cloneExplanationTargets(
  explanationTargets: DiffFragmentExplanationTarget[],
): DiffFragmentExplanationTarget[] {
  return explanationTargets.map((target) => ({
    ...target,
    leftSelection: { ...target.leftSelection },
    rightSelection: { ...target.rightSelection },
    explanation: {
      ...target.explanation,
      reasons: [...target.explanation.reasons],
    },
  }))
}

function getParentFragmentIdFromTargetId(targetId: string): number | null {
  const [rawFragmentId] = targetId.split(":")
  const fragmentId = Number(rawFragmentId)

  return Number.isFinite(fragmentId) ? fragmentId : null
}

function buildProviderFragmentPayloads(input: ExplainDiffFragmentsInput): Array<{
  targetId: string
  leftSnippet: string
  rightSnippet: string
  leftContextSnippet: string
  rightContextSnippet: string
}> {
  return input.fragments.map((fragment, index) => ({
    targetId: fragment.targetId ?? `${fragment.fragmentId}:${index}`,
    leftSnippet: extractSelectedCode(input.leftContent, fragment.leftSelection),
    rightSnippet: extractSelectedCode(input.rightContent, fragment.rightSelection),
    leftContextSnippet:
      fragment.leftContextSnippet ??
      extractContextSnippet(
        input.leftContent,
        fragment.leftSelection,
        DIFF_CONTEXT_RADIUS_LINES,
      ),
    rightContextSnippet:
      fragment.rightContextSnippet ??
      extractContextSnippet(
        input.rightContent,
        fragment.rightSelection,
        DIFF_CONTEXT_RADIUS_LINES,
      ),
  }))
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

function extractSelectedCode(content: string, selection: DiffCodeSelection): string {
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
