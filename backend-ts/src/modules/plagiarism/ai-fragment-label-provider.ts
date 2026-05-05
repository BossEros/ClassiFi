import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

export interface AiFragmentLabelPayload {
  targetId: string
  leftSnippet: string
  rightSnippet: string
  leftContextSnippet: string
  rightContextSnippet: string
}

export interface AiFragmentLabelBatchInput {
  taskName: string
  language?: string
  fragments: AiFragmentLabelPayload[]
  systemInstructions: string[]
  responseFormatName: string
  jsonSchema: Record<string, unknown>
}

export interface AiFragmentLabelBatchItem {
  targetId: string
  explanation: unknown
}

export interface AiFragmentLabelProvider {
  generateLabels(
    input: AiFragmentLabelBatchInput,
  ): Promise<AiFragmentLabelBatchItem[]>
}

interface OpenAiStructuredOutputResponse {
  output_parsed?: unknown
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
      refusal?: string
    }>
  }>
}

interface AnthropicMessagesResponse {
  stop_reason?: string
  content?: Array<{
    type?: string
    text?: string
  }>
}

const logger = createLogger("AiFragmentLabelProvider")
const ANTHROPIC_FRAGMENT_LABEL_MAX_OUTPUT_TOKENS = 4096
const PROVIDER_FRAGMENT_ARRAY_KEYS = [
  "fragments",
  "explanations",
  "targets",
  "labels",
  "results",
  "items",
] as const
const PROVIDER_NESTED_WRAPPER_KEYS = [
  "output",
  "data",
  "diff_fragment_explanations",
  "match_fragment_explanations",
] as const

class OpenAiFragmentLabelProvider implements AiFragmentLabelProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(apiKey: string, model: string, timeoutMs: number) {
    this.apiKey = apiKey
    this.model = model
    this.timeoutMs = timeoutMs
  }

  async generateLabels(
    input: AiFragmentLabelBatchInput,
  ): Promise<AiFragmentLabelBatchItem[]> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content: input.systemInstructions.join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              task: input.taskName,
              language: input.language ?? "unknown",
              fragments: input.fragments,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: input.responseFormatName,
            strict: true,
            schema: input.jsonSchema,
          },
        },
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error(
        `OpenAI fragment label request failed with ${response.status}`,
      )
    }

    const payload = (await response.json()) as OpenAiStructuredOutputResponse
    const parsedOutput = parseOpenAiStructuredOutput(payload)

    return parseAiFragmentLabelBatchOutput(parsedOutput)
  }
}

class AnthropicFragmentLabelProvider implements AiFragmentLabelProvider {
  private readonly apiKey: string
  private readonly model: string
  private readonly timeoutMs: number

  constructor(apiKey: string, model: string, timeoutMs: number) {
    this.apiKey = apiKey
    this.model = model
    this.timeoutMs = timeoutMs
  }

  async generateLabels(
    input: AiFragmentLabelBatchInput,
  ): Promise<AiFragmentLabelBatchItem[]> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: ANTHROPIC_FRAGMENT_LABEL_MAX_OUTPUT_TOKENS,
        system: [
          ...input.systemInstructions,
          "Return only valid JSON that matches the requested schema.",
          "Do not wrap the JSON in Markdown unless necessary.",
        ].join(" "),
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              task: input.taskName,
              language: input.language ?? "unknown",
              fragments: input.fragments,
              responseSchema: input.jsonSchema,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    })

    if (!response.ok) {
      throw new Error(
        `Anthropic fragment label request failed with ${response.status}: ${await response.text()}`,
      )
    }

    const payload = (await response.json()) as AnthropicMessagesResponse
    const parsedOutput = parseAnthropicTextOutput(payload)

    return parseAiFragmentLabelBatchOutput(parsedOutput)
  }
}

/**
 * Builds the configured AI fragment label provider from environment settings.
 *
 * @returns The configured provider, or null when required credentials are missing.
 */
export function createConfiguredAiFragmentLabelProvider(): AiFragmentLabelProvider | null {
  switch (settings.aiFragmentLabelsProvider) {
    case "anthropic":
      if (!settings.anthropicApiKey) {
        if (settings.aiFragmentLabelsEnabled) {
          logger.warn("AI fragment labels enabled without ANTHROPIC_API_KEY")
        }

        return null
      }

      return new AnthropicFragmentLabelProvider(
        settings.anthropicApiKey,
        settings.aiFragmentLabelsModel,
        settings.aiFragmentLabelsTimeoutMs,
      )
    case "openai":
      if (!settings.openAiApiKey) {
        if (settings.aiFragmentLabelsEnabled) {
          logger.warn("AI fragment labels enabled without OPENAI_API_KEY")
        }

        return null
      }

      return new OpenAiFragmentLabelProvider(
        settings.openAiApiKey,
        settings.aiFragmentLabelsModel,
        settings.aiFragmentLabelsTimeoutMs,
      )
  }
}

/**
 * Creates the shared JSON schema requested from AI providers for fragment labels.
 *
 * @param input - Category and field descriptions for the label task.
 * @returns A JSON schema object accepted by provider-specific structured output APIs.
 */
export function createAiFragmentLabelBatchJsonSchema(input: {
  categories: readonly string[]
  labelDescription: string
  reasonDescription: string
  includeArrayBounds: boolean
}): Record<string, unknown> {
  return {
    type: "object",
    description:
      "Container for all fragment labels. Place every label inside fragments.",
    additionalProperties: false,
    required: ["fragments"],
    properties: {
      fragments: {
        type: "array",
        description:
          "One label per requested target. Use the exact targetId values from the request.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["targetId", "category", "label", "reasons", "confidence"],
          properties: {
            targetId: {
              type: "string",
              description:
                "The exact targetId from the corresponding request fragment.",
            },
            category: {
              type: "string",
              description: "The most specific neutral category for this target.",
              enum: input.categories,
            },
            label: {
              type: "string",
              description: input.labelDescription,
            },
            reasons: {
              type: "array",
              description: input.reasonDescription,
              items: { type: "string" },
              ...(input.includeArrayBounds
                ? {
                    minItems: 1,
                    maxItems: 1,
                  }
                : {}),
            },
            confidence: {
              type: "number",
              description: "Confidence from 0 to 1.",
            },
          },
        },
      },
    },
  }
}

/**
 * Parses provider output into normalized fragment label items.
 *
 * @param payload - Provider output as parsed JSON, direct arrays, wrappers, or JSON text.
 * @returns Normalized label items keyed by target ID.
 */
export function parseAiFragmentLabelBatchOutput(
  payload: unknown,
): AiFragmentLabelBatchItem[] {
  const parsedPayload =
    typeof payload === "string" ? tryParseJsonText(payload) : payload

  if (!parsedPayload) {
    throw new Error("AI structured output did not contain valid JSON")
  }

  const rawFragments = extractProviderFragmentPayloads(parsedPayload)

  return rawFragments.map((rawFragment) => {
    const fragmentPayload = coerceObjectPayload(rawFragment)
    const targetId = fragmentPayload.targetId

    if (typeof targetId !== "string") {
      throw new Error("AI structured output included a fragment without targetId")
    }

    const { targetId: _targetId, ...rawExplanation } = fragmentPayload

    return { targetId, explanation: { ...rawExplanation, source: "ai" } }
  })
}

function extractProviderFragmentPayloads(payload: unknown): unknown[] {
  return extractProviderFragmentPayloadsFromPayload(payload, 0)
}

function extractProviderFragmentPayloadsFromPayload(
  payload: unknown,
  depth: number,
): unknown[] {
  if (Array.isArray(payload)) return payload

  const objectPayload = coerceObjectPayload(payload)

  for (const arrayKey of PROVIDER_FRAGMENT_ARRAY_KEYS) {
    const maybeFragmentPayloads = objectPayload[arrayKey]

    if (Array.isArray(maybeFragmentPayloads)) return maybeFragmentPayloads
  }

  if (typeof objectPayload.targetId === "string") return [objectPayload]

  if (depth < 2) {
    for (const wrapperKey of PROVIDER_NESTED_WRAPPER_KEYS) {
      const nestedPayload = objectPayload[wrapperKey]

      if (typeof nestedPayload === "object" && nestedPayload !== null) {
        return extractProviderFragmentPayloadsFromPayload(nestedPayload, depth + 1)
      }
    }

    const nestedObjectValues = Object.values(objectPayload).filter(
      (value): value is Record<string, unknown> =>
        typeof value === "object" && value !== null && !Array.isArray(value),
    )

    if (nestedObjectValues.length === 1) {
      return extractProviderFragmentPayloadsFromPayload(
        nestedObjectValues[0],
        depth + 1,
      )
    }
  }

  throw new Error(
    `AI structured output did not include a fragments array. Available keys: ${Object.keys(
      objectPayload,
    ).join(", ") || "none"}`,
  )
}

function parseOpenAiStructuredOutput(
  payload: OpenAiStructuredOutputResponse,
): unknown {
  if (payload.output_parsed) return payload.output_parsed

  if (payload.output_text) {
    return JSON.parse(payload.output_text)
  }

  for (const outputItem of payload.output ?? []) {
    for (const contentItem of outputItem.content ?? []) {
      if (contentItem.refusal) {
        throw new Error("OpenAI refused to generate fragment labels")
      }

      if (contentItem.type === "output_text" && contentItem.text) {
        return JSON.parse(contentItem.text)
      }
    }
  }

  throw new Error("OpenAI response did not contain structured output")
}

function parseAnthropicTextOutput(payload: AnthropicMessagesResponse): unknown {
  for (const contentBlock of payload.content ?? []) {
    if (contentBlock.type !== "text" || !contentBlock.text) continue

    const parsedTextPayload = tryParseJsonText(contentBlock.text)

    if (parsedTextPayload) return parsedTextPayload
  }

  throw new Error(
    `Anthropic response did not contain JSON text output. stop_reason=${
      payload.stop_reason ?? "unknown"
    }`,
  )
}

function tryParseJsonText(text: string): unknown | null {
  const trimmedText = text.trim()

  if (!trimmedText) return null

  try {
    return JSON.parse(trimmedText)
  } catch {
    const fencedJsonMatch = trimmedText.match(/```(?:json)?\s*([\s\S]*?)```/i)

    if (!fencedJsonMatch?.[1]) return null

    try {
      return JSON.parse(fencedJsonMatch[1].trim())
    } catch {
      return null
    }
  }
}

function coerceObjectPayload(payload: unknown): Record<string, unknown> {
  if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
    return payload as Record<string, unknown>
  }

  throw new Error("AI structured output was not an object")
}
