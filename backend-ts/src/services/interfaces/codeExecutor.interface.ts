/**
 * Code Executor Interface
 * 
 * Provides an abstraction layer for code execution services.
 * Allows swapping between Judge0, custom sandbox, or other providers.
 */

/** Supported programming languages */
export type ProgrammingLanguage = 'python' | 'java' | 'c';

/** Execution status from code runner */
export type ExecutionStatus =
    | 'Accepted'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Memory Limit Exceeded'
    | 'Compilation Error'
    | 'Runtime Error'
    | 'Internal Error'
    | 'Processing';

/** Execution result from code runner */
export interface ExecutionResult {
    /** Status of the execution */
    status: ExecutionStatus;
    /** Standard output (stdout) */
    stdout: string | null;
    /** Standard error (stderr) */
    stderr: string | null;
    /** Compiler output (for compilation errors) */
    compileOutput: string | null;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Memory used in kilobytes */
    memoryUsedKb: number;
    /** External token for tracking (e.g., Judge0 token) */
    token?: string;
}

/** Code execution request */
export interface ExecutionRequest {
    /** Source code to execute */
    sourceCode: string;
    /** Programming language */
    language: ProgrammingLanguage;
    /** Standard input (stdin) */
    stdin: string;
    /** Expected output for comparison (optional) */
    expectedOutput?: string;
    /** Time limit in seconds (default: 5) */
    timeLimitSeconds?: number;
    /** Memory limit in MB (default: 128) */
    memoryLimitMb?: number;
    /** Optional filename for the source code (required for Java public classes) */
    fileName?: string;
}

/**
 * Interface for code execution providers.
 * Implementations: Judge0Service, CustomSandboxService, etc.
 */
export interface ICodeExecutor {
    /**
     * Execute code and return result.
     * @param request - Execution request with code, language, and stdin
     * @returns Execution result with status, output, and metrics
     */
    execute(request: ExecutionRequest): Promise<ExecutionResult>;

    /**
     * Execute multiple test cases in batch.
     * More efficient than individual calls for multiple tests.
     * @param requests - Array of execution requests
     * @returns Array of execution results
     */
    executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResult[]>;

    /**
     * Check if the execution service is available.
     * @returns True if service is healthy and responsive
     */
    healthCheck(): Promise<boolean>;
}

/** Dependency injection token for ICodeExecutor */
export const CODE_EXECUTOR_TOKEN = 'ICodeExecutor';
