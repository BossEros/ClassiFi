import { injectable } from 'tsyringe';
import { settings } from '@/shared/config.js';
import type {
    ICodeExecutor,
    ExecutionRequest,
    ExecutionResult,
    ExecutionStatus,
    ProgrammingLanguage,
} from './interfaces/codeExecutor.interface.js';

/** Judge0 API submission response */
interface Judge0SubmissionResponse {
    token: string;
}

/** Judge0 API result response */
interface Judge0ResultResponse {
    status: {
        id: number;
        description: string;
    };
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    time: string | null;
    memory: number | null;
    token: string;
}

/** Judge0 status ID mapping */
const JUDGE0_STATUS: Record<number, ExecutionStatus> = {
    1: 'Processing',    // In Queue
    2: 'Processing',    // Processing
    3: 'Accepted',      // Accepted
    4: 'Wrong Answer',  // Wrong Answer
    5: 'Time Limit Exceeded',
    6: 'Compilation Error',
    7: 'Runtime Error', // Runtime Error (SIGSEGV)
    8: 'Runtime Error', // Runtime Error (SIGXFSZ)
    9: 'Runtime Error', // Runtime Error (SIGFPE)
    10: 'Runtime Error', // Runtime Error (SIGABRT)
    11: 'Runtime Error', // Runtime Error (NZEC)
    12: 'Runtime Error', // Runtime Error (Other)
    13: 'Internal Error', // Internal Error
    14: 'Internal Error', // Exec Format Error
};

/** Language ID mapping for Judge0 */
const LANGUAGE_IDS: Record<ProgrammingLanguage, number> = {
    python: 71,  // Python (3.8.1)
    java: 62,    // Java (OpenJDK 13.0.1)
    c: 50,       // C (GCC 9.2.0)
};

/**
 * Judge0 Code Executor Service
 * 
 * Implements ICodeExecutor using self-hosted Judge0 API.
 * Handles code submission, polling for results, and status mapping.
 */
@injectable()
export class Judge0Service implements ICodeExecutor {
    private readonly apiUrl: string;
    private readonly pollingIntervalMs = 1000;
    private readonly maxPollingAttempts = 30;

    constructor() {
        // Default to local Docker instance
        this.apiUrl = settings.judge0Url || 'http://localhost:2358';
    }

    /**
     * Execute code and return result.
     */
    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        // Submit code to Judge0
        const token = await this.submitCode(request);

        // Poll for result
        return this.pollForResult(token);
    }

    /**
     * Execute multiple test cases in batch.
     */
    async executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResult[]> {
        // Submit batch of submissions
        const submissions = requests.map(req => ({
            source_code: this.encodeBase64(req.sourceCode),
            language_id: LANGUAGE_IDS[req.language],
            stdin: this.encodeBase64(req.stdin),
            expected_output: req.expectedOutput ? this.encodeBase64(req.expectedOutput) : undefined,
            cpu_time_limit: req.timeLimitSeconds ?? 5,
            memory_limit: (req.memoryLimitMb ?? 128) * 1024, // Convert MB to KB
            main_source_file_name: req.fileName,
        }));

        const response = await fetch(`${this.apiUrl}/submissions/batch?base64_encoded=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissions }),
        });

        if (!response.ok) {
            throw new Error(`Judge0 batch submission failed: ${response.status}`);
        }

        const data = await response.json() as Judge0SubmissionResponse[];
        const tokens = data.map(d => d.token);

        // Poll for all results
        return Promise.all(tokens.map(token => this.pollForResult(token)));
    }

    /**
     * Check if Judge0 is available.
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/about`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Submit code to Judge0 and return token.
     */
    private async submitCode(request: ExecutionRequest): Promise<string> {
        const payload = {
            source_code: this.encodeBase64(request.sourceCode),
            language_id: LANGUAGE_IDS[request.language],
            stdin: this.encodeBase64(request.stdin),
            expected_output: request.expectedOutput
                ? this.encodeBase64(request.expectedOutput)
                : undefined,
            cpu_time_limit: request.timeLimitSeconds ?? 5,
            memory_limit: (request.memoryLimitMb ?? 128) * 1024, // Convert MB to KB
            main_source_file_name: request.fileName,
        };

        const response = await fetch(`${this.apiUrl}/submissions?base64_encoded=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Judge0 submission failed: ${response.status}`);
        }

        const data = await response.json() as Judge0SubmissionResponse;
        return data.token;
    }

    /**
     * Poll Judge0 for result with exponential backoff.
     */
    private async pollForResult(token: string): Promise<ExecutionResult> {
        let attempts = 0;
        let delay = this.pollingIntervalMs;

        while (attempts < this.maxPollingAttempts) {
            const result = await this.getSubmissionResult(token);

            if (result.status !== 'Processing') {
                return result;
            }

            attempts++;
            await this.sleep(delay);
            delay = Math.min(delay * 1.5, 5000); // Exponential backoff, max 5s
        }

        return {
            status: 'Internal Error',
            stdout: null,
            stderr: null,
            compileOutput: null,
            executionTimeMs: 0,
            memoryUsedKb: 0,
            token,
        };
    }

    /**
     * Get submission result from Judge0.
     */
    private async getSubmissionResult(token: string): Promise<ExecutionResult> {
        const response = await fetch(
            `${this.apiUrl}/submissions/${token}?base64_encoded=true&fields=*`,
            { method: 'GET' }
        );

        if (!response.ok) {
            throw new Error(`Judge0 get result failed: ${response.status}`);
        }

        const data = await response.json() as Judge0ResultResponse;
        const status = JUDGE0_STATUS[data.status.id] ?? 'Internal Error';

        return {
            status,
            stdout: data.stdout ? this.decodeBase64(data.stdout) : null,
            stderr: data.stderr ? this.decodeBase64(data.stderr) : null,
            compileOutput: data.compile_output ? this.decodeBase64(data.compile_output) : null,
            executionTimeMs: data.time ? parseFloat(data.time) * 1000 : 0,
            memoryUsedKb: data.memory ?? 0,
            token: data.token,
        };
    }

    /**
     * Encode string to Base64.
     */
    private encodeBase64(str: string): string {
        return Buffer.from(str).toString('base64');
    }

    /**
     * Decode Base64 to string.
     */
    private decodeBase64(str: string): string {
        return Buffer.from(str, 'base64').toString('utf-8');
    }

    /**
     * Sleep helper.
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
