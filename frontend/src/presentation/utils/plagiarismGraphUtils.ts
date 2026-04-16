import type { FileResponse, PairResponse } from "@/data/api/plagiarism.types"
import {
  buildSimilarityClusters,
  getPairOverallSimilarityRatio,
  getThresholdQualifiedPairs,
  type SimilarityCluster,
  type SimilarityClusterMember,
} from "@/presentation/utils/plagiarismClusterUtils"

export const SIMILARITY_GRAPH_DEFAULT_THRESHOLD_PERCENT = 75
export const SIMILARITY_GRAPH_MIN_THRESHOLD_PERCENT = 25
export const SIMILARITY_GRAPH_MAX_THRESHOLD_PERCENT = 100

const GRAPH_CLUSTER_COLORS = [
  "#0f766e",
  "#2563eb",
  "#9333ea",
  "#ea580c",
  "#e11d48",
  "#4f46e5",
  "#059669",
  "#7c3aed",
] as const

const GRAPH_SINGLETON_COLOR = "#64748b"
const GRAPH_MIN_CLUSTER_RING_RADIUS = 62
const GRAPH_MAX_CLUSTER_RING_RADIUS = 124
const GRAPH_NODE_RADIUS = 18
const GRAPH_LAYOUT_PADDING = 72

/**
 * Graph-ready submission node enriched with threshold-aware metrics.
 */
export interface SimilarityGraphNode extends SimilarityClusterMember {
  clusterId: number | null
  connectedPairCount: number
  visiblePairCount: number
  strongestSimilarity: number
  strongestVisibleSimilarity: number
  averageVisibleSimilarity: number
  strongestPair: PairResponse | null
  strongestVisiblePair: PairResponse | null
}

/**
 * Graph-ready similarity edge.
 */
export interface SimilarityGraphEdge {
  edgeId: number
  sourceId: number
  targetId: number
  similarity: number
  clusterId: number | null
  pair: PairResponse
}

/**
 * Graph-ready cluster derived from thresholded pairwise results.
 */
export interface SimilarityGraphCluster {
  clusterId: number
  label: string
  nodes: SimilarityGraphNode[]
  edges: SimilarityGraphEdge[]
  submissionCount: number
  pairCount: number
  averageSimilarity: number
  maxSimilarity: number
  strongestPair: PairResponse | null
}

/**
 * Threshold-aware graph dataset before layout positioning is applied.
 */
export interface SimilarityGraphData {
  thresholdRatio: number
  nodes: SimilarityGraphNode[]
  edges: SimilarityGraphEdge[]
  clusters: SimilarityGraphCluster[]
  singletonNodes: SimilarityGraphNode[]
}

/**
 * Positioned node ready for SVG rendering.
 */
export interface PositionedSimilarityGraphNode extends SimilarityGraphNode {
  x: number
  y: number
  radius: number
  color: string
  initials: string
  isVisible: boolean
}

/**
 * Positioned cluster hull ready for SVG rendering.
 */
export interface PositionedSimilarityGraphCluster extends SimilarityGraphCluster {
  x: number
  y: number
  radius: number
  color: string
}

/**
 * Positioned graph layout ready for rendering.
 */
export interface SimilarityGraphLayout {
  width: number
  height: number
  nodes: PositionedSimilarityGraphNode[]
  edges: SimilarityGraphEdge[]
  clusters: PositionedSimilarityGraphCluster[]
}

interface SimilarityGraphLayoutOptions {
  width: number
  height: number
  showSingletons: boolean
}

interface SimilarityMetrics {
  totalSimilarity: number
  count: number
  strongestSimilarity: number
  strongestPair: PairResponse | null
}

/**
 * Builds graph-ready nodes, edges, and clusters from pairwise similarity results.
 * The graph reuses the same threshold logic as the cluster view and pairwise triage table.
 *
 * @param submissions - All analyzed submissions for the assignment.
 * @param pairs - Pairwise similarity results for an assignment.
 * @param minimumSimilarityPercent - Active threshold percentage.
 * @returns Threshold-aware graph data.
 */
export function buildSimilarityGraphData(
  submissions: FileResponse[],
  pairs: PairResponse[],
  minimumSimilarityPercent: number,
): SimilarityGraphData {
  const thresholdRatio = Math.max(
    0,
    Math.min(1, Math.round(minimumSimilarityPercent) / 100),
  )
  const allMembers = buildAllSubmissionMembers(submissions, pairs)
  const strongestOverallBySubmissionId = buildSimilarityMetricsBySubmissionId(
    pairs,
    () => true,
  )
  const visiblePairs = getThresholdQualifiedPairs(
    pairs,
    minimumSimilarityPercent,
  )
  const visibleSimilarityBySubmissionId = buildSimilarityMetricsBySubmissionId(
    visiblePairs,
    () => true,
  )
  const clusters = buildSimilarityClusters(pairs, minimumSimilarityPercent)
  const clusterIdBySubmissionId = buildClusterIdBySubmissionId(clusters)
  const edges = visiblePairs.map((pair) => ({
    edgeId: pair.id,
    sourceId: pair.leftFile.id,
    targetId: pair.rightFile.id,
    similarity: getPairOverallSimilarityRatio(pair),
    clusterId: getClusterIdForPair(pair, clusterIdBySubmissionId),
    pair,
  }))

  const edgesByClusterId = new Map<number, SimilarityGraphEdge[]>()
  for (const edge of edges) {
    if (edge.clusterId === null) {
      continue
    }

    const clusterEdges = edgesByClusterId.get(edge.clusterId)
    if (clusterEdges) {
      clusterEdges.push(edge)
      continue
    }

    edgesByClusterId.set(edge.clusterId, [edge])
  }

  const nodes = Array.from(allMembers.values())
    .map((member) => {
      const strongestOverallMetrics =
        strongestOverallBySubmissionId.get(member.submissionId)
      const visibleMetrics = visibleSimilarityBySubmissionId.get(
        member.submissionId,
      )

      return {
        ...member,
        clusterId: clusterIdBySubmissionId.get(member.submissionId) ?? null,
        connectedPairCount: strongestOverallMetrics?.count ?? 0,
        visiblePairCount: visibleMetrics?.count ?? 0,
        strongestSimilarity: strongestOverallMetrics?.strongestSimilarity ?? 0,
        strongestVisibleSimilarity: visibleMetrics?.strongestSimilarity ?? 0,
        averageVisibleSimilarity:
          visibleMetrics && visibleMetrics.count > 0
            ? visibleMetrics.totalSimilarity / visibleMetrics.count
            : 0,
        strongestPair: strongestOverallMetrics?.strongestPair ?? null,
        strongestVisiblePair: visibleMetrics?.strongestPair ?? null,
      }
    })
    .sort((leftNode, rightNode) => {
      if (leftNode.clusterId !== null && rightNode.clusterId !== null) {
        if (leftNode.clusterId !== rightNode.clusterId) {
          return leftNode.clusterId - rightNode.clusterId
        }
      } else if (leftNode.clusterId !== null) {
        return -1
      } else if (rightNode.clusterId !== null) {
        return 1
      }

      if (rightNode.strongestVisibleSimilarity !== leftNode.strongestVisibleSimilarity) {
        return rightNode.strongestVisibleSimilarity - leftNode.strongestVisibleSimilarity
      }

      if (rightNode.strongestSimilarity !== leftNode.strongestSimilarity) {
        return rightNode.strongestSimilarity - leftNode.strongestSimilarity
      }

      return leftNode.displayName.localeCompare(rightNode.displayName)
    })

  const graphClusters = clusters.map((cluster) => ({
    clusterId: cluster.clusterId,
    label: `Cluster ${cluster.clusterId}`,
    nodes: cluster.members
      .map((member) => nodes.find((node) => node.submissionId === member.submissionId))
      .filter((node): node is SimilarityGraphNode => node !== undefined),
    edges:
      edgesByClusterId.get(cluster.clusterId)?.sort(
        (leftEdge, rightEdge) => rightEdge.similarity - leftEdge.similarity,
      ) ?? [],
    submissionCount: cluster.submissionCount,
    pairCount: cluster.pairCount,
    averageSimilarity: cluster.averageSimilarity,
    maxSimilarity: cluster.maxSimilarity,
    strongestPair: cluster.pairs[0] ?? null,
  }))

  return {
    thresholdRatio,
    nodes,
    edges: edges.sort((leftEdge, rightEdge) => rightEdge.similarity - leftEdge.similarity),
    clusters: graphClusters,
    singletonNodes: nodes.filter((node) => node.visiblePairCount === 0),
  }
}

/**
 * Calculates deterministic SVG positions for the active graph state.
 * Clusters occupy the inner ring while optional singleton nodes orbit around the outside.
 *
 * @param graphData - Graph data derived from pairwise results.
 * @param options - Layout dimensions and singleton visibility.
 * @returns Positioned graph layout for rendering.
 */
export function layoutSimilarityGraph(
  graphData: SimilarityGraphData,
  options: SimilarityGraphLayoutOptions,
): SimilarityGraphLayout {
  const width = Math.max(options.width, 640)
  const height = Math.max(options.height, 420)
  const centerX = width / 2
  const centerY = height / 2
  const positionedNodes = new Map<number, PositionedSimilarityGraphNode>()
  const positionedClusters: PositionedSimilarityGraphCluster[] = []
  const visibleClusterCount = graphData.clusters.length
  const visibleSingletonNodes = options.showSingletons
    ? graphData.singletonNodes
    : []

  const clusterCentroids = computeClusterCentroids({
    width,
    height,
    clusterCount: visibleClusterCount,
    centerX,
    centerY,
  })

  for (let clusterIndex = 0; clusterIndex < graphData.clusters.length; clusterIndex += 1) {
    const cluster = graphData.clusters[clusterIndex]
    const centroid = clusterCentroids[clusterIndex] ?? { x: centerX, y: centerY }
    const clusterColor = getClusterColor(cluster.clusterId)
    const clusterRadius = getClusterRingRadius(cluster.submissionCount)
    const localNodeRadius = Math.max(28, clusterRadius - 20)
    const positionedClusterNodes = positionClusterNodes(
      cluster.nodes,
      centroid.x,
      centroid.y,
      localNodeRadius,
      clusterColor,
      true,
    )

    for (const node of positionedClusterNodes) {
      positionedNodes.set(node.submissionId, node)
    }

    positionedClusters.push({
      ...cluster,
      x: centroid.x,
      y: centroid.y,
      radius: clusterRadius,
      color: clusterColor,
    })
  }

  const singletonPositions = computeSingletonPositions({
    width,
    height,
    count: visibleSingletonNodes.length,
    centerX,
    centerY,
    hasClusters: visibleClusterCount > 0,
  })

  for (let singletonIndex = 0; singletonIndex < visibleSingletonNodes.length; singletonIndex += 1) {
    const singletonNode = visibleSingletonNodes[singletonIndex]
    const singletonPosition = singletonPositions[singletonIndex] ?? {
      x: centerX,
      y: centerY,
    }

    positionedNodes.set(singletonNode.submissionId, {
      ...singletonNode,
      x: singletonPosition.x,
      y: singletonPosition.y,
      radius: GRAPH_NODE_RADIUS,
      color: GRAPH_SINGLETON_COLOR,
      initials: buildNodeInitials(singletonNode.displayName),
      isVisible: true,
    })
  }

  for (const node of graphData.nodes) {
    if (positionedNodes.has(node.submissionId)) {
      continue
    }

    positionedNodes.set(node.submissionId, {
      ...node,
      x: centerX,
      y: centerY,
      radius: GRAPH_NODE_RADIUS,
      color:
        node.clusterId !== null
          ? getClusterColor(node.clusterId)
          : GRAPH_SINGLETON_COLOR,
      initials: buildNodeInitials(node.displayName),
      isVisible: false,
    })
  }

  return {
    width,
    height,
    nodes: Array.from(positionedNodes.values()),
    edges: graphData.edges,
    clusters: positionedClusters,
  }
}

/**
 * Resolves the highlight color for a cluster.
 *
 * @param clusterId - Cluster identifier.
 * @returns Hex color string.
 */
export function getClusterColor(clusterId: number): string {
  return GRAPH_CLUSTER_COLORS[(clusterId - 1) % GRAPH_CLUSTER_COLORS.length]
}

function buildAllSubmissionMembers(
  submissions: FileResponse[],
  pairs: PairResponse[],
): Map<number, SimilarityClusterMember> {
  const memberLookup = new Map<number, SimilarityClusterMember>()

  for (const submission of submissions) {
    registerMember(memberLookup, submission)
  }

  for (const pair of pairs) {
    registerMember(memberLookup, pair.leftFile)
    registerMember(memberLookup, pair.rightFile)
  }

  return memberLookup
}

function registerMember(
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

function buildSimilarityMetricsBySubmissionId(
  pairs: PairResponse[],
  predicate: (pair: PairResponse) => boolean,
): Map<number, SimilarityMetrics> {
  const metricsBySubmissionId = new Map<number, SimilarityMetrics>()

  for (const pair of pairs) {
    if (!predicate(pair)) {
      continue
    }

    const similarity = getPairOverallSimilarityRatio(pair)
    accumulateSimilarityMetrics(metricsBySubmissionId, pair.leftFile.id, similarity, pair)
    accumulateSimilarityMetrics(metricsBySubmissionId, pair.rightFile.id, similarity, pair)
  }

  return metricsBySubmissionId
}

function accumulateSimilarityMetrics(
  metricsBySubmissionId: Map<number, SimilarityMetrics>,
  submissionId: number,
  similarity: number,
  pair: PairResponse,
): void {
  const existingMetrics = metricsBySubmissionId.get(submissionId)
  if (!existingMetrics) {
    metricsBySubmissionId.set(submissionId, {
      totalSimilarity: similarity,
      count: 1,
      strongestSimilarity: similarity,
      strongestPair: pair,
    })
    return
  }

  existingMetrics.totalSimilarity += similarity
  existingMetrics.count += 1

  if (similarity > existingMetrics.strongestSimilarity) {
    existingMetrics.strongestSimilarity = similarity
    existingMetrics.strongestPair = pair
  }
}

function buildClusterIdBySubmissionId(
  clusters: SimilarityCluster[],
): Map<number, number> {
  const clusterIdBySubmissionId = new Map<number, number>()

  for (const cluster of clusters) {
    for (const member of cluster.members) {
      clusterIdBySubmissionId.set(member.submissionId, cluster.clusterId)
    }
  }

  return clusterIdBySubmissionId
}

function getClusterIdForPair(
  pair: PairResponse,
  clusterIdBySubmissionId: Map<number, number>,
): number | null {
  const leftClusterId = clusterIdBySubmissionId.get(pair.leftFile.id)
  const rightClusterId = clusterIdBySubmissionId.get(pair.rightFile.id)

  if (leftClusterId === undefined || rightClusterId === undefined) {
    return null
  }

  return leftClusterId === rightClusterId ? leftClusterId : null
}

function computeClusterCentroids({
  width,
  height,
  clusterCount,
  centerX,
  centerY,
}: {
  width: number
  height: number
  clusterCount: number
  centerX: number
  centerY: number
}): Array<{ x: number; y: number }> {
  if (clusterCount <= 0) {
    return []
  }

  if (clusterCount === 1) {
    return [{ x: centerX, y: centerY }]
  }

  const innerRadiusX = Math.max(
    0,
    Math.min(width * 0.24, width / 2 - GRAPH_LAYOUT_PADDING - 120),
  )
  const innerRadiusY = Math.max(
    0,
    Math.min(height * 0.2, height / 2 - GRAPH_LAYOUT_PADDING - 72),
  )

  return Array.from({ length: clusterCount }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / clusterCount
    return {
      x: centerX + Math.cos(angle) * innerRadiusX,
      y: centerY + Math.sin(angle) * innerRadiusY,
    }
  })
}

function getClusterRingRadius(submissionCount: number): number {
  const scaledRadius = 48 + Math.sqrt(Math.max(submissionCount, 1)) * 22
  return clampNumber(
    scaledRadius,
    GRAPH_MIN_CLUSTER_RING_RADIUS,
    GRAPH_MAX_CLUSTER_RING_RADIUS,
  )
}

function positionClusterNodes(
  nodes: SimilarityGraphNode[],
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  isVisible: boolean,
): PositionedSimilarityGraphNode[] {
  if (nodes.length === 0) {
    return []
  }

  if (nodes.length === 1) {
    return [
      {
        ...nodes[0],
        x: centerX,
        y: centerY,
        radius: GRAPH_NODE_RADIUS,
        color,
        initials: buildNodeInitials(nodes[0].displayName),
        isVisible,
      },
    ]
  }

  if (nodes.length === 2) {
    return nodes.map((node, index) => ({
      ...node,
      x: centerX,
      y: centerY + (index === 0 ? -radius * 0.42 : radius * 0.42),
      radius: GRAPH_NODE_RADIUS,
      color,
      initials: buildNodeInitials(node.displayName),
      isVisible,
    }))
  }

  return nodes.map((node, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / nodes.length
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: GRAPH_NODE_RADIUS,
      color,
      initials: buildNodeInitials(node.displayName),
      isVisible,
    }
  })
}

function computeSingletonPositions({
  width,
  height,
  count,
  centerX,
  centerY,
  hasClusters,
}: {
  width: number
  height: number
  count: number
  centerX: number
  centerY: number
  hasClusters: boolean
}): Array<{ x: number; y: number }> {
  if (count <= 0) {
    return []
  }

  const outerRadiusX = Math.max(
    0,
    Math.min(width * (hasClusters ? 0.38 : 0.28), width / 2 - GRAPH_LAYOUT_PADDING),
  )
  const outerRadiusY = Math.max(
    0,
    Math.min(height * (hasClusters ? 0.3 : 0.22), height / 2 - GRAPH_LAYOUT_PADDING),
  )

  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count
    return {
      x: centerX + Math.cos(angle) * outerRadiusX,
      y: centerY + Math.sin(angle) * outerRadiusY,
    }
  })
}

function buildNodeInitials(displayName: string): string {
  const nameParts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (nameParts.length === 0) {
    return "?"
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase()
  }

  return `${nameParts[0][0] ?? ""}${nameParts[1][0] ?? ""}`.toUpperCase()
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

