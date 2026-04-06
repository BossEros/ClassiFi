import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { User } from "@/data/api/auth.types"

const mockUser: User = {
  id: "1",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  role: "student",
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  createdAt: new Date("2024-01-01"),
}

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
    window.localStorage.clear()
  })

  describe("initial state", () => {
    it("should start with null user and not authenticated", () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("login", () => {
    it("should set user and mark as authenticated", () => {
      useAuthStore.getState().login(mockUser)

      const state = useAuthStore.getState()

      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it("should persist user to localStorage", () => {
      useAuthStore.getState().login(mockUser)

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      )
    })
  })

  describe("logout", () => {
    it("should clear user and mark as not authenticated", () => {
      useAuthStore.getState().login(mockUser)
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it("should remove user from localStorage", () => {
      useAuthStore.getState().login(mockUser)
      useAuthStore.getState().logout()

      expect(window.localStorage.removeItem).toHaveBeenCalledWith("user")
    })
  })
})
