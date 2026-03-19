import { describe, expect, it } from "vitest"
import { mergeModuleAssignmentsWithLatestAssignmentState } from "@/presentation/utils/mergeModuleAssignments"
import type { Assignment, Module } from "@/shared/types/class"

function createAssignment(
  overrides: Partial<Assignment> = {},
): Assignment {
  return {
    id: 1,
    classId: 10,
    moduleId: 100,
    assignmentName: "FizzBuzz",
    deadline: "2026-03-20T00:00:00.000Z" as Assignment["deadline"],
    programmingLanguage: "python",
    createdAt: "2026-03-01T00:00:00.000Z" as Assignment["createdAt"],
    ...overrides,
  }
}

function createModule(
  overrides: Partial<Module> = {},
): Module {
  return {
    id: 100,
    classId: 10,
    name: "Module 1",
    isPublished: true,
    createdAt: "2026-03-01T00:00:00.000Z" as Module["createdAt"],
    updatedAt: "2026-03-01T00:00:00.000Z" as Module["updatedAt"],
    assignments: [],
    ...overrides,
  }
}

describe("mergeModuleAssignmentsWithLatestAssignmentState", () => {
  it("prefers the latest flat assignment submission state for module cards", () => {
    const moduleAssignment = createAssignment({
      id: 1,
      hasSubmitted: false,
      grade: null,
    })
    const latestAssignmentState = createAssignment({
      id: 1,
      hasSubmitted: true,
      submittedAt: "2026-03-19T09:00:00.000Z" as Assignment["submittedAt"],
      grade: 50,
      maxGrade: 50,
    })
    const modules = [
      createModule({
        assignments: [moduleAssignment],
      }),
    ]

    const mergedModules =
      mergeModuleAssignmentsWithLatestAssignmentState(modules, [
        latestAssignmentState,
      ])

    expect(mergedModules[0].assignments[0]).toMatchObject({
      id: 1,
      hasSubmitted: true,
      submittedAt: "2026-03-19T09:00:00.000Z",
      grade: 50,
      maxGrade: 50,
    })
  })

  it("keeps the original module assignment when no flat assignment exists", () => {
    const moduleAssignment = createAssignment({
      id: 7,
      hasSubmitted: false,
    })
    const modules = [
      createModule({
        assignments: [moduleAssignment],
      }),
    ]

    const mergedModules =
      mergeModuleAssignmentsWithLatestAssignmentState(modules, [])

    expect(mergedModules[0].assignments[0]).toEqual(moduleAssignment)
  })
})
