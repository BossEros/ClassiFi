import { describe, expect, it } from "vitest"
import { renderToString } from "@react-pdf/renderer"
import { GradeReportDocument } from "@/presentation/components/teacher/gradebook/pdf/gradeReportPdf"
import type { GradeReportData } from "@/presentation/components/teacher/gradebook/pdf/gradeReportTypes"

describe("GradeReportDocument", () => {
  it("renders inactive student labels in the exported PDF", async () => {
    const reportData: GradeReportData = {
      title: "Grade Report - Algorithms",
      reportMetadata: [
        { label: "Class", value: "Algorithms" },
        {
          label: "Export Rule",
          value: "Inactive students are labeled in the table.",
        },
      ],
      summaryMetrics: [
        { label: "Active Students", value: "1" },
        { label: "Inactive Students", value: "1" },
      ],
      assignmentNames: ["Quiz 1"],
      studentRows: [
        {
          studentName: "Inactive Student",
          statusLabel: "Inactive",
          isActive: false,
          grades: [
            {
              assignmentName: "Quiz 1",
              score: "80/100",
              percentage: 80,
              totalScore: 100,
            },
          ],
          average: "80%",
        },
      ],
    }

    const pdfString = await renderToString(
      <GradeReportDocument data={reportData} />,
    )

    expect(pdfString).toContain("Inactive Student")
    expect(pdfString).toContain("Inactive")
  })
})
