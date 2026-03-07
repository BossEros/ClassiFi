import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { SimilarityResultsPage } from "@/presentation/pages/teacher/SimilarityResultsPage"
import { getResultDetails } from "@/business/services/plagiarismService"
import { getAssignmentById } from "@/business/services/assignmentService"

const mockData = vi.hoisted(() => {
  const pair = {
    id: 101,
    leftFile: {
      id: 11,
      path: "student-a.py",
      filename: "student-a.py",
      lineCount: 10,
      studentName: "Student A",
    },
    rightFile: {
      id: 12,
      path: "student-b.py",
      filename: "student-b.py",
      lineCount: 10,
      studentName: "Student B",
    },
    structuralScore: 0.9,
    semanticScore: 0.88,
    hybridScore: 0.89,
    overlap: 40,
    longest: 15,
  }

  const results = {
    reportId: "report-1",
    isReusedReport: false,
    summary: {
      totalFiles: 2,
      totalPairs: 1,
      suspiciousPairs: 1,
      averageSimilarity: 0.89,
      maxSimilarity: 0.9,
    },
    submissions: [
      pair.leftFile,
      pair.rightFile,
      {
        id: 13,
        path: "student-c.py",
        filename: "student-c.py",
        lineCount: 8,
        studentName: "Student C",
      },
    ],
    pairs: [pair],
    warnings: [],
  }

  const details = {
    result: {
      id: 101,
      submission1Id: 1001,
      submission2Id: 1002,
      structuralScore: "0.90",
      overlap: 40,
      longestFragment: 15,
    },
    fragments: [],
    leftFile: {
      filename: "student-a.py",
      content: "print('A')",
      lineCount: 1,
      studentName: "Student A",
    },
    rightFile: {
      filename: "student-b.py",
      content: "print('B')",
      lineCount: 1,
      studentName: "Student B",
    },
  }

  const assignment = {
    id: 1,
    classId: 10,
    className: "Algorithms",
    assignmentName: "Similarity Review",
    instructions: "Review for similarity",
    programmingLanguage: "python" as const,
    deadline: null,
    allowResubmission: false,
    isActive: true,
  }

  return { pair, results, details, assignment }
})

vi.mock("@/business/services/plagiarismService", () => ({
  getResultDetails: vi.fn(),
}))

vi.mock("@/business/services/assignmentService", () => ({
  getAssignmentById: vi.fn().mockResolvedValue(mockData.assignment),
}))

vi.mock("@/shared/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector({
      user: {
        id: "1",
        firstName: "Test",
        lastName: "Teacher",
        role: "teacher",
      },
    }),
}))

vi.mock("@/presentation/components/shared/dashboard/TopBar", () => ({
  useTopBar: () => null,
}))

vi.mock("@/presentation/components/shared/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@/presentation/components/ui/BackButton", () => ({
  BackButton: ({ label }: { label: string }) => <button>{label}</button>,
}))

vi.mock("@/presentation/components/ui/SummaryStatCard", () => ({
  SummaryStatCard: ({
    label,
    value,
  }: {
    label: string
    value: string | number
  }) => (
    <div>
      {label}: {value}
    </div>
  ),
}))

vi.mock("@/presentation/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/presentation/components/teacher/plagiarism", () => ({
  PairwiseTriageTable: ({
    onPairSelect,
  }: {
    onPairSelect: (pair: typeof mockData.pair) => void
  }) => (
    <button onClick={() => onPairSelect(mockData.pair)}>Select Pair</button>
  ),
  SimilarityGraphView: ({
    minimumSimilarityPercent,
    submissions,
  }: {
    minimumSimilarityPercent: number
    submissions: Array<{ id: number }>
  }) => (
    <div>
      Similarity Graph: {minimumSimilarityPercent}% / {submissions.length} submissions
    </div>
  ),
  PairComparison: () => <div>Pair Comparison</div>,
  PairCodeDiff: () => <div>Pair Diff</div>,
}))

describe("SimilarityResultsPage", () => {
  const scrollIntoViewMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    scrollIntoViewMock.mockReset()
    vi.mocked(getAssignmentById).mockImplementation(() => new Promise(() => {}))

    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    })
  })

  it("renders the graph with submission-aware summary cards", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/dashboard/assignments/1/similarity",
            state: { results: mockData.results },
          },
        ]}
      >
        <Routes>
          <Route
            path="/dashboard/assignments/:assignmentId/similarity"
            element={<SimilarityResultsPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText("Submissions: 3")).toBeInTheDocument()
    expect(screen.getByText("Average Similarity: 89.0%")).toBeInTheDocument()
    expect(screen.getByText("Max Similarity: 90.0%")).toBeInTheDocument()
    expect(
      screen.getByText("Similarity Graph: 75% / 3 submissions"),
    ).toBeInTheDocument()
  })

  it("renders the average similarity card before the max similarity card", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/dashboard/assignments/1/similarity",
            state: { results: mockData.results },
          },
        ]}
      >
        <Routes>
          <Route
            path="/dashboard/assignments/:assignmentId/similarity"
            element={<SimilarityResultsPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    const averageSimilarityCard = screen.getByText("Average Similarity: 89.0%")
    const maxSimilarityCard = screen.getByText("Max Similarity: 90.0%")
    const averageCardPosition = averageSimilarityCard.compareDocumentPosition(
      maxSimilarityCard,
    )

    expect(averageCardPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("auto-scrolls to comparison section when a pair is selected", async () => {
    vi.mocked(getResultDetails).mockResolvedValue(mockData.details)

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/dashboard/assignments/1/similarity",
            state: { results: mockData.results },
          },
        ]}
      >
        <Routes>
          <Route
            path="/dashboard/assignments/:assignmentId/similarity"
            element={<SimilarityResultsPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Select Pair" }))

    await waitFor(() => {
      expect(getResultDetails).toHaveBeenCalledWith(101)
      expect(scrollIntoViewMock).toHaveBeenCalled()
    })

    expect(screen.getByText(/Code Comparison:/)).toBeInTheDocument()
  })
})

