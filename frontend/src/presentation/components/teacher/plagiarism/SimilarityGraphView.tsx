import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import type {
  FileResponse,
  PairResponse,
} from "@/business/services/plagiarismService"
import {
  buildSimilarityGraphData,
  layoutSimilarityGraph,
  SIMILARITY_GRAPH_MAX_THRESHOLD_PERCENT,
  SIMILARITY_GRAPH_MIN_THRESHOLD_PERCENT,
  type PositionedSimilarityGraphNode,
} from "@/presentation/utils/plagiarismGraphUtils"
import { SimilarityThresholdSlider } from "./SimilarityThresholdSlider"
import { SimilarityBadge } from "./SimilarityBadge"
import { Info, MousePointerClick } from "lucide-react"

interface SimilarityGraphViewProps {
  /** All analyzed submissions so true singleton nodes can be rendered. */
  submissions: FileResponse[]
  /** Pairwise similarity results for the assignment. */
  pairs: PairResponse[]
  /** Active threshold percentage shared with the rest of the page. */
  minimumSimilarityPercent: number
  /** Triggered when the shared threshold changes. */
  onMinimumSimilarityPercentChange: (minimumSimilarityPercent: number) => void
  /** Opens the detailed review flow for a specific pair. */
  onReviewPair: (pair: PairResponse) => void
  /** Optional selected pair identifier from the comparison panel. */
  selectedPairId?: number | null
  /** Notifies the parent whenever the singleton toggle changes. */
  onShowSingletonsChange?: (showSingletons: boolean) => void
}

interface GraphTooltipState {
  nodeId: number
  x: number
  y: number
}

/**
 * Interactive similarity graph that mirrors Dolos-style threshold clustering in native React.
 *
 * @param props - Pair data, shared threshold state, and review callbacks.
 * @returns Responsive SVG graph with threshold slider, singleton toggle, tooltips, and selection details.
 */
export function SimilarityGraphView({
  submissions,
  pairs,
  minimumSimilarityPercent,
  onMinimumSimilarityPercentChange,
  onReviewPair,
  selectedPairId = null,
  onShowSingletonsChange,
}: SimilarityGraphViewProps) {
  const graphContainerRef = useRef<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({
    width: 960,
    height: 560,
  })
  const [showSingletons, setShowSingletons] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(
    null,
  )
  const [tooltipState, setTooltipState] = useState<GraphTooltipState | null>(
    null,
  )

  const graphData = useMemo(
    () =>
      buildSimilarityGraphData(submissions, pairs, minimumSimilarityPercent),
    [minimumSimilarityPercent, pairs, submissions],
  )
  const graphLayout = useMemo(
    () =>
      layoutSimilarityGraph(graphData, {
        width: containerSize.width,
        height: containerSize.height,
        showSingletons,
      }),
    [containerSize.height, containerSize.width, graphData, showSingletons],
  )

  const visibleNodes = useMemo(
    () => graphLayout.nodes.filter((node) => node.isVisible),
    [graphLayout.nodes],
  )
  const visibleNodeById = useMemo(
    () => new Map(visibleNodes.map((node) => [node.submissionId, node])),
    [visibleNodes],
  )
  const visibleEdges = useMemo(
    () =>
      graphLayout.edges.filter(
        (edge) =>
          visibleNodeById.has(edge.sourceId) &&
          visibleNodeById.has(edge.targetId),
      ),
    [graphLayout.edges, visibleNodeById],
  )
  const selectedPairEdge = useMemo(() => {
    if (selectedPairId === null) {
      return null
    }

    return (
      graphData.edges.find((edge) => edge.edgeId === selectedPairId) ?? null
    )
  }, [graphData.edges, selectedPairId])
  const effectiveSelectedNodeId =
    selectedNodeId !== null && visibleNodeById.has(selectedNodeId)
      ? selectedNodeId
      : null
  const effectiveSelectedClusterId =
    selectedPairEdge?.clusterId ??
    (selectedClusterId !== null &&
    graphLayout.clusters.some(
      (cluster) => cluster.clusterId === selectedClusterId,
    )
      ? selectedClusterId
      : null)
  const selectedNode =
    effectiveSelectedNodeId !== null
      ? (visibleNodeById.get(effectiveSelectedNodeId) ?? null)
      : null
  const selectedCluster =
    effectiveSelectedClusterId !== null
      ? (graphLayout.clusters.find(
          (cluster) => cluster.clusterId === effectiveSelectedClusterId,
        ) ?? null)
      : null
  const hoveredNode =
    tooltipState !== null
      ? (visibleNodeById.get(tooltipState.nodeId) ?? null)
      : null

  useEffect(() => {
    const container = graphContainerRef.current
    if (!container) {
      return
    }

    const updateContainerSize = () => {
      const nextWidth = Math.max(container.clientWidth, 640)
      const nextHeight = Math.max(container.clientHeight, 420)
      setContainerSize({ width: nextWidth, height: nextHeight })
    }

    updateContainerSize()

    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])


  const handleCanvasReset = () => {
    setSelectedNodeId(null)
    setSelectedClusterId(null)
    setTooltipState(null)
  }

  const handleNodeSelect = (node: {
    submissionId: number
    clusterId: number | null
  }) => {
    setSelectedNodeId(node.submissionId)
    setSelectedClusterId(node.clusterId)
  }

  const handleNodeHover = (
    event: MouseEvent<SVGCircleElement>,
    node: PositionedSimilarityGraphNode,
  ) => {
    const containerRect = graphContainerRef.current?.getBoundingClientRect()
    if (!containerRect) {
      return
    }

    setTooltipState({
      nodeId: node.submissionId,
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    })
  }

  const handleNodeHoverEnd = () => {
    setTooltipState(null)
  }

  const handleEdgeReview = (pair: PairResponse, clusterId: number | null) => {
    setSelectedNodeId(null)
    setSelectedClusterId(clusterId)
    onReviewPair(pair)
  }

  const reviewableNodePair =
    selectedNode?.strongestVisiblePair ?? selectedNode?.strongestPair
  const reviewableClusterPair = selectedCluster?.strongestPair ?? null
  const emptyStatePanelWidthPx = Math.max(
    Math.min(containerSize.width - 96, 768),
    320,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold text-slate-900">
          Similarity Graph
        </h2>
        <p className="max-w-3xl text-sm text-slate-500">
          Explore submission similarity as a graph. Each edge connects two
          submissions whose hybrid similarity meets or exceeds the threshold.
          Raise the threshold to focus on the most suspicious pairs; lower it to
          reveal more connections. The slider also updates the pairwise triage
          table simultaneously.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0">
          <div
            ref={graphContainerRef}
            className="relative min-h-[560px] w-full overflow-hidden rounded-[28px] border border-slate-300 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.14),_rgba(255,255,255,0.96)_44%)] shadow-xl shadow-slate-200/80"
          >
            {visibleNodes.length === 0 ? (
              <div className="flex h-full min-h-[560px] w-full items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
                <div
                  className="max-w-full rounded-[32px] border border-white/80 bg-white/88 px-6 py-10 text-center sm:px-10"
                  style={{ width: emptyStatePanelWidthPx }}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300/60">
                    <Info className="h-6 w-6" />
                  </div>

                  <h3 className="mx-auto mt-5 text-balance text-xl font-semibold text-slate-900">
                    No nodes are visible at this threshold
                  </h3>

                  <p className="mx-auto mt-3 text-pretty text-sm leading-6 text-slate-600 sm:text-[15px]">
                    Lower the threshold or enable singleton nodes to inspect the
                    available submissions in this similarity result set.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line no-restricted-syntax */}
                <svg
                  viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                  className="h-full w-full"
                  role="img"
                  aria-label="Similarity clustering graph"
                  onClick={handleCanvasReset}
                >
                  <rect
                    width={graphLayout.width}
                    height={graphLayout.height}
                    fill="transparent"
                  />

                  {graphLayout.clusters.map((cluster) => {
                    const isSelectedCluster =
                      cluster.clusterId === effectiveSelectedClusterId
                    return (
                      <circle
                        key={cluster.clusterId}
                        cx={cluster.x}
                        cy={cluster.y}
                        r={cluster.radius}
                        fill={cluster.color}
                        fillOpacity={isSelectedCluster ? 0.14 : 0.08}
                        stroke={cluster.color}
                        strokeWidth={isSelectedCluster ? 3 : 1.5}
                        strokeOpacity={isSelectedCluster ? 0.8 : 0.28}
                        className="cursor-pointer transition-all duration-200"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedNodeId(null)
                          setSelectedClusterId(cluster.clusterId)
                        }}
                      />
                    )
                  })}

                  {visibleEdges.map((edge) => {
                    const sourceNode = visibleNodeById.get(edge.sourceId)
                    const targetNode = visibleNodeById.get(edge.targetId)
                    if (!sourceNode || !targetNode) {
                      return null
                    }

                    const isSelectedEdge = edge.edgeId === selectedPairId
                    const isClusterSelected =
                      edge.clusterId !== null &&
                      edge.clusterId === effectiveSelectedClusterId
                    const strokeOpacity = isSelectedEdge
                      ? 0.95
                      : isClusterSelected
                        ? 0.78
                        : 0.42
                    const strokeWidth = isSelectedEdge
                      ? 7
                      : 2 + edge.similarity * 5

                    return (
                      <line
                        key={edge.edgeId}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isSelectedEdge ? "#0f766e" : sourceNode.color}
                        strokeOpacity={strokeOpacity}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="cursor-pointer transition-all duration-200"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleEdgeReview(edge.pair, edge.clusterId)
                        }}
                      />
                    )
                  })}

                  {visibleNodes.map((node) => {
                    const isSelectedNode = node.submissionId === selectedNodeId
                    const isNodeInSelectedCluster =
                      effectiveSelectedClusterId !== null &&
                      node.clusterId === effectiveSelectedClusterId

                    return (
                      <g key={node.submissionId}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.radius + (isSelectedNode ? 4 : 0)}
                          fill={node.color}
                          stroke={isSelectedNode ? "#0f172a" : "#ffffff"}
                          strokeWidth={
                            isSelectedNode
                              ? 3
                              : isNodeInSelectedCluster
                                ? 2.5
                                : 2
                          }
                          className="cursor-pointer transition-all duration-200"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleNodeSelect(node)
                          }}
                          onMouseMove={(event) => handleNodeHover(event, node)}
                          onMouseLeave={handleNodeHoverEnd}
                        />
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="#ffffff"
                          className="pointer-events-none select-none"
                        >
                          {node.initials}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                {hoveredNode && tooltipState && (
                  <div
                    className="pointer-events-none absolute z-10 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-300/70 backdrop-blur-sm"
                    style={{
                      left: Math.min(
                        tooltipState.x + 18,
                        Math.max(24, containerSize.width - 304),
                      ),
                      top: Math.max(24, tooltipState.y - 36),
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {hoveredNode.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {hoveredNode.filename}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>Visible links</span>
                      <span className="font-semibold text-slate-900">
                        {hoveredNode.visiblePairCount}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Strongest visible match</span>
                      <span className="font-semibold text-slate-900">
                        {(hoveredNode.strongestVisibleSimilarity * 100).toFixed(
                          0,
                        )}
                        %
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Highest recorded match</span>
                      <span className="font-semibold text-slate-900">
                        {(hoveredNode.strongestSimilarity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-slate-300 bg-white p-5 shadow-lg shadow-slate-200/70">
            <SimilarityThresholdSlider
              minimumSimilarityPercent={minimumSimilarityPercent}
              min={SIMILARITY_GRAPH_MIN_THRESHOLD_PERCENT}
              max={SIMILARITY_GRAPH_MAX_THRESHOLD_PERCENT}
              showHelperText
              onMinimumSimilarityPercentChange={
                onMinimumSimilarityPercentChange
              }
            />

            <label className="inline-flex cursor-pointer items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Allow Singleton
              </span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showSingletons}
                  onChange={(event) => {
                    const next = event.target.checked
                    setShowSingletons(next)
                    onShowSingletonsChange?.(next)
                  }}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-teal-600 peer-focus:ring-2 peer-focus:ring-teal-500/30 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
              </span>
            </label>
          </div>

          <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-lg shadow-slate-200/70">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Selection Details
              </h3>
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Selected node
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">
                    {selectedNode.studentName}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {selectedNode.filename}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectionMetricCard
                    label="Visible links"
                    value={selectedNode.visiblePairCount}
                  />
                  <SelectionMetricCard
                    label="Connected pairs"
                    value={selectedNode.connectedPairCount}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Strongest visible match
                    </span>
                    <SimilarityBadge
                      similarity={selectedNode.strongestVisibleSimilarity}
                      size="small"
                      showLabel={false}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Highest recorded match
                    </span>
                    <SimilarityBadge
                      similarity={selectedNode.strongestSimilarity}
                      size="small"
                      showLabel={false}
                    />
                  </div>
                </div>

                {reviewableNodePair ? (
                  <button
                    type="button"
                    onClick={() => onReviewPair(reviewableNodePair)}
                    className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition-colors duration-200 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800"
                  >
                    Review strongest pair for this node
                  </button>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No pair is available to review for this node at the current
                    threshold.
                  </div>
                )}
              </div>
            ) : selectedCluster ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Selected cluster
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-900">
                    {selectedCluster.label}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {selectedCluster.submissionCount} submissions,{" "}
                    {selectedCluster.pairCount} qualifying links
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectionMetricCard
                    label="Average"
                    value={`${(selectedCluster.averageSimilarity * 100).toFixed(0)}%`}
                  />
                  <SelectionMetricCard
                    label="Strongest"
                    value={`${(selectedCluster.maxSimilarity * 100).toFixed(0)}%`}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Members
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCluster.nodes.map((node) => (
                      <button
                        key={node.submissionId}
                        type="button"
                        onClick={() => handleNodeSelect(node)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      >
                        {node.studentName}
                      </button>
                    ))}
                  </div>
                </div>

                {reviewableClusterPair && (
                  <button
                    type="button"
                    onClick={() => onReviewPair(reviewableClusterPair)}
                    className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition-colors duration-200 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800"
                  >
                    Review strongest pair in this cluster
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Select a node or cluster to inspect the submissions behind the
                graph. The graph stays synchronized with the active similarity
                threshold.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

interface SelectionMetricCardProps {
  label: string
  value: number | string
}

function SelectionMetricCard({ label, value }: SelectionMetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default SimilarityGraphView



