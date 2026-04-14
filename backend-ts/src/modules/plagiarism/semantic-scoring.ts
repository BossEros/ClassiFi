import { cosineSimilarity } from "@/modules/plagiarism/semantic-similarity.client.js"

export interface SemanticEmbeddingClient {
  getEmbedding(code: string, language?: string): Promise<number[] | null>
}

export interface SemanticScorePairEntry {
  pairKey: string
  leftSubmissionId: string
  rightSubmissionId: string
}

export interface ComputeSemanticScoresFromEmbeddingsOptions {
  embeddingClient: SemanticEmbeddingClient
  maxConcurrentRequests: number
  pairEntries: SemanticScorePairEntry[]
  submissionContentById: Map<string, string>
  language?: string
}

/**
 * Computes semantic similarity scores for prepared submission pairs.
 *
 * Step 1: Build embeddings for each unique submission only once.
 * Step 2: Compare the matching embeddings for each pair.
 * Step 3: Return the final rounded score for each pair key.
 *
 * @param options - The semantic scoring inputs.
 * @returns A map of pair keys to rounded semantic similarity scores.
 */
export async function computeSemanticScoresFromEmbeddings({
  embeddingClient,
  maxConcurrentRequests,
  pairEntries,
  submissionContentById,
  language,
}: ComputeSemanticScoresFromEmbeddingsOptions): Promise<Map<string, number>> {
  const semanticScores = new Map<string, number>()

  // Step 1: Stop early when there is nothing to score.
  if (pairEntries.length === 0 || submissionContentById.size === 0) {
    return semanticScores
  }

  // Step 2: Generate and cache one embedding per submission.
  const embeddingBySubmissionId = await buildEmbeddingCache({
    embeddingClient,
    maxConcurrentRequests,
    submissionContentById,
    language,
  })

  // Step 3: Compute one semantic score for each prepared pair.
  for (const pairEntry of pairEntries) {
    const leftEmbedding = embeddingBySubmissionId.get(
      pairEntry.leftSubmissionId,
    )
    const rightEmbedding = embeddingBySubmissionId.get(
      pairEntry.rightSubmissionId,
    )

    semanticScores.set(
      pairEntry.pairKey,
      computeRoundedSemanticScore(leftEmbedding, rightEmbedding),
    )
  }

  return semanticScores
}

interface BuildEmbeddingCacheOptions {
  embeddingClient: SemanticEmbeddingClient
  maxConcurrentRequests: number
  submissionContentById: Map<string, string>
  language?: string
}

async function buildEmbeddingCache({
  embeddingClient,
  maxConcurrentRequests,
  submissionContentById,
  language,
}: BuildEmbeddingCacheOptions): Promise<Map<string, number[]>> {
  // Step 1: Prepare the cache and list of submissions to embed.
  const embeddingBySubmissionId = new Map<string, number[]>()
  const submissionIds = Array.from(submissionContentById.keys())
  const workerCount = Math.min(
    Math.max(1, maxConcurrentRequests),
    submissionIds.length,
  )
  let nextSubmissionIndex = 0

  // Step 2: Use a small worker pool so embedding requests stay bounded.
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextSubmissionIndex < submissionIds.length) {
        const currentSubmissionIndex = nextSubmissionIndex
        nextSubmissionIndex += 1

        const submissionId = submissionIds[currentSubmissionIndex]
        const submissionContent = submissionContentById.get(submissionId)

        // Step 2a: Skip entries that somehow have no content.
        if (!submissionContent) {
          continue
        }

        // Step 2b: Request the embedding and save it in the cache.
        const embedding = await embeddingClient.getEmbedding(submissionContent, language)

        if (embedding) {
          embeddingBySubmissionId.set(submissionId, embedding)
        }
      }
    }),
  )

  return embeddingBySubmissionId
}

function computeRoundedSemanticScore(
  leftEmbedding: number[] | undefined,
  rightEmbedding: number[] | undefined,
): number {
  // Step 1: If either embedding is missing, this pair gets a zero score.
  if (!leftEmbedding || !rightEmbedding) {
    return 0
  }

  // Step 2: Compute cosine similarity between the two embeddings.
  const similarity = cosineSimilarity(leftEmbedding, rightEmbedding)

  // Step 3: Keep the score inside the valid 0 to 1 range.
  const clampedSimilarity = Math.min(1, Math.max(0, similarity))

  // Step 4: Round the value so scores stay consistent.
  return Math.round(clampedSimilarity * 10000) / 10000
}
