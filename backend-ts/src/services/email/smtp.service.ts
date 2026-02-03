import { injectable } from "tsyringe";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { settings } from "../../shared/config.js";
import type { IEmailService, EmailOptions } from "../interfaces/email.interface.js";
import { htmlToText } from "html-to-text";

/**
 * SMTP email service implementation using nodemailer.
 * Supports Gmail SMTP and other SMTP providers.
 */
@injectable()
export class SMTPEmailService implements IEmailService {
    private transporter: Transporter;

    constructor() {
        if (!settings.smtpUser || !settings.smtpPassword) {
            throw new Error("SMTP credentials (SMTP_USER and SMTP_PASSWORD) are not configured");
        }

        this.transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword,
            },
        });
    }

    /**
     * Sends an email using SMTP.
     *
     * @param options - Email options including recipient, subject, and content
     * @throws Error if email sending fails
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: `"${settings.emailFromName}" <${settings.emailFrom}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html),
            });

            console.log(`✅ Email sent successfully via SMTP (Message ID: ${info.messageId})`);
        } catch (error) {
            console.error("Failed to send email via SMTP:", error);
            throw new Error(
                `SMTP email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Strips HTML tags to create plain text version.
     *
     * @param html - HTML content
     * @returns Plain text content
     */
    private stripHtml(html: string): string {
        return htmlToText(html, { wordwrap: false }).trim();
    }
}
