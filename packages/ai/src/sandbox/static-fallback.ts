import type { TestExecutionResult, SandboxExecutionResult } from './types';

interface StaticAnalysisResult {
  hasSyntaxErrors: boolean;
  syntaxError?: string | undefined;
  hasRequiredExports: boolean;
  missingExports: string[];
  hasBasicStructure: boolean;
  structureIssues: string[];
}

function detectLanguage(filename: string): 'javascript' | 'typescript' {
  return filename.endsWith('.ts') || filename.endsWith('.tsx') ? 'typescript' : 'javascript';
}

function checkBasicSyntax(
  code: string,
  language: 'javascript' | 'typescript'
): { valid: boolean; error?: string | undefined } {
  try {
    // Basic syntax checks using regex patterns
    const issues: string[] = [];

    // Check for unmatched braces
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    // Check for unmatched parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
    }

    // Check for unmatched brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }

    // Check for common TypeScript-specific issues
    if (language === 'typescript') {
      // Check for unclosed type annotations
      if (/<[^>]*$/.test(code.replace(/=>/g, ''))) {
        issues.push('Potentially unclosed generic type');
      }
    }

    if (issues.length > 0) {
      return { valid: false, error: issues.join('; ') };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown syntax error',
    };
  }
}

function findExports(code: string): string[] {
  const exports: string[] = [];

  // Match "export function name"
  const funcExports = code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
  for (const match of funcExports) {
    if (match[1]) exports.push(match[1]);
  }

  // Match "export const name"
  const constExports = code.matchAll(/export\s+const\s+(\w+)/g);
  for (const match of constExports) {
    if (match[1]) exports.push(match[1]);
  }

  // Match "export class name"
  const classExports = code.matchAll(/export\s+class\s+(\w+)/g);
  for (const match of classExports) {
    if (match[1]) exports.push(match[1]);
  }

  // Match "export default"
  if (/export\s+default/.test(code)) {
    exports.push('default');
  }

  // Match named exports: export { name1, name2 }
  const namedExports = code.matchAll(/export\s*{\s*([^}]+)\s*}/g);
  for (const match of namedExports) {
    if (match[1]) {
      const names = match[1].split(',').map(
        (n) =>
          n
            .trim()
            .split(/\s+as\s+/)[0]
            ?.trim() ?? ''
      );
      exports.push(...names.filter(Boolean));
    }
  }

  return [...new Set(exports)];
}

function analyzeCode(
  code: string,
  filename: string,
  expectedExports?: string[]
): StaticAnalysisResult {
  const language = detectLanguage(filename);
  const syntaxCheck = checkBasicSyntax(code, language);
  const actualExports = findExports(code);

  const missingExports = expectedExports
    ? expectedExports.filter((e) => !actualExports.includes(e))
    : [];

  const structureIssues: string[] = [];

  // Check for empty file
  if (code.trim().length === 0) {
    structureIssues.push('File is empty');
  }

  // Check for common issues
  if (code.includes('TODO') || code.includes('FIXME')) {
    structureIssues.push('Contains TODO/FIXME comments');
  }

  return {
    hasSyntaxErrors: !syntaxCheck.valid,
    syntaxError: syntaxCheck.error,
    hasRequiredExports: missingExports.length === 0,
    missingExports,
    hasBasicStructure: structureIssues.length === 0,
    structureIssues,
  };
}

export interface StaticTest {
  name: string;
  code: string;
  expectedBehavior: string;
  requiredExports?: string[];
}

export function runStaticFallback(
  files: Array<{ name: string; content: string }>,
  tests: StaticTest[]
): SandboxExecutionResult {
  const startTime = Date.now();
  const results: TestExecutionResult[] = [];

  // Combine all files for analysis
  const combinedCode = files.map((f) => f.content).join('\n');

  for (const test of tests) {
    const testStartTime = Date.now();

    // Analyze user code
    const analysis = analyzeCode(combinedCode, files[0]?.name ?? 'index.ts', test.requiredExports);

    let passed = true;
    const issues: string[] = [];

    if (analysis.hasSyntaxErrors) {
      passed = false;
      issues.push(`Syntax error: ${analysis.syntaxError}`);
    }

    if (!analysis.hasRequiredExports && analysis.missingExports.length > 0) {
      passed = false;
      issues.push(`Missing exports: ${analysis.missingExports.join(', ')}`);
    }

    if (!analysis.hasBasicStructure) {
      // Don't fail for structure issues, just note them
      issues.push(`Structure notes: ${analysis.structureIssues.join(', ')}`);
    }

    results.push({
      testName: test.name,
      passed,
      stdout: passed ? 'Static analysis passed' : '',
      stderr: issues.join('\n'),
      executionTimeMs: Date.now() - testStartTime,
      error: passed ? undefined : 'Static analysis found issues',
    });
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    available: false,
    results,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    executionTimeMs: Date.now() - startTime,
    fallbackUsed: true,
  };
}

export function createBasicStaticTests(
  taskDescription: string,
  objectives: string[]
): StaticTest[] {
  // Extract likely function names from objectives
  const functionNames: string[] = [];
  for (const obj of objectives) {
    // Look for patterns like "implement X function", "create X", "function X"
    const matches = obj.match(
      /(?:implement|create|write|define)\s+(?:a\s+)?(?:function\s+)?['"`]?(\w+)['"`]?/gi
    );
    if (matches) {
      for (const match of matches) {
        const name = match
          .replace(/^(?:implement|create|write|define)\s+(?:a\s+)?(?:function\s+)?['"`]?/i, '')
          .replace(/['"`]?$/, '');
        if (name && name.length > 1) {
          functionNames.push(name);
        }
      }
    }
  }

  const tests: StaticTest[] = [
    {
      name: 'Basic syntax check',
      code: '',
      expectedBehavior: 'Code should have valid syntax',
    },
  ];

  if (functionNames.length > 0) {
    tests.push({
      name: 'Required exports check',
      code: '',
      expectedBehavior: `Code should export: ${functionNames.join(', ')}`,
      requiredExports: functionNames,
    });
  }

  return tests;
}
