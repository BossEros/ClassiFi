import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"

describe("useZodForm", () => {
  it("uses default values", () => {
    const schema = z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: {
          email: "teacher@classifi.com",
          password: "Password1!",
        },
      }),
    )

    expect(result.current.getValues()).toEqual({
      email: "teacher@classifi.com",
      password: "Password1!",
    })
  })

  it("validates fields with zod resolver", async () => {
    const schema = z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: {
          email: "",
          password: "",
        },
        mode: "onSubmit",
      }),
    )

    act(() => {
      result.current.register("email")
      result.current.register("password")
      result.current.setValue("email", "invalid-email", {
        shouldValidate: true,
      })
      result.current.setValue("password", "123", {
        shouldValidate: true,
      })
    })

    await waitFor(() => {
      expect(result.current.formState.errors.email?.message).toBe(
        "Please enter a valid email address",
      )
      expect(result.current.formState.errors.password?.message).toBe(
        "Password must be at least 8 characters",
      )
    })
  })

  it("returns transformed schema output on submit", async () => {
    const schema = z.object({
      email: z.string().trim().toLowerCase().email("Invalid email"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })

    const onValidSubmit = vi.fn()

    const { result } = renderHook(() =>
      useZodForm({
        schema,
        defaultValues: {
          email: "",
          password: "",
        },
      }),
    )

    act(() => {
      result.current.setValue("email", "  TEST@CLASSIFI.COM  ")
      result.current.setValue("password", "Password1!")
    })

    await act(async () => {
      await result.current.handleSubmit(onValidSubmit)()
    })

    expect(onValidSubmit).toHaveBeenCalledTimes(1)
    expect(onValidSubmit.mock.calls[0]?.[0]).toEqual({
      email: "test@classifi.com",
      password: "Password1!",
    })
  })
})
