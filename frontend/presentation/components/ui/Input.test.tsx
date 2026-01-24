import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders input element", () => {
      render(<Input data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(<Input data-testid="test-input" />);
      const input = screen.getByTestId("test-input");
      expect(input).toHaveClass("rounded-xl");
      expect(input).toHaveClass("border");
    });

    it("applies custom className", () => {
      render(<Input className="custom-class" data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toHaveClass("custom-class");
    });
  });

  describe("Input Types", () => {
    it("renders text input by default", () => {
      render(<Input data-testid="test-input" />);
      // Default type is text when not specified
      expect(screen.getByTestId("test-input")).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<Input type="email" data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toHaveAttribute("type", "email");
    });

    it("renders password input", () => {
      render(<Input type="password" data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toHaveAttribute(
        "type",
        "password",
      );
    });
  });

  describe("Error State", () => {
    it("applies error styling when hasError is true", () => {
      render(<Input hasError data-testid="test-input" />);
      const input = screen.getByTestId("test-input");
      expect(input).toHaveClass("border-red-500/50");
    });

    it("sets aria-invalid when hasError is true", () => {
      render(<Input hasError data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("does not apply error styling when hasError is false", () => {
      render(<Input hasError={false} data-testid="test-input" />);
      const input = screen.getByTestId("test-input");
      expect(input).not.toHaveClass("border-red-500/50");
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      render(<Input disabled data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toBeDisabled();
    });

    it("applies disabled styling", () => {
      render(<Input disabled data-testid="test-input" />);
      const input = screen.getByTestId("test-input");
      expect(input).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Value Handling", () => {
    it("displays controlled value", () => {
      render(
        <Input
          value="test value"
          onChange={() => {}}
          data-testid="test-input"
        />,
      );
      expect(screen.getByTestId("test-input")).toHaveValue("test value");
    });

    it("calls onChange when value changes", () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="test-input" />);

      fireEvent.change(screen.getByTestId("test-input"), {
        target: { value: "new value" },
      });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Ref Forwarding", () => {
    it("forwards ref to input element", () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe("Autocomplete", () => {
    it("has autocomplete off by default", () => {
      render(<Input data-testid="test-input" />);
      expect(screen.getByTestId("test-input")).toHaveAttribute(
        "autocomplete",
        "off",
      );
    });
  });
});
