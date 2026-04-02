import { beforeEach, describe, expect, it, vi } from "vitest"

const mockWarn = vi.fn()

vi.mock("../../src/shared/config.js", () => ({
  settings: {
    semanticServiceUrl: "http://semantic-service.test",
    semanticSimilarityTimeoutMs: 5000,
    semanticSimilarityMaxRetries: 1,
  },
}))

vi.mock("../../src/shared/logger.js", () => ({
  createLogger: () => ({
    warn: mockWarn,
  }),
}))

describe("SemanticSimilarityClient", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("returns semantic score from a successful service response", async () => {
    const { SemanticSimilarityClient } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ score: "0.77" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new SemanticSimilarityClient()
    const score = await client.getSemanticScore("code-1", "code-2")

    expect(score).toBe(0.77)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries transient HTTP failures before succeeding", async () => {
    const { SemanticSimilarityClient } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    fetchMock
      .mockResolvedValueOnce(new Response("temporary error", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ score: 0.66 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

    const client = new SemanticSimilarityClient()
    const score = await client.getSemanticScore("code-1", "code-2")

    expect(score).toBe(0.66)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("returns 0 when retries are exhausted", async () => {
    const { SemanticSimilarityClient } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    fetchMock.mockRejectedValue(new Error("timeout"))

    const client = new SemanticSimilarityClient()
    const score = await client.getSemanticScore("code-1", "code-2")

    expect(score).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(mockWarn).toHaveBeenCalled()
  })

  it("returns embedding vector from a successful /embed response", async () => {
    const { SemanticSimilarityClient } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    const mockEmbedding = Array(768).fill(0).map((_, i) => i * 0.001)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ embedding: mockEmbedding }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const client = new SemanticSimilarityClient()
    const embedding = await client.getEmbedding("some code")

    expect(embedding).toEqual(mockEmbedding)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns null when /embed fails after retries", async () => {
    const { SemanticSimilarityClient } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    fetchMock.mockRejectedValue(new Error("timeout"))

    const client = new SemanticSimilarityClient()
    const embedding = await client.getEmbedding("some code")

    expect(embedding).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", async () => {
    const { cosineSimilarity } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    const vec = [1, 2, 3, 4, 5]

    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0)
  })

  it("returns 0 for orthogonal vectors", async () => {
    const { cosineSimilarity } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    const vecA = [1, 0, 0]
    const vecB = [0, 1, 0]

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0)
  })

  it("returns -1 for opposite vectors", async () => {
    const { cosineSimilarity } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    const vecA = [1, 2, 3]
    const vecB = [-1, -2, -3]

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1.0)
  })

  it("returns 0 when either vector has zero magnitude", async () => {
    const { cosineSimilarity } = await import(
      "../../src/modules/plagiarism/semantic-similarity.client.js"
    )
    const vecA = [0, 0, 0]
    const vecB = [1, 2, 3]

    expect(cosineSimilarity(vecA, vecB)).toBe(0)
  })
})
