import { injectable } from "tsyringe"
import sgMail from "@sendgrid/mail"
import { settings } from "../../shared/config.js"
import { createLogger } from "../../shared/logger.js"
import type {
  IEmailService,
  EmailOptions,
} from "../interfaces/email.interface.js"
import striptags from "striptags"

const logger = createLogger("SendGridEmailService")

/**
 * SendGrid email service implementation.
 * Uses SendGrid API for sending transactional emails.
 */
@injectable()
export class SendGridEmailService implements IEmailService {
  constructor() {
    if (!settings.sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY is not configured")
    }
    sgMail.setApiKey(settings.sendgridApiKey)
  }

  /**
   * Sends an email using SendGrid.
   *
   * @param options - Email options including recipient, subject, and content
   * @returns Promise that resolves when the email is sent successfully or rejects on error
   * @throws Error if email sending fails
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const msg = {
        to: options.to,
        from: {
          email: settings.emailFrom,
          name: settings.emailFromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      }

      const [response] = await sgMail.send(msg)

      logger.info(
        `✅ Email sent successfully via SendGrid (Status: ${response.statusCode})`,
      )
    } catch (error) {
      logger.error("Failed to send email via SendGrid:", error)

      // SendGrid errors have a response property with details
      if (error && typeof error === "object" && "response" in error) {
        const sgError = error as { response?: { body?: unknown } }
        logger.error("SendGrid error details:", sgError.response?.body)
      }

      throw new Error(
        `SendGrid email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  /**
   * Strips HTML tags to create plain text version.
   *
   * @param html - HTML content
   * @returns Plain text content
   */
  private stripHtml(html: string): string {
    return striptags(html).trim()
  }
}




