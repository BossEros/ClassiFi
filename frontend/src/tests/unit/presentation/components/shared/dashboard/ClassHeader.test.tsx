import { render, screen, fireEvent } from "@testing-library/react"
import { ClassHeader } from "@/presentation/components/shared/dashboard/ClassHeader"
import { vi, describe, it, expect } from "vitest"
import type { ReactNode } from "react"

// Define mock prop interfaces
interface MockButtonProps {
  children?: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  isLoading?: boolean
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

interface MockDropdownMenuItem {
  id: string | number
  label: ReactNode
  onClick?: () => void
  icon?: unknown
  variant?: "default" | "danger"
}

interface MockDropdownMenuProps {
  items?: MockDropdownMenuItem[]
  className?: string
  triggerLabel?: string
}

// Type guard for Button props
function isMockButtonProps(props: unknown): props is MockButtonProps {
  if (typeof props !== "object" || props === null) {
    return false
  }

  const p = props as Record<string, unknown>

  return (
    (p.children === undefined || typeof p.children !== "undefined") &&
    (p.onClick === undefined || typeof p.onClick === "function") &&
    (p.className === undefined || typeof p.className === "string") &&
    (p.disabled === undefined || typeof p.disabled === "boolean") &&
    (p.isLoading === undefined || typeof p.isLoading === "boolean")
  )
}

// Type guard for DropdownMenu props
function isMockDropdownMenuProps(
  props: unknown,
): props is MockDropdownMenuProps {
  if (typeof props !== "object" || props === null) {
    return false
  }

  const p = props as Record<string, unknown>

  if (p.items !== undefined && !Array.isArray(p.items)) {
    return false
  }

  if (p.className !== undefined && typeof p.className !== "string") {
    return false
  }

  if (p.triggerLabel !== undefined && typeof p.triggerLabel !== "string") {
    return false
  }

  return true
}

// Type guard for DropdownMenuItem
function isMockDropdownMenuItem(item: unknown): item is MockDropdownMenuItem {
  if (typeof item !== "object" || item === null) {
    return false
  }

  const i = item as Record<string, unknown>

  return (
    (typeof i.id === "string" || typeof i.id === "number") &&
    i.label !== undefined &&
    (i.onClick === undefined || typeof i.onClick === "function")
  )
}

// Mock dependencies
vi.mock("@/presentation/components/ui/Button", () => ({
  Button: (props: unknown) => {
    if (!isMockButtonProps(props)) {
      return <button>Invalid Button Props</button>
    }

    const { children, onClick, className, disabled, isLoading } = props

    return (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Loading..." : children}
      </button>
    )
  },
}))

vi.mock("@/presentation/components/ui/DropdownMenu", () => ({
  DropdownMenu: (props: unknown) => {
    if (!isMockDropdownMenuProps(props)) {
      return <div>Invalid DropdownMenu Props</div>
    }

    const { items } = props

    if (!items || items.length === 0) {
      return <div>No items</div>
    }

    return (
      <div>
        {items.map((item) => {
          if (!isMockDropdownMenuItem(item)) {
            return <div key="invalid">Invalid item</div>
          }

          return (
            <div key={item.id} onClick={item.onClick}>
              {item.label}
            </div>
          )
        })}
      </div>
    )
  },
}))

describe("ClassHeader", () => {
  const defaultProps = {
    classNameTitle: "Intro to CS",
    instructorName: "Dr. Smith",
    schedule: {
      days: ["monday" as const, "wednesday" as const],
      startTime: "10:00",
      endTime: "11:00",
    },
    studentCount: 20,
    isTeacher: false,
  }

  it("renders class details correctly", () => {
    render(<ClassHeader {...defaultProps} />)
    expect(screen.getByText("Intro to CS")).toBeInTheDocument()
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument()
    expect(screen.getByText(/MW 10:00 - 11:00 AM/)).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    const description = "This is an introductory course to computer science"
    render(<ClassHeader {...defaultProps} description={description} />)
    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it("does not render description section when not provided", () => {
    const { container } = render(<ClassHeader {...defaultProps} />)
    const descriptionText = container.querySelector(".text-gray-400")
    expect(descriptionText).not.toBeInTheDocument()
  })

  it("renders teacher actions when isTeacher is true", () => {
    render(<ClassHeader {...defaultProps} isTeacher={true} />)

    expect(screen.queryByText("Leave Class")).not.toBeInTheDocument()

    // Check for edit/delete options in dropdown (simplified check since we mocked it)
    expect(screen.getByText("Edit Class")).toBeInTheDocument()
    expect(screen.getByText("Delete Class")).toBeInTheDocument()
  })

  it("renders student actions when isTeacher is false", () => {
    const onLeaveClass = vi.fn()
    render(
      <ClassHeader
        {...defaultProps}
        isTeacher={false}
        onLeaveClass={onLeaveClass}
      />,
    )

    expect(screen.getByText("Leave Class")).toBeInTheDocument()
    expect(screen.queryByText("Edit Class")).not.toBeInTheDocument()
  })

  it("calls action handlers", () => {
    const onLeaveClass = vi.fn()
    render(
      <ClassHeader
        {...defaultProps}
        isTeacher={false}
        onLeaveClass={onLeaveClass}
      />,
    )

    fireEvent.click(screen.getByText("Leave Class"))
    expect(onLeaveClass).toHaveBeenCalled()
  })
})
