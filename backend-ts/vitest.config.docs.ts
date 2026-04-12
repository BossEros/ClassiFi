import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["../documentation-test/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
