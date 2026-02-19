import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/shared/utils/cn"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Pagination component for navigating through paginated content.
 *
 * @param currentPage - The currently active page (1-indexed)
 * @param totalPages - Total number of pages available
 * @param totalItems - Total number of items across all pages
 * @param itemsPerPage - Number of items displayed per page
 * @param onPageChange - Callback function when page changes
 * @param className - Optional additional CSS classes
 * @returns A React element representing the pagination controls with page numbers and navigation buttons.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: PaginationProps) {
  // Calculate the range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem =
    totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems)

  /**
   * Generate array of page numbers to display with ellipsis for large page counts.
   * Logic:
   * - Return empty array if no pages
   * - Show all pages if totalPages <= 7
   * - Otherwise show: [1] ... [current-1, current, current+1] ... [last]
   */
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages === 0) {
      return []
    }

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []

    // Always show first page
    pages.push(1)

    // Add ellipsis or pages before current
    if (currentPage > 3) {
      pages.push("...")
    } else if (currentPage === 3) {
      pages.push(2)
    }

    // Add pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }

    // Add ellipsis or pages after current
    if (currentPage < totalPages - 2) {
      pages.push("...")
    } else if (currentPage === totalPages - 2) {
      pages.push(totalPages - 1)
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  const handlePrevious = () => {
    if (totalPages > 0 && currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (totalPages > 0 && currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 pt-4 border-t border-white/10",
        className,
      )}
    >
      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={totalPages === 0 || currentPage === 1}
          aria-label="Previous page"
          aria-disabled={totalPages === 0 || currentPage === 1}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "border border-white/10",
            totalPages === 0 || currentPage === 1
              ? "opacity-50 cursor-not-allowed text-gray-500"
              : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-500 select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  isActive
                    ? "bg-teal-600 text-white border border-teal-500/40"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={totalPages === 0 || currentPage === totalPages}
          aria-label="Next page"
          aria-disabled={totalPages === 0 || currentPage === totalPages}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "border border-white/10",
            totalPages === 0 || currentPage === totalPages
              ? "opacity-50 cursor-not-allowed text-gray-500"
              : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Count Display */}
      <div className="text-sm text-gray-400">
        Showing {startItem}-{endItem} of {totalItems} students
      </div>
    </div>
  )
}
