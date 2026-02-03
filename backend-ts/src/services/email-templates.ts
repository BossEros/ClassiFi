import { settings } from "../shared/config.js";

/**
 * Base HTML email template wrapper.
 * Provides consistent styling across all emails.
 */
function baseEmailTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background: #0d9488;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 500;
    }
    .button:hover {
      background: #0f766e;
    }
    .info-box {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #0d9488;
    }
    .info-box p {
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      padding: 20px 30px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${settings.appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated notification from ${settings.appName}.</p>
      <p>If you have questions, please contact your instructor.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email template for assignment creation notification.
 */
export function assignmentCreatedEmailTemplate(data: {
    assignmentTitle: string;
    className: string;
    dueDate: string;
    assignmentUrl: string;
}): string {
    const content = `
    <h2>New Assignment Posted</h2>
    <p>Your teacher has created a new assignment in <strong>${data.className}</strong>.</p>
    
    <div class="info-box">
      <p><strong>Assignment:</strong> ${data.assignmentTitle}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
    </div>
    
    <a href="${data.assignmentUrl}" class="button">View Assignment</a>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Make sure to submit your work before the deadline to avoid late penalties.
    </p>
  `;

    return baseEmailTemplate(content);
}

/**
 * Email template for submission graded notification.
 */
export function submissionGradedEmailTemplate(data: {
    assignmentTitle: string;
    grade: number;
    maxGrade: number;
    submissionUrl: string;
}): string {
    const percentage = Math.round((data.grade / data.maxGrade) * 100);

    const content = `
    <h2>Your Assignment Has Been Graded</h2>
    <p>Your submission for <strong>${data.assignmentTitle}</strong> has been graded.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="font-size: 36px; font-weight: bold; margin: 0; color: #0d9488;">
        ${data.grade}/${data.maxGrade}
      </p>
      <p style="font-size: 18px; color: #6b7280; margin: 10px 0 0 0;">
        ${percentage}%
      </p>
    </div>
    
    <a href="${data.submissionUrl}" class="button">View Submission</a>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Review your submission to see detailed feedback and test results.
    </p>
  `;

    return baseEmailTemplate(content);
}
