import { injectable } from "tsyringe"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

/** Response shape from the semantic similarity microservice */
interface SemanticSimilarityResponse {
  score?: number | string | null
}

const logger = createLogger("SemanticSimilarityClient")

/**
 * HTTP client for the Python semantic similarity microservice.
 *
 * Wraps the GraphCodeBERT inference endpoint exposed via FastAPI.
 * Designed to be resilient — any network or inference failure returns 0
 * so the plagiarism pipeline is never blocked by semantic scoring.
 */
@injectable()
export class SemanticSimilarityClient {
  private readonly serviceUrl: string
  private static readonly TIMEOUT_MS = 3_000

  constructor() {
    this.serviceUrl = settings.semanticServiceUrl
  }

  /**
   * Request a semantic similarity score for two Python code snippets.
   *
   * Returns a value in [0.0, 1.0] representing the model's confidence that
   * the two submissions are semantically similar.  Falls back to 0 on any
   * error (timeout, service unavailable, unexpected response).
   */
  async getSemanticScore(code1: string, code2: string): Promise<number> {
    try {
      const response = await fetch(`${this.serviceUrl}/similarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code1, code2 }),
        signal: AbortSignal.timeout(SemanticSimilarityClient.TIMEOUT_MS),
      })

      if (!response.ok) {
        logger.warn("Semantic service returned non-OK status", {
          status: response.status,
        })
        return 0
      }

      const data = (await response.json()) as SemanticSimilarityResponse
      const parsedScore =
        typeof data?.score === "string"
          ? Number.parseFloat(data.score)
          : Number(data?.score)

      if (!Number.isFinite(parsedScore)) {
        return 0
      }

      return Math.min(1, Math.max(0, parsedScore))
    } catch (error) {
      logger.warn(
        "Semantic service unavailable — falling back to semanticScore 0",
        { error },
      )
      return 0
    }
  }

  /** Verify the semantic service is reachable. */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        signal: AbortSignal.timeout(SemanticSimilarityClient.TIMEOUT_MS),
      })

      return response.ok
    } catch {
      return false
    }
  }
}
