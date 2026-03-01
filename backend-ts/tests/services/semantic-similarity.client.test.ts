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
})
