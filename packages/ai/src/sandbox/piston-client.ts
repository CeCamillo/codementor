import type { PistonExecuteRequest, PistonExecuteResponse, ExecutionResult } from './types';

const PISTON_API_URL = process.env['PISTON_API_URL'] ?? 'https://emkc.org/api/v2/piston';
const DEFAULT_RUN_TIMEOUT = 3000;
const DEFAULT_COMPILE_TIMEOUT = 10000;
const DEFAULT_MEMORY_LIMIT = 128 * 1024 * 1024; // 128MB

interface PistonRuntimeInfo {
  language: string;
  version: string;
  aliases: string[];
}

let cachedRuntimes: PistonRuntimeInfo[] | null = null;
let runtimesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getRuntimes(): Promise<PistonRuntimeInfo[]> {
  const now = Date.now();
  if (cachedRuntimes && now - runtimesCacheTime < CACHE_TTL) {
    return cachedRuntimes;
  }

  const response = await fetch(`${PISTON_API_URL}/runtimes`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch runtimes: ${response.status} ${response.statusText}`);
  }

  cachedRuntimes = (await response.json()) as PistonRuntimeInfo[];
  runtimesCacheTime = now;
  return cachedRuntimes;
}

export async function getLanguageVersion(language: 'javascript' | 'typescript'): Promise<string> {
  const runtimes = await getRuntimes();
  const runtime = runtimes.find((r) => r.language === language || r.aliases.includes(language));

  if (!runtime) {
    throw new Error(`Runtime not found for language: ${language}`);
  }

  return runtime.version;
}

export async function executeCode(
  request: Omit<PistonExecuteRequest, 'version'> & { version?: string }
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const version = request.version ?? (await getLanguageVersion(request.language));

    const pistonRequest: PistonExecuteRequest = {
      language: request.language,
      version,
      files: request.files,
      stdin: request.stdin,
      args: request.args,
      run_timeout: request.run_timeout ?? DEFAULT_RUN_TIMEOUT,
      compile_timeout: request.compile_timeout ?? DEFAULT_COMPILE_TIMEOUT,
      run_memory_limit: request.run_memory_limit ?? DEFAULT_MEMORY_LIMIT,
    };

    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pistonRequest),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        stdout: '',
        stderr: errorText,
        exitCode: -1,
        executionTimeMs,
        timedOut: false,
        error: `Piston API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = (await response.json()) as PistonExecuteResponse;

    // Check for compilation errors first
    if (result.compile && result.compile.code !== 0) {
      return {
        success: false,
        stdout: result.compile.stdout,
        stderr: result.compile.stderr || result.compile.output,
        exitCode: result.compile.code,
        executionTimeMs,
        timedOut: false,
        error: 'Compilation failed',
      };
    }

    // Check if execution timed out (signal SIGKILL often indicates timeout)
    const timedOut = result.run.signal === 'SIGKILL';

    return {
      success: result.run.code === 0,
      stdout: result.run.stdout,
      stderr: result.run.stderr,
      exitCode: result.run.code,
      executionTimeMs,
      timedOut,
      error: timedOut ? 'Execution timed out' : undefined,
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      stdout: '',
      stderr: '',
      exitCode: -1,
      executionTimeMs,
      timedOut: false,
      error: `Failed to execute code: ${errorMessage}`,
    };
  }
}

export async function isPistonAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${PISTON_API_URL}/runtimes`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
