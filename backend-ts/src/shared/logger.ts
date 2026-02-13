import pino, { type Logger as PinoLogger } from "pino"

export interface LogContext {
  [key: string]: unknown
}

export interface Logger {
  debug(message: string, context?: unknown): void
  info(message: string, context?: unknown): void
  warn(message: string, context?: unknown): void
  error(message: string, context?: unknown): void
  child(scope: string, context?: LogContext): Logger
}

class PinoLoggerAdapter implements Logger {
  constructor(private readonly logger: PinoLogger) {}

  debug(message: string, context?: unknown): void {
    this.logger.debug(this.normalizeContext(context), message)
  }

  info(message: string, context?: unknown): void {
    this.logger.info(this.normalizeContext(context), message)
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn(this.normalizeContext(context), message)
  }

  error(message: string, context?: unknown): void {
    this.logger.error(this.normalizeContext(context), message)
  }

  child(scope: string, context?: LogContext): Logger {
    return new PinoLoggerAdapter(
      this.logger.child({ scope, ...(context ?? {}) }),
    )
  }

  private normalizeContext(context?: unknown): LogContext {
    if (context === undefined) {
      return {}
    }

    if (
      context !== null &&
      typeof context === "object" &&
      !Array.isArray(context)
    ) {
      return context as LogContext
    }

    return { value: context }
  }
}

const rootLogger = new PinoLoggerAdapter(
  pino({
    level:
      process.env.DEBUG === "true" || process.env.DEBUG === "True"
        ? "debug"
        : "info",
    base: {
      app: process.env.APP_NAME ?? "ClassiFi",
      environment: process.env.ENVIRONMENT ?? "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
)

export function createLogger(scope: string, context?: LogContext): Logger {
  return rootLogger.child(scope, context)
}
