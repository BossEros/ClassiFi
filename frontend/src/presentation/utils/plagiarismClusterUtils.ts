import type {
  FileResponse,
  PairResponse,
} from "@/data/api/plagiarism.types"

/**
 * A submission included in a similarity cluster.
 */
export interface SimilarityClusterMember {
  submissionId: number
  studentName: string
  filename: string
  lineCount: number
  displayName: string
}

/**
 * A connected cluster of similar submissions derived from pairwise results.
 */
export interface SimilarityCluster {
  clusterId: number
  members: SimilarityClusterMember[]
  pairs: PairResponse[]
  submissionCount: number
  pairCount: number
  averageSimilarity: number
  maxSimilarity: number
}

/**
 * Normalizes a similarity score to a 0-1 ratio.
 * Supports both fractional and percentage-style values.
 *
 * @param similarity - The similarity value to normalize.
 * @returns A ratio between 0 and 1.
 */
export function normalizeSimilarityToRatio(similarity: number): number {
  if (!Number.isFinite(similarity) || similarity <= 0) {
    return 0
  }

  return similarity > 1 ? similarity / 100 : similarity
}

/**
 * Gets the overall similarity ratio for a pair.
 * Prefers the hybrid score when present and falls back to the structural score.
 *
 * @param pair - The pairwise similarity result.
 * @returns The overall similarity ratio between 0 and 1.
 */
export function getPairOverallSimilarityRatio(pair: PairResponse): number {
  const hybridSimilarity = normalizeSimilarityToRatio(pair.hybridScore)
  if (hybridSimilarity > 0) {
    return hybridSimilarity
  }

  return normalizeSimilarityToRatio(pair.structuralScore)
}

/**
 * Converts a similarity ratio into the same whole-number percentage shown in the UI.
 *
 * @param similarityRatio - Normalized similarity ratio between 0 and 1.
 * @returns Rounded whole-number percentage between 0 and 100.
 */
export function getDisplayedSimilarityPercent(similarityRatio: number): number {
  const clampedSimilarityRatio = Math.max(0, Math.min(1, similarityRatio))

  return Math.round(clampedSimilarityRatio * 100)
}

/**
 * Returns the pairs that meet the active minimum similarity threshold.
 *
 * @param pairs - Pairwise similarity results for an assignment.
 * @param minimumSimilarityPercent - Minimum overall similarity percentage required for a pair to qualify.
 * @returns The threshold-qualified pairs.
 */
export function getThresholdQualifiedPairs(
  pairs: PairResponse[],
  minimumSimilarityPercent: number,
): PairResponse[] {
  const minimumDisplayedSimilarityPercent = Math.max(
    0,
    Math.min(100, Math.round(minimumSimilarityPercent)),
  )

  return pairs.filter(
    (pair) =>
      getDisplayedSimilarityPercent(getPairOverallSimilarityRatio(pair)) >=
      minimumDisplayedSimilarityPercent,
  )
}

/**
 * Builds connected submission clusters from pairwise similarity results.
 * Pairs at or above the provided threshold become graph edges.
 * Any submissions connected through those edges are grouped into the same cluster.
 *
 * @param pairs - Pairwise similarity results for an assignment.
 * @param minimumSimilarityPercent - Minimum overall similarity percentage required for a pair to contribute to a cluster.
 * @returns Sorted cluster list, excluding singleton submissions.
 */
export function buildSimilarityClusters(
  pairs: PairResponse[],
  minimumSimilarityPercent: number,
): SimilarityCluster[] {
  const eligiblePairs = getThresholdQualifiedPairs(
    pairs,
    minimumSimilarityPercent,
  )

  if (eligiblePairs.length === 0) {
    return []
  }

  const pairLookup = new Map<number, PairResponse>()
  const adjacencyBySubmissionId = new Map<number, PairResponse[]>()
  const memberLookup = new Map<number, SimilarityClusterMember>()

  for (const pair of eligiblePairs) {
    pairLookup.set(pair.id, pair)
    registerClusterMember(memberLookup, pair.leftFile)
    registerClusterMember(memberLookup, pair.rightFile)
    appendPairToAdjacency(adjacencyBySubmissionId, pair.leftFile.id, pair)
    appendPairToAdjacency(adjacencyBySubmissionId, pair.rightFile.id, pair)
  }

  const visitedSubmissionIds = new Set<number>()
  const discoveredClusters: SimilarityCluster[] = []

  for (const submissionId of memberLookup.keys()) {
    if (visitedSubmissionIds.has(submissionId)) {
      continue
    }

    const submissionQueue: number[] = [submissionId]
    const clusterSubmissionIds = new Set<number>()
    const clusterPairIds = new Set<number>()

    while (submissionQueue.length > 0) {
      const currentSubmissionId = submissionQueue.pop()
      if (
        currentSubmissionId === undefined ||
        visitedSubmissionIds.has(currentSubmissionId)
      ) {
        continue
      }

      visitedSubmissionIds.add(currentSubmissionId)
      clusterSubmissionIds.add(currentSubmissionId)

      const connectedPairs = adjacencyBySubmissionId.get(currentSubmissionId) ?? []
      for (const pair of connectedPairs) {
        clusterPairIds.add(pair.id)

        const leftSubmissionId = pair.leftFile.id
        const rightSubmissionId = pair.rightFile.id

        if (!visitedSubmissionIds.has(leftSubmissionId)) {
          submissionQueue.push(leftSubmissionId)
        }

        if (!visitedSubmissionIds.has(rightSubmissionId)) {
          submissionQueue.push(rightSubmissionId)
        }
      }
    }

    if (clusterSubmissionIds.size <= 1 || clusterPairIds.size === 0) {
      continue
    }

    const clusterPairs = Array.from(clusterPairIds)
      .map((pairId) => pairLookup.get(pairId))
      .filter((pair): pair is PairResponse => pair !== undefined)
      .sort(
        (leftPair, rightPair) =>
          getPairOverallSimilarityRatio(rightPair) -
          getPairOverallSimilarityRatio(leftPair),
      )

    const memberAverageSimilarity = buildMemberAverageSimilarityMap(clusterPairs)
    const clusterMembers = Array.from(clusterSubmissionIds)
      .map((currentSubmissionId) => memberLookup.get(currentSubmissionId))
      .filter(
        (member): member is SimilarityClusterMember => member !== undefined,
      )
      .sort((leftMember, rightMember) => {
        const averageDifference =
          (memberAverageSimilarity.get(rightMember.submissionId) ?? 0) -
          (memberAverageSimilarity.get(leftMember.submissionId) ?? 0)

        if (averageDifference !== 0) {
          return averageDifference
        }

        return leftMember.displayName.localeCompare(rightMember.displayName)
      })

    const totalSimilarity = clusterPairs.reduce(
      (sum, pair) => sum + getPairOverallSimilarityRatio(pair),
      0,
    )

    discoveredClusters.push({
      clusterId: 0,
      members: clusterMembers,
      pairs: clusterPairs,
      submissionCount: clusterMembers.length,
      pairCount: clusterPairs.length,
      averageSimilarity:
        clusterPairs.length > 0 ? totalSimilarity / clusterPairs.length : 0,
      maxSimilarity:
        clusterPairs.length > 0
          ? getPairOverallSimilarityRatio(clusterPairs[0])
          : 0,
    })
  }

  return discoveredClusters
    .sort((leftCluster, rightCluster) => {
      if (rightCluster.submissionCount !== leftCluster.submissionCount) {
        return rightCluster.submissionCount - leftCluster.submissionCount
      }

      if (rightCluster.maxSimilarity !== leftCluster.maxSimilarity) {
        return rightCluster.maxSimilarity - leftCluster.maxSimilarity
      }

      if (rightCluster.averageSimilarity !== leftCluster.averageSimilarity) {
        return rightCluster.averageSimilarity - leftCluster.averageSimilarity
      }

      return leftCluster.members[0]?.displayName.localeCompare(
        rightCluster.members[0]?.displayName ?? "",
      ) ?? 0
    })
    .map((cluster, index) => ({
      ...cluster,
      clusterId: index + 1,
    }))
}

/**
 * Adds a pair to the adjacency list for a specific submission.
 *
 * @param adjacencyBySubmissionId - Pair adjacency lookup keyed by submission id.
 * @param submissionId - The submission to register.
 * @param pair - The pair that touches the submission.
 */
function appendPairToAdjacency(
  adjacencyBySubmissionId: Map<number, PairResponse[]>,
  submissionId: number,
  pair: PairResponse,
): void {
  const existingPairs = adjacencyBySubmissionId.get(submissionId)
  if (existingPairs) {
    existingPairs.push(pair)
    return
  }

  adjacencyBySubmissionId.set(submissionId, [pair])
}

/**
 * Registers a submission as a cluster member candidate.
 *
 * @param memberLookup - Cluster member lookup keyed by submission id.
 * @param file - Pair file metadata.
 */
function registerClusterMember(
  memberLookup: Map<number, SimilarityClusterMember>,
  file: FileResponse,
): void {
  if (memberLookup.has(file.id)) {
    return
  }

  const trimmedStudentName = file.studentName?.trim() ?? ""
  const displayName = trimmedStudentName || file.filename

  memberLookup.set(file.id, {
    submissionId: file.id,
    studentName: trimmedStudentName || "Unknown Student",
    filename: file.filename,
    lineCount: file.lineCount,
    displayName,
  })
}

/**
 * Calculates the average connected similarity for each submission in a cluster.
 *
 * @param clusterPairs - Pairs that belong to a cluster.
 * @returns Map of submission id to average connected similarity.
 */
function buildMemberAverageSimilarityMap(
  clusterPairs: PairResponse[],
): Map<number, number> {
  const similarityTotals = new Map<number, { total: number; count: number }>()

  for (const pair of clusterPairs) {
    const pairSimilarity = getPairOverallSimilarityRatio(pair)

    accumulateMemberSimilarity(similarityTotals, pair.leftFile.id, pairSimilarity)
    accumulateMemberSimilarity(similarityTotals, pair.rightFile.id, pairSimilarity)
  }

  return new Map(
    Array.from(similarityTotals.entries()).map(([submissionId, metrics]) => [
      submissionId,
      metrics.count > 0 ? metrics.total / metrics.count : 0,
    ]),
  )
}

/**
 * Adds one pair similarity contribution for a submission.
 *
 * @param similarityTotals - Running totals keyed by submission id.
 * @param submissionId - The submission being updated.
 * @param pairSimilarity - The similarity contribution to add.
 */
function accumulateMemberSimilarity(
  similarityTotals: Map<number, { total: number; count: number }>,
  submissionId: number,
  pairSimilarity: number,
): void {
  const existingMetrics = similarityTotals.get(submissionId)
  if (!existingMetrics) {
    similarityTotals.set(submissionId, { total: pairSimilarity, count: 1 })
    return
  }

  existingMetrics.total += pairSimilarity
  existingMetrics.count += 1
}

