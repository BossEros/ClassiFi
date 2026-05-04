import { describe, expect, it } from "vitest"
import type { EnrolledStudent } from "@/data/api/class.types"
import { buildTeacherClassListCsvContent } from "@/presentation/utils/teacherClassListCsv"
import { buildClassListReportData } from "@/presentation/components/teacher/classDetail/pdf/classListReportBuilder"

const students: EnrolledStudent[] = [
  {
    id: 1,
    firstName: "Amy",
    lastName: "Anderson",
    email: "amy@example.test",
    avatarUrl: null,
    isActive: true,
    enrolledAt: "2026-01-15T08:30:00.000Z" as EnrolledStudent["enrolledAt"],
    fullName: "Amy Anderson",
  },
  {
    id: 2,
    firstName: "Ben",
    lastName: 'O"Connor',
    email: "ben@example.test",
    avatarUrl: null,
    isActive: false,
    enrolledAt: "2026-02-20T09:45:00.000Z" as EnrolledStudent["enrolledAt"],
    fullName: 'Ben O"Connor',
  },
]

describe("teacher class list export utilities", () => {
  it("builds a CSV class list with status labels and escaped cells", () => {
    const csvContent = buildTeacherClassListCsvContent(students)

    expect(csvContent).toContain('"Student Name","Email","Status","Enrolled At"')
    expect(csvContent).toContain('"Amy Anderson","amy@example.test","Active","Jan 15, 2026"')
    expect(csvContent).toContain('"Ben O""Connor","ben@example.test","Inactive","Feb 20, 2026"')
  })

  it("builds PDF report data with class metadata and roster summary", () => {
    const reportData = buildClassListReportData({
      students,
      className: "Algorithms",
      classCode: "ALG123",
      teacherName: "Dr. Cruz",
      rosterScopeLabel: "Inactive students",
      downloadedAt: new Date("2026-03-01T10:00:00.000Z"),
    })

    expect(reportData.title).toBe("Class List - Algorithms")
    expect(reportData.reportMetadata).toEqual(
      expect.arrayContaining([
        { label: "Class", value: "Algorithms" },
        { label: "Class Code", value: "ALG123" },
        { label: "Teacher", value: "Dr. Cruz" },
        { label: "Roster Scope", value: "Inactive students" },
        { label: "Total Students", value: "2" },
      ]),
    )
    expect(reportData.summaryMetrics).toEqual([
      { label: "Active Students", value: "1" },
      { label: "Inactive Students", value: "1" },
      { label: "Included Students", value: "2" },
    ])
    expect(reportData.studentRows).toEqual([
      {
        studentName: "Amy Anderson",
        email: "amy@example.test",
        statusLabel: "Active",
        isActive: true,
        enrolledAt: "Jan 15, 2026",
      },
      {
        studentName: 'Ben O"Connor',
        email: "ben@example.test",
        statusLabel: "Inactive",
        isActive: false,
        enrolledAt: "Feb 20, 2026",
      },
    ])
  })
})
