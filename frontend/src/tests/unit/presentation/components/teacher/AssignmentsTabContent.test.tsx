import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AssignmentsTabContent } from "@/presentation/components/teacher/classDetail/AssignmentsTabContent"
import type { Module, ISODateString } from "@/data/api/class.types"
import { createMockAssignment } from "@/tests/utils/factories"

vi.mock("@/presentation/components/shared/dashboard/AssignmentFilterBar", () => ({
  AssignmentFilterBar: () => <div>Assignment Filter Bar</div>,
}))

vi.mock("@/presentation/components/shared/dashboard/AssignmentSection", () => ({
  AssignmentSection: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock("@/presentation/components/shared/modules", () => ({
  ViewToggle: ({
    activeView,
    onViewChange,
    isListViewDisabled = false,
  }: {
    activeView: "module" | "list"
    onViewChange: (view: "module" | "list") => void
    isListViewDisabled?: boolean
  }) => (
    <div>
      <button
        type="button"
        aria-pressed={activeView === "module"}
        onClick={() => onViewChange("module")}
      >
        Modules
      </button>
      <button
        type="button"
        aria-pressed={activeView === "list"}
        disabled={isListViewDisabled}
        onClick={() => onViewChange("list")}
      >
        List
      </button>
    </div>
  ),
  ModuleCard: () => <div>Module Card</div>,
  CreateModuleInput: () => <div>Create Module Input</div>,
}))

describe("AssignmentsTabContent", () => {
  const sampleModule: Module = {
    id: 101,
    name: "Module 1",
    classId: 1,
    isPublished: true,
    assignments: [],
    createdAt: "2026-01-01T00:00:00.000Z" as ISODateString,
    updatedAt: "2026-01-01T00:00:00.000Z" as ISODateString,
  }

  const baseProps = {
    assignments: [],
    groupedAssignments: {
      current: [],
      past: [],
    },
    assignmentFilter: "all" as const,
    filterCounts: {
      all: 0,
      pending: 0,
      submitted: 0,
    },
    teacherAssignmentFilter: "all" as const,
    teacherFilterCounts: {
      all: 0,
      current: 0,
      past: 0,
    },
    isTeacher: true,
    onFilterChange: vi.fn(),
    onTeacherFilterChange: vi.fn(),
    onCreateAssignment: vi.fn(),
    onAssignmentClick: vi.fn(),
    modules: [],
    onCreateModule: vi.fn(),
    variant: "light" as const,
  }

  it("shows the empty module state for a new class without modules", () => {
    render(<AssignmentsTabContent {...baseProps} />)

    expect(screen.getByText("No modules yet")).toBeInTheDocument()
    expect(
      screen.getByText("Create your first module to start organizing assignments."),
    ).toBeInTheDocument()
  })

  it("prevents teachers from switching to list view when the class has no modules", async () => {
    const user = userEvent.setup()

    render(<AssignmentsTabContent {...baseProps} />)

    const listViewButton = screen.getByRole("button", { name: "List" })

    expect(listViewButton).toBeDisabled()

    await user.click(listViewButton)
    expect(screen.getByText("No modules yet")).toBeInTheDocument()
  })

  it("returns to module view if the last module is removed while list view is active", async () => {
    const user = userEvent.setup()
    const sampleAssignment = createMockAssignment({ moduleId: sampleModule.id })
    const { rerender } = render(
      <AssignmentsTabContent
        {...baseProps}
        assignments={[sampleAssignment]}
        groupedAssignments={{ current: [sampleAssignment], past: [] }}
        modules={[sampleModule]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "List" }))
    expect(screen.getByText("CURRENT & UPCOMING")).toBeInTheDocument()

    rerender(<AssignmentsTabContent {...baseProps} assignments={[]} modules={[]} />)

    expect(screen.getByText("No modules yet")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "List" })).toBeDisabled()
  })
})
