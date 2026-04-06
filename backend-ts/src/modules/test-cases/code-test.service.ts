import { inject, injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { TestCaseRepository } from "@/modules/test-cases/test-case.repository.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import { StorageService } from "@/services/storage.service.js"
import {
  CODE_EXECUTOR_TOKEN,
  type ICodeExecutor,
  type ExecutionRequest,
  type ExecutionResult,
  type ProgrammingLanguage,
} from "@/services/interfaces/codeExecutor.interface.js"
import type { Assignment } from "@/modules/assignments/assignment.model.js"
import type { Submission } from "@/modules/submissions/submission.model.js"
import type { TestCase } from "@/modules/test-cases/test-case.model.js"
import type { NewTestResult } from "@/modules/test-cases/test-result.model.js"
import {
  SubmissionNotFoundError,
  AssignmentNotFoundError,
} from "@/shared/errors.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { withTransaction } from "@/shared/transaction.js"

const logger = createLogger("CodeTestService")

/** Test execution summary */
export interface TestExecutionSummary {
  submissionId: number
  passed: number
  total: number
  percentage: number
  results: TestResultDetail[]
}

/** Individual test result detail */
export interface TestResultDetail {
  testCaseId: number
  name: string
  status: string
  isHidden: boolean
  executionTimeMs: number
  memoryUsedKb: number
  // Only included for non-hidden tests
  input?: string
  expectedOutput?: string
  actualOutput?: string
  errorMessage?: string
}

/** Preview test run (without saving) */
export interface TestPreviewResult {
  passed: number
  total: number
  percentage: number
  results: TestResultDetail[]
}

/**
 * Business logic service for code testing.
 * Uses ICodeExecutor for actual code execution (Judge0, etc.)
 */
@injectable()
export class CodeTestService {
  constructor(
    @inject(CODE_EXECUTOR_TOKEN) private executor: ICodeExecutor,
    @inject(DI_TOKENS.repositories.testCase)
    private testCaseRepo: TestCaseRepository,
    @inject(DI_TOKENS.repositories.testResult)
    private testResultRepo: TestResultRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.services.storage) private storageService: StorageService,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
  ) {}

  /**
   * Run all test cases for a submission and save results.
   * Called automatically when a student submits code.
   */
  async runTestsForSubmission(
    submissionId: number,
  ): Promise<TestExecutionSummary> {
    // STEP 1: Load the submission and the assignment it belongs to — we need both to proceed
    const { submission, assignment } = await this.fetchSubmissionData(submissionId)

    // STEP 2: Get the test cases for this assignment.
    // If the teacher hasn't added any, we just award full marks and skip everything else.
    const testCases = await this.testCaseRepo.getByAssignmentId(submission.assignmentId)

    if (testCases.length === 0) {
      return this.handleNoTestCases(submissionId, assignment.totalScore ?? 100)
    }

    // STEP 3: Download the student's code file from storage and preprocess it if needed.
    // Java files get their public class renamed to "Main" so Judge0 can compile them.
    const sourceCode = await this.prepareSourceCode(
      submission.filePath,
      assignment.programmingLanguage,
    )

    // STEP 4: Send the code to Judge0 and run it against every test case.
    // All test cases run in parallel and we wait for all of them to finish.
    const executionResults = await this.executeTests(
      sourceCode,
      testCases,
      assignment.programmingLanguage,
      submission.filePath,
    )

    // STEP 5: Save every test result to the database inside a transaction.
    // We delete the old results first so a resubmission always gives a fresh set.
    await this.saveTestResults(submissionId, testCases, executionResults)

    // STEP 6: Read the final score back from the database now that the results are saved
    const { passed, total, percentage } = await this.testResultRepo.calculateScore(submissionId)

    // STEP 7: Write the grade to the submission record and send the student a notification
    await this.updateGradeAndNotify(
      submissionId,
      submission,
      assignment,
      passed,
      total,
    )

    // STEP 8: Build the response object and send it back.
    // Hidden test case details (input/expected output) are stripped out before returning.
    const results = this.buildResultDetails(testCases, executionResults)

    return {
      submissionId,
      passed,
      total,
      percentage,
      results,
    }
  }

  /**
   * Run tests in preview mode (without saving to database).
   * Used for the "Run Tests" button before final submission.
   */
  async runTestsPreview(
    sourceCode: string,
    language: ProgrammingLanguage,
    assignmentId: number,
  ): Promise<TestPreviewResult> {
    // STEP 1: Grab all the test cases the teacher set up for this assignment
    const testCases = await this.testCaseRepo.getByAssignmentId(assignmentId)

    // If the teacher hasn't added any test cases yet, just return a perfect score so it doesn't block the student
    if (testCases.length === 0) {
      return {
        passed: 0,
        total: 0,
        percentage: 100,
        results: [],
      }
    }

    // STEP 2: Java files need special handling — Judge0 requires the public class to be named "Main",
    // so we rename it before sending. Python and C go through as-is.
    const processedCode =
      language === "java"
        ? this.preprocessJavaSourceCode(sourceCode)
        : sourceCode

    // STEP 3: Build one execution request per test case, each carrying the student's code,
    // the expected input, the expected output, and the time limit
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode: processedCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
      fileName: language === "java" ? "Main.java" : undefined,
    }))

    // STEP 4: Fire all test cases at Judge0 at the same time and wait for all results to come back
    const executionResults = await this.executor.executeBatch(requests)

    // STEP 5: Count how many came back as "Accepted" and calculate the pass percentage
    const passed = executionResults.filter((r) => r.status === "Accepted").length
    const total = executionResults.length
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 100

    // STEP 6: Shape the raw Judge0 results into the response format the frontend expects.
    // Hidden test case details (input/expected output) are stripped out here.
    const results = this.buildResultDetails(testCases, executionResults)

    // STEP 7: Return the summary — nothing has been written to the database
    return {
      passed,
      total,
      percentage,
      results,
    }
  }

  /**
   * Get test results for a submission (previously run).
   *
   * @param submissionId - The submission identifier.
   * @param includeHiddenDetails - Whether hidden test case details should be included.
   * @returns The test execution summary, or null when no persisted results exist.
   */
  async getTestResults(
    submissionId: number,
    includeHiddenDetails: boolean = false,
  ): Promise<TestExecutionSummary | null> {
    const resultsWithCases =
      await this.testResultRepo.getWithCasesBySubmissionId(submissionId)

    if (resultsWithCases.length === 0) {
      // Determine if the assignment simply has no test cases
      const { assignment } = await this.fetchSubmissionData(submissionId)
      const testCases = await this.testCaseRepo.getByAssignmentId(assignment.id)

      if (testCases.length === 0) {
        return {
          submissionId,
          passed: 0,
          total: 0,
          percentage: 100,
          results: [],
        }
      }

      return null
    }

    const { passed, total, percentage } =
      await this.testResultRepo.calculateScore(submissionId)

    const results: TestResultDetail[] = resultsWithCases.map((r) => ({
      testCaseId: r.testCaseId,
      name: r.testCase.name,
      status: r.status,
      isHidden: r.testCase.isHidden,
      executionTimeMs: r.executionTime ? parseFloat(r.executionTime) * 1000 : 0,
      memoryUsedKb: r.memoryUsed ?? 0,
      // Include hidden case details only when explicitly requested.
      ...(!r.testCase.isHidden || includeHiddenDetails
        ? {
            input: r.testCase.input,
            expectedOutput: r.testCase.expectedOutput,
            actualOutput: r.actualOutput ?? undefined,
            errorMessage: r.errorMessage ?? undefined,
          }
        : {
            input: undefined,
            expectedOutput: undefined,
            actualOutput: undefined,
            errorMessage: undefined,
          }),
    }))

    return {
      submissionId,
      passed,
      total,
      percentage,
      results,
    }
  }

  /**
   * Check if the code executor service is healthy.
   */
  async healthCheck(): Promise<boolean> {
    return this.executor.healthCheck()
  }

  /**
   * Fetch submission and assignment data.
   */
  private async fetchSubmissionData(submissionId: number) {
    // STEP 1: Pull the submission from the database
    const submission = await this.submissionRepo.getSubmissionById(submissionId)

    // If it doesn't exist there's nothing to run tests against — stop here
    if (!submission) {
      throw new SubmissionNotFoundError(submissionId)
    }

    // STEP 2: Pull the assignment the submission belongs to
    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )

    // Assignment could have been deleted after the student submitted — guard against that
    if (!assignment) {
      throw new AssignmentNotFoundError(submission.assignmentId)
    }

    // Both found — hand them back together so the caller doesn't have to do two lookups
    return { submission, assignment }
  }

  /**
   * Handle case when assignment has no test cases.
   */
  private async handleNoTestCases(
    submissionId: number,
    totalScore: number,
  ): Promise<TestExecutionSummary> {
    // Award the student full marks — if the teacher set up no tests, we can't penalize anyone
    await this.submissionRepo.updateGrade(submissionId, totalScore)

    // Return a "perfect" summary so the caller always gets a consistent object shape back
    return {
      submissionId,
      passed: 0,
      total: 0,
      percentage: 100,
      results: [],
    }
  }

  /**
   * Download and preprocess source code.
   */
  private async prepareSourceCode(
    filePath: string,
    language: ProgrammingLanguage,
  ): Promise<string> {
    // STEP 1: Download the student's code file from Supabase storage
    let sourceCode = await this.storageService.download("submissions", filePath)

    // STEP 2: Java files need their public class renamed to "Main" before Judge0 can compile them.
    // Python and C don't have this restriction so they go straight through.
    if (language === "java") {
      sourceCode = this.preprocessJavaSourceCode(sourceCode)
    }

    return sourceCode
  }

  /**
   * Execute tests for the given source code.
   */
  private async executeTests(
    sourceCode: string,
    testCases: TestCase[],
    language: ProgrammingLanguage,
    filePath: string,
  ): Promise<ExecutionResult[]> {
    // STEP 1: Bundle up everything Judge0 needs for each test case —
    // the code, the language, stdin to feed in, the expected output, and the time limit.
    // The filename is needed for Java so the JVM can match the file to the public class name.
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
      fileName: this.extractFileName(filePath),
    }))

    // STEP 2: Fire all test cases at Judge0 in one batch and wait for every result to come back
    return this.executor.executeBatch(requests)
  }

  /**
   * Save test results to database.
   */
  private async saveTestResults(
    submissionId: number,
    testCases: TestCase[],
    executionResults: ExecutionResult[],
  ): Promise<void> {
    // STEP 1: Sanity check — Judge0 should always return one result per test case we sent.
    // If the counts don't match something went wrong with the batch execution.
    if (executionResults.length !== testCases.length) {
      throw new Error(
        `Result count mismatch: expected ${testCases.length}, got ${executionResults.length}`,
      )
    }

    // STEP 2: Map each raw Judge0 result into the shape the database expects.
    // We convert execution time from ms to seconds here since that's what the DB column stores.
    const newResults: Omit<NewTestResult, "id" | "createdAt">[] =
      executionResults.map((result, index) => ({
        submissionId,
        testCaseId: testCases[index].id,
        status: result.status,
        actualOutput: result.stdout,
        executionTime: (result.executionTimeMs / 1000).toFixed(4),
        memoryUsed: result.memoryUsedKb,
        executorToken: result.token ?? null,
        errorMessage: result.stderr || result.compileOutput || null,
      }))

    // STEP 3: Delete the old results and insert the new ones inside a single transaction.
    // Doing both together means a resubmission can never end up with a half-old, half-new set.
    await db.transaction(async (tx) => {
      await this.testResultRepo.deleteBySubmissionId(submissionId, tx)
      await this.testResultRepo.createMany(newResults, tx)
    })
  }

  /**
   * Calculate grade and send notification to student.
   */
  private async updateGradeAndNotify(
    submissionId: number,
    submission: Submission,
    assignment: Assignment,
    passed: number,
    total: number,
  ): Promise<void> {
    // STEP 1: Calculate the numeric grade from the pass ratio.
    // e.g. 7 passed out of 10 test cases with a max score of 100 → grade = 70
    const totalScore = assignment.totalScore ?? 100
    const grade = total > 0 ? Math.floor((passed / total) * totalScore) : totalScore

    // STEP 2: Write the grade and create an in-app notification in a single transaction.
    // If either write fails we roll both back — the student should never see a grade without a notification.
    await withTransaction(async (transactionContext) => {
      const transactionSubmissionRepo = this.submissionRepo.withContext(transactionContext)
      const transactionNotificationService = this.notificationService.withContext(transactionContext)

      await transactionSubmissionRepo.updateGrade(submissionId, grade)
      await transactionNotificationService.createNotification(
        submission.studentId,
        "SUBMISSION_GRADED",
        {
          submissionId: submission.id,
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          grade,
          maxGrade: totalScore,
          submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
        },
      )
    })

    // STEP 3: Fire the email notification in the background — we don't block the response on it.
    // If the email fails we just log it; the grade is already saved so the student isn't left in the dark.
    void this.notificationService.sendEmailNotificationIfEnabled(
      submission.studentId,
      "SUBMISSION_GRADED",
      {
        submissionId: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        grade,
        maxGrade: totalScore,
        submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      },
    ).catch((error) => {
      logger.error("Failed to send grade notification email", {
        submissionId,
        studentId: submission.studentId,
        error,
      })
    })
  }

  /**
   * Build result details from test cases and execution results.
   */
  private buildResultDetails(
    testCases: TestCase[],
    executionResults: ExecutionResult[],
  ): TestResultDetail[] {
    return testCases.map((tc, index) => {
      const result = executionResults[index]

      return {
        testCaseId: tc.id,
        name: tc.name,
        status: result.status,
        isHidden: tc.isHidden,
        executionTimeMs: result.executionTimeMs,
        memoryUsedKb: result.memoryUsedKb,
        // For hidden test cases we only expose the pass/fail status.
        // Input and expected output are never sent to the student — only the teacher can see those.
        ...(tc.isHidden
          ? {}
          : {
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: result.stdout ?? undefined,
              errorMessage: result.stderr || result.compileOutput || undefined,
            }),
      }
    })
  }

  /**
   * Extract filename from storage path.
   * Removes any unique ID prefix if present (e.g. "123_Main.java" -> "Main.java").
   * If no prefix found, returns the basename.
   */
  private extractFileName(filePath: string): string {
    const basename = filePath.split("/").pop() || ""
    // If file starts with distinct ID prefix (e.g. "1_Filename.java"), remove it
    // Pattern: Starts with digits followed by underscore
    const match = basename.match(/^\d+_(.+)$/)
    return match ? match[1] : basename
  }

  /**
   * Preprocess Java source code for Judge0 compatibility.
   * Judge0's single-file Java expects the class to be named "Main".
   * This renames the public class to Main.
   */
  private preprocessJavaSourceCode(sourceCode: string): string {
    // Match "public class ClassName" and replace ClassName with "Main"
    // This regex handles various spacing and modifiers
    return sourceCode.replace(/public\s+class\s+\w+/, "public class Main")
  }
}
