import { injectable } from "tsyringe"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

/** Response shape from the semantic similarity microservice */
interface SemanticSimilarityResponse {
  score?: number | string | null
}

const logger = createLogger("SemanticSimilarityClient")

/**
 * HTTP client for the semantic similarity microservice.
 *
 * Wraps the GraphCodeBERT inference endpoint exposed via FastAPI.
 * Designed to be resilient - any network or inference failure returns 0
 * so the plagiarism pipeline is never blocked by semantic scoring.
 */
@injectable()
export class SemanticSimilarityClient {
  private readonly serviceUrl: string
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor() {
    this.serviceUrl = settings.semanticServiceUrl
    this.timeoutMs = settings.semanticSimilarityTimeoutMs
    this.maxRetries = settings.semanticSimilarityMaxRetries
  }

  /**
   * Request a semantic similarity score for two code snippets.
   *
   * Returns a value in [0.0, 1.0] representing how semantically similar
   * the two submissions are. Falls back to 0 on timeout/service errors.
   */
  async getSemanticScore(code1: string, code2: string): Promise<number> {
    let lastError: unknown = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.serviceUrl}/similarity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code1, code2 }),
          signal: AbortSignal.timeout(this.timeoutMs),
        })

        if (!response.ok) {
          if (this.shouldRetryStatus(response.status) && attempt < this.maxRetries) {
            continue
          }

          logger.warn("Semantic service returned non-OK status", {
            status: response.status,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
          })
          return 0
        }

        const data = (await response.json()) as SemanticSimilarityResponse
        const parsedScore =
          typeof data?.score === "string"
            ? Number.parseFloat(data.score)
            : Number(data?.score)

        if (!Number.isFinite(parsedScore)) {
          logger.warn("Semantic service returned invalid score payload", {
            data,
          })
          return 0
        }

        return Math.min(1, Math.max(0, parsedScore))
      } catch (error) {
        lastError = error

        if (attempt < this.maxRetries) {
          continue
        }
      }
    }

    logger.warn("Semantic service unavailable; using semanticScore=0 fallback", {
      error: lastError,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
    })

    return 0
  }

  /** Verify the semantic service is reachable. */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      return response.ok
    } catch {
      return false
    }
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
  }
}
