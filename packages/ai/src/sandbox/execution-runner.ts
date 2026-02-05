import { executeCode, isPistonAvailable } from './piston-client';
import { runStaticFallback, createBasicStaticTests } from './static-fallback';
import type { SandboxExecutionResult, TestExecutionResult } from './types';

export interface TaskTest {
  id: string;
  name: string;
  code: string;
  testType: 'unit' | 'edge_case' | 'behavior';
  expectedBehavior: string;
}

export interface ExecutionRequest {
  files: Array<{ path: string; content: string }>;
  tests: TaskTest[];
  language?: 'javascript' | 'typescript';
  taskDescription?: string;
  objectives?: string[];
}

function detectLanguage(
  files: Array<{ path: string; content: string }>
): 'javascript' | 'typescript' {
  return files.some((f) => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
    ? 'typescript'
    : 'javascript';
}

function wrapTestWithRunner(userCode: string, testCode: string): string {
  return `
// User code
${userCode}

// Test runner
const __testResults = [];

function describe(name, fn) {
  try {
    fn();
  } catch (e) {
    __testResults.push({ name, passed: false, error: e.message });
  }
}

function it(name, fn) {
  try {
    fn();
    __testResults.push({ name, passed: true });
  } catch (e) {
    __testResults.push({ name, passed: false, error: e.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(\`Expected truthy value but got \${JSON.stringify(actual)}\`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(\`Expected falsy value but got \${JSON.stringify(actual)}\`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(\`Expected null but got \${JSON.stringify(actual)}\`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(\`Expected undefined but got \${JSON.stringify(actual)}\`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new Error(\`Expected array to contain \${JSON.stringify(item)}\`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(item)) {
          throw new Error(\`Expected string to contain "\${item}"\`);
        }
      } else {
        throw new Error('toContain can only be used with arrays or strings');
      }
    },
    toHaveLength(length) {
      if (actual?.length !== length) {
        throw new Error(\`Expected length \${length} but got \${actual?.length}\`);
      }
    },
    toThrow(message) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow can only be used with functions');
      }
      try {
        actual();
        throw new Error('Expected function to throw');
      } catch (e) {
        if (message && !e.message?.includes(message)) {
          throw new Error(\`Expected error message to include "\${message}" but got "\${e.message}"\`);
        }
      }
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) {
        throw new Error(\`Expected \${actual} to be greater than \${n}\`);
      }
    },
    toBeLessThan(n) {
      if (!(actual < n)) {
        throw new Error(\`Expected \${actual} to be less than \${n}\`);
      }
    },
    toBeInstanceOf(cls) {
      if (!(actual instanceof cls)) {
        throw new Error(\`Expected value to be instance of \${cls.name}\`);
      }
    },
    not: {
      toBe(expected) {
        if (actual === expected) {
          throw new Error(\`Expected \${JSON.stringify(actual)} not to be \${JSON.stringify(expected)}\`);
        }
      },
      toEqual(expected) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
          throw new Error(\`Expected values not to be equal\`);
        }
      },
      toContain(item) {
        if (Array.isArray(actual) && actual.includes(item)) {
          throw new Error(\`Expected array not to contain \${JSON.stringify(item)}\`);
        }
        if (typeof actual === 'string' && actual.includes(item)) {
          throw new Error(\`Expected string not to contain "\${item}"\`);
        }
      },
    },
  };
}

// Run tests
${testCode}

// Output results
console.log(JSON.stringify({ __testResults }));
`;
}

async function runSingleTest(
  files: Array<{ path: string; content: string }>,
  test: TaskTest,
  language: 'javascript' | 'typescript'
): Promise<TestExecutionResult> {
  const startTime = Date.now();

  // Combine user code
  const userCode = files.map((f) => f.content).join('\n');

  // Wrap test with our test runner
  const wrappedCode = wrapTestWithRunner(userCode, test.code);

  const result = await executeCode({
    language,
    files: [{ name: language === 'typescript' ? 'test.ts' : 'test.js', content: wrappedCode }],
    run_timeout: 5000,
    compile_timeout: 10000,
  });

  const executionTimeMs = Date.now() - startTime;

  if (!result.success) {
    return {
      testName: test.name,
      passed: false,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTimeMs,
      error: result.error || 'Test execution failed',
    };
  }

  // Parse test results from stdout
  try {
    const outputLines = result.stdout.trim().split('\n');
    const lastLine = outputLines[outputLines.length - 1];

    if (lastLine) {
      const parsed = JSON.parse(lastLine) as {
        __testResults: Array<{ name: string; passed: boolean; error?: string }>;
      };
      const testResults = parsed.__testResults || [];

      const failed = testResults.filter((t) => !t.passed);
      const passed = failed.length === 0 && testResults.length > 0;

      return {
        testName: test.name,
        passed,
        stdout: outputLines.slice(0, -1).join('\n'),
        stderr: failed.map((f) => `${f.name}: ${f.error}`).join('\n'),
        executionTimeMs,
        error: passed ? undefined : failed[0]?.error,
      };
    }
  } catch {
    // If we can't parse, check if there's any output indicating success
  }

  // If we can't parse results, consider it failed
  return {
    testName: test.name,
    passed: false,
    stdout: result.stdout,
    stderr: result.stderr || 'Could not parse test results',
    executionTimeMs,
    error: 'Failed to parse test output',
  };
}

export async function runTests(request: ExecutionRequest): Promise<SandboxExecutionResult> {
  const startTime = Date.now();
  const language = request.language ?? detectLanguage(request.files);

  // Check if Piston is available
  const pistonAvailable = await isPistonAvailable();

  if (!pistonAvailable) {
    // Fall back to static analysis
    console.warn('Piston sandbox unavailable, using static analysis fallback');

    const staticTests =
      request.tests.length > 0
        ? request.tests.map((t) => ({
            name: t.name,
            code: t.code,
            expectedBehavior: t.expectedBehavior,
          }))
        : createBasicStaticTests(request.taskDescription ?? '', request.objectives ?? []);

    return runStaticFallback(
      request.files.map((f) => ({ name: f.path, content: f.content })),
      staticTests
    );
  }

  // Run tests using Piston
  const results: TestExecutionResult[] = [];

  // If no tests defined, create basic validation
  if (request.tests.length === 0) {
    // Just validate that code compiles/runs without errors
    const userCode = request.files.map((f) => f.content).join('\n');
    const result = await executeCode({
      language,
      files: [{ name: language === 'typescript' ? 'index.ts' : 'index.js', content: userCode }],
      run_timeout: 5000,
      compile_timeout: 10000,
    });

    results.push({
      testName: 'Code compilation',
      passed: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTimeMs: result.executionTimeMs,
      error: result.error,
    });
  } else {
    // Run each test
    for (const test of request.tests) {
      const result = await runSingleTest(request.files, test, language);
      results.push(result);
    }
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    available: true,
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    executionTimeMs: Date.now() - startTime,
    fallbackUsed: false,
  };
}
