import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "@/presentation/components/ui/Button"

describe("Button", () => {
  describe("Rendering", () => {
    it("renders children correctly", () => {
      render(<Button>Click me</Button>)
      expect(
        screen.getByRole("button", { name: "Click me" }),
      ).toBeInTheDocument()
    })

    it("renders with custom className", () => {
      render(<Button className="custom-class">Test</Button>)
      const button = screen.getByRole("button")
      expect(button).toHaveClass("custom-class")
    })

    it("applies default styling classes", () => {
      render(<Button>Test</Button>)
      const button = screen.getByRole("button")
      expect(button).toHaveClass("rounded-xl")
      expect(button).toHaveClass("font-semibold")
    })
  })

  describe("Loading State", () => {
    it("shows spinner when isLoading is true", () => {
      render(<Button isLoading>Loading</Button>)
      const button = screen.getByRole("button")
      // Check for the Loader2 icon (has animate-spin class)
      const spinner = button.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })

    it("disables button when isLoading is true", () => {
      render(<Button isLoading>Loading</Button>)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("does not show spinner when isLoading is false", () => {
      render(<Button isLoading={false}>Normal</Button>)
      const button = screen.getByRole("button")
      const spinner = button.querySelector(".animate-spin")
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe("Disabled State", () => {
    it("disables button when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("applies disabled styling", () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole("button")
      expect(button).toHaveClass("disabled:opacity-50")
    })
  })

  describe("Click Handling", () => {
    it("calls onClick when clicked", () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      fireEvent.click(screen.getByRole("button"))

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it("does not call onClick when disabled", () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Click
        </Button>,
      )

      fireEvent.click(screen.getByRole("button"))

      expect(handleClick).not.toHaveBeenCalled()
    })

    it("does not call onClick when loading", () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} isLoading>
          Click
        </Button>,
      )

      fireEvent.click(screen.getByRole("button"))

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe("Ref Forwarding", () => {
    it("forwards ref to button element", () => {
      const ref = vi.fn()
      render(<Button ref={ref}>Test</Button>)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe("HTML Attributes", () => {
    it("passes through HTML button attributes", () => {
      render(
        <Button type="submit" data-testid="submit-btn">
          Submit
        </Button>,
      )
      const button = screen.getByTestId("submit-btn")
      expect(button).toHaveAttribute("type", "submit")
    })
  })
})
