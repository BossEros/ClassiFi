import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { CrossClassResultsSection } from "@/presentation/components/teacher/plagiarism/CrossClassResultsSection"
import {
  getCrossClassResultDetails,
  getLatestCrossClassReport,
} from "@/business/services/crossClassPlagiarismService"

const mockShowToast = vi.fn()

const mockReport = {
  reportId: 400,
  generatedAt: "2026-03-31T18:48:09.347Z",
  sourceAssignment: {
    id: 104,
    name: "FizzBuzz",
    className: "BSCS 3A",
  },
  matchedAssignments: [
    {
      id: 114,
      name: "FizzBuzz",
      className: "BSCS 3B",
      classCode: "CS3B",
      nameSimilarity: 1,
    },
  ],
  summary: {
    totalSubmissions: 2,
    totalComparisons: 1,
    flaggedPairs: 1,
    averageSimilarity: 0.93,
    maxSimilarity: 0.93,
  },
  results: [
    {
      id: 1886,
      submission1Id: 101,
      submission2Id: 201,
      student1Name: "John Doe",
      student2Name: "Jane Smith",
      class1Name: "BSCS 3A",
      class1Code: "CS3A",
      class2Name: "BSCS 3B",
      class2Code: "CS3B",
      assignment1Name: "FizzBuzz",
      assignment2Name: "FizzBuzz",
      structuralScore: 0.92,
      semanticScore: 0.95,
      hybridScore: 0.93,
      overlap: 41,
      longestFragment: 16,
      isFlagged: true,
    },
  ],
  scoringWeights: { structuralWeight: 0.7, semanticWeight: 0.3 },
}

const mockDetails = {
  result: mockReport.results[0],
  fragments: [],
  leftFile: {
    filename: "submission_101.py",
    content: "print('left')",
    lineCount: 1,
    studentName: "John Doe",
    submittedAt: "2026-03-31T09:00:00.000Z",
  },
  rightFile: {
    filename: "submission_201.py",
    content: "print('right')",
    lineCount: 1,
    studentName: "Jane Smith",
    submittedAt: "2026-03-31T10:30:00.000Z",
  },
}

vi.mock("@/business/services/crossClassPlagiarismService", () => ({
  analyzeCrossClassSimilarity: vi.fn(),
  getLatestCrossClassReport: vi.fn(),
  getCrossClassResultDetails: vi.fn(),
}))

vi.mock("@/shared/store/useAuthStore", () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector({
      user: {
        id: "47",
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

vi.mock("@/presentation/components/ui/Card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/presentation/components/ui/SummaryStatCard", () => ({
  SummaryStatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div>
      {label}: {value}
    </div>
  ),
}))

vi.mock("@/presentation/components/ui/TablePaginationFooter", () => ({
  TablePaginationFooter: () => <div>Pagination</div>,
}))

vi.mock("@/presentation/components/teacher/plagiarism/SimilarityBadge", () => ({
  SimilarityBadge: ({ similarity }: { similarity: number }) => <span>{similarity}</span>,
}))

vi.mock("@/presentation/components/teacher/plagiarism/SimilarityThresholdSlider", () => ({
  SimilarityThresholdSlider: () => <div>Threshold Slider</div>,
}))

vi.mock("@/presentation/components/teacher/plagiarism/PairComparison", () => ({
  PairComparison: ({
    pair,
  }: {
    pair: {
      leftFile: { submittedAt?: string | null; studentName?: string }
      rightFile: { submittedAt?: string | null; studentName?: string }
    }
  }) => (
    <div>
      Pair Comparison:
      {" "}
      {pair.leftFile.studentName}
      {" "}
      {pair.leftFile.submittedAt}
      {" | "}
      {pair.rightFile.studentName}
      {" "}
      {pair.rightFile.submittedAt}
    </div>
  ),
}))

vi.mock("@/presentation/components/teacher/plagiarism/PairCodeDiff", () => ({
  PairCodeDiff: () => <div>Pair Diff</div>,
}))

vi.mock("@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf", () => ({
  buildCrossClassReportData: vi.fn(),
  buildCrossClassPairReportData: vi.fn(),
  ClassSimilarityReportDocument: () => <div>Class PDF</div>,
  PairSimilarityReportDocument: () => <div>Pair PDF</div>,
  toFileNameSegment: (value: string) => value,
}))

vi.mock("@/presentation/utils/pdfDownload", () => ({
  downloadPdfDocument: vi.fn(),
}))

describe("CrossClassResultsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLatestCrossClassReport).mockResolvedValue(mockReport)
    vi.mocked(getCrossClassResultDetails).mockResolvedValue(mockDetails)

    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    })
  })

  it("passes submission timestamps into the shared pair comparison view", async () => {
    render(<CrossClassResultsSection assignmentId={104} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /compare/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /compare/i }))

    await waitFor(() => {
      expect(getCrossClassResultDetails).toHaveBeenCalledWith(1886)
      expect(
        screen.getByText(
          /Pair Comparison:\s+John Doe 2026-03-31T09:00:00.000Z \| Jane Smith 2026-03-31T10:30:00.000Z/i,
        ),
      ).toBeInTheDocument()
    })
  })
})
