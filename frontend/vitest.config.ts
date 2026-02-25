import path from "path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/business/services/authService.ts",
        "src/business/services/userService.ts",
        "src/business/services/notificationPreferenceService.ts",
        "src/business/validation/authValidation.ts",
        "src/data/repositories/notificationPreferenceRepository.ts",
        "src/presentation/schemas/auth/authSchemas.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
        perFile: true,
      },
      exclude: [
        "node_modules",
        "dist",
        "src/tests/setup.ts",
        "src/tests/mocks/**",
      ],
    },
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      VITE_API_BASE_URL: "http://localhost:8001/api/v1",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
