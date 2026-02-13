import { useEffect } from "react"

/**
 * Registers a document-level click handler and cleans it up on unmount.
 *
 * @param onDocumentClick - Callback invoked for each document click event.
 */
export function useDocumentClick(
  onDocumentClick: (event: MouseEvent) => void,
): void {
  useEffect(() => {
    document.addEventListener("click", onDocumentClick)

    return () => {
      document.removeEventListener("click", onDocumentClick)
    }
  }, [onDocumentClick])
}
