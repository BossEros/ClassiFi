import { describe, it, expect, beforeEach } from "vitest"
import { useToastStore } from "@/shared/store/useToastStore"

describe("useToastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  describe("showToast", () => {
    it("should add a toast with default success variant", () => {
      useToastStore.getState().showToast("Operation succeeded")

      const toasts = useToastStore.getState().toasts

      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe("Operation succeeded")
      expect(toasts[0].variant).toBe("success")
      expect(toasts[0].id).toBeDefined()
    })

    it("should add a toast with specified variant", () => {
      useToastStore.getState().showToast("Something failed", "error")

      const toasts = useToastStore.getState().toasts

      expect(toasts).toHaveLength(1)
      expect(toasts[0].variant).toBe("error")
    })

    it("should add multiple toasts", () => {
      useToastStore.getState().showToast("First")
      useToastStore.getState().showToast("Second")
      useToastStore.getState().showToast("Third")

      expect(useToastStore.getState().toasts).toHaveLength(3)
    })

    it("should generate unique IDs for each toast", () => {
      useToastStore.getState().showToast("First")
      useToastStore.getState().showToast("Second")

      const toasts = useToastStore.getState().toasts

      expect(toasts[0].id).not.toBe(toasts[1].id)
    })
  })

  describe("dismissToast", () => {
    it("should remove a specific toast by ID", () => {
      useToastStore.getState().showToast("First")
      useToastStore.getState().showToast("Second")

      const toasts = useToastStore.getState().toasts
      const firstToastId = toasts[0].id

      useToastStore.getState().dismissToast(firstToastId)

      const remainingToasts = useToastStore.getState().toasts

      expect(remainingToasts).toHaveLength(1)
      expect(remainingToasts[0].message).toBe("Second")
    })

    it("should not affect other toasts when dismissing", () => {
      useToastStore.getState().showToast("Keep")
      useToastStore.getState().showToast("Remove")
      useToastStore.getState().showToast("Keep Too")

      const toasts = useToastStore.getState().toasts
      useToastStore.getState().dismissToast(toasts[1].id)

      const remaining = useToastStore.getState().toasts

      expect(remaining).toHaveLength(2)
      expect(remaining[0].message).toBe("Keep")
      expect(remaining[1].message).toBe("Keep Too")
    })

    it("should handle dismissing non-existent ID gracefully", () => {
      useToastStore.getState().showToast("Toast")
      useToastStore.getState().dismissToast("non-existent-id")

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })
})
