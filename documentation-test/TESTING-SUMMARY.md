# ClassiFi Testing Documentation Summary (Manual Verification Scope)

## Manually Verifiable Unit Tests

| Module Name | Unit Name | Date Tested | Test Case ID | Test Case Description | Expected Results | Actual Results | Remarks |
|:---|:---|:---|:---|:---|:---|:---|:---|
| Authentication | Register User | 3/28/26 | TC-001 | Verify that a new user is registered with valid input. | New account is created successfully. | As Expected | Passed |
| Authentication | Register User | 3/28/26 | TC-002 | Verify error handling when registering with an existing email. | User sees "User already exists" message. | As Expected | Passed |
| Authentication | Login User | 3/28/26 | TC-003 | Verify that login works with correct credentials. | User can access the dashboard after login. | As Expected | Passed |
| Authentication | Login User | 3/28/26 | TC-004 | Verify error handling with invalid login credentials. | User sees "Incorrect email or password" message. | As Expected | Passed |
| Authentication | Password Reset | 3/28/26 | TC-007 | Verify that a password reset request is sent. | User receives a password reset email. | As Expected | Passed |
| Class Management | Create Class | 3/28/26 | TC-008 | Verify that a teacher can create a new class. | New class appears in the teacher's class list. | As Expected | Passed |
| Class Management | Get Class Details | 3/28/26 | TC-011 | Verify that class details are retrieved by ID. | Class details page shows class information correctly. | As Expected | Passed |
| Class Management | Delete Class | 3/28/26 | TC-012 | Verify that a class owner can delete their class. | Class is removed from the teacher's class list. | As Expected | Passed |
| Submission | Submit Assignment | 3/28/26 | TC-013 | Verify that a valid assignment submission is processed. | Submission is accepted and marked as submitted. | As Expected | Passed |
| Submission | Submit Assignment | 3/28/26 | TC-014 | Verify error handling when submitting to an inactive assignment. | User sees "This assignment is no longer active" message. | As Expected | Passed |
| Submission | Submit Assignment | 3/28/26 | TC-015 | Verify error handling when submitting past the deadline. | User sees "Deadline has passed" message. | As Expected | Passed |
| Submission | Submit Assignment | 3/28/26 | TC-016 | Verify error handling when submitting an invalid file type. | User sees "Invalid file type" message. | As Expected | Passed |
| Submission | Submit Assignment | 3/28/26 | TC-017 | Verify error handling when file exceeds size limit. | User sees "File size exceeds limit" message. | As Expected | Passed |
| Plagiarism Detection | Analyze Files | 3/28/26 | TC-018 | Verify that files are analyzed for structural similarity. | Similarity report is shown after analysis. | As Expected | Passed |
| Plagiarism Detection | Analyze Files | 3/28/26 | TC-019 | Verify error handling when fewer than 2 files are provided. | User sees "At least 2 files are required" message. | As Expected | Passed |
| Gradebook | Get Gradebook | 3/28/26 | TC-022 | Verify that the class gradebook is retrieved correctly. | Gradebook page shows assignments and student grades. | As Expected | Passed |
| Gradebook | Override Grade | 3/28/26 | TC-023 | Verify that a teacher can override a student's grade. | Updated grade is shown and student is notified. | As Expected | Passed |
| Gradebook | Remove Override | 3/28/26 | TC-024 | Verify that a grade override can be removed. | Grade returns to computed score after removing override. | As Expected | Passed |
| Notification | Create Notification | 3/28/26 | TC-025 | Verify that an in-app notification is created. | New notification appears in the notification list. | As Expected | Passed |
| Notification | Mark as Read | 3/28/26 | TC-026 | Verify that a notification can be marked as read. | Notification status changes from unread to read. | As Expected | Passed |
| Notification | Send Email | 3/28/26 | TC-027 | Verify that an email notification is sent to a user. | User receives an email notification. | As Expected | Passed |
| Notification | Notification Preference | 3/29/26 | TC-028 | Verify that notification delivery follows user notification settings. | Notifications are sent only through channels enabled by the user. | As Expected | Passed |
| Student Dashboard | Join Class | 3/29/26 | TC-029 | Verify that a student can join a class using a valid class code. | Class appears in the student's enrolled classes. | As Expected | Passed |
| Student Dashboard | Pending Assignments | 3/29/26 | TC-030 | Verify that pending assignments are shown in dashboard. | Only upcoming and not-yet-submitted assignments are shown. | As Expected | Passed |
| Student Dashboard | Leave Class | 3/29/26 | TC-031 | Verify that a student can leave an enrolled class. | Student is removed from the class roster. | As Expected | Passed |

## Manually Verifiable Integration Tests

| Module Name | Unit Name | Date Tested | Test Case ID | Test Case Description | Expected Results | Actual Results | Remarks |
|:---|:---|:---|:---|:---|:---|:---|:---|
| Assignment | Assignment Created Notification | 3/28/26 | IT-001 | Verify that creating an assignment notifies enrolled students. | Students see in-app notifications and receive emails. | As Expected | Passed |
| Gradebook | Grade Override Notification | 3/28/26 | IT-002 | Verify that overriding a grade triggers notification and email. | Student sees grade update notification and receives email. | As Expected | Passed |
| Code Testing | Submission Graded Notification | 3/29/26 | IT-003 | Verify that running tests grades the submission and notifies the student. | Student receives a "submission graded" in-app notification and email. | As Expected | Passed |
| Submission | Teacher Feedback Notification | 3/29/26 | IT-004 | Verify that saving teacher feedback notifies the student. | Student receives a "feedback given" in-app notification and email. | As Expected | Passed |

