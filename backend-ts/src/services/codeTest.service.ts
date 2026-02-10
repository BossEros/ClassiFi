import { inject, injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { TestCaseRepository } from "@/repositories/testCase.repository.js"
import { TestResultRepository } from "@/repositories/testResult.repository.js"
import { SubmissionRepository } from "@/repositories/submission.repository.js"
import { AssignmentRepository } from "@/repositories/assignment.repository.js"
import { NotificationService } from "@/services/notification/notification.service.js"
import { StorageService } from "./storage.service.js"
import {
  CODE_EXECUTOR_TOKEN,
  type ICodeExecutor,
  type ExecutionRequest,
  type ExecutionResult,
  type ProgrammingLanguage,
} from "./interfaces/codeExecutor.interface.js"
import type {
  TestCase,
  NewTestResult,
  Submission,
  Assignment,
} from "@/models/index.js"
import {
  SubmissionNotFoundError,
  AssignmentNotFoundError,
} from "@/shared/errors.js"
import { settings } from "@/shared/config.js"

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
    @inject("TestCaseRepository") private testCaseRepo: TestCaseRepository,
    @inject("TestResultRepository")
    private testResultRepo: TestResultRepository,
    @inject("SubmissionRepository")
    private submissionRepo: SubmissionRepository,
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("StorageService") private storageService: StorageService,
    @inject("NotificationService")
    private notificationService: NotificationService,
  ) {}

  /**
   * Run all test cases for a submission and save results.
   * Called automatically when a student submits code.
   */
  async runTestsForSubmission(
    submissionId: number,
  ): Promise<TestExecutionSummary> {
    const { submission, assignment } =
      await this.fetchSubmissionData(submissionId)

    const testCases = await this.testCaseRepo.getByAssignmentId(
      submission.assignmentId,
    )

    if (testCases.length === 0) {
      return this.handleNoTestCases(submissionId, assignment.totalScore ?? 100)
    }

    const sourceCode = await this.prepareSourceCode(
      submission.filePath,
      assignment.programmingLanguage,
    )

    const executionResults = await this.executeTests(
      sourceCode,
      testCases,
      assignment.programmingLanguage,
      submission.filePath,
    )

    await this.saveTestResults(submissionId, testCases, executionResults)

    const { passed, total, percentage } =
      await this.testResultRepo.calculateScore(submissionId)

    await this.updateGradeAndNotify(
      submissionId,
      submission,
      assignment,
      passed,
      total,
    )

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
    const testCases = await this.testCaseRepo.getByAssignmentId(assignmentId)

    if (testCases.length === 0) {
      return {
        passed: 0,
        total: 0,
        percentage: 100,
        results: [],
      }
    }

    // Preprocess source code (reusing helper)
    const processedCode =
      language === "java"
        ? this.preprocessJavaSourceCode(sourceCode)
        : sourceCode

    // Build execution requests
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode: processedCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
      fileName: language === "java" ? "Main.java" : undefined,
    }))

    const executionResults = await this.executor.executeBatch(requests)

    const passed = executionResults.filter(
      (r) => r.status === "Accepted",
    ).length
    const total = executionResults.length
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 100

    const results = this.buildResultDetails(testCases, executionResults)

    return {
      passed,
      total,
      percentage,
      results,
    }
  }

  /**
   * Get test results for a submission (previously run).
   */
  async getTestResults(
    submissionId: number,
  ): Promise<TestExecutionSummary | null> {
    const resultsWithCases =
      await this.testResultRepo.getWithCasesBySubmissionId(submissionId)
    if (resultsWithCases.length === 0) {
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
      // Only include details for non-hidden tests
      ...(r.testCase.isHidden
        ? {}
        : {
            input: r.testCase.input,
            expectedOutput: r.testCase.expectedOutput,
            actualOutput: r.actualOutput ?? undefined,
            errorMessage: r.errorMessage ?? undefined,
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
    const submission = await this.submissionRepo.getSubmissionById(submissionId)

    if (!submission) {
      throw new SubmissionNotFoundError(submissionId)
    }

    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )

    if (!assignment) {
      throw new AssignmentNotFoundError(submission.assignmentId)
    }

    return { submission, assignment }
  }

  /**
   * Handle case when assignment has no test cases.
   */
  private async handleNoTestCases(
    submissionId: number,
    totalScore: number,
  ): Promise<TestExecutionSummary> {
    await this.submissionRepo.updateGrade(submissionId, totalScore)

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
    let sourceCode = await this.storageService.download("submissions", filePath)

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
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
      fileName: this.extractFileName(filePath),
    }))

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
    if (executionResults.length !== testCases.length) {
      throw new Error(
        `Result count mismatch: expected ${testCases.length}, got ${executionResults.length}`,
      )
    }

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
    const totalScore = assignment.totalScore ?? 100
    const grade =
      total > 0 ? Math.floor((passed / total) * totalScore) : totalScore

    await this.submissionRepo.updateGrade(submissionId, grade)

    this.notificationService
      .createNotification(submission.studentId, "SUBMISSION_GRADED", {
        submissionId: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        grade,
        maxGrade: totalScore,
        submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      })
      .catch((error) => {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.error("Failed to send grade notification:", error)
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
        // Only include details for non-hidden tests
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
