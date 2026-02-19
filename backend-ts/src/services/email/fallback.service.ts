import { injectable } from "tsyringe"
import type {
  IEmailService,
  EmailOptions,
} from "@/services/interfaces/email.interface.js"
import { SendGridEmailService } from "@/services/email/sendgrid.service.js"
import { SMTPEmailService } from "@/services/email/smtp.service.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("FallbackEmailService")

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
        logger.info("Primary email service initialized", {
          provider: "sendgrid",
        })
      } catch (error) {
        logger.warn("Failed to initialize primary email service", {
          provider: "sendgrid",
          error,
        })
      }
    }

    // Initialize backup service (SMTP)
    if (settings.smtpUser && settings.smtpPassword) {
      try {
        this.backupService = new SMTPEmailService()
        logger.info("Backup email service initialized", {
          provider: "smtp",
        })
      } catch (error) {
        logger.warn("Failed to initialize backup email service", {
          provider: "smtp",
          error,
        })
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
        logger.error("Primary email service failed", {
          provider: "sendgrid",
          error,
        })
        logger.info("Attempting backup email service", {
          provider: "smtp",
        })
      }
    }

    // Try backup service
    if (this.backupService) {
      try {
        await this.backupService.sendEmail(options)
        logger.info("Email sent via backup service", {
          provider: "smtp",
        })
        return // Success!
      } catch (error) {
        logger.error("Backup email service also failed", {
          provider: "smtp",
          error,
        })
        throw new Error(
          "All email services failed. Please check your email configuration.",
        )
      }
    }

    // If we get here, no services were available
    throw new Error("No email service available")
  }
}
