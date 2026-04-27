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

  it("counts no-submission assignments as zero while excluding submitted work awaiting grades", () => {
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
      },
    })

    expect(reportData.studentRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentName: "Missing Counts As Zero",
          average: "50%",
        }),
        expect.objectContaining({
          studentName: "Pending Review Excluded",
          average: "100%",
        }),
      ]),
    )

    expect(reportData.summaryMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Class Average", value: "75%" }),
      ]),
    )
  })

  it("uses a points-weighted total when assignment scores differ", () => {
    const reportData = buildGradeReportData({
      className: "Algorithms",
      classCode: "ALG-101",
      teacherName: "Teacher One",
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
      },
    })

    expect(reportData.studentRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          studentName: "Weighted Example",
          average: "64%",
        }),
      ]),
    )
  })
})
