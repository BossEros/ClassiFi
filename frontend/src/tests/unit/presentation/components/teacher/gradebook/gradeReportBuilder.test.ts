import { describe, expect, it } from "vitest"
import { buildGradeReportData } from "@/presentation/components/teacher/gradebook/pdf/gradeReportPdf"

describe("buildGradeReportData", () => {
  it("includes inactive student status and keeps summary metrics active-only", () => {
    const reportData = buildGradeReportData({
      className: "Algorithms",
      classCode: "ALG-101",
      teacherName: "Teacher One",
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
            name: "Active Student",
            email: "active@student.test",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 90,
                gradeBreakdown: {
                  originalGrade: 90,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 90,
                  effectiveGrade: 90,
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
            name: "Inactive Student",
            email: "inactive@student.test",
            isActive: false,
            grades: [
              {
                assignmentId: 1,
                submissionId: 22,
                grade: 40,
                gradeBreakdown: {
                  originalGrade: 40,
                  latePenaltyPercent: 0,
                  similarityPenaltyPercent: 0,
                  similarityScore: null,
                  finalGrade: 40,
                  effectiveGrade: 40,
                  isOverridden: false,
                },
                isOverridden: false,
                overrideReason: null,
                submittedAt: null,
              },
            ],
          },
        ],
      },
    })

    expect(reportData.studentRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentName: "Inactive Student",
          statusLabel: "Inactive",
          isActive: false,
        }),
      ]),
    )

    expect(reportData.summaryMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Active Students", value: "1" }),
        expect.objectContaining({ label: "Inactive Students", value: "1" }),
        expect.objectContaining({ label: "Class Average", value: "90%" }),
      ]),
    )
  })
})
