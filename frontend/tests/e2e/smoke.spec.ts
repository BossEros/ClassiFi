import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

test.describe.serial("Smoke Tests - Critical User Flows", () => {
  // Increase timeout to accommodate real API calls and code execution
  test.setTimeout(120000);

  // Shared state variables
  let teacherContext: BrowserContext;
  let studentContext: BrowserContext;
  let teacherPage: Page;
  let studentPage: Page;

  let classCode: string = "";
  let classId: number = 0;
  let assignmentId: number = 0;
  let teacherId: number = 0;
  let className: string = "";

  // Load test credentials from environment variables
  const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL;
  const TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD;
  const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL;
  const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD;

  // Validate that all required environment variables are present
  if (!TEACHER_EMAIL || !TEACHER_PASSWORD || !STUDENT_EMAIL || !STUDENT_PASSWORD) {
    throw new Error(
      "Missing required test credentials. Please set the following environment variables:\n" +
      "  - TEST_TEACHER_EMAIL\n" +
      "  - TEST_TEACHER_PASSWORD\n" +
      "  - TEST_STUDENT_EMAIL\n" +
      "  - TEST_STUDENT_PASSWORD"
    );
  }

  // Comment 1: Use Playwright’s test fixture `browser` instead of manual launch
  test.beforeAll(async ({ browser, baseURL }) => {
    // Comment 1 & 2: Create contexts per role to separate auth states
    teacherContext = await browser.newContext({
      baseURL: baseURL,
    });
    studentContext = await browser.newContext({
      baseURL: baseURL,
    });

    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();

    // Setup: Login Teacher
    console.log("Logging in as Teacher...");
    await teacherPage.goto("/login");
    await teacherPage.fill("#email", TEACHER_EMAIL);
    await teacherPage.fill("#password", TEACHER_PASSWORD);
    await teacherPage.getByRole("button", { name: /sign in/i }).click();
    try {
      await expect(teacherPage).toHaveURL(/\/dashboard/, { timeout: 30000 });
      await teacherPage.waitForLoadState("networkidle");
    } catch (error) {
      console.error("Teacher login failed!");
      console.log("Current URL:", teacherPage.url());
      try {
        const bodyText = await teacherPage.evaluate(() =>
          document.body.innerText.substring(0, 500),
        );
        console.log("Page text snippet:", bodyText);
      } catch (e) {
        console.log("Could not get page text");
      }
      throw error;
    }

    // Extract Teacher ID from localStorage for cleanup
    const userStr = await teacherPage.evaluate(() =>
      localStorage.getItem("user"),
    );
    if (userStr) {
      const user = JSON.parse(userStr);
      teacherId = user.id;
      console.log(`Captured Teacher ID: ${teacherId}`);
    } else {
      console.warn("Could not capture Teacher ID from localStorage");
    }

    // Setup: Login Student
    console.log("Logging in as Student...");
    await studentPage.goto("/login");
    await studentPage.fill("#email", STUDENT_EMAIL);
    await studentPage.fill("#password", STUDENT_PASSWORD);
    await studentPage.getByRole("button", { name: /sign in/i }).click();
    try {
      await expect(studentPage).toHaveURL(/\/dashboard/, { timeout: 30000 });
      await studentPage.waitForLoadState("networkidle");
    } catch (error) {
      console.error("Student login failed!");
      console.log("Current URL:", studentPage.url());

      try {
        const bodyText = await studentPage.evaluate(() =>
          document.body.innerText.substring(0, 500),
        );

        console.log("Page text snippet:", bodyText);
      } catch (e) {
        console.log("Could not get page text");
      }
      throw error;
    }
  });

  // Comment 3: Explicit cleanup steps using real API calls
  test.afterAll(async () => {
    console.log("Cleaning up test resources via API...");

    try {
      // Guard: Only attempt API cleanup if teacherPage and request exist
      if (teacherPage?.request) {
        const request = teacherPage.request;

        // Delete Assignment
        if (assignmentId) {
          console.log(`Deleting Assignment ID: ${assignmentId}`);
          const response = await request.delete(
            `/api/v1/assignments/${assignmentId}`,
            {
              params: { teacherId: teacherId.toString() }, // Pass as query param if needed
              // Some APIs might expect body, trying both or relying on implementation
              data: { teacherId: teacherId },
            },
          );
          if (response.ok()) {
            console.log("Assignment deleted successfully.");
          } else {
            console.error(
              `Failed to delete assignment: ${await response.text()}`,
            );
          }
        }

        // Delete Class
        if (classId) {
          console.log(`Deleting Class ID: ${classId}`);
          const response = await request.delete(`/api/v1/classes/${classId}`, {
            data: { teacherId: teacherId },
          });
          if (response.ok()) {
            console.log("Class deleted successfully.");
          } else {
            console.error(`Failed to delete class: ${await response.text()}`);
          }
        }
      } else {
        console.log("Skipping API cleanup - teacherPage.request not available");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      // Guard: Only close contexts if they were created
      if (teacherContext) {
        await teacherContext.close();
      }
      if (studentContext) {
        await studentContext.close();
      }
    }
  });

  test("should create a new class as teacher", async () => {
    const page = teacherPage; // Use teacher page context

    // Navigate to /dashboard/classes
    await page.goto("/dashboard/classes");

    // Click "Create New Class" button
    await page.getByRole("button", { name: /create new class/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/classes\/new/);

    // Comment 4: Store generated class name
    const timestamp = Date.now();
    className = `E2E Test Class - ${timestamp}`;
    await page.fill("#className", className);

    // Fill description field
    await page.fill("#description", "This is an automated E2E test class.");

    // Click "Generate" button
    const generateButton = page.getByRole("button", { name: /generate/i });
    console.log("Waiting for Generate button...");
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    console.log("Clicked Generate button.");

    // Wait for class code with explicit assertion
    // Note: The input does not have an ID, so we use placeholder or layout
    const classCodeInput = page.getByPlaceholder("Click Generate");
    try {
      await expect(classCodeInput).not.toBeEmpty({ timeout: 10000 });
    } catch (e) {
      console.error("Class code did not populate!");
      // Check for error toasts
      const toast = page.getByText(/error|failed/i);
      if (await toast.isVisible()) {
        console.error("Error toast observed:", await toast.textContent());
      }
      throw e;
    }

    // Capture class code
    classCode = await classCodeInput.inputValue();
    console.log(`Generated Class Code: ${classCode}`);

    // Select schedule
    await page.getByRole("button", { name: "Mon" }).click();
    await page.getByRole("button", { name: "Wed" }).click();
    await page.selectOption("#yearLevel", "1");
    await page.selectOption("#semester", "1");
    await page.fill("#academicYear", "2024-2025");

    // Click "Create Class" button
    await page.getByRole("button", { name: /create class/i }).click();

    // Wait for navigation back
    await expect(page).toHaveURL(/\/dashboard\/classes/);
    await expect(page.getByText(/class created successfully/i)).toBeVisible();

    // Verify class appears using Comment 4 logical fix (exact match implicitly by using unique variable)
    await expect(page.getByText(className)).toBeVisible();

    // Extract Class ID
    await page.getByText(className).click();
    await expect(page).toHaveURL(/\/dashboard\/classes\/\d+/);
    const url = page.url();
    const matches = url.match(/\/dashboard\/classes\/(\d+)/);
    if (matches && matches[1]) {
      classId = parseInt(matches[1]);
      console.log(`Captured Class ID: ${classId}`);
    }
  });

  test("should join class using class code as student", async () => {
    const page = studentPage; // Use student page context

    // Navigate to /dashboard/classes where the 'Join Class' button exists
    await page.goto("/dashboard/classes");
    await page.waitForLoadState("networkidle");

    // Debug: Verify we are on the correct page
    try {
      await expect(page).toHaveURL(/\/dashboard\/classes/, { timeout: 5000 });
      await expect(
        page.getByRole("heading", { name: "My Classes" }),
      ).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.error("Failed to load Student Classes page!");
      console.log("Current URL:", page.url());
      console.log(
        "Page text:",
        await page.evaluate(() => document.body.innerText.substring(0, 500)),
      );
      throw e;
    }

    // Click "Join Class" button
    // Use filter to be more robust against icon/text layout
    const joinButton = page
      .locator("button")
      .filter({ hasText: "Join a Class" });
    if ((await joinButton.count()) === 0) {
      console.log("Join button not found. Dumping page text...");
      console.log(
        await page.evaluate(() => document.body.innerText.substring(0, 1000)),
      );
    }
    await joinButton.click();

    // Wait for modal and fill code
    await expect(page.locator("#classCode")).toBeVisible();
    await page.fill("#classCode", classCode);

    // Click "Join Class" in modal
    await page
      .locator("form")
      .getByRole("button", { name: /join class/i })
      .click();

    // Verify success and enrollment
    try {
      // Allow some time for the join process
      await expect(page.getByText(/successfully joined/i)).toBeVisible({
        timeout: 10000,
      });

      // Comment 4: Student enrollment selects exact class name match
      // If exact match fails, log page text to see if it's truncated
      await expect(page.getByText(className, { exact: true })).toBeVisible({
        timeout: 10000,
      });

      // Navigate to class detail
      await page.getByText(className, { exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/classes\/\d+/);
    } catch (e) {
      console.error("Failed during join confirmation or class navigation!");
      console.log("Expected Class Name:", className);
      console.log("Current URL:", page.url());
      // Log toast if present
      const errorToast = page.getByText(/error|failed/i);
      if (await errorToast.isVisible()) {
        console.log("Error Toast:", await errorToast.textContent());
      }
      console.log(
        "Page text dump:",
        await page.evaluate(() => document.body.innerText.substring(0, 1000)),
      );
      throw e;
    }
  });

  test("should create assignment as teacher", async () => {
    const page = teacherPage;

    // Navigate to class detail
    await page.goto(`/dashboard/classes/${classId}`);

    // Click "Add Coursework"
    // Use first() as there might be buttons in header and empty state
    await page
      .getByRole("button", { name: /add coursework/i })
      .first()
      .click();
    await expect(page).toHaveURL(/.*\/coursework\/new/);

    // Fill Assignment Name
    const timestamp = Date.now();
    await page.fill("#assignmentName", `E2E Assignment - ${timestamp}`);
    await page.fill("#description", "E2E Test Assignment Description");
    await page.selectOption("#programmingLanguage", "python");

    // Handle Date Picker
    const deadlineInput = page.locator('input[type="date"]');
    if (
      (await deadlineInput.count()) > 0 &&
      (await deadlineInput.isVisible())
    ) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];
      await deadlineInput.fill(dateString);
    } else {
      // Custom DatePicker component interaction
      // Trigger might say "Pick a date..." or current date
      // We look for the button associated with "Deadline Date" label or placeholder
      await page
        .getByRole("button", { name: /pick a date|deadline date/i })
        .first()
        .click();

      // Select tomorrow or a future day dynamically
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayNumber = tomorrow.getDate().toString();
      await page
        .getByRole("button", { name: dayNumber, exact: true })
        .first()
        .click();    }

    await page.fill("#totalScore", "100");

    // Expand Test Cases section (collapsed by default when empty)
    await page.getByRole("button", { name: "Test Cases", exact: true }).click();

    // Add a Test Case
    await page.getByRole("button", { name: /add new test case/i }).click();
    await expect(
      page.getByRole("heading", { name: /add test case/i }),
    ).toBeVisible();
    await page.fill("#tcName", "Hello World Test");
    await page.fill("#tcOutput", "Hello, World!");
    await page.getByRole("button", { name: /add case/i }).click();

    // Verify test case added
    await expect(page.getByText("Hello World Test")).toBeVisible();
    await page.getByRole("button", { name: /create coursework/i }).click();

    // Verify success
    await expect(page).toHaveURL(new RegExp(`/dashboard/classes/${classId}`));
    await expect(
      page.getByText(/created successfully with 1 test case/i),
    ).toBeVisible();

    // Get Assignment ID
    await page.getByText(`E2E Assignment - ${timestamp}`).click();
    await expect(page).toHaveURL(/.*\/assignments\/\d+/);

    const url = page.url();
    const matches = url.match(/\/assignments\/(\d+)/);
    if (matches && matches[1]) {
      assignmentId = parseInt(matches[1]);
      console.log(`Captured Assignment ID: ${assignmentId}`);
    }
  });

  test("should submit assignment as student", async () => {
    const page = studentPage;

    if (!assignmentId) {
      console.warn(
        "Assignment ID was not captured in previous test! Attempting fallback navigation.",
      );
    }

    // Navigate to assignment details
    if (assignmentId) {
      await page.goto(`/dashboard/assignments/${assignmentId}`);
    } else {
      // Should not happen if previous test passed, but fallback
      await page
        .getByText(/E2E Assignment/i)
        .first()
        .click();
    }

    // Verify details
    await expect(page.getByText(/E2E Assignment/i)).toBeVisible();

    // Verify "Test Case" card is visible (Student should see the 1 test case we added)
    await expect(page.getByText(/test case/i)).toBeVisible();

    // Create and upload file
    const fileContent = Buffer.from('print("Hello, World!")');
    const fileName = "main.py";

    await page.setInputFiles('input[type="file"]', {
      name: fileName,
      mimeType: "text/x-python",
      buffer: fileContent,
    });

    await expect(page.getByText(fileName)).toBeVisible();

    // Submit
    // Text in UI is "Submit Coursework"
    await page
      .getByRole("button", { name: /submit coursework/i })
      .first()
      .click();

    // Toast text is "Coursework submitted successfully!"
    try {
      await expect(
        page.getByText(/coursework submitted successfully/i),
      ).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log("Submission success toast not found!");
      // Check for error banner
      const errorBanner = page.locator(".text-red-400");
      if ((await errorBanner.count()) > 0) {
        console.log(
          "Error Banner Text:",
          await errorBanner.first().textContent(),
        );
      }
      throw e;
    }

    // Verify test results (UI card title is "Test Cases" or "Test Case")
    await expect(page.getByText(/test cases?/i)).toBeVisible({
      timeout: 60000,
    });
    // Verify score or pass status
    // Use .first() to avoid strict mode violation if "Score" and "Passed" both appear
    // We just want to ensure the results card has loaded
    await expect(page.getByText(/passed/i).first()).toBeVisible({
      timeout: 30000,
    });
  });
});
