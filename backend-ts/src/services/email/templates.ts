import { settings } from "../../shared/config.js"

/**
 * Escapes HTML special characters to prevent HTML injection attacks.
 * Converts characters like <, >, &, ", and ' to their HTML entity equivalents.
 *
 * @param text - The text to escape.
 * @returns The escaped text safe for HTML insertion.
 */
function escapeHtml(text: string): string {
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
 * Base HTML email template wrapper with professional styling.
 * Provides consistent, responsive design across all emails.
 *
 * @param content - The main email content HTML
 * @param accentColor - Optional accent color for the header (defaults to teal)
 * @returns Complete HTML email string
 */
function baseEmailTemplate(
  content: string,
  accentColor: string = "#0d9488",
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(settings.appName)} Notification</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    
    /* Container */
    .email-wrapper {
      width: 100%;
      background-color: #f9fafb;
      padding: 20px 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, ${accentColor} 0%, ${adjustBrightness(accentColor, 20)} 100%);
      padding: 32px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .tagline {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin: 8px 0 0 0;
      font-weight: 400;
    }
    
    /* Content */
    .content {
      padding: 40px;
    }
    
    .content h1 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    
    .content h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 24px 0 12px 0;
    }
    
    .content p {
      font-size: 16px;
      color: #4b5563;
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    /* Info card */
    .info-card {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .info-card-row {
      display: table;
      width: 100%;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
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
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      vertical-align: middle;
    }
    
    .info-value {
      display: table-cell;
      width: 60%;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      text-align: right;
      vertical-align: middle;
    }
    
    /* Score display */
    .score-display {
      text-align: center;
      padding: 32px;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px;
      margin: 24px 0;
      border: 2px solid #e5e7eb;
    }
    
    .score-number {
      font-size: 48px;
      font-weight: 700;
      margin: 0;
      line-height: 1;
    }
    
    .score-percentage {
      font-size: 20px;
      color: #6b7280;
      margin: 8px 0 0 0;
      font-weight: 500;
    }
    
    /* Button */
    .button {
      display: inline-block;
      background: ${accentColor};
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      margin: 24px 0;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .button:hover {
      background: ${adjustBrightness(accentColor, -10)};
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    }
    
    /* Alert box */
    .alert {
      padding: 16px 20px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .alert-info {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }
    
    .alert-warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    
    .alert-success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    
    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 32px 0;
    }
    
    /* Footer */
    .footer {
      background: #f9fafb;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer p {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0;
      line-height: 1.5;
    }
    
    .footer-links {
      margin: 16px 0 0 0;
    }
    
    .footer-link {
      color: ${accentColor};
      text-decoration: none;
      font-weight: 500;
      margin: 0 12px;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 0 !important;
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
  <div class="email-wrapper">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <div class="email-container">
            <div class="header">
              <h1 class="logo">${escapeHtml(settings.appName)}</h1>
              <p class="tagline">Your Coding Education Platform</p>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p><strong>This is an automated notification from ${escapeHtml(settings.appName)}.</strong></p>
              <p>If you have questions, please contact your instructor or visit our help center.</p>
              <div class="footer-links">
                <a href="#" class="footer-link">Help Center</a>
                <a href="#" class="footer-link">Contact Support</a>
              </div>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${escapeHtml(settings.appName)}. All rights reserved.
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
    <h1>📚 New Assignment Posted</h1>
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
        <span class="info-value">📅 ${escapeHtml(data.dueDate)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.assignmentUrl)}" class="button">View Assignment Details</a>
    </center>
    
    <div class="alert alert-info">
      <strong>💡 Pro Tip:</strong> Start early to avoid last-minute stress. Review the test cases and requirements carefully before submitting.
    </div>
  `

  return baseEmailTemplate(content, "#0d9488")
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
}): string {
  const percentage =
    data.maxGrade > 0 ? Math.round((data.grade / data.maxGrade) * 100) : 0

  // Determine color based on grade
  let scoreColor = "#10b981" // Green for good grades
  let alertType = "alert-success"
  let emoji = "🎉"
  let message = "Excellent work! Keep up the great performance."

  if (percentage < 60) {
    scoreColor = "#ef4444" // Red for low grades
    alertType = "alert-warning"
    emoji = "📚"
    message =
      "Don't worry! Review the feedback and test results to improve next time."
  } else if (percentage < 80) {
    scoreColor = "#f59e0b" // Orange for medium grades
    alertType = "alert-info"
    emoji = "💪"
    message = "Good effort! Review the feedback to see where you can improve."
  }

  const content = `
    <h1>✅ Your Assignment Has Been Graded</h1>
    <p>Your submission for <strong>${escapeHtml(data.assignmentTitle)}</strong> has been reviewed and graded by your instructor.</p>
    
    <div class="score-display" style="border-color: ${scoreColor};">
      <p class="score-number" style="color: ${scoreColor};">
        ${String(data.grade)}/${String(data.maxGrade)}
      </p>
      <p class="score-percentage" style="color: ${scoreColor};">
        ${String(percentage)}%
      </p>
    </div>
    
    <center>
      <a href="${escapeHtml(data.submissionUrl)}" class="button">View Detailed Feedback</a>
    </center>
    
    <div class="alert ${alertType}">
      <strong>${emoji} ${message}</strong>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #6b7280;">
      <strong>What's next?</strong> Review your submission to see detailed feedback, test results, and areas for improvement. Use this feedback to enhance your coding skills.
    </p>
  `

  return baseEmailTemplate(content, scoreColor)
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
    <h1>📢 Class Announcement</h1>
    <p>Your instructor has posted an important announcement in <strong>${escapeHtml(data.className)}</strong>.</p>
    
    <div class="info-card">
      <p style="font-size: 16px; color: #1f2937; line-height: 1.6; margin: 0;">
        ${escapeHtml(data.message)}
      </p>
    </div>
    
    <div class="alert alert-info">
      <strong>📌 Note:</strong> Make sure to read this announcement carefully as it may contain important information about assignments, deadlines, or class policies.
    </div>
  `

  return baseEmailTemplate(content, "#3b82f6")
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
    <h1>⏰ Assignment Deadline Reminder</h1>
    <p>This is a friendly reminder that your assignment <strong>${escapeHtml(data.assignmentTitle)}</strong> is due soon!</p>
    
    <div class="info-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #f59e0b;">
      <div class="info-card-row" style="border-color: #fbbf24;">
        <span class="info-label" style="color: #92400e;">Assignment</span>
        <span class="info-value" style="color: #78350f;">${escapeHtml(data.assignmentTitle)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label" style="color: #92400e;">Due Date</span>
        <span class="info-value" style="color: #78350f;">⏰ ${escapeHtml(data.dueDate)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.assignmentUrl)}" class="button" style="background: #f59e0b;">Submit Assignment Now</a>
    </center>
    
    <div class="alert alert-warning">
      <strong>⚠️ Important:</strong> Late submissions may incur penalties. Make sure to submit your work before the deadline to receive full credit.
    </div>
  `

  return baseEmailTemplate(content, "#f59e0b")
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
    <h1>🎓 Welcome to ${escapeHtml(data.className)}!</h1>
    <p>Congratulations! You have been successfully enrolled in <strong>${escapeHtml(data.className)}</strong>. We're excited to have you in the class.</p>
    
    <div class="info-card">
      <div class="info-card-row">
        <span class="info-label">Class Name</span>
        <span class="info-value">${escapeHtml(data.className)}</span>
      </div>
      <div class="info-card-row" style="border-bottom: none;">
        <span class="info-label">Instructor</span>
        <span class="info-value">👨‍🏫 ${escapeHtml(data.instructorName)}</span>
      </div>
    </div>
    
    <center>
      <a href="${escapeHtml(data.classUrl)}" class="button">Go to Class Dashboard</a>
    </center>
    
    <div class="alert alert-success">
      <strong>🚀 Getting Started:</strong> Visit your class dashboard to view assignments, announcements, and course materials. Don't hesitate to reach out to your instructor if you have any questions.
    </div>
    
    <div class="divider"></div>
    
    <h2>What's Next?</h2>
    <p style="font-size: 14px; color: #4b5563;">
      • Check for any pending assignments<br>
      • Review the class syllabus and requirements<br>
      • Introduce yourself to your instructor and classmates<br>
      • Set up your development environment
    </p>
  `

  return baseEmailTemplate(content, "#10b981")
}
