import { test, expect } from "@playwright/test"

/**
 * E2E tests for assignment flows.
 * Covers creating an assignment as a teacher and submitting as a student.
 */
test.describe("Assignment Management", () => {
  // Increase timeout for this suite as it involves file uploads and multiple page transitions
  test.setTimeout(60000)

  const teacherUser = {
    id: 1,
    email: "teacher@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "teacher",
  }

  const studentUser = {
    id: 2,
    email: "student@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "student",
  }

  const mockClass = {
    id: 1,
    className: "Introduction to Computer Science",
    classCode: "CS101X",
    teacherId: 1,
    studentCount: 1,
    isActive: true,
  }
  const mockAssignment = {
    id: 101,
    classId: 1,
    className: "Introduction to Computer Science",
    assignmentName: "Hello World in Python",
    title: "Hello World in Python",
    description:
      "Write a program that prints 'Hello, World!' and passes all tests.",
    programmingLanguage: "python",
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    allowResubmission: true,
    maxAttempts: null,
    isActive: true,
    totalScore: 100,
    testCases: [],
    templateCode: "",
    hasTemplateCode: false,
    scheduledDate: null,
  }

  test.describe("As a Teacher", () => {
    test.beforeEach(async ({ page }) => {
      // Mock auth session
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, teacherUser)

      // Mock class detail data
      await page.route("**/api/v1/classes/1*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            classInfo: mockClass,
            assignments: [],
            students: [
              {
                id: 2,
                firstName: "Jane",
                lastName: "Smith",
                email: "student@example.com",
                role: "student",
              },
            ],
          }),
        })
      })

      await page.goto("/dashboard/classes/1")
    })

    test("should successfully create a new assignment", async ({ page }) => {
      // Mock assignment creation
      await page.route("**/api/v1/classes/1/assignments", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, assignment: mockAssignment }),
        })
      })

      // Click Add Assignment button
      await page.getByRole("button", { name: /add assignment/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/classes\/1\/assignments\/new/)

      // Fill in assignment details using IDs
      await page.locator("#assignmentName").fill("Hello World in Python")
      await page
        .locator("#description")
        .fill(
          "Write a program that prints 'Hello, World!' and passes all tests.",
        )

      // Select language
      await page.locator("#programmingLanguage").click()
      await page.getByRole("option", { name: "Python" }).click()

      // Set deadline using custom DatePicker
      // 1. Click the trigger
      await page.getByRole("button", { name: /pick a date/i }).click()
      // 2. Click a future date (select first available enabled day button)
      await page
        .locator('button[role="gridcell"]:not([aria-disabled="true"])')
        .first()
        .click()

      // Set total score
      await page.locator("#totalScore").fill("100")

      // Mock the class detail call to include the new assignment after success
      await page.route("**/api/v1/classes/1*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            classInfo: mockClass,
            assignments: [mockAssignment],
            students: [
              { id: 2, firstName: "Jane", lastName: "Smith", role: "student" },
            ],
          }),
        })
      })

      // Submit
      await page.getByRole("button", { name: /create assignment/i }).click()

      // Verify success and list
      await expect(page).toHaveURL(/\/dashboard\/classes\/1$/)
      await expect(
        page.getByText(/assignment created successfully/i),
      ).toBeVisible()
      await expect(page.getByText("Hello World in Python")).toBeVisible()
    })
  })

  test.describe("As a Student", () => {
    test.beforeEach(async ({ page }) => {
      // Mock auth session
      await page.addInitScript((user) => {
        window.localStorage.setItem("user", JSON.stringify(user))
      }, studentUser)

      // Mock student dashboard
      await page.route("**/api/v1/student/dashboard/2*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            recentClasses: [mockClass],
            pendingTasks: [
              {
                id: 101,
                assignmentName: "Hello World in Python",
                className: "Introduction to Computer Science",
                deadline: mockAssignment.deadline,
                programmingLanguage: "python",
              },
            ],
          }),
        })
      })

      // Mock assignment detail
      await page.route("**/api/v1/assignments/101*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            assignment: mockAssignment,
          }),
        })
      })

      // Mock submission history
      await page.route(
        "**/api/v1/submissions/history/101/2*",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              submissions: [],
            }),
          })
        },
      )

      await page.goto("/dashboard")
    })

    test("should successfully submit assignment", async ({ page }) => {
      // Navigate to assignment
      await page.getByText("Hello World in Python").first().click()
      await expect(page).toHaveURL(/\/dashboard\/assignments\/101/)

      // Setup mock for file upload
      await page.route("**/api/v1/submissions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Assignment submitted successfully",
            submission: {
              id: 501,
              assignmentId: 101,
              studentId: 2,
              status: "graded",
              grade: 100,
              submittedAt: new Date().toISOString(),
            },
          }),
        })
      })

      // Setup mock for test results
      await page.route("**/api/v1/submissions/501/results*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              passedCount: 1,
              totalCount: 1,
              score: 100,
              results: [
                {
                  testCaseId: 1,
                  status: "passed",
                  actualOutput: "Hello, World!",
                  expectedOutput: "Hello, World!",
                },
              ],
            },
          }),
        })
      })

      // Refreshed history
      await page.route(
        "**/api/v1/submissions/history/101/2*",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              submissions: [
                {
                  id: 501,
                  assignmentId: 101,
                  studentId: 2,
                  status: "graded",
                  grade: 100,
                  submittedAt: new Date().toISOString(),
                },
              ],
            }),
          })
        },
      )

      // Upload file
      // Use the dropzone or hidden input
      const fileBuffer = Buffer.from('print("Hello, World!")')
      await page.locator('input[type="file"]').setInputFiles({
        name: "hello.py",
        mimeType: "text/x-python",
        buffer: fileBuffer,
      })

      // Submit
      await page.getByRole("button", { name: /submit assignment/i }).click()

      // Verify success and results
      await expect(
        page.getByText(/assignment submitted successfully/i),
      ).toBeVisible()
      await expect(page.locator("text=100%").first()).toBeVisible()
      await expect(page.getByText("All tests passed!")).toBeVisible()
    })
  })
})
