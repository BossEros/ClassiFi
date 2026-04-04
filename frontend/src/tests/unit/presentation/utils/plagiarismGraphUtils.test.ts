import { describe, expect, it } from "vitest"
import type { FileResponse, PairResponse } from "@/data/api/plagiarism.types"
import {
  buildSimilarityGraphData,
  layoutSimilarityGraph,
} from "@/presentation/utils/plagiarismGraphUtils"

function createPair(
  id: number,
  leftSubmissionId: number,
  leftStudentName: string,
  rightSubmissionId: number,
  rightStudentName: string,
  hybridScore: number,
): PairResponse {
  return {
    id,
    leftFile: {
      id: leftSubmissionId,
      path: `${leftStudentName}.py`,
      filename: `${leftStudentName}.py`,
      lineCount: 20,
      studentName: leftStudentName,
    },
    rightFile: {
      id: rightSubmissionId,
      path: `${rightStudentName}.py`,
      filename: `${rightStudentName}.py`,
      lineCount: 20,
      studentName: rightStudentName,
    },
    structuralScore: hybridScore,
    semanticScore: hybridScore,
    hybridScore,
    overlap: 10,
    longest: 5,
  }
}

describe("plagiarismGraphUtils", () => {
  const submissions: FileResponse[] = [
    {
      id: 1,
      path: "Alice.py",
      filename: "Alice.py",
      lineCount: 20,
      studentName: "Alice",
    },
    {
      id: 2,
      path: "Bob.py",
      filename: "Bob.py",
      lineCount: 20,
      studentName: "Bob",
    },
    {
      id: 3,
      path: "Cara.py",
      filename: "Cara.py",
      lineCount: 20,
      studentName: "Cara",
    },
    {
      id: 4,
      path: "Dina.py",
      filename: "Dina.py",
      lineCount: 20,
      studentName: "Dina",
    },
    {
      id: 5,
      path: "Eli.py",
      filename: "Eli.py",
      lineCount: 12,
      studentName: "Eli",
    },
  ]

  it("builds graph data with clusters and thresholded singleton nodes", () => {
    const pairs = [
      createPair(1, 1, "Alice", 2, "Bob", 0.96),
      createPair(2, 2, "Bob", 3, "Cara", 0.94),
      createPair(3, 1, "Alice", 4, "Dina", 0.52),
    ]

    const graphData = buildSimilarityGraphData(submissions, pairs, 90)

    expect(graphData.edges.map((edge) => edge.edgeId)).toEqual([1, 2])
    expect(graphData.clusters).toHaveLength(1)
    expect(graphData.clusters[0].nodes.map((node) => node.studentName)).toEqual([
      "Alice",
      "Bob",
      "Cara",
    ])
    expect(graphData.singletonNodes.map((node) => node.studentName)).toEqual([
      "Dina",
      "Eli",
    ])

    const thresholdSingletonNode = graphData.singletonNodes.find(
      (node) => node.studentName === "Dina",
    )
    const trueSingletonNode = graphData.singletonNodes.find(
      (node) => node.studentName === "Eli",
    )

    expect(thresholdSingletonNode?.visiblePairCount).toBe(0)
    expect(thresholdSingletonNode?.strongestSimilarity).toBeCloseTo(0.52)
    expect(trueSingletonNode?.connectedPairCount).toBe(0)
    expect(trueSingletonNode?.strongestSimilarity).toBe(0)
  })

  it("keeps singleton nodes hidden unless the view requests them", () => {
    const pairs = [
      createPair(1, 1, "Alice", 2, "Bob", 0.96),
      createPair(2, 2, "Bob", 3, "Cara", 0.94),
      createPair(3, 1, "Alice", 4, "Dina", 0.52),
    ]

    const graphData = buildSimilarityGraphData(submissions, pairs, 90)
    const layoutWithoutSingletons = layoutSimilarityGraph(graphData, {
      width: 960,
      height: 560,
      showSingletons: false,
    })
    const layoutWithSingletons = layoutSimilarityGraph(graphData, {
      width: 960,
      height: 560,
      showSingletons: true,
    })

    expect(
      layoutWithoutSingletons.nodes.filter((node) => node.isVisible),
    ).toHaveLength(3)
    expect(layoutWithoutSingletons.clusters).toHaveLength(1)
    expect(layoutWithSingletons.nodes.filter((node) => node.isVisible)).toHaveLength(5)
    expect(
      layoutWithSingletons.nodes.find((node) => node.studentName === "Dina")?.isVisible,
    ).toBe(true)
  })
})

