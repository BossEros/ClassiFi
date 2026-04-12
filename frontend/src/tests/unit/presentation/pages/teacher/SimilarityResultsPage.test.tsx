import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { ReactNode } from "react"
import { SimilarityResultsPage } from "@/presentation/pages/teacher/SimilarityResultsPage"
import { getResultDetails } from "@/business/services/plagiarismService"
import { getAssignmentById } from "@/business/services/assignmentService"
import * as similarityReportPdf from "@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf"
import * as pdfDownload from "@/presentation/utils/pdfDownload"

function createDeferredPromise<T>() {
  let resolvePromise!: (value: T) => void
  let rejectPromise!: (reason?: unknown) => void

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  }
}

const mockShowToast = vi.fn()

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
    generatedAt: "2026-03-10T10:00:00.000Z",
    summary: {
      totalFiles: 2,
      totalPairs: 1,
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
      leftCovered: 40,
      rightCovered: 32,
      leftTotal: 120,
      rightTotal: 110,
    },
    fragments: [
      {
        id: 1,
        leftSelection: {
          startRow: 1,
          startCol: 0,
          endRow: 3,
          endCol: 10,
        },
        rightSelection: {
          startRow: 2,
          startCol: 0,
          endRow: 4,
          endCol: 10,
        },
        length: 3,
      },
    ],
    leftFile: {
      filename: "student-a.py",
      content: "print('A')",
      lineCount: 1,
      studentName: "Student A",
      submittedAt: "2026-03-10T10:00:00.000Z",
    },
    rightFile: {
      filename: "student-b.py",
      content: "print('B')",
      lineCount: 1,
      studentName: "Student B",
      submittedAt: "2026-03-10T11:00:00.000Z",
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
  getAssignmentById: vi.fn(),
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

vi.mock("@/shared/store/useToastStore", () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
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

vi.mock(
  "@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf",
  () => ({
    buildClassSimilarityReportData: vi.fn(() => ({ title: "Class Report" })),
    buildPairSimilarityReportData: vi.fn(() => ({ title: "Pair Report" })),
    ClassSimilarityReportDocument: () => <div>Class PDF Document</div>,
    PairSimilarityReportDocument: () => <div>Pair PDF Document</div>,
    toFileNameSegment: (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "report",
  }),
)

vi.mock("@/presentation/utils/pdfDownload", () => ({
  downloadPdfDocument: vi.fn().mockResolvedValue(undefined),
}))

function renderSimilarityResultsPage(results = mockData.results) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/dashboard/assignments/1/similarity",
          state: { results },
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
}

describe("SimilarityResultsPage", () => {
  const scrollIntoViewMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    scrollIntoViewMock.mockReset()
    mockShowToast.mockReset()
    vi.mocked(getAssignmentById).mockImplementation(() => new Promise(() => {}))

    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    })
  })

  it("renders the graph with submission-aware summary cards and class download action", async () => {
    renderSimilarityResultsPage()

    expect(screen.getByText("Submissions: 3")).toBeInTheDocument()
    expect(screen.getByText("Suspicious Pair: 1")).toBeInTheDocument()
    expect(screen.getByText("Average Similarity: 89.0%")).toBeInTheDocument()
    expect(screen.getByText("Max Similarity: 90.0%")).toBeInTheDocument()
    expect(
      screen.getByText("Similarity Graph: 75% / 3 submissions"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Download Class Report" }),
    ).toBeInTheDocument()
  })

  it("renders the average similarity card before the max similarity card", async () => {
    renderSimilarityResultsPage()

    const averageSimilarityCard = screen.getByText("Average Similarity: 89.0%")
    const maxSimilarityCard = screen.getByText("Max Similarity: 90.0%")
    const averageCardPosition = averageSimilarityCard.compareDocumentPosition(
      maxSimilarityCard,
    )

    expect(averageCardPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("derives the suspicious pair card from the active threshold-qualified pairs", async () => {
    const lowSimilarityPair = {
      ...mockData.pair,
      id: 102,
      leftFile: {
        id: 21,
        path: "student-c.py",
        filename: "student-c.py",
        lineCount: 8,
        studentName: "Student C",
      },
      rightFile: {
        id: 22,
        path: "student-d.py",
        filename: "student-d.py",
        lineCount: 9,
        studentName: "Student D",
      },
      structuralScore: 0.61,
      semanticScore: 0.58,
      hybridScore: 0.6,
      overlap: 10,
      longest: 3,
    }
    const thresholdQualifiedResults = {
      ...mockData.results,
      summary: {
        ...mockData.results.summary,
        totalFiles: 4,
        totalPairs: 2,
      },
      submissions: [
        mockData.pair.leftFile,
        mockData.pair.rightFile,
        lowSimilarityPair.leftFile,
        lowSimilarityPair.rightFile,
      ],
      pairs: [mockData.pair, lowSimilarityPair],
    }

    renderSimilarityResultsPage(thresholdQualifiedResults)

    expect(screen.getByText("Suspicious Pair: 1")).toBeInTheDocument()
  })

  it("auto-scrolls to comparison section when a pair is selected", async () => {
    vi.mocked(getResultDetails).mockResolvedValue(mockData.details)

    renderSimilarityResultsPage()

    await userEvent.click(screen.getByRole("button", { name: "Select Pair" }))

    await waitFor(() => {
      expect(getResultDetails).toHaveBeenCalledWith(101)
      expect(scrollIntoViewMock).toHaveBeenCalled()
    })

    expect(screen.getByText(/Code Comparison:/)).toBeInTheDocument()
  })

  it("keeps the pair download button disabled while details are loading and enables it after details resolve", async () => {
    const deferredDetails = createDeferredPromise<typeof mockData.details>()
    vi.mocked(getResultDetails).mockReturnValue(deferredDetails.promise)

    renderSimilarityResultsPage()

    await userEvent.click(screen.getByRole("button", { name: "Select Pair" }))

    const pairDownloadButton = await screen.findByRole("button", {
      name: "Download Pair Report",
    })

    expect(pairDownloadButton).toBeDisabled()

    deferredDetails.resolve(mockData.details)

    await waitFor(() => {
      expect(pairDownloadButton).toBeEnabled()
    })
  })

  it("uses the active threshold and selected pair context for both PDF downloads", async () => {
    vi.mocked(getResultDetails).mockResolvedValue(mockData.details)
    vi.mocked(getAssignmentById).mockResolvedValue(mockData.assignment)
    const buildClassSimilarityReportDataMock = vi.mocked(
      similarityReportPdf.buildClassSimilarityReportData,
    )
    const buildPairSimilarityReportDataMock = vi.mocked(
      similarityReportPdf.buildPairSimilarityReportData,
    )
    const downloadPdfDocumentMock = vi.mocked(pdfDownload.downloadPdfDocument)

    renderSimilarityResultsPage()

    await waitFor(() => {
      expect(getAssignmentById).toHaveBeenCalledWith(1, 1)
    })

    await userEvent.click(
      screen.getByRole("button", { name: "Download Class Report" }),
    )

    await waitFor(() => {
      expect(buildClassSimilarityReportDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          results: mockData.results,
          minimumSimilarityPercent: 75,
          assignment: mockData.assignment,
        }),
      )
      expect(downloadPdfDocumentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "similarity-review-similarity-threshold-75.pdf",
        }),
      )
    })

    await userEvent.click(screen.getByRole("button", { name: "Select Pair" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download Pair Report" })).toBeEnabled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: "Download Pair Report" }),
    )

    await waitFor(() => {
      expect(buildPairSimilarityReportDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          results: mockData.results,
          selectedPair: mockData.pair,
          minimumSimilarityPercent: 75,
          assignment: mockData.assignment,
        }),
      )
      expect(downloadPdfDocumentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: "similarity-review-student-a-vs-student-b.pdf",
        }),
      )
    })

    expect(mockShowToast).toHaveBeenCalledWith(
      "Class similarity report downloaded successfully",
    )
    expect(mockShowToast).toHaveBeenCalledWith(
      "Pairwise similarity report downloaded successfully",
    )
  })
})



