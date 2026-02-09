import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { FallbackEmailService } from "../../src/services/email/fallback.service.js"
import type { EmailOptions } from "../../src/services/interfaces/email.interface.js"

// Mock SendGrid
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}))

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}))

// Mock config
vi.mock("../../src/shared/config.js", () => ({
  settings: {
    environment: "test",
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

describe("Email Fallback Integration", () => {
  let emailService: FallbackEmailService
  let sgMail: any
  let nodemailer: any
  let mockSendMail: any

  beforeEach(async () => {
    vi.clearAllMocks()

    sgMail = (await import("@sendgrid/mail")).default
    nodemailer = (await import("nodemailer")).default

    mockSendMail = vi.fn()
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any)

    emailService = new FallbackEmailService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Successful Email Delivery", () => {
    it("should send email via SendGrid when available", async () => {
      vi.mocked(sgMail.send).mockResolvedValue([{ statusCode: 202 }] as any)

      const emailOptions: EmailOptions = {
        to: "student@example.com",
        subject: "Assignment Graded",
        html: "<p>Your assignment has been graded.</p>",
      }

      await emailService.sendEmail(emailOptions)

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "student@example.com",
          subject: "Assignment Graded",
        }),
      )
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe("Fallback Scenarios", () => {
    it("should fallback to SMTP when SendGrid rate limit is hit", async () => {
      const rateLimitError = new Error("Rate limit exceeded")
      vi.mocked(sgMail.send).mockRejectedValue(rateLimitError)

      mockSendMail.mockResolvedValue({ messageId: "smtp-backup-id" })

      const emailOptions: EmailOptions = {
        to: "teacher@example.com",
        subject: "New Submission",
        html: "<p>A student has submitted an assignment.</p>",
      }

      await emailService.sendEmail(emailOptions)

      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "teacher@example.com",
          subject: "New Submission",
        }),
      )
    })

    it("should fallback to SMTP when SendGrid API key is invalid", async () => {
      const authError = new Error("Invalid API key")
      vi.mocked(sgMail.send).mockRejectedValue(authError)

      mockSendMail.mockResolvedValue({ messageId: "smtp-backup-id" })

      const emailOptions: EmailOptions = {
        to: "admin@example.com",
        subject: "System Alert",
        html: "<p>System notification.</p>",
      }

      await emailService.sendEmail(emailOptions)

      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it("should fallback to SMTP when SendGrid service is down", async () => {
      const serviceError = new Error("Service unavailable")
      vi.mocked(sgMail.send).mockRejectedValue(serviceError)

      mockSendMail.mockResolvedValue({ messageId: "smtp-backup-id" })

      const emailOptions: EmailOptions = {
        to: "user@example.com",
        subject: "Password Reset",
        html: "<p>Click here to reset your password.</p>",
      }

      await emailService.sendEmail(emailOptions)

      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })

  describe("Complete Failure Scenarios", () => {
    it("should throw error when both SendGrid and SMTP fail", async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error("SendGrid down"))
      mockSendMail.mockRejectedValue(new Error("SMTP connection failed"))

      const emailOptions: EmailOptions = {
        to: "user@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      }

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow(
        "All email services failed",
      )

      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })

    it("should provide detailed error information when all services fail", async () => {
      const sendgridError = new Error("SendGrid: Invalid recipient")
      const smtpError = new Error("SMTP: Authentication failed")

      vi.mocked(sgMail.send).mockRejectedValue(sendgridError)
      mockSendMail.mockRejectedValue(smtpError)

      const emailOptions: EmailOptions = {
        to: "invalid@example.com",
        subject: "Test Email",
        html: "<p>Test content</p>",
      }

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow(
        "All email services failed",
      )
    })
  })

  describe("Email Content Handling", () => {
    it("should handle HTML emails with fallback", async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error("SendGrid error"))
      mockSendMail.mockResolvedValue({ messageId: "smtp-id" })

      const emailOptions: EmailOptions = {
        to: "user@example.com",
        subject: "Rich Content Email",
        html: `
          <html>
            <body>
              <h1>Welcome to ClassiFi</h1>
              <p>Your account has been created.</p>
              <a href="https://classifi.com">Visit Dashboard</a>
            </body>
          </html>
        `,
      }

      await emailService.sendEmail(emailOptions)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Welcome to ClassiFi"),
        }),
      )
    })

    it("should handle plain text emails with fallback", async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error("SendGrid error"))
      mockSendMail.mockResolvedValue({ messageId: "smtp-id" })

      const emailOptions: EmailOptions = {
        to: "user@example.com",
        subject: "Plain Text Email",
        html: "<p>Simple message</p>",
        text: "Simple message",
      }

      await emailService.sendEmail(emailOptions)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "Simple message",
        }),
      )
    })
  })

  describe("Performance and Reliability", () => {
    it("should handle multiple concurrent email sends with fallback", async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error("SendGrid error"))
      mockSendMail.mockResolvedValue({ messageId: "smtp-id" })

      const emailPromises = Array.from({ length: 5 }, (_, i) =>
        emailService.sendEmail({
          to: `user${i}@example.com`,
          subject: `Email ${i}`,
          html: `<p>Content ${i}</p>`,
        }),
      )

      await Promise.all(emailPromises)

      expect(sgMail.send).toHaveBeenCalledTimes(5)
      expect(mockSendMail).toHaveBeenCalledTimes(5)
    })

    it("should not retry on the same service within a single send", async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error("SendGrid error"))
      mockSendMail.mockResolvedValue({ messageId: "smtp-id" })

      await emailService.sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      })

      // Should only try SendGrid once before falling back
      expect(sgMail.send).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })
})
