import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300))

    expect(result.current).toBe("hello")
  })

  it("should not update until delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 300 } },
    )

    rerender({ value: "updated", delay: 300 })

    expect(result.current).toBe("initial")
  })

  it("should update after delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 300 } },
    )

    rerender({ value: "updated", delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("updated")
  })

  it("should reset timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "first", delay: 300 } },
    )

    rerender({ value: "second", delay: 300 })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    rerender({ value: "third", delay: 300 })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    // "second" should never have been set because timer was reset
    expect(result.current).toBe("first")

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe("third")
  })

  it("should work with numeric values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 0, delay: 500 } },
    )

    rerender({ value: 42, delay: 500 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe(42)
  })
})
