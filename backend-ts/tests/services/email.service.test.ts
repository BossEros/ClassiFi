import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        // Mock Supabase client
    })),
}));

// Mock config
vi.mock("../../src/shared/config.js", () => ({
    settings: {
        supabaseUrl: "https://test.supabase.co",
        supabaseServiceRoleKey: "test-key",
        environment: "development",
        appName: "ClassiFi",
    },
}));

describe("SupabaseEmailService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("sendEmail", () => {
        it("should log email in development mode", async () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });

            const { SupabaseEmailService } = await import(
                "../../src/services/email.service.js"
            );
            const emailService = new SupabaseEmailService();

            await emailService.sendEmail({
                to: "test@example.com",
                subject: "Test Email",
                html: "<p>Test content</p>",
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                "📧 Email would be sent:",
                expect.objectContaining({
                    to: "test@example.com",
                    subject: "Test Email",
                })
            );

            consoleSpy.mockRestore();
        });
    });

    describe("createEmailService", () => {
        it("should return SupabaseEmailService instance", async () => {
            const { createEmailService, SupabaseEmailService } = await import(
                "../../src/services/email.service.js"
            );

            const service = createEmailService();

            expect(service).toBeInstanceOf(SupabaseEmailService);
        });
    });
});
