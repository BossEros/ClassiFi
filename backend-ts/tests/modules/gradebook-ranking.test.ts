import { describe, expect, it } from "vitest"
import {
  calculateStudentAveragePercentage,
  getStudentRankFromGradebook,
  sortGradebookStudentsByRank,
} from "../../src/modules/gradebook/gradebook-ranking.js"

const gradebookAssignments = [
  { id: 1, name: "Quiz 1", totalScore: 100, deadline: null },
  { id: 2, name: "Machine Problem", totalScore: 50, deadline: null },
]

describe("gradebook ranking", () => {
  it("sorts active students by displayed average before inactive students", () => {
    const sortedStudents = sortGradebookStudentsByRank(gradebookAssignments, [
      {
        id: 3,
        name: "Zara Active",
        email: "zara@classifi.test",
        isActive: true,
        grades: [
          { assignmentId: 1, grade: 90 },
          { assignmentId: 2, grade: 45 },
        ],
      },
      {
        id: 2,
        name: "Aaron Active",
        email: "aaron@classifi.test",
        isActive: true,
        grades: [
          { assignmentId: 1, grade: 100 },
          { assignmentId: 2, grade: 50 },
        ],
      },
      {
        id: 1,
        name: "Bella Inactive",
        email: "bella@classifi.test",
        isActive: false,
        grades: [
          { assignmentId: 1, grade: 100 },
          { assignmentId: 2, grade: 50 },
        ],
      },
    ])

    expect(sortedStudents.map((student) => student.name)).toEqual([
      "Aaron Active",
      "Zara Active",
      "Bella Inactive",
    ])
  })

  it("falls back to alphabetical ordering when displayed averages tie", () => {
    const sortedStudents = sortGradebookStudentsByRank(gradebookAssignments, [
      {
        id: 2,
        name: "Zoe Student",
        email: "zoe@classifi.test",
        isActive: true,
        grades: [
          { assignmentId: 1, grade: 80 },
          { assignmentId: 2, grade: 40 },
        ],
      },
      {
        id: 1,
        name: "Adam Student",
        email: "adam@classifi.test",
        isActive: true,
        grades: [
          { assignmentId: 1, grade: 80 },
          { assignmentId: 2, grade: 40 },
        ],
      },
    ])

    expect(sortedStudents.map((student) => student.name)).toEqual([
      "Adam Student",
      "Zoe Student",
    ])
  })

  it("returns a null rank when the student has no graded assignments yet", () => {
    const rank = getStudentRankFromGradebook(
      gradebookAssignments,
      [
        {
          id: 1,
          name: "Ready Student",
          email: "ready@classifi.test",
          isActive: true,
          grades: [
            { assignmentId: 1, grade: 90 },
            { assignmentId: 2, grade: 45 },
          ],
        },
        {
          id: 2,
          name: "New Student",
          email: "new@classifi.test",
          isActive: true,
          grades: [
            { assignmentId: 1, grade: null },
            { assignmentId: 2, grade: null },
          ],
        },
      ],
      2,
    )

    expect(rank).toBeNull()
  })

  it("computes rank from the same rounded average shown in the gradebook", () => {
    const studentRank = getStudentRankFromGradebook(
      gradebookAssignments,
      [
        {
          id: 1,
          name: "Top Student",
          email: "top@classifi.test",
          isActive: true,
          grades: [
            { assignmentId: 1, grade: 100 },
            { assignmentId: 2, grade: 50 },
          ],
        },
        {
          id: 2,
          name: "Target Student",
          email: "target@classifi.test",
          isActive: true,
          grades: [
            { assignmentId: 1, grade: 80 },
            { assignmentId: 2, grade: 40 },
          ],
        },
        {
          id: 3,
          name: "Third Student",
          email: "third@classifi.test",
          isActive: true,
          grades: [
            { assignmentId: 1, grade: 70 },
            { assignmentId: 2, grade: 35 },
          ],
        },
      ],
      2,
    )

    expect(calculateStudentAveragePercentage(gradebookAssignments, [
      { assignmentId: 1, grade: 80 },
      { assignmentId: 2, grade: 40 },
    ])).toBe(80)
    expect(studentRank).toEqual({
      rank: 2,
      totalStudents: 3,
      percentile: 67,
    })
  })
})
