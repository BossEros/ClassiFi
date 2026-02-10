import { injectable } from "tsyringe"
import type {
  IEmailService,
  EmailOptions,
} from "../interfaces/email.interface.js"
import { SendGridEmailService } from "./sendgrid.service.js"
import { SMTPEmailService } from "./smtp.service.js"
import { settings } from "../../shared/config.js"

/**
 * Fallback email service that tries multiple providers.
 * Tries SendGrid first, then falls back to SMTP (Gmail) if SendGrid fails.
 */
@injectable()
export class FallbackEmailService implements IEmailService {
  private primaryService: IEmailService | null = null
  private backupService: IEmailService | null = null

  constructor() {
    // Initialize primary service (SendGrid)
    if (settings.sendgridApiKey) {
      try {
        this.primaryService = new SendGridEmailService()
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.log("✅ Primary email service (SendGrid) initialized")
      } catch (error) {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.warn("⚠️  Failed to initialize SendGrid:", error)
      }
    }

    // Initialize backup service (SMTP)
    if (settings.smtpUser && settings.smtpPassword) {
      try {
        this.backupService = new SMTPEmailService()
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.log("✅ Backup email service (SMTP) initialized")
      } catch (error) {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.warn("⚠️  Failed to initialize SMTP:", error)
      }
    }

    if (!this.primaryService && !this.backupService) {
      throw new Error(
        "No email service configured. Please set up either SendGrid or SMTP credentials.",
      )
    }
  }

  /**
   * Sends an email using the primary service, falling back to backup if it fails.
   *
   * @param options - Email options including recipient, subject, and content
   * @throws Error if both primary and backup services fail
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    // Try primary service first
    if (this.primaryService) {
      try {
        await this.primaryService.sendEmail(options)
        return // Success! No need to try backup
      } catch (error) {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.error("❌ Primary email service (SendGrid) failed:", error)
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.log("🔄 Attempting backup email service (SMTP)...")
      }
    }

    // Try backup service
    if (this.backupService) {
      try {
        await this.backupService.sendEmail(options)
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.log("✅ Email sent via backup service (SMTP)")
        return // Success!
      } catch (error) {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.error("❌ Backup email service (SMTP) also failed:", error)
        throw new Error(
          "All email services failed. Please check your email configuration.",
        )
      }
    }

    // If we get here, no services were available
    throw new Error("No email service available")
  }
}
