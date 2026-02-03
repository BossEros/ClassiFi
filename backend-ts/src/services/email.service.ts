import type { IEmailService } from "./interfaces/email.interface.js";
import { SupabaseEmailService } from "./email-supabase.service.js";

/**
 * Factory function to create the appropriate email service based on configuration.
 * This allows easy switching between providers.
 * 
 * To add a new provider:
 * 1. Create a new file like email-sendgrid.service.ts
 * 2. Implement IEmailService interface
 * 3. Add a case here to return your new implementation
 */
export function createEmailService(): IEmailService {
    // For now, always return Supabase implementation
    // In the future, you could check an EMAIL_PROVIDER env variable:
    // const provider = settings.emailProvider;
    // switch (provider) {
    //   case "sendgrid": return new SendGridEmailService();
    //   case "aws-ses": return new AWSEmailService();
    //   default: return new SupabaseEmailService();
    // }

    return new SupabaseEmailService();
}

// Export the default implementation class for dependency injection
export const EmailService = SupabaseEmailService;
