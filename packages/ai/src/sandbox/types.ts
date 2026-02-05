export interface PistonExecuteRequest {
  language: 'javascript' | 'typescript';
  version: string;
  files: Array<{ name: string; content: string }>;
  stdin?: string | undefined;
  args?: string[] | undefined;
  run_timeout?: number | undefined;
  compile_timeout?: number | undefined;
  run_memory_limit?: number | undefined;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?:
    | {
        stdout: string;
        stderr: string;
        code: number;
        signal: string | null;
        output: string;
      }
    | undefined;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
  error?: string | undefined;
}

export interface TestExecutionResult {
  testName: string;
  passed: boolean;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  error?: string | undefined;
}

export interface SandboxExecutionResult {
  available: boolean;
  results: TestExecutionResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTimeMs: number;
  fallbackUsed: boolean;
}
