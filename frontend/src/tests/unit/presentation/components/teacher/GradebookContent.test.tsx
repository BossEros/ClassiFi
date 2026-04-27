import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { GradebookContent } from "@/presentation/components/teacher/gradebook/GradebookContent"

vi.mock("@/presentation/hooks/teacher/useGradebook", () => ({
  useClassGradebook: vi.fn(),
  useGradebookExport: vi.fn(),
}))

vi.mock("@/presentation/hooks/shared/useMediaQuery", () => ({
  useIsMobile: vi.fn(() => false),
}))

vi.mock("@/shared/store/useToastStore", () => ({
  useToastStore: vi.fn((selector) =>
    selector({
      showToast: vi.fn(),
    }),
  ),
}))

import {
  useClassGradebook,
} from "@/presentation/hooks/teacher/useGradebook"

describe("GradebookContent", () => {
  const originalCreateObjectUrl = window.URL.createObjectURL
  const originalRevokeObjectUrl = window.URL.revokeObjectURL

  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => "blob:gradebook-export")
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectUrl
    window.URL.revokeObjectURL = originalRevokeObjectUrl
    vi.restoreAllMocks()
  })

  it("shows an inactive status label for inactive students kept in the gradebook", () => {
    vi.mocked(useClassGradebook).mockReturnValue({
      gradebook: {
        assignments: [
          {
            id: 1,
            name: "Quiz 1",
            totalScore: 100,
            deadline: null,
          },
        ],
        students: [
          {
            id: 1,
            name: "Inactive Student",
            email: "inactive@student.test",
            isActive: false,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 80,
                gradeBreakdown: {
                  originalGrade: 80,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 80,
                  effectiveGrade: 80,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GradebookContent
        classId={1}
        classCode="ABC123"
        className="Algorithms"
        teacherName="Test Teacher"
        variant="light"
      />,
    )

    expect(screen.getAllByText("Inactive Student")).toHaveLength(2)
    expect(screen.getAllByText("Inactive")).toHaveLength(2)
  })

  it("shows zero-counted missing work in the displayed average but excludes pending-review submissions", () => {
    vi.mocked(useClassGradebook).mockReturnValue({
      gradebook: {
        assignments: [
          {
            id: 1,
            name: "Quiz 1",
            totalScore: 100,
            deadline: null,
          },
          {
            id: 2,
            name: "Quiz 2",
            totalScore: 100,
            deadline: null,
          },
        ],
        students: [
          {
            id: 1,
            name: "Missing Counts As Zero",
            email: "missing@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: null,
                grade: null,
                gradeBreakdown: {
                  originalGrade: null,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: null,
                  effectiveGrade: null,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
          {
            id: 2,
            name: "Pending Review Excluded",
            email: "pending@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 21,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: 22,
                grade: null,
                gradeBreakdown: {
                  originalGrade: null,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: null,
                  effectiveGrade: null,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: "2026-04-27T00:00:00.000Z",
              },
            ],
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GradebookContent
        classId={1}
        classCode="ABC123"
        className="Algorithms"
        teacherName="Test Teacher"
        variant="light"
      />,
    )

    expect(screen.getAllByText("50%").length).toBeGreaterThan(0)
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0)
  })

  it("shows a points-weighted total when assignment scores differ", () => {
    vi.mocked(useClassGradebook).mockReturnValue({
      gradebook: {
        assignments: [
          { id: 1, name: "Assignment 1", totalScore: 100, deadline: null },
          { id: 2, name: "Assignment 2", totalScore: 100, deadline: null },
          { id: 3, name: "Assignment 3", totalScore: 100, deadline: null },
          { id: 4, name: "Assignment 4", totalScore: 67, deadline: null },
          { id: 5, name: "Assignment 5", totalScore: 100, deadline: null },
        ],
        students: [
          {
            id: 1,
            name: "Weighted Example",
            email: "weighted@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: 12,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 3,
                submissionId: 13,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 4,
                submissionId: null,
                grade: null,
                gradeBreakdown: {
                  originalGrade: null,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: null,
                  effectiveGrade: null,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
              {
                assignmentId: 5,
                submissionId: null,
                grade: null,
                gradeBreakdown: {
                  originalGrade: null,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: null,
                  effectiveGrade: null,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GradebookContent
        classId={1}
        classCode="ABC123"
        className="Algorithms"
        teacherName="Test Teacher"
        variant="light"
      />,
    )

    expect(screen.getAllByText("64%").length).toBeGreaterThan(0)
  })

  it("defaults to rank order and lets teachers switch to last-name order", () => {
    vi.mocked(useClassGradebook).mockReturnValue({
      gradebook: {
        assignments: [
          {
            id: 1,
            name: "Quiz 1",
            totalScore: 100,
            deadline: null,
          },
        ],
        students: [
          {
            id: 1,
            name: "Zoe Zimmerman",
            email: "zoe@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
          {
            id: 2,
            name: "Amy Anderson",
            email: "amy@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 12,
                grade: 60,
                gradeBreakdown: {
                  originalGrade: 60,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 60,
                  effectiveGrade: 60,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(
      <GradebookContent
        classId={1}
        classCode="ABC123"
        className="Algorithms"
        teacherName="Test Teacher"
        variant="light"
      />,
    )

    const studentNameCells = () =>
      Array.from(
        container.querySelectorAll("table tbody tr td:first-child p"),
      ).map((cell) => cell.textContent?.trim())

    expect(studentNameCells()).toEqual(["Zoe Zimmerman", "Amy Anderson"])

    fireEvent.change(screen.getByLabelText("Sort student grades"), {
      target: { value: "name" },
    })

    expect(studentNameCells()).toEqual(["Amy Anderson", "Zoe Zimmerman"])
  })

  it("exports CSV using the selected last-name order", async () => {
    let exportedBlob: Blob | null = null
    window.URL.createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob
      return "blob:gradebook-export"
    })

    vi.mocked(useClassGradebook).mockReturnValue({
      gradebook: {
        assignments: [
          {
            id: 1,
            name: "Quiz 1",
            totalScore: 100,
            deadline: null,
          },
        ],
        students: [
          {
            id: 1,
            name: "Zoe Zimmerman",
            email: "zoe@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                gradeBreakdown: {
                  originalGrade: 100,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 100,
                  effectiveGrade: 100,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
          {
            id: 2,
            name: "Amy Anderson",
            email: "amy@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 12,
                grade: 60,
                gradeBreakdown: {
                  originalGrade: 60,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 60,
                  effectiveGrade: 60,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <GradebookContent
        classId={1}
        classCode="ABC123"
        className="Algorithms"
        teacherName="Test Teacher"
        variant="light"
      />,
    )

    fireEvent.change(screen.getByLabelText("Sort student grades"), {
      target: { value: "name" },
    })
    fireEvent.click(screen.getByRole("button", { name: /export/i }))
    fireEvent.click(screen.getByRole("button", { name: "Export as CSV" }))

    await waitFor(() => {
      expect(exportedBlob).not.toBeNull()
    })

    if (!exportedBlob) {
      throw new Error("Expected CSV export blob to be created")
    }

    const csvContent = await (exportedBlob as Blob).text()
    const amyRowIndex = csvContent.indexOf('"Amy Anderson"')
    const zoeRowIndex = csvContent.indexOf('"Zoe Zimmerman"')

    expect(amyRowIndex).toBeGreaterThan(-1)
    expect(zoeRowIndex).toBeGreaterThan(-1)
    expect(amyRowIndex).toBeLessThan(zoeRowIndex)
  })
})
