import { describe, expect, it } from "vitest"
import { toClassGradebookDTO } from "../../src/modules/gradebook/gradebook.mapper.js"

describe("toClassGradebookDTO", () => {
  it("includes the student active status in each gradebook row", () => {
    const result = toClassGradebookDTO({
      assignments: [
        {
          id: 1,
          name: "Quiz 1",
          totalScore: 100,
          deadline: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
      students: [
        {
          id: 22,
          name: "Inactive Student",
          email: "inactive@student.test",
          isActive: false,
          grades: [
            {
              assignmentId: 1,
              submissionId: 11,
              grade: 87,
              gradeBreakdown: {
                originalGrade: 87,
                latePenaltyPercent: 0,
                similarityPenaltyPercent: 0,
                similarityScore: null,
                finalGrade: 87,
                effectiveGrade: 87,
                isOverridden: false,
              },
              isOverridden: false,
              overrideReason: null,
              submittedAt: new Date("2026-04-02T00:00:00.000Z"),
            },
          ],
        },
      ],
    })

    expect(result.students[0]).toMatchObject({
      id: 22,
      isActive: false,
    })
  })
})
