import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
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
  useGradebookExport,
} from "@/presentation/hooks/teacher/useGradebook"

describe("GradebookContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useGradebookExport).mockReturnValue({
      exportCSV: vi.fn(),
      isExporting: false,
      error: null,
    })
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
})
