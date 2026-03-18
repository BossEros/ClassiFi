import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { AssignmentsTabContent } from "@/presentation/components/teacher/classDetail/AssignmentsTabContent"

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
  }: {
    activeView: "module" | "list"
    onViewChange: (view: "module" | "list") => void
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

  it("allows switching back to Modules after visiting the list view with no modules", async () => {
    const user = userEvent.setup()

    render(<AssignmentsTabContent {...baseProps} />)

    await user.click(screen.getByRole("button", { name: "List" }))
    expect(screen.getByText("No assignments yet")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Modules" }))
    expect(screen.getByText("No modules yet")).toBeInTheDocument()
  })
})
