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
