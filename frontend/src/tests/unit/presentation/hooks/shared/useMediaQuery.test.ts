import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useMediaQuery, useIsMobile, useIsTabletOrBelow } from "@/presentation/hooks/shared/useMediaQuery"

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return false when media query does not match", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 639px)"))

    expect(result.current).toBe(false)
  })

  it("should return the match status from matchMedia", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(max-width: 639px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery("(max-width: 639px)"))

    expect(result.current).toBe(true)
  })
})

describe("useIsMobile", () => {
  it("should use the mobile breakpoint query", () => {
    renderHook(() => useIsMobile())

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 639px)")
  })
})

describe("useIsTabletOrBelow", () => {
  it("should use the tablet breakpoint query", () => {
    renderHook(() => useIsTabletOrBelow())

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 1023px)")
  })
})
