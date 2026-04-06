export const APP_NAME = "ClassiFi"

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/",
  DASHBOARD: "/dashboard",
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER: "user",
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    VERIFY: "/auth/verify",
  },
} as const

/**
 * Programming language options for select dropdowns
 */
export const PROGRAMMING_LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
] as const
