import { buildApp } from "@/app.js"
import { settings } from "@/shared/config.js"
import { closeDatabase } from "@/shared/database.js"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("Server")

interface SerializedStartupError {
  name: string
  message: string
  stack?: string
}

function serializeStartupError(error: unknown): SerializedStartupError | unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return error
}

/** Start the server */
async function start(): Promise<void> {
  try {
    const app = await buildApp()

    logger.info("Starting server", {
      appName: settings.appName,
      appVersion: settings.appVersion,
      environment: settings.environment,
      databaseStatus: "connected",
    })

    await app.listen({
      port: settings.port,
      host: "0.0.0.0",
    })

    logger.info("Server running", {
      url: `http://localhost:${settings.port}`,
    })

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info("Shutdown signal received", { signal })
      await app.close()
      await closeDatabase()
      logger.info("Shutdown complete")
      process.exit(0)
    }

    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
  } catch (error) {
    logger.error("Failed to start server", {
      error: serializeStartupError(error),
    })
    process.exit(1)
  }
}

start()
