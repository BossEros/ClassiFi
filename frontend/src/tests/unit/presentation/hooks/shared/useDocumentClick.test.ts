import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"

describe("useDocumentClick", () => {
  it("should add a click listener on mount", () => {
    const addSpy = vi.spyOn(document, "addEventListener")
    const handler = vi.fn()

    renderHook(() => useDocumentClick(handler))

    expect(addSpy).toHaveBeenCalledWith("click", handler)

    addSpy.mockRestore()
  })

  it("should remove the click listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener")
    const handler = vi.fn()

    const { unmount } = renderHook(() => useDocumentClick(handler))
    unmount()

    expect(removeSpy).toHaveBeenCalledWith("click", handler)

    removeSpy.mockRestore()
  })

  it("should invoke the handler on document clicks", () => {
    const handler = vi.fn()

    renderHook(() => useDocumentClick(handler))

    document.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
