import { create } from "zustand"

export type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const THEME_STORAGE_KEY = "classifi-theme"

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

const getInitialTheme = (): Theme => {
  if (!isBrowserEnvironment()) {
    return "light"
  }

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme
    }
  } catch {
    // Ignore error
  }

  // Phase 1 decision: default to light if no preference
  return "light"
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light"
      if (isBrowserEnvironment()) {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme)
        document.documentElement.classList.toggle("light", newTheme === "light")
        document.documentElement.classList.toggle("dark", newTheme === "dark")
      }
      return { theme: newTheme }
    })
  },

  setTheme: (theme: Theme) => {
    if (isBrowserEnvironment()) {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      document.documentElement.classList.toggle("light", theme === "light")
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
    set({ theme })
  },
}))

// Synchronize theme across tabs
if (isBrowserEnvironment()) {
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      const newTheme = event.newValue as Theme
      if (newTheme === "light" || newTheme === "dark") {
        useThemeStore.setState({ theme: newTheme })
        document.documentElement.classList.toggle("light", newTheme === "light")
        document.documentElement.classList.toggle("dark", newTheme === "dark")
      }
    }
  })

  // Initialize DOM on first load (redundant with index.html script but good for safety)
  const theme = getInitialTheme()
  document.documentElement.classList.toggle("light", theme === "light")
  document.documentElement.classList.toggle("dark", theme === "dark")
}
