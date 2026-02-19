import { describe, it, expect, vi, beforeEach } from "vitest"
import { supabaseAuthAdapter } from "@/data/api/supabaseAuthAdapter"
import { supabase } from "@/data/api/supabaseClient"
import type {
  Session,
  AuthResponse,
  AuthError,
  User,
} from "@supabase/supabase-js"

// ============================================================================
// Typed Mock Helpers
// ============================================================================

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "mock-user-id",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  }) as User

const createMockSession = (overrides: Partial<Session> = {}): Session =>
  ({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: createMockUser(),
    ...overrides,
  }) as Session

const createMockAuthResponse = (
  overrides: Partial<AuthResponse> = {},
): AuthResponse =>
  ({
    data: { user: createMockUser(), session: createMockSession() },
    error: null,
    ...overrides,
  }) as AuthResponse

const createMockAuthError = (overrides: Partial<AuthError> = {}): AuthError =>
  ({
    name: "AuthError",
    message: "Default error message",
    status: 400,
    ...overrides,
  }) as AuthError

// Mock the supabase client
vi.mock("@/data/api/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      setSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

describe("SupabaseAuthAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("initializeResetSession", () => {
    it("should return failure if URL contains an error", async () => {
      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#error=access_denied&error_description=User+is+not+allowed",
        search: "",
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe("User is not allowed")
    })

    it("should return failure if token type is not recovery and no session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#type=signup", // Not recovery
        search: "",
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Invalid reset link type")
    })

    it("should return success if already has a session and type is not recovery", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      })

      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#type=signup",
        search: "",
      })

      expect(result.success).toBe(true)
    })

    it("should return success when valid recovery tokens are provided", async () => {
      const mockSession = createMockSession()

      vi.mocked(supabase.auth.setSession).mockResolvedValue(
        createMockAuthResponse({
          data: { session: mockSession, user: mockSession.user },
        }),
      )

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#access_token=abc&refresh_token=def&type=recovery",
        search: "",
      })

      expect(result.success).toBe(true)
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: "abc",
        refresh_token: "def",
      })
    })

    it("should return failure if tokens are missing in recovery mode", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#type=recovery", // Missing tokens
        search: "",
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Missing required tokens")
    })

    it("should return failure if setSession fails", async () => {
      vi.mocked(supabase.auth.setSession).mockResolvedValue({
        data: { session: null, user: null },
        error: createMockAuthError({ message: "Invalid token" }),
      })

      const result = await supabaseAuthAdapter.initializeResetSession({
        hash: "#access_token=bad&refresh_token=bad&type=recovery",
        search: "",
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Unable to establish reset session")
    })
  })
})
