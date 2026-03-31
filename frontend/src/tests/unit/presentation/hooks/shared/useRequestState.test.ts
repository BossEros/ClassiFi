import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRequestState } from "@/presentation/hooks/shared/useRequestState"

describe("useRequestState", () => {
  it("should start with loading true by default", () => {
    const { result } = renderHook(() => useRequestState())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it("should start with loading false when specified", () => {
    const { result } = renderHook(() => useRequestState(false))

    expect(result.current.isLoading).toBe(false)
  })

  it("should handle successful request", async () => {
    const { result } = renderHook(() => useRequestState(false))

    const requestFn = vi.fn().mockResolvedValue({ data: "success" })
    const onSuccess = vi.fn()

    await act(async () => {
      await result.current.executeRequest({
        requestFn,
        onSuccess,
        fallbackErrorMessage: "Failed",
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith({ data: "success" })
  })

  it("should set error from Error instance on failure", async () => {
    const { result } = renderHook(() => useRequestState(false))

    const requestFn = vi.fn().mockRejectedValue(new Error("Server error"))
    const onSuccess = vi.fn()

    await act(async () => {
      await result.current.executeRequest({
        requestFn,
        onSuccess,
        fallbackErrorMessage: "Fallback",
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe("Server error")
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("should use fallback error message for non-Error exceptions", async () => {
    const { result } = renderHook(() => useRequestState(false))

    const requestFn = vi.fn().mockRejectedValue("unknown error")
    const onSuccess = vi.fn()

    await act(async () => {
      await result.current.executeRequest({
        requestFn,
        onSuccess,
        fallbackErrorMessage: "Something went wrong",
      })
    })

    expect(result.current.error).toBe("Something went wrong")
  })

  it("should clear previous error on new request", async () => {
    const { result } = renderHook(() => useRequestState(false))

    // First: fail
    await act(async () => {
      await result.current.executeRequest({
        requestFn: vi.fn().mockRejectedValue(new Error("fail")),
        onSuccess: vi.fn(),
        fallbackErrorMessage: "Fallback",
      })
    })

    expect(result.current.error).toBe("fail")

    // Second: succeed
    await act(async () => {
      await result.current.executeRequest({
        requestFn: vi.fn().mockResolvedValue("ok"),
        onSuccess: vi.fn(),
        fallbackErrorMessage: "Fallback",
      })
    })

    expect(result.current.error).toBeNull()
  })

  it("should allow setting error manually via setError", () => {
    const { result } = renderHook(() => useRequestState(false))

    act(() => {
      result.current.setError("Manual error")
    })

    expect(result.current.error).toBe("Manual error")
  })
})
