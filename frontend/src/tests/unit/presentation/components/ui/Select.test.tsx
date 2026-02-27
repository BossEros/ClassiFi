import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Select } from "@/presentation/components/ui/Select"

const mockOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
]

describe("Select", () => {
  describe("Rendering", () => {
    it("renders select element", () => {
      render(<Select options={mockOptions} data-testid="test-select" />)
      expect(screen.getByTestId("test-select")).toBeInTheDocument()
    })

    it("renders all options", () => {
      render(<Select options={mockOptions} />)
      expect(screen.getByText("Option 1")).toBeInTheDocument()
      expect(screen.getByText("Option 2")).toBeInTheDocument()
      expect(screen.getByText("Option 3")).toBeInTheDocument()
    })

    it("renders placeholder when provided", () => {
      render(<Select options={mockOptions} placeholder="Select an option" />)
      expect(screen.getByText("Select an option")).toBeInTheDocument()
    })

    it("placeholder option is disabled", () => {
      render(<Select options={mockOptions} placeholder="Select an option" />)
      const placeholder = screen.getByText("Select an option")
      expect(placeholder).toHaveAttribute("disabled")
    })

    it("applies default styling classes", () => {
      render(<Select options={mockOptions} data-testid="test-select" />)
      const select = screen.getByTestId("test-select")
      expect(select).toHaveClass("rounded-xl")
      expect(select).toHaveClass("border")
    })

    it("applies custom className", () => {
      render(
        <Select
          options={mockOptions}
          className="custom-class"
          data-testid="test-select"
        />,
      )
      expect(screen.getByTestId("test-select")).toHaveClass("custom-class")
    })
  })

  describe("Selection", () => {
    it("calls onChange with selected value", () => {
      const handleChange = vi.fn()
      render(
        <Select
          options={mockOptions}
          onChange={handleChange}
          data-testid="test-select"
        />,
      )

      fireEvent.change(screen.getByTestId("test-select"), {
        target: { value: "option2" },
      })

      expect(handleChange).toHaveBeenCalledWith("option2")
    })

    it("displays selected value", () => {
      render(
        <Select
          options={mockOptions}
          value="option2"
          onChange={() => {}}
          data-testid="test-select"
        />,
      )
      expect(screen.getByTestId("test-select")).toHaveValue("option2")
    })

    it("does not call onChange when not provided", () => {
      // Should not throw error when onChange is undefined
      render(<Select options={mockOptions} data-testid="test-select" />)

      expect(() => {
        fireEvent.change(screen.getByTestId("test-select"), {
          target: { value: "option2" },
        })
      }).not.toThrow()
    })
  })

  describe("Disabled State", () => {
    it("disables select when disabled prop is true", () => {
      render(
        <Select options={mockOptions} disabled data-testid="test-select" />,
      )
      expect(screen.getByTestId("test-select")).toBeDisabled()
    })

    it("applies disabled styling", () => {
      render(
        <Select options={mockOptions} disabled data-testid="test-select" />,
      )
      const select = screen.getByTestId("test-select")
      expect(select).toHaveClass("disabled:opacity-50")
    })
  })

  describe("Empty Options", () => {
    it("renders with empty options array", () => {
      render(<Select options={[]} data-testid="test-select" />)
      expect(screen.getByTestId("test-select")).toBeInTheDocument()
    })

    it("renders only placeholder when options are empty", () => {
      render(
        <Select
          options={[]}
          placeholder="No options"
          data-testid="test-select"
        />,
      )
      expect(screen.getByText("No options")).toBeInTheDocument()
    })
  })

  describe("Ref Forwarding", () => {
    it("forwards ref to select element", () => {
      const ref = vi.fn()
      render(<Select options={mockOptions} ref={ref} />)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLSelectElement)
    })
  })

  describe("Option Values", () => {
    it("sets correct value attribute on options", () => {
      render(<Select options={mockOptions} data-testid="test-select" />)
      const select = screen.getByTestId("test-select")
      const options = select.querySelectorAll("option")

      expect(options[0]).toHaveValue("option1")
      expect(options[1]).toHaveValue("option2")
      expect(options[2]).toHaveValue("option3")
    })
  })
})
