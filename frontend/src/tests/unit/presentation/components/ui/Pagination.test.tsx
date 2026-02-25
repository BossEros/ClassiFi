import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Pagination } from "@/presentation/components/ui/Pagination"

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
  }

  it("renders pagination controls with correct page numbers", () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByLabelText("Previous page")).toBeInTheDocument()
    expect(screen.getByLabelText("Next page")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 4")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 5")).toBeInTheDocument()
  })

  it("displays correct count text", () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByText("Showing 1-10 of 50 students")).toBeInTheDocument()
  })

  it("displays correct count text for last page", () => {
    render(<Pagination {...defaultProps} currentPage={5} />)

    expect(screen.getByText("Showing 41-50 of 50 students")).toBeInTheDocument()
  })

  it("disables Previous button on first page", () => {
    render(<Pagination {...defaultProps} currentPage={1} />)

    const prevButton = screen.getByLabelText("Previous page")
    expect(prevButton).toBeDisabled()
    expect(prevButton).toHaveAttribute("aria-disabled", "true")
  })

  it("disables Next button on last page", () => {
    render(<Pagination {...defaultProps} currentPage={5} />)

    const nextButton = screen.getByLabelText("Next page")
    expect(nextButton).toBeDisabled()
    expect(nextButton).toHaveAttribute("aria-disabled", "true")
  })

  it("highlights current page", () => {
    render(<Pagination {...defaultProps} currentPage={3} />)

    const currentPageButton = screen.getByLabelText("Page 3")
    expect(currentPageButton).toHaveAttribute("aria-current", "page")
  })

  it("calls onPageChange when clicking page number", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(<Pagination {...defaultProps} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText("Page 3"))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("calls onPageChange when clicking Next button", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination
        {...defaultProps}
        currentPage={2}
        onPageChange={onPageChange}
      />,
    )

    await user.click(screen.getByLabelText("Next page"))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it("calls onPageChange when clicking Previous button", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    )

    await user.click(screen.getByLabelText("Previous page"))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it("does not call onPageChange when clicking current page", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination
        {...defaultProps}
        currentPage={2}
        onPageChange={onPageChange}
      />,
    )

    await user.click(screen.getByLabelText("Page 2"))

    expect(onPageChange).not.toHaveBeenCalled()
  })

  it("shows ellipsis for many pages", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />)

    const ellipses = screen.getAllByText("...")
    expect(ellipses.length).toBeGreaterThan(0)
  })

  it("shows all pages when totalPages <= 7", () => {
    render(<Pagination {...defaultProps} totalPages={7} />)

    for (let i = 1; i <= 7; i++) {
      expect(screen.getByLabelText(`Page ${i}`)).toBeInTheDocument()
    }

    expect(screen.queryByText("...")).not.toBeInTheDocument()
  })

  it("shows correct pages with ellipsis for page 1 of 20", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={1} />)

    expect(screen.getByLabelText("Page 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 20")).toBeInTheDocument()
    expect(screen.getByText("...")).toBeInTheDocument()
  })

  it("shows correct pages with ellipsis for middle page", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />)

    expect(screen.getByLabelText("Page 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 9")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 10")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 11")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 20")).toBeInTheDocument()

    const ellipses = screen.getAllByText("...")
    expect(ellipses).toHaveLength(2)
  })

  it("shows correct pages with ellipsis for last page", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={20} />)

    expect(screen.getByLabelText("Page 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 19")).toBeInTheDocument()
    expect(screen.getByLabelText("Page 20")).toBeInTheDocument()
    expect(screen.getByText("...")).toBeInTheDocument()
  })

  it("renders with single page", () => {
    render(<Pagination {...defaultProps} totalPages={1} totalItems={5} />)

    expect(screen.getByLabelText("Page 1")).toBeInTheDocument()
    expect(screen.getByText("Showing 1-5 of 5 students")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <Pagination {...defaultProps} className="custom-class" />,
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })
})
