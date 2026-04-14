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
      "@/data/api/auth.types": resolve(
        __dirname,
        "../frontend/src/data/api/auth.types.ts",
      ),
      "@/data/api/class.types": resolve(
        __dirname,
        "../frontend/src/data/api/class.types.ts",
      ),
      "@/presentation/schemas/shared/commonSchemas": resolve(
        __dirname,
        "../frontend/src/presentation/schemas/shared/commonSchemas.ts",
      ),
      "@/presentation/constants/schedule.constants": resolve(
        __dirname,
        "../frontend/src/presentation/constants/schedule.constants.ts",
      ),
      "@/shared/constants": resolve(
        __dirname,
        "../frontend/src/shared/constants/index.ts",
      ),
      "@": resolve(__dirname, "src"),
    },
  },
})
