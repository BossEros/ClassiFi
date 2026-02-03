export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * Email service interface for sending emails.
 * Implementations can use different providers (SendGrid, AWS SES, Supabase, etc.)
 */
export interface IEmailService {
    /**
     * Sends an email.
     *
     * @param options - Email options including recipient, subject, and content
     * @throws Error if email sending fails
     */
    sendEmail(options: EmailOptions): Promise<void>;
}
