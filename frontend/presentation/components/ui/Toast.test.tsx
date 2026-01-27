import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast, ToastContainer } from "@/presentation/components/ui/Toast";
describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders message", () => {
      render(<Toast id="1" message="Test message" onDismiss={vi.fn()} />);
      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("renders with role alert", () => {
      render(<Toast id="1" message="Alert" onDismiss={vi.fn()} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      render(<Toast id="1" message="Test" onDismiss={vi.fn()} />);
      expect(
        screen.getByRole("button", { name: "Dismiss" }),
      ).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders success variant by default", () => {
      render(<Toast id="1" message="Success" onDismiss={vi.fn()} />);
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-green");
    });

    it("renders error variant", () => {
      render(
        <Toast id="1" message="Error" variant="error" onDismiss={vi.fn()} />,
      );
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-red");
    });

    it("renders info variant", () => {
      render(
        <Toast id="1" message="Info" variant="info" onDismiss={vi.fn()} />,
      );
      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-blue");
    });
  });

  describe("Auto-dismiss", () => {
    it("calls onDismiss after default duration", async () => {
      const onDismiss = vi.fn();
      render(<Toast id="1" message="Test" onDismiss={onDismiss} />);

      // Fast-forward past default duration (4000ms) + animation time (300ms)
      await act(async () => {
        vi.advanceTimersByTime(4300);
      });

      expect(onDismiss).toHaveBeenCalledWith("1");
    });

    it("calls onDismiss after custom duration", async () => {
      const onDismiss = vi.fn();
      render(
        <Toast id="1" message="Test" duration={2000} onDismiss={onDismiss} />,
      );

      await act(async () => {
        vi.advanceTimersByTime(2300);
      });

      expect(onDismiss).toHaveBeenCalledWith("1");
    });
  });

  describe("Manual Dismiss", () => {
    it("calls onDismiss when dismiss button clicked", async () => {
      const onDismiss = vi.fn();
      render(<Toast id="test-id" message="Test" onDismiss={onDismiss} />);

      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

      // Wait for animation
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onDismiss).toHaveBeenCalledWith("test-id");
    });
  });
});

describe("ToastContainer", () => {
  it("renders nothing when no toasts", () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders multiple toasts", () => {
    const toasts = [
      { id: "1", message: "Toast 1" },
      { id: "2", message: "Toast 2" },
      { id: "3", message: "Toast 3" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
  });

  it("passes onDismiss to each toast", () => {
    const onDismiss = vi.fn();
    const toasts = [{ id: "1", message: "Toast 1" }];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    // Advance timers to complete animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders toasts with correct variants", () => {
    const toasts = [
      { id: "1", message: "Success", variant: "success" as const },
      { id: "2", message: "Error", variant: "error" as const },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);

    const alerts = screen.getAllByRole("alert");
    expect(alerts[0].className).toContain("bg-green");
    expect(alerts[1].className).toContain("bg-red");
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
