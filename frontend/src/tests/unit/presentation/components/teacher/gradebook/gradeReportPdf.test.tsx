import { isValidElement, type ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { GradeReportDocument } from "@/presentation/components/teacher/gradebook/pdf/gradeReportPdf"
import type { GradeReportData } from "@/presentation/components/teacher/gradebook/pdf/gradeReportTypes"

interface RenderableElementProps {
  children?: ReactNode
}

function collectRenderedPdfText(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return []
  }

  if (typeof node === "string" || typeof node === "number") {
    return [String(node)]
  }

  if (Array.isArray(node)) {
    return node.flatMap((childNode) => collectRenderedPdfText(childNode))
  }

  if (!isValidElement(node)) {
    return []
  }

  if (typeof node.type === "function") {
    const renderFunction = node.type as (
      props: RenderableElementProps,
    ) => ReactNode

    return collectRenderedPdfText(
      renderFunction(node.props as RenderableElementProps),
    )
  }

  return collectRenderedPdfText(
    (node.props as RenderableElementProps).children,
  )
}

describe("GradeReportDocument", () => {
  it("renders inactive student labels in the exported PDF", () => {
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

    const renderedPdfText = collectRenderedPdfText(
      <GradeReportDocument data={reportData} />,
    ).join(" ")

    expect(renderedPdfText).toContain("Inactive Student")
    expect(renderedPdfText).toContain("Inactive")
  })
})
