import { settings } from "@/shared/config.js"

/**
 * Escapes HTML special characters to prevent HTML injection attacks.
 * Converts characters like <, >, &, ", and ' to their HTML entity equivalents.
 *
 * @param text - The text to escape.
 * @returns The escaped text safe for HTML insertion.
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Removes control characters that are unsafe in email headers.
 *
 * @param subject - The candidate email subject line.
 * @returns A header-safe subject string.
 */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim()
}

const classifiEmailTheme = {
  brandPrimary: "#0d9488",
  brandPrimaryHover: "#0f766e",
  brandPrimaryLight: "#14b8a6",
  brandSecondary: "#f59e0b",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#f43f5e",
  info: "#0ea5e9",
  shellBackground: "#11211F",
  shellBackgroundSecondary: "#17312D",
  shellBackgroundTertiary: "#0E1B19",
  authSurface: "#F4F7F6",
  authSurfaceMuted: "#EDF3F1",
  authBorder: "#D7E2DE",
  authBorderStrong: "#B8C8C2",
  titleText: "#13211E",
  bodyText: "#5F746E",
  labelText: "#334944",
  tertiaryText: "#6A817A",
  footerText: "#B8CCC6",
  footerTextMuted: "#8DA39D",
  white: "#FFFFFF",
} as const

/**
 * Resolves the email-safe application name with a defensive fallback.
 *
 * @returns The application name shown in shared email chrome.
 */
function getEmailApplicationName(): string {
  const configuredApplicationName = settings.appName?.trim()

  return configuredApplicationName || "ClassiFi"
}

/**
 * Base HTML email template wrapper with professional styling.
 * Provides consistent, responsive design across all emails.
 *
 * @param content - The main email content HTML
 * @returns Complete HTML email string
 */
function baseEmailTemplate(content: string): string {
  const emailApplicationName = getEmailApplicationName()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(emailApplicationName)} Notification</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, h1, h2, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: ${classifiEmailTheme.bodyText};
      background-color: ${classifiEmailTheme.shellBackground};
    }

    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
      overflow: hidden;
      mso-hide: all;
    }

    .email-wrapper {
      width: 100%;
      background-color: ${classifiEmailTheme.shellBackground};
      background-image: linear-gradient(135deg, ${classifiEmailTheme.shellBackground} 0%, ${classifiEmailTheme.shellBackgroundSecondary} 58%, ${classifiEmailTheme.shellBackgroundTertiary} 100%);
      padding: 24px 0;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${classifiEmailTheme.authSurface};
      border: 1px solid ${classifiEmailTheme.authBorder};
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 18px 40px rgba(7, 16, 15, 0.28);
    }

    .top-accent {
      height: 6px;
      background-color: ${classifiEmailTheme.brandPrimary};
      background-image: linear-gradient(90deg, ${classifiEmailTheme.brandPrimary} 0%, ${adjustBrightness(classifiEmailTheme.brandPrimary, 16)} 100%);
    }

    .header {
      padding: 28px 32px 24px;
      background-color: ${classifiEmailTheme.authSurfaceMuted};
      border-bottom: 1px solid ${classifiEmailTheme.authBorder};
    }

    .logo {
      font-size: 30px;
      font-weight: 700;
      color: ${classifiEmailTheme.titleText};
      margin: 0;
      letter-spacing: -0.5px;
      font-family: "Expletus Sans", "Trebuchet MS", "Avenir Next", Arial, sans-serif;
    }

    .content {
      padding: 32px;
    }

    .content h1 {
      font-size: 24px;
      font-weight: 700;
      color: ${classifiEmailTheme.titleText};
      margin: 0 0 16px 0;
      line-height: 1.3;
    }

    .content h2 {
      font-size: 20px;
      font-weight: 600;
      color: ${classifiEmailTheme.titleText};
      margin: 24px 0 12px 0;
    }

    .content p {
      font-size: 16px;
      color: ${classifiEmailTheme.bodyText};
      margin: 0 0 16px 0;
      line-height: 1.6;
    }

    .content strong {
      color: ${classifiEmailTheme.titleText};
    }

    .info-card {
      background-color: ${classifiEmailTheme.authSurfaceMuted};
      background-image: linear-gradient(135deg, ${classifiEmailTheme.authSurfaceMuted} 0%, ${classifiEmailTheme.white} 100%);
      border: 1px solid ${classifiEmailTheme.authBorder};
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }

    .info-card-row {
      display: table;
      width: 100%;
      padding: 12px 0;
      border-bottom: 1px solid ${classifiEmailTheme.authBorder};
    }

    .info-card-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-card-row:first-child {
      padding-top: 0;
    }

    .info-label {
      display: table-cell;
      width: 40%;
      font-size: 12px;
      font-weight: 600;
      color: ${classifiEmailTheme.tertiaryText};
      text-transform: uppercase;
      letter-spacing: 0.08em;
      vertical-align: middle;
    }

    .info-value {
      display: table-cell;
      width: 60%;
      font-size: 16px;
      font-weight: 600;
      color: ${classifiEmailTheme.titleText};
      text-align: right;
      vertical-align: middle;
    }

    .score-display {
      text-align: center;
      padding: 32px;
      background-color: ${classifiEmailTheme.white};
      background-image: linear-gradient(135deg, ${classifiEmailTheme.authSurfaceMuted} 0%, ${classifiEmailTheme.white} 100%);
      border-radius: 16px;
      margin: 24px 0;
      border: 1px solid ${classifiEmailTheme.authBorderStrong};
    }

    .score-number {
      font-size: 48px;
      font-weight: 700;
      margin: 0;
      line-height: 1;
    }

    .score-percentage {
      font-size: 20px;
      color: ${classifiEmailTheme.bodyText};
      margin: 8px 0 0 0;
      font-weight: 500;
    }

    .button {
      display: inline-block;
      background-color: ${classifiEmailTheme.brandPrimary};
      background-image: linear-gradient(180deg, ${classifiEmailTheme.brandPrimary} 0%, ${adjustBrightness(classifiEmailTheme.brandPrimary, -8)} 100%);
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 12px 24px rgba(7, 16, 15, 0.14);
    }

    .alert {
      padding: 16px 20px;
      border-radius: 12px;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.5;
      border: 1px solid transparent;
    }

    .alert-info {
      background: #e7f6fc;
      border-color: #b9e5f7;
      color: #135e79;
    }

    .alert-warning {
      background: #fff4de;
      border-color: #f7d49f;
      color: #8a5200;
    }

    .alert-success {
      background: #eaf7f1;
      border-color: #bfe6cf;
      color: #166534;
    }

    .alert-danger {
      background: #fdecef;
      border-color: #f6c1cf;
      color: #b42318;
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, ${classifiEmailTheme.authBorderStrong}, transparent);
      margin: 32px 0;
    }

    .footer {
      background-color: ${classifiEmailTheme.shellBackground};
      background-image: linear-gradient(135deg, ${classifiEmailTheme.shellBackground} 0%, ${classifiEmailTheme.shellBackgroundSecondary} 100%);
      padding: 28px 32px 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .footer p {
      font-size: 14px;
      color: ${classifiEmailTheme.footerText};
      margin: 8px 0;
      line-height: 1.5;
    }

    .footer strong {
      color: ${classifiEmailTheme.white};
    }

    .footer-note {
      font-size: 12px !important;
      color: ${classifiEmailTheme.footerTextMuted} !important;
      margin-top: 16px !important;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 20px !important;
      }

      .content, .header, .footer {
        padding: 24px !important;
      }

      .content h1 {
        font-size: 20px !important;
      }

      .score-number {
        font-size: 36px !important;
      }

      .button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(emailApplicationName)} notification</div>
  <div class="email-wrapper">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 0 16px;">
          <div class="email-container">
            <div class="top-accent"></div>
            <div class="header">
              <h1 class="logo">${escapeHtml(emailApplicationName)}</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p><strong>This is an automated notification from ${escapeHtml(emailApplicationName)}.</strong></p>
              <p>You can manage your notification preferences from your ClassiFi account settings.</p>
              <p class="footer-note">
                &copy; ${new Date().getFullYear()} ${escapeHtml(emailApplicationName)}. All rights reserved.
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Adjusts the brightness of a hex color.
 *
 * @param hex - Hex color code (e.g., "#0d9488")
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))

  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, "0")}`
}

/**
 * Generates an HTML email template for password reset emails.
 *
 * @param data - Password reset email data
 * @param data.resetUrl - The password reset URL
 * @returns The generated HTML email string
 */
export function passwordResetEmailTemplate(data: { resetUrl: string }): string {
  const content = `
    <h1>Reset Your Password</h1>
    <p>We received a request to reset your password. If you made this request, use the button below to choose a new password.</p>

    <center>
      <a href="${escapeHtml(data.resetUrl)}" class="button">Reset Password</a>
    </center>

    <div class="alert alert-info">
      <strong>Note:</strong> If you did not request a password reset, you can safely ignore this email.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for password changed notifications.
 * Intended for Supabase-hosted security notification configuration so the
 * password changed email matches the rest of the ClassiFi email system.
 *
 * @param data - Password changed notification data
 * @param data.email - The account email address displayed in the notification
 * @returns The generated HTML email string
 */
export function passwordChangedNotificationEmailTemplate(data: {
  email: string
}): string {
  const content = `
    <h1>Your Password Has Been Changed</h1>
    <p>This is a confirmation that the password for your account <strong>${escapeHtml(data.email)}</strong> was just changed.</p>

    <div class="alert alert-warning">
      <strong>Didn’t make this change?</strong> Reset your password immediately and review your recent account activity.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates the Supabase-hosted password changed notification template content.
 * This preserves Supabase template variables so the HTML can be copied into the
 * hosted Auth Email Templates configuration without modification.
 *
 * @returns The generated HTML email string for Supabase configuration
 */
export function supabasePasswordChangedNotificationEmailTemplate(): string {
  return passwordChangedNotificationEmailTemplate({ email: "{{ .Email }}" })
}

/**
 * Generates an HTML email template for assignment creation notifications.
 *
 * @param data - Assignment notification data
 * @param data.assignmentTitle - The title of the newly created assignment
 * @param data.className - The name of the class the assignment belongs to
 * @param data.dueDate - The due date for the assignment (formatted string)
 * @param data.assignmentUrl - The URL to view the assignment details
 * @returns The generated HTML email string
 */
export function assignmentCreatedEmailTemplate(data: {
  assignmentTitle: string
  className: string
  dueDate: string
  assignmentUrl: string
}): string {
  const content = `
    <h1>New Assignment Posted</h1>
    <p>Your teacher has created a new assignment in <strong>${escapeHtml(data.className)}</strong>. Make sure to review the requirements and submit your work before the deadline.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Assignment</span>
        <span class="info-value">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Due Date</span>
        <span class="info-value">${escapeHtml(data.dueDate)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.assignmentUrl)}" class="button">View Assignment Details</a>
    </center>
    
    <div class="alert alert-info">
      <strong>Pro tip:</strong> Start early to avoid last-minute stress. Review the test cases and requirements carefully before submitting.
    </div>
  `

  return baseEmailTemplate(content)
}

function formatEmailNameList(names: string[] | undefined): string {
  if (!names || names.length === 0) {
    return "another student"
  }

  if (names.length === 1) {
    return names[0]
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`
  }

  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`
}

function getSubmissionGradedHeading(
  reason: "automatic_grade" | "manual_grade" | "grade_override" | "late_penalty_applied" | "similarity_deduction",
): string {
  switch (reason) {
    case "automatic_grade":
      return "Your Assignment Has Been Graded"
    case "manual_grade":
      return "Your Teacher Posted a Grade"
    case "grade_override":
      return "Your Score Was Updated"
    case "late_penalty_applied":
      return "Late Penalty Applied"
    case "similarity_deduction":
      return "Score Updated After Similarity Review"
  }
}

function getSubmissionGradedIntroText(
  data: {
    assignmentTitle: string
    grade: number
    maxGrade: number
    reason: "automatic_grade" | "manual_grade" | "grade_override" | "late_penalty_applied" | "similarity_deduction"
    previousGrade?: number
    similarityPercentage?: number
    latenessText?: string
  },
  matchedStudentNamesText: string,
): string {
  switch (data.reason) {
    case "automatic_grade":
      return `Your submission for "${data.assignmentTitle}" has been graded.`
    case "manual_grade":
      return `Your teacher graded your submission for "${data.assignmentTitle}".`
    case "grade_override":
      return data.previousGrade === undefined
        ? `Your score for "${data.assignmentTitle}" was updated by your teacher to ${data.grade}/${data.maxGrade}.`
        : `Your score for "${data.assignmentTitle}" was updated by your teacher from ${data.previousGrade}/${data.maxGrade} to ${data.grade}/${data.maxGrade}.`
    case "late_penalty_applied":
      return data.previousGrade === undefined
        ? `A late penalty was applied to your submission for "${data.assignmentTitle}". Final score: ${data.grade}/${data.maxGrade}. ${data.latenessText}.`
        : `Your score for "${data.assignmentTitle}" was reduced from ${data.previousGrade}/${data.maxGrade} to ${data.grade}/${data.maxGrade} due to late submission. ${data.latenessText}.`
    case "similarity_deduction":
      return data.previousGrade === undefined
        ? `Your score for "${data.assignmentTitle}" was updated after similarity review to ${data.grade}/${data.maxGrade}. You had ${data.similarityPercentage}% source code similarity with ${matchedStudentNamesText}.`
        : `Your score for "${data.assignmentTitle}" changed from ${data.previousGrade}/${data.maxGrade} to ${data.grade}/${data.maxGrade} after similarity review. You had ${data.similarityPercentage}% source code similarity with ${matchedStudentNamesText}.`
  }
}

function getSubmissionGradedGuidanceText(
  reason: "automatic_grade" | "manual_grade" | "grade_override" | "late_penalty_applied" | "similarity_deduction",
): string {
  switch (reason) {
    case "automatic_grade":
    case "manual_grade":
      return "Review your submission to see detailed feedback, test results, and areas for improvement."
    case "grade_override":
      return "Review your updated submission details to see the latest score and any teacher notes."
    case "late_penalty_applied":
      return "Review the submission details for the grading breakdown, including the late penalty that affected your score."
    case "similarity_deduction":
      return "Review the submission details for the updated score and the similarity review outcome."
  }
}

/**
 * Generates an HTML email template for submission graded notifications.
 *
 * @param data - Submission grading data
 * @param data.assignmentTitle - The title of the graded assignment
 * @param data.grade - The score received by the student
 * @param data.maxGrade - The maximum possible score for the assignment
 * @param data.submissionUrl - The URL to view the graded submission
 * @returns The generated HTML email string
 */
export function submissionGradedEmailTemplate(data: {
  assignmentTitle: string
  grade: number
  maxGrade: number
  submissionUrl: string
  reason: "automatic_grade" | "manual_grade" | "grade_override" | "late_penalty_applied" | "similarity_deduction"
  previousGrade?: number
  deductedPoints?: number
  similarityPercentage?: number
  latenessText?: string
  matchedStudentNames?: string[]
}): string {
  const percentage =
    data.maxGrade > 0 ? Math.round((data.grade / data.maxGrade) * 100) : 0

  // Determine color based on grade
  let scoreColor: string = classifiEmailTheme.success
  let alertType = "alert-success"
  let alertLead = "Keep going:"
  let message = "Excellent work! Keep up the great performance."

  if (percentage < 60) {
    scoreColor = classifiEmailTheme.error
    alertType = "alert-danger"
    alertLead = "Review focus:"
    message =
      "Don't worry! Review the feedback and test results to improve next time."
  } else if (percentage < 80) {
    scoreColor = classifiEmailTheme.warning
    alertType = "alert-info"
    alertLead = "Next step:"
    message = "Good effort! Review the feedback to see where you can improve."
  }

  const matchedStudentNamesText = formatEmailNameList(data.matchedStudentNames)

  const headingText = getSubmissionGradedHeading(data.reason)
  const introText = getSubmissionGradedIntroText(data, matchedStudentNamesText)
  const guidanceText = getSubmissionGradedGuidanceText(data.reason)

  const content = `
    <h1>${escapeHtml(headingText)}</h1>
    <p>${escapeHtml(introText)}</p>
    
    <div class="score-display" style="border-color: ${scoreColor};">
      <p class="score-number" style="color: ${scoreColor};">
        ${String(data.grade)}/${String(data.maxGrade)}
      </p>
    </div>
    
    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">View Detailed Feedback</a>
    </center>
    
    <div class="alert ${alertType}">
      <strong>${alertLead} ${escapeHtml(message)}</strong>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: ${classifiEmailTheme.bodyText};">
      <strong>What's next?</strong> ${escapeHtml(guidanceText)}
    </p>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for class announcements.
 *
 * @param data - Class announcement data
 * @param data.className - The name of the class
 * @param data.message - The announcement message
 * @returns The generated HTML email string
 */
export function classAnnouncementEmailTemplate(data: {
  className: string
  message: string
}): string {
  const content = `
    <h1>Class Announcement</h1>
    <p>Your instructor has posted an important announcement in <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="info-card">
      <p style="font-size: 16px; color: ${classifiEmailTheme.titleText}; line-height: 1.6; margin: 0;">
        ${escapeHtml(data.message)}
      </p>
    </div>
    
    <div class="alert alert-info">
      <strong>Note:</strong> Make sure to read this announcement carefully as it may contain important information about assignments, deadlines, or class policies.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for deadline reminders.
 *
 * @param data - Deadline reminder data
 * @param data.assignmentTitle - The title of the assignment
 * @param data.dueDate - The due date for the assignment
 * @param data.assignmentUrl - The URL to view the assignment
 * @returns The generated HTML email string
 */
export function deadlineReminderEmailTemplate(data: {
  assignmentTitle: string
  dueDate: string
  assignmentUrl: string
}): string {
  const content = `
    <h1>Assignment Deadline Reminder</h1>
    <p>This is a friendly reminder that your assignment <strong>${escapeHtml(data.assignmentTitle)}</strong> is due soon!</p>
    
    <div class="info-card" style="background: linear-gradient(135deg, #fff4de 0%, #fffbeb 100%); border-color: #f7d49f;">
      <div class="info-card-row" style="border-color: #f7d49f;">
        <span class="info-label" style="color: #8a5200;">Assignment</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label" style="color: #8a5200;">Due Date</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.dueDate)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.assignmentUrl)}" class="button">Submit Assignment Now</a>
    </center>
    
    <div class="alert alert-warning">
      <strong>Important:</strong> Late submissions may incur penalties. Make sure to submit your work before the deadline to receive full credit.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for enrollment confirmation.
 *
 * @param data - Enrollment confirmation data
 * @param data.className - The name of the class
 * @param data.instructorName - The name of the instructor
 * @param data.classUrl - The URL to view the class
 * @returns The generated HTML email string
 */
export function enrollmentConfirmedEmailTemplate(data: {
  className: string
  instructorName: string
  classUrl: string
}): string {
  const content = `
    <h1>Welcome to ${escapeHtml(data.className)}</h1>
    <p>Congratulations! You have been successfully enrolled in <strong>${escapeHtml(data.className)}</strong>. We're excited to have you in the class.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Class Name</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label">Instructor</span>
        <span class="info-value">${escapeHtml(data.instructorName)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.classUrl)}" class="button">Go to Class Dashboard</a>
    </center>
    
    <div class="alert alert-success">
      <strong>Getting started:</strong> Visit your class dashboard to view assignments, announcements, and course materials. Don't hesitate to reach out to your instructor if you have any questions.
    </div>
    
    <div class="divider"></div>
    
    <h2>What's Next?</h2>
    <p style="font-size: 14px; color: ${classifiEmailTheme.bodyText};">
      - Check for any pending assignments<br>
      - Review the class syllabus and requirements<br>
      - Introduce yourself to your instructor and classmates<br>
      - Set up your development environment
    </p>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for submission feedback notifications.
 *
 * @param data - Feedback notification data
 * @param data.assignmentTitle - The title of the assignment
 * @param data.teacherName - The name of the teacher who left feedback
 * @param data.submissionUrl - The URL to view the submission and feedback
 * @returns The generated HTML email string
 */
export function submissionFeedbackGivenEmailTemplate(data: {
  assignmentTitle: string
  teacherName: string
  submissionUrl: string
}): string {
  const content = `
    <h1>Your Teacher Left Feedback</h1>
    <p><strong>${escapeHtml(data.teacherName)}</strong> has left feedback on your submission for <strong>${escapeHtml(data.assignmentTitle)}</strong>.</p>

    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Assignment</span>
        <span class="info-value">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label">From</span>
        <span class="info-value">${escapeHtml(data.teacherName)}</span>
      </div>
    </div>

    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">View Feedback</a>
    </center>

    <div class="alert alert-info">
      <strong>Tip:</strong> Feedback from your teacher can help you improve your understanding. Make sure to read it carefully and apply the suggestions in future submissions.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for assignment updated notifications.
 *
 * @param data - Assignment update data
 * @param data.assignmentTitle - The title of the updated assignment
 * @param data.className - The name of the class
 * @param data.dueDate - The (possibly updated) due date
 * @param data.assignmentUrl - The URL to view the assignment
 * @returns The generated HTML email string
 */
export function assignmentUpdatedEmailTemplate(data: {
  assignmentTitle: string
  className: string
  dueDate: string
  assignmentUrl: string
}): string {
  const content = `
    <h1>Assignment Updated</h1>
    <p>Your teacher has updated the assignment <strong>${escapeHtml(data.assignmentTitle)}</strong> in <strong>${escapeHtml(data.className)}</strong>. Please review the changes.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Assignment</span>
        <span class="info-value">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Due Date</span>
        <span class="info-value">${escapeHtml(data.dueDate)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.assignmentUrl)}" class="button">View Updated Assignment</a>
    </center>
    
    <div class="alert alert-info">
      <strong>Note:</strong> Make sure to review the updated requirements and adjust your submission accordingly.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for new submission received notifications (teacher).
 *
 * @param data - Submission data
 * @param data.assignmentTitle - The assignment title
 * @param data.studentName - The name of the student who submitted
 * @param data.className - The class name
 * @param data.submissionUrl - The URL to view the submission
 * @returns The generated HTML email string
 */
export function newSubmissionReceivedEmailTemplate(data: {
  assignmentTitle: string
  studentName: string
  className: string
  submissionUrl: string
}): string {
  const content = `
    <h1>New Submission Received</h1>
    <p><strong>${escapeHtml(data.studentName)}</strong> has submitted their work for <strong>${escapeHtml(data.assignmentTitle)}</strong> in <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Student</span>
        <span class="info-value">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Assignment</span>
        <span class="info-value">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">Review Submission</a>
    </center>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for late submission received notifications (teacher).
 *
 * @param data - Late submission data
 * @param data.assignmentTitle - The assignment title
 * @param data.studentName - The student who submitted late
 * @param data.className - The class name
 * @param data.dueDate - The original due date
 * @param data.submittedAt - When the submission was actually made
 * @param data.submissionUrl - The URL to view the submission
 * @returns The generated HTML email string
 */
export function lateSubmissionReceivedEmailTemplate(data: {
  assignmentTitle: string
  studentName: string
  className: string
  dueDate: string
  submittedAt: string
  submissionUrl: string
}): string {
  const content = `
    <h1>Late Submission Received</h1>
    <p><strong>${escapeHtml(data.studentName)}</strong> submitted <strong>${escapeHtml(data.assignmentTitle)}</strong> in <strong>${escapeHtml(data.className)}</strong> after the deadline.</p>
    
    <div class="info-card" style="background: linear-gradient(135deg, #fff4de 0%, #fffbeb 100%); border-color: #f7d49f;">
      <div class="info-card-row" style="border-color: #f7d49f;">
        <span class="info-label" style="color: #8a5200;">Student</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="info-card-row" style="border-color: #f7d49f;">
        <span class="info-label" style="color: #8a5200;">Assignment</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row" style="border-color: #f7d49f;">
        <span class="info-label" style="color: #8a5200;">Due Date</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.dueDate)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label" style="color: #8a5200;">Submitted</span>
        <span class="info-value" style="color: ${classifiEmailTheme.titleText};">${escapeHtml(data.submittedAt)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">Review Late Submission</a>
    </center>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for similarity detected notifications (teacher).
 *
 * @param data - Similarity detection data
 * @param data.assignmentTitle - The assignment title
 * @param data.studentName - The student whose submission was flagged
 * @param data.className - The class name
 * @param data.similarityPercentage - The similarity percentage
 * @param data.submissionUrl - The URL to view the submission
 * @returns The generated HTML email string
 */
export function similarityDetectedEmailTemplate(data: {
  assignmentTitle: string
  studentName: string
  className: string
  similarityPercentage: number
  submissionUrl: string
}): string {
  const content = `
    <h1>Similarity Alert</h1>
    <p>A high code similarity score has been detected for a submission in <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="score-display" style="border-color: ${classifiEmailTheme.error};">
      <p class="score-number" style="color: ${classifiEmailTheme.error};">
        ${String(data.similarityPercentage)}%
      </p>
      <p class="score-percentage" style="color: ${classifiEmailTheme.error};">
        Similarity Score
      </p>
    </div>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Student</span>
        <span class="info-value">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Assignment</span>
        <span class="info-value">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">Review Submission</a>
    </center>
    
    <div class="alert alert-warning">
      <strong>Action required:</strong> Please review this submission to determine if academic integrity policies apply.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for student enrolled notifications (teacher).
 *
 * @param data - Student enrollment data
 * @param data.className - The class name
 * @param data.studentName - The student who enrolled
 * @param data.studentEmail - The student's email
 * @returns The generated HTML email string
 */
export function studentEnrolledEmailTemplate(data: {
  className: string
  studentName: string
  studentEmail: string
}): string {
  const content = `
    <h1>New Student Enrolled</h1>
    <p>A new student has joined your class <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Student</span>
        <span class="info-value">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Email</span>
        <span class="info-value">${escapeHtml(data.studentEmail)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
    </div>
    
    <div class="alert alert-success">
      <strong>Welcome:</strong> You may want to greet the new student and share any important class information.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for student unenrolled notifications (teacher).
 *
 * @param data - Student unenrollment data
 * @param data.className - The class name
 * @param data.studentName - The student who left
 * @param data.studentEmail - The student's email
 * @returns The generated HTML email string
 */
export function studentUnenrolledEmailTemplate(data: {
  className: string
  studentName: string
  studentEmail: string
}): string {
  const content = `
    <h1>Student Left Class</h1>
    <p><strong>${escapeHtml(data.studentName)}</strong> has left your class <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Student</span>
        <span class="info-value">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Email</span>
        <span class="info-value">${escapeHtml(data.studentEmail)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for new user registration notifications (admin).
 *
 * @param data - Registration data
 * @param data.userName - The new user's name
 * @param data.userEmail - The new user's email
 * @param data.userRole - The new user's role
 * @returns The generated HTML email string
 */
export function newUserRegisteredEmailTemplate(data: {
  userName: string
  userEmail: string
  userRole: string
}): string {
  const content = `
    <h1>Teacher Approval Required</h1>
    <p>A new teacher account request has been submitted and is awaiting administrator review.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Teacher</span>
        <span class="info-value">${escapeHtml(data.userName)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Email</span>
        <span class="info-value">${escapeHtml(data.userEmail)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Role</span>
        <span class="info-value">${escapeHtml(data.userRole)}</span>
      </div>
    </div>

    <div class="alert alert-warning">
      <strong>Action required:</strong> Review this teacher account in the admin panel and activate it when approved.
    </div>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for teacher approval notifications.
 *
 * @param data - Approval email data
 * @param data.teacherName - The teacher whose account was approved
 * @param data.loginUrl - The login page URL
 * @returns The generated HTML email string
 */
export function teacherApprovedEmailTemplate(data: {
  teacherName: string
  loginUrl: string
}): string {
  const content = `
    <h1>Your Teacher Account Has Been Approved</h1>
    <p>Hello <strong>${escapeHtml(data.teacherName)}</strong>, your account request has been reviewed and approved by the administrator.</p>

    <div class="alert alert-success">
      <strong>You may now sign in and start using the system.</strong>
    </div>

    <center>
      <a href="${escapeHtml(data.loginUrl)}" class="button">Sign In to ClassiFi</a>
    </center>

    <p style="font-size: 14px; color: ${classifiEmailTheme.bodyText};">
      If you did not request this account, please contact the administrator immediately.
    </p>
  `

  return baseEmailTemplate(content)
}

/**
 * Generates an HTML email template for removed from class notifications (student).
 *
 * @param data - Removal data
 * @param data.className - The class name
 * @param data.instructorName - The instructor who removed the student
 * @returns The generated HTML email string
 */
export function removedFromClassEmailTemplate(data: {
  className: string
  instructorName: string
}): string {
  const content = `
    <h1>Class Enrollment Update</h1>
    <p>You have been removed from <strong>${escapeHtml(data.className)}</strong> by <strong>${escapeHtml(data.instructorName)}</strong>.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Class</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
      <div class="info-card-row">
        <span class="info-label">Instructor</span>
        <span class="info-value">${escapeHtml(data.instructorName)}</span>
      </div>
    </div>
    
    <div class="alert alert-info">
      <strong>Note:</strong> If you believe this was done in error, please contact your instructor directly.
    </div>
  `

  return baseEmailTemplate(content)
}
