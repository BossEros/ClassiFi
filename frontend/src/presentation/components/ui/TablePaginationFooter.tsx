import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationFooterProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

/**
 * Renders compact table pagination controls used by teacher dashboard tables.
 *
 * @param currentPage - Current active page (1-indexed).
 * @param totalPages - Total available pages.
 * @param totalItems - Total filtered rows.
 * @param itemsPerPage - Number of rows shown per page.
 * @param onPageChange - Called when previous/next is triggered.
 * @returns Footer with range text and previous/next controls.
 */
export function TablePaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TablePaginationFooterProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems)

  const handlePreviousPage = () => {
    onPageChange(Math.max(currentPage - 1, 1))
  }

  const handleNextPage = () => {
    onPageChange(Math.min(currentPage + 1, totalPages))
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
      <span className="text-slate-400 sm:order-1 order-2 sm:text-left text-right">
        Showing {startItem}-{endItem} of {totalItems} results
      </span>

      <div className="flex items-center justify-end gap-2 sm:order-2 order-1">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-3 py-1.5 text-slate-300">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

