import { injectable } from "tsyringe"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

/** Response shape from the semantic similarity microservice */
interface SemanticSimilarityResponse {
  score?: number | string | null
}

/** Response shape from the /embed endpoint */
interface SemanticEmbedResponse {
  embedding?: number[] | null
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

  /**
   * Request the CLS embedding vector for a single code snippet.
   *
   * Returns a 768-dimensional vector, or null on failure.
   * Clients can cache embeddings per-submission and compute pairwise
   * cosine similarity locally, reducing model calls from O(n²) to O(n).
   */
  async getEmbedding(code: string): Promise<number[] | null> {
    let lastError: unknown = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.serviceUrl}/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          signal: AbortSignal.timeout(this.timeoutMs),
        })

        if (!response.ok) {
          if (this.shouldRetryStatus(response.status) && attempt < this.maxRetries) {
            continue
          }

          logger.warn("Semantic service /embed returned non-OK status", {
            status: response.status,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
          })

          return null
        }

        const data = (await response.json()) as SemanticEmbedResponse

        if (!Array.isArray(data?.embedding) || data.embedding.length === 0) {
          logger.warn("Semantic service returned invalid embedding payload", { data })

          return null
        }

        return data.embedding
      } catch (error) {
        lastError = error

        if (attempt < this.maxRetries) {
          continue
        }
      }
    }

    logger.warn("Semantic service /embed unavailable; returning null", {
      error: lastError,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
    })

    return null
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
  }
}

/**
 * Compute cosine similarity between two vectors.
 *
 * @returns A value in [-1, 1], or 0 if either vector has zero magnitude.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    magnitudeA += vecA[i] * vecA[i]
    magnitudeB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)

  if (denominator === 0) return 0

  return dotProduct / denominator
}
