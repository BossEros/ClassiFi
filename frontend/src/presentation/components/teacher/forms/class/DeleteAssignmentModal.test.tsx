import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DeleteAssignmentModal } from "@/presentation/components/teacher/forms/class/DeleteAssignmentModal"
describe("DeleteAssignmentModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = "unset"
  })

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<DeleteAssignmentModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("renders modal when isOpen is true", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("displays Delete Assignment title", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(
        screen.getByRole("heading", { name: "Delete Assignment" }),
      ).toBeInTheDocument()
    })

    it("displays default assignment title", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByText("this assignment")).toBeInTheDocument()
    })

    it("displays custom assignment title", () => {
      render(
        <DeleteAssignmentModal {...defaultProps} assignmentTitle="Lab 1" />,
      )
      expect(screen.getByText("Lab 1")).toBeInTheDocument()
    })

    it("displays warning message", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()
    })

    it("displays Cancel button", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("displays Delete Assignment button", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(
        screen.getByRole("button", { name: "Delete Assignment" }),
      ).toBeInTheDocument()
    })
  })

  describe("Interactions", () => {
    it("calls onClose when Cancel button clicked", () => {
      const onClose = vi.fn()
      render(<DeleteAssignmentModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("calls onConfirm when Delete button clicked", () => {
      const onConfirm = vi.fn()
      render(<DeleteAssignmentModal {...defaultProps} onConfirm={onConfirm} />)

      fireEvent.click(screen.getByRole("button", { name: "Delete Assignment" }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it("calls onClose when backdrop clicked", () => {
      const onClose = vi.fn()
      const { container } = render(
        <DeleteAssignmentModal {...defaultProps} onClose={onClose} />,
      )

      // Find backdrop (first child div with backdrop class)
      const backdrop = container.querySelector(".backdrop-blur-sm")
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("calls onClose when close button clicked", () => {
      const onClose = vi.fn()
      render(<DeleteAssignmentModal {...defaultProps} onClose={onClose} />)

      // Close button is the one with X icon
      const buttons = screen.getAllByRole("button")
      const closeButton = buttons.find((btn) => btn.querySelector("svg"))
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      expect(onClose).toHaveBeenCalled()
    })

    it("calls onClose when Escape key pressed", () => {
      const onClose = vi.fn()
      render(<DeleteAssignmentModal {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: "Escape" })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("Deleting State", () => {
    it("displays Deleting... text when isDeleting", () => {
      render(<DeleteAssignmentModal {...defaultProps} isDeleting />)
      expect(
        screen.getByRole("button", { name: "Deleting..." }),
      ).toBeInTheDocument()
    })

    it("disables Cancel button when isDeleting", () => {
      render(<DeleteAssignmentModal {...defaultProps} isDeleting />)
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    })

    it("disables Delete button when isDeleting", () => {
      render(<DeleteAssignmentModal {...defaultProps} isDeleting />)
      expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled()
    })

    it("does not close on backdrop click when isDeleting", () => {
      const onClose = vi.fn()
      const { container } = render(
        <DeleteAssignmentModal
          {...defaultProps}
          onClose={onClose}
          isDeleting
        />,
      )

      const backdrop = container.querySelector(".backdrop-blur-sm")
      if (backdrop) {
        fireEvent.click(backdrop)
      }

      expect(onClose).not.toHaveBeenCalled()
    })

    it("does not close on Escape when isDeleting", () => {
      const onClose = vi.fn()
      render(
        <DeleteAssignmentModal
          {...defaultProps}
          onClose={onClose}
          isDeleting
        />,
      )

      fireEvent.keyDown(document, { key: "Escape" })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe("Accessibility", () => {
    it("has role dialog", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("has aria-modal attribute", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true")
    })

    it("has aria-labelledby pointing to title", () => {
      render(<DeleteAssignmentModal {...defaultProps} />)
      const dialog = screen.getByRole("dialog")
      const labelId = dialog.getAttribute("aria-labelledby")
      expect(labelId).toBe("delete-assignment-modal-title")
      expect(document.getElementById(labelId!)).toHaveTextContent(
        "Delete Assignment",
      )
    })
  })

  describe("Body scroll lock", () => {
    it("prevents body scroll when open", () => {
      render(<DeleteAssignmentModal {...defaultProps} isOpen={true} />)
      expect(document.body.style.overflow).toBe("hidden")
    })

    it("restores body scroll when closed", () => {
      const { rerender } = render(
        <DeleteAssignmentModal {...defaultProps} isOpen={true} />,
      )
      expect(document.body.style.overflow).toBe("hidden")

      rerender(<DeleteAssignmentModal {...defaultProps} isOpen={false} />)
      expect(document.body.style.overflow).toBe("unset")
    })
  })
})

