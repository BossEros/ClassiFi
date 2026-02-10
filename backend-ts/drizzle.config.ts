import { defineConfig } from "drizzle-kit";
import "dotenv/config"; // Load environment variables

export default defineConfig({
  schema: "./dist/models/*.model.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
