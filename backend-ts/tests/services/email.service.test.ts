import { describe, it, expect, vi, beforeEach } from "vitest"
import { SendGridEmailService } from "../../src/services/email/sendgrid.service.js"
import { SMTPEmailService } from "../../src/services/email/smtp.service.js"
import { FallbackEmailService } from "../../src/services/email/fallback.service.js"

// Mock SendGrid
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(() => Promise.resolve([{ statusCode: 202 }])),
  },
}))

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(() => Promise.resolve({ messageId: "test-message-id" })),
    })),
  },
}))

// Mock config
vi.mock("../../src/shared/config.js", () => ({
  settings: {
    environment: "development",
    appName: "ClassiFi",
    sendgridApiKey: "test-sendgrid-key",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "test@gmail.com",
    smtpPassword: "test-password",
    emailFrom: "noreply@classifi.com",
    emailFromName: "ClassiFi",
  },
}))

describe("Email Services", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("SendGridEmailService", () => {
    it("should send email via SendGrid", async () => {
      const emailService = new SendGridEmailService()
      const sgMail = (await import("@sendgrid/mail")).default

      await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      })

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Email",
          html: "<p>Test content</p>",
        }),
      )
    })
  })

  describe("SMTPEmailService", () => {
    it("should send email via SMTP", async () => {
      const nodemailer = (await import("nodemailer")).default
      const mockSendMail = vi.fn(() =>
        Promise.resolve({ messageId: "test-message-id" }),
      )

      // Update the mock to return our spy
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any)

      const emailService = new SMTPEmailService()

      await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      })

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Email",
          html: "<p>Test content</p>",
        }),
      )
    })
  })

  describe("FallbackEmailService", () => {
    it("should initialize with both primary and backup services", () => {
      const emailService = new FallbackEmailService()
      expect(emailService).toBeDefined()
    })

    it("should send email using primary service (SendGrid)", async () => {
      const emailService = new FallbackEmailService()
      const sgMail = (await import("@sendgrid/mail")).default

      await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      })

      expect(sgMail.send).toHaveBeenCalled()
    })

    it("should fallback to SMTP when SendGrid fails", async () => {
      const sgMail = (await import("@sendgrid/mail")).default
      const nodemailer = (await import("nodemailer")).default

      // Mock SendGrid to fail
      vi.mocked(sgMail.send).mockRejectedValueOnce(
        new Error("SendGrid API error"),
      )

      // Mock SMTP to succeed
      const mockSendMail = vi.fn(() =>
        Promise.resolve({ messageId: "backup-message-id" }),
      )
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any)

      const emailService = new FallbackEmailService()

      await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      })

      // Verify SendGrid was attempted first
      expect(sgMail.send).toHaveBeenCalledTimes(1)

      // Verify SMTP was used as fallback
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Email",
          html: "<p>Test content</p>",
        }),
      )
    })

    it("should throw error when both services fail", async () => {
      const sgMail = (await import("@sendgrid/mail")).default
      const nodemailer = (await import("nodemailer")).default

      // Mock both services to fail
      vi.mocked(sgMail.send).mockRejectedValueOnce(
        new Error("SendGrid API error"),
      )

      const mockSendMail = vi.fn(() =>
        Promise.reject(new Error("SMTP connection failed")),
      )
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any)

      const emailService = new FallbackEmailService()

      await expect(
        emailService.sendEmail({
          to: "test@example.com",
          subject: "Test Email",
          html: "<p>Test content</p>",
        }),
      ).rejects.toThrow("All email services failed")

      // Verify both services were attempted
      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it("should handle retry logic in notification queue", async () => {
      const sgMail = (await import("@sendgrid/mail")).default
      const nodemailer = (await import("nodemailer")).default

      // Mock SendGrid to fail initially
      vi.mocked(sgMail.send).mockRejectedValueOnce(
        new Error("Temporary SendGrid error"),
      )

      // Mock SMTP to succeed as fallback
      const mockSendMail = vi.fn(() =>
        Promise.resolve({ messageId: "fallback-message-id" }),
      )
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as any)

      const emailService = new FallbackEmailService()

      // Should succeed via SMTP fallback
      await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      })

      // Verify SendGrid was attempted first
      expect(sgMail.send).toHaveBeenCalled()

      // Verify SMTP was used as fallback
      expect(mockSendMail).toHaveBeenCalled()
    })
  })

  describe("createEmailService", () => {
    it("should return FallbackEmailService instance when email config exists", async () => {
      const { createEmailService } =
        await import("../../src/services/email/index.js")

      const service = createEmailService()

      expect(service).toBeInstanceOf(FallbackEmailService)
    })
  })
})
