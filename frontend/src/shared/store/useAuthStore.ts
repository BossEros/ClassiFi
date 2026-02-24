import { create } from "zustand"
import type { User } from "@/business/models/auth/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

const USER_STORAGE_KEY = "user"
const AUTH_STORAGE_SYNC_FLAG = "__CLASSIFI_AUTH_STORAGE_SYNC__"

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

const getInitialUser = (): User | null => {
  if (!isBrowserEnvironment()) {
    return null
  }

  try {
    const userJson = localStorage.getItem(USER_STORAGE_KEY)
    return userJson ? (JSON.parse(userJson) as User) : null
  } catch {
    return null
  }
}

const initialUser = getInitialUser()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,

  login: (user: User) => {
    if (isBrowserEnvironment()) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }

    set({ user, isAuthenticated: true })
  },

  logout: () => {
    if (isBrowserEnvironment()) {
      localStorage.removeItem(USER_STORAGE_KEY)
    }

    set({ user: null, isAuthenticated: false })
  },
}))

if (
  isBrowserEnvironment() &&
  !(window as Window & { [AUTH_STORAGE_SYNC_FLAG]?: boolean })[
    AUTH_STORAGE_SYNC_FLAG
  ]
) {
  ;(window as Window & { [AUTH_STORAGE_SYNC_FLAG]?: boolean })[
    AUTH_STORAGE_SYNC_FLAG
  ] = true

  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key !== USER_STORAGE_KEY && event.key !== null) {
      return
    }

    const syncedUser = getInitialUser()
    useAuthStore.setState({
      user: syncedUser,
      isAuthenticated: !!syncedUser,
    })
  })
}
