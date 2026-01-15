import { inject, injectable } from "tsyringe";
import { TestCaseRepository } from "@/repositories/testCase.repository.js";
import {
  TestResultRepository,
  type TestResultWithCase,
} from "@/repositories/testResult.repository.js";
import { SubmissionRepository } from "@/repositories/submission.repository.js";
import { AssignmentRepository } from "@/repositories/assignment.repository.js";
import { StorageService } from "./storage.service.js";
import {
  CODE_EXECUTOR_TOKEN,
  type ICodeExecutor,
  type ExecutionRequest,
} from "./interfaces/codeExecutor.interface.js";
import type { TestCase, NewTestResult } from "@/models/index.js";

/** Test execution summary */
export interface TestExecutionSummary {
  submissionId: number;
  passed: number;
  total: number;
  percentage: number;
  results: TestResultDetail[];
}

/** Individual test result detail */
export interface TestResultDetail {
  testCaseId: number;
  name: string;
  status: string;
  isHidden: boolean;
  executionTimeMs: number;
  memoryUsedKb: number;
  // Only included for non-hidden tests
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
}

/** Preview test run (without saving) */
export interface TestPreviewResult {
  passed: number;
  total: number;
  percentage: number;
  results: TestResultDetail[];
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
    @inject("StorageService") private storageService: StorageService
  ) {}

  /**
   * Run all test cases for a submission and save results.
   * Called automatically when a student submits code.
   */
  async runTestsForSubmission(
    submissionId: number
  ): Promise<TestExecutionSummary> {
    // Get submission details
    const submission = await this.submissionRepo.getSubmissionById(
      submissionId
    );
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    // Get assignment to determine language
    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId
    );
    if (!assignment) {
      throw new Error(`Assignment ${submission.assignmentId} not found`);
    }

    // Get test cases for this assignment
    const testCases = await this.testCaseRepo.getByAssignmentId(
      submission.assignmentId
    );
    if (testCases.length === 0) {
      // No tests = full score (no failures)
      const fullGrade = assignment.totalScore ?? 100;
      await this.submissionRepo.updateGrade(submissionId, fullGrade);
      return {
        submissionId,
        passed: 0,
        total: 0,
        percentage: 100, // No tests = 100% (no failures)
        results: [],
      };
    }

    // Download source code from storage
    let sourceCode = await this.storageService.download(
      "submissions",
      submission.filePath
    );

    // Preprocess Java code to rename public class to Main (Judge0 requirement)
    if (assignment.programmingLanguage === "java") {
      sourceCode = this.preprocessJavaSourceCode(sourceCode);
    }

    // Build execution requests
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode,
      language: assignment.programmingLanguage as "python" | "java" | "c",
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
      fileName: this.extractFileName(submission.filePath),
    }));

    // Execute all tests in batch
    const executionResults = await this.executor.executeBatch(requests);

    // Delete any existing results for this submission
    await this.testResultRepo.deleteBySubmissionId(submissionId);

    // Save results to database
    const newResults: Omit<NewTestResult, "id" | "createdAt">[] =
      executionResults.map((result, index) => ({
        submissionId,
        testCaseId: testCases[index].id,
        status: result.status,
        actualOutput: result.stdout,
        executionTime: (result.executionTimeMs / 1000).toFixed(4), // Convert to seconds
        memoryUsed: result.memoryUsedKb,
        executorToken: result.token ?? null,
        errorMessage: result.stderr || result.compileOutput || null,
      }));

    await this.testResultRepo.createMany(newResults);

    // Calculate score
    const { passed, total, percentage } =
      await this.testResultRepo.calculateScore(submissionId);

    // Calculate and save grade based on test results
    // Formula: floor((passed / total) * totalScore) for whole number grades
    const totalScore = assignment.totalScore ?? 100;
    const grade =
      total > 0 ? Math.floor((passed / total) * totalScore) : totalScore;
    await this.submissionRepo.updateGrade(submissionId, grade);

    // Build response
    const results = this.buildResultDetails(testCases, executionResults);

    return {
      submissionId,
      passed,
      total,
      percentage,
      results,
    };
  }

  /**
   * Run tests in preview mode (without saving to database).
   * Used for the "Run Tests" button before final submission.
   */
  async runTestsPreview(
    sourceCode: string,
    language: "python" | "java" | "c",
    assignmentId: number
  ): Promise<TestPreviewResult> {
    // Get test cases for this assignment
    const testCases = await this.testCaseRepo.getByAssignmentId(assignmentId);
    if (testCases.length === 0) {
      return {
        passed: 0,
        total: 0,
        percentage: 100,
        results: [],
      };
    }

    // Build execution requests
    const requests: ExecutionRequest[] = testCases.map((tc) => ({
      sourceCode,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitSeconds: tc.timeLimit,
    }));

    // Execute all tests in batch
    const executionResults = await this.executor.executeBatch(requests);

    // Calculate score
    const passed = executionResults.filter(
      (r) => r.status === "Accepted"
    ).length;
    const total = executionResults.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 100;

    // Build response
    const results = this.buildResultDetails(testCases, executionResults);

    return {
      passed,
      total,
      percentage,
      results,
    };
  }

  /**
   * Get test results for a submission (previously run).
   */
  async getTestResults(
    submissionId: number
  ): Promise<TestExecutionSummary | null> {
    const resultsWithCases =
      await this.testResultRepo.getWithCasesBySubmissionId(submissionId);
    if (resultsWithCases.length === 0) {
      return null;
    }

    const { passed, total, percentage } =
      await this.testResultRepo.calculateScore(submissionId);

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
    }));

    return {
      submissionId,
      passed,
      total,
      percentage,
      results,
    };
  }

  /**
   * Check if the code executor service is healthy.
   */
  async healthCheck(): Promise<boolean> {
    return this.executor.healthCheck();
  }

  /**
   * Build result details from test cases and execution results.
   */
  private buildResultDetails(
    testCases: TestCase[],
    executionResults: Array<{
      status: string;
      stdout: string | null;
      stderr: string | null;
      compileOutput: string | null;
      executionTimeMs: number;
      memoryUsedKb: number;
    }>
  ): TestResultDetail[] {
    return testCases.map((tc, index) => {
      const result = executionResults[index];
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
      };
    });
  }

  /**
   * Extract filename from storage path.
   * Removes any unique ID prefix if present (e.g. "123_Main.java" -> "Main.java").
   * If no prefix found, returns the basename.
   */
  private extractFileName(filePath: string): string {
    const basename = filePath.split("/").pop() || "";
    // If file starts with distinct ID prefix (e.g. "1_Filename.java"), remove it
    // Pattern: Starts with digits followed by underscore
    const match = basename.match(/^\d+_(.+)$/);
    return match ? match[1] : basename;
  }

  /**
   * Preprocess Java source code for Judge0 compatibility.
   * Judge0's single-file Java expects the class to be named "Main".
   * This renames the public class to Main.
   */
  private preprocessJavaSourceCode(sourceCode: string): string {
    // Match "public class ClassName" and replace ClassName with "Main"
    // This regex handles various spacing and modifiers
    return sourceCode.replace(/public\s+class\s+(\w+)/, "public class Main");
  }
}
