import { injectable } from "tsyringe";
// import { createClient } from "@supabase/supabase-js";
import { settings } from "../shared/config.js";
import type { IEmailService, EmailOptions } from "./interfaces/email.interface.js";

/**
 * Supabase email service implementation.
 * Uses Supabase's built-in email functionality.
 */
@injectable()
export class SupabaseEmailService implements IEmailService {
    // private supabase;

    constructor() {
        // this.supabase = createClient(
        //     settings.supabaseUrl,
        //     settings.supabaseServiceRoleKey
        // );
    }

    /**
     * Sends an email using Supabase.
     *
     * @param options - Email options
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            // Note: Supabase doesn't have a direct email sending API
            // This is a placeholder - you would typically use:
            // 1. Supabase Edge Functions to call an email provider
            // 2. Or integrate directly with SendGrid/AWS SES here

            // For now, we'll log the email (development mode)
            if (settings.environment === "development") {
                console.log("📧 Email would be sent:", {
                    to: options.to,
                    subject: options.subject,
                    preview: options.html.substring(0, 100) + "...",
                });
                return;
            }

            // TODO: Implement actual email sending via Supabase Edge Function or direct provider
            throw new Error("Email sending not yet configured for production");
        } catch (error) {
            console.error("Failed to send email:", error);
            throw new Error(`Email sending failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
