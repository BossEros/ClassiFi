import { describe, expect, it } from "vitest"
import {
  buildClassSimilarityReportData,
  buildCrossClassPairReportData,
  buildCrossClassReportData,
  buildPairSimilarityReportData,
  CLASS_REPORT_TABLE_HEADERS,
} from "@/presentation/components/teacher/plagiarism/pdf/similarityReportPdf"

const mockTeacher = {
  id: "7",
  firstName: "Taylor",
  lastName: "Teacher",
  email: "teacher@classifi.test",
  role: "teacher" as const,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  createdAt: new Date("2026-03-10T09:00:00.000Z"),
}

const mockAssignment = {
  id: 9,
  classId: 3,
  className: "Algorithms",
  assignmentName: "Threshold Review",
  instructions: "Inspect similarity output",
  programmingLanguage: "python" as const,
  deadline: null,
  allowResubmission: false,
  isActive: true,
}

const mockResults = {
  reportId: "report-55",
  isReusedReport: false,
  generatedAt: "2026-03-10T10:00:00.000Z",
  summary: {
    totalFiles: 3,
    totalPairs: 3,
    suspiciousPairs: 2,
    averageSimilarity: 0.86,
    maxSimilarity: 0.95,
  },
  submissions: [
    {
      id: 1,
      path: "student-a.py",
      filename: "student-a.py",
      lineCount: 12,
      studentName: "Student A",
    },
    {
      id: 2,
      path: "student-b.py",
      filename: "student-b.py",
      lineCount: 10,
      studentName: "Student B",
    },
    {
      id: 3,
      path: "student-c.py",
      filename: "student-c.py",
      lineCount: 14,
      studentName: "Student C",
    },
  ],
  pairs: [
    {
      id: 10,
      leftFile: {
        id: 1,
        path: "student-a.py",
        filename: "student-a.py",
        lineCount: 12,
        studentName: "Student A",
      },
      rightFile: {
        id: 2,
        path: "student-b.py",
        filename: "student-b.py",
        lineCount: 10,
        studentName: "Student B",
      },
      structuralScore: 0.94,
      semanticScore: 0.91,
      hybridScore: 0.95,
      overlap: 48,
      longest: 18,
    },
    {
      id: 11,
      leftFile: {
        id: 1,
        path: "student-a.py",
        filename: "student-a.py",
        lineCount: 12,
        studentName: "Student A",
      },
      rightFile: {
        id: 3,
        path: "student-c.py",
        filename: "student-c.py",
        lineCount: 14,
        studentName: "Student C",
      },
      structuralScore: 0.91,
      semanticScore: 0.88,
      hybridScore: 0,
      overlap: 36,
      longest: 14,
    },
    {
      id: 12,
      leftFile: {
        id: 2,
        path: "student-b.py",
        filename: "student-b.py",
        lineCount: 10,
        studentName: "Student B",
      },
      rightFile: {
        id: 3,
        path: "student-c.py",
        filename: "student-c.py",
        lineCount: 14,
        studentName: "Student C",
      },
      structuralScore: 0.72,
      semanticScore: 0.7,
      hybridScore: 0.72,
      overlap: 20,
      longest: 8,
    },
  ],
  warnings: [],
}

const mockPairDetails = {
  id: 10,
  leftFile: {
    id: 1,
    path: "student-a.py",
    filename: "student-a.py",
    content: "print('A')\nprint('B')",
    lineCount: 2,
  },
  rightFile: {
    id: 2,
    path: "student-b.py",
    filename: "student-b.py",
    content: "print('A')\nprint('B')",
    lineCount: 2,
  },
  similarity: 0.95,
  overlap: 48,
  longest: 18,
  fragments: [
    {
      id: 1,
      leftSelection: {
        startRow: 1,
        startCol: 0,
        endRow: 2,
        endCol: 10,
      },
      rightSelection: {
        startRow: 3,
        startCol: 0,
        endRow: 4,
        endCol: 10,
      },
      length: 2,
    },
  ],
}

const mockCrossClassReport = {
  reportId: 401,
  generatedAt: "2026-03-11T08:30:00.000Z",
  sourceAssignment: {
    id: 9,
    name: "Threshold Review",
    className: "Algorithms",
  },
  matchedAssignments: [
    {
      id: 19,
      name: "Threshold Review",
      className: "Algorithms B",
      classCode: "ALG-B",
      nameSimilarity: 1,
    },
  ],
  summary: {
    totalSubmissions: 4,
    totalComparisons: 6,
    flaggedPairs: 1,
    averageSimilarity: 0.84,
    maxSimilarity: 0.96,
  },
  results: [
    {
      id: 44,
      submission1Id: 1001,
      submission2Id: 1002,
      student1Name: "Student A",
      student2Name: "Student D",
      class1Name: "Algorithms",
      class1Code: "ALG-A",
      class2Name: "Algorithms B",
      class2Code: "ALG-B",
      assignment1Name: "Threshold Review",
      assignment2Name: "Threshold Review",
      structuralScore: 0.93,
      semanticScore: 0.89,
      hybridScore: 0.92,
      overlap: 28,
      longestFragment: 11,
      isFlagged: true,
    },
  ],
}

describe("similarityReportPdf", () => {
  it("filters the class report by the active threshold and maps badge metadata", () => {
    const reportData = buildClassSimilarityReportData({
      assignment: mockAssignment,
      teacher: mockTeacher,
      results: mockResults,
      minimumSimilarityPercent: 90,
      showSingletons: false,
      downloadedAt: new Date("2026-03-10T11:00:00.000Z"),
    })

    expect(reportData.filteredPairRows).toHaveLength(2)
    expect(
      reportData.summaryMetrics.find((metric) => metric.label === "Suspicious Pairs")
        ?.value,
    ).toBe("2")
    expect(
      reportData.filteredPairRows.map((row) => row.overallSimilarity.label),
    ).toEqual(["95.0%", "91.0%"])
    expect(
      reportData.filteredPairRows.map((row) => row.overallSimilarity.severity),
    ).toEqual(["high", "high"])
    expect(reportData.filteredPairRows.map((row) => row.pairLabel)).toEqual([
      "Student A vs Student B",
      "Student A vs Student C",
    ])
    expect(reportData.filteredPairRows[0].overlapSignal).toEqual({
      label: "High",
      level: "high",
    })
    expect(reportData.filteredPairRows[0].longestFragmentSignal).toEqual({
      label: "High",
      level: "high",
    })
  })

  it("renames the retained download timestamp to report generated in metadata", () => {
    const reportData = buildClassSimilarityReportData({
      assignment: mockAssignment,
      teacher: mockTeacher,
      results: mockResults,
      minimumSimilarityPercent: 90,
      showSingletons: false,
      downloadedAt: new Date("2026-03-10T11:00:00.000Z"),
    })

    expect(
      reportData.reportMetadata.filter(
        (entry) => entry.label === "Report Generated",
      ),
    ).toHaveLength(1)
    expect(reportData.reportMetadata.map((entry) => entry.label)).not.toContain(
      "Downloaded",
    )
  })

  it("returns an empty-state graph payload when no pairs meet the active threshold", () => {
    const reportData = buildClassSimilarityReportData({
      assignment: mockAssignment,
      teacher: mockTeacher,
      results: mockResults,
      minimumSimilarityPercent: 98,
      showSingletons: false,
      downloadedAt: new Date("2026-03-10T11:00:00.000Z"),
    })

    expect(reportData.filteredPairRows).toEqual([])
    expect(reportData.graphLayout).toBeNull()
    expect(reportData.emptyStateMessage).toContain("No pairs met the active threshold")
  })

  it("keeps structural similarity before semantic similarity in the exported class table", () => {
    expect(CLASS_REPORT_TABLE_HEADERS.indexOf("Structural Similarity")).toBeLessThan(
      CLASS_REPORT_TABLE_HEADERS.indexOf("Semantic Similarity"),
    )
  })

  it("includes pairwise fragment evidence, source appendices, and renamed metadata in the pair report", () => {
    const reportData = buildPairSimilarityReportData({
      assignment: mockAssignment,
      teacher: mockTeacher,
      results: mockResults,
      selectedPair: mockResults.pairs[0],
      pairDetails: mockPairDetails,
      minimumSimilarityPercent: 90,
      downloadedAt: new Date("2026-03-10T11:00:00.000Z"),
    })

    expect(reportData.fragmentRows).toEqual([
      {
        fragmentLabel: "Fragment 1",
        leftRange: "Lines 2\u20133",
        rightRange: "Lines 4\u20135",
        length: "2",
      },
    ])
    expect(reportData.leftCode).toContain("print('A')")
    expect(reportData.rightCode).toContain("print('B')")
    expect(reportData.summaryMetrics.map((metric) => metric.label)).toEqual([
      "Overall Similarity",
      "Structural Similarity",
      "Semantic Similarity",
      "Total Overlap",
      "Longest Fragment",
      "Matched Fragments",
    ])
    expect(
      reportData.reportMetadata.filter(
        (entry) => entry.label === "Report Generated",
      ),
    ).toHaveLength(1)
    expect(reportData.reportMetadata.map((entry) => entry.label)).not.toContain(
      "Downloaded",
    )
  })

  it("uses the persisted report timestamp for the cross-class class report metadata", () => {
    const reportData = buildCrossClassReportData({
      report: mockCrossClassReport,
      teacher: mockTeacher,
      minimumSimilarityPercent: 90,
      downloadedAt: new Date("2026-03-11T10:00:00.000Z"),
    })

    expect(
      reportData.reportMetadata.find(
        (entry) => entry.label === "Report Generated",
      )?.value,
    ).toContain("Mar 11, 2026")
    expect(reportData.reportMetadata.map((entry) => entry.label)).not.toContain(
      "Downloaded At",
    )
  })

  it("uses the persisted report timestamp for the cross-class pair report metadata", () => {
    const reportData = buildCrossClassPairReportData({
      report: mockCrossClassReport,
      teacher: mockTeacher,
      selectedResult: mockCrossClassReport.results[0],
      pairDetails: mockPairDetails,
      downloadedAt: new Date("2026-03-11T10:00:00.000Z"),
    })

    expect(
      reportData.reportMetadata.find(
        (entry) => entry.label === "Report Generated",
      )?.value,
    ).toContain("Mar 11, 2026")
    expect(reportData.reportMetadata.map((entry) => entry.label)).not.toContain(
      "Downloaded At",
    )
  })
})


