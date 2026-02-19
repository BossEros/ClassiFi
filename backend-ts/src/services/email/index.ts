import type {
  IEmailService,
  EmailOptions,
} from "@/services/interfaces/email.interface.js"
import { FallbackEmailService } from "@/services/email/fallback.service.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("EmailServiceFactory")

/**
 * Factory function to create the appropriate email service based on configuration.
 * Returns a fallback service that tries SendGrid first, then SMTP as backup.
 */
export function createEmailService(): IEmailService {
  // In development without any API keys, use mock service
  const hasEmailConfig =
    settings.sendgridApiKey || (settings.smtpUser && settings.smtpPassword)

  if (settings.environment === "development" && !hasEmailConfig) {
    logger.warn(
      "No email service configured. Development mode will use mock email logger.",
    )
    return new MockEmailService()
  }

  return new FallbackEmailService()
}

// Export the fallback implementation class for dependency injection
export const EmailService = FallbackEmailService

/**
 * Mock email service for development when no API key is configured.
 */
class MockEmailService implements IEmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    logger.info("Mock email would be sent", {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + "...",
    })
  }
}
