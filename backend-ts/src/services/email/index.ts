import type {
  IEmailService,
  EmailOptions,
} from "../interfaces/email.interface.js"
import { FallbackEmailService } from "./fallback.service.js"
import { settings } from "../../shared/config.js"

/**
 * Factory function to create the appropriate email service based on configuration.
 * Returns a fallback service that tries SendGrid first, then SMTP as backup.
 */
export function createEmailService(): IEmailService {
  // In development without any API keys, use mock service
  const hasEmailConfig =
    settings.sendgridApiKey || (settings.smtpUser && settings.smtpPassword)

  if (settings.environment === "development" && !hasEmailConfig) {
    console.warn(
      "⚠️  No email service configured. Emails will be logged to console.",
    )
    return new MockEmailService()
  }

  return new FallbackEmailService()
}

// Export the fallback implementation class for dependency injection
export const EmailService = FallbackEmailService

/**
 * Mock email service for development when no API key is configured.
 * Logs emails to console instead of sending them.
 */
class MockEmailService implements IEmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    console.log("📧 [MOCK] Email would be sent:", {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + "...",
    })
  }
}
