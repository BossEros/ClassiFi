export const APP_NAME = 'ClassiFi'

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  HOME: '/',
  DASHBOARD: '/dashboard'
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user'
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify'
  }
} as const

export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
} as const
