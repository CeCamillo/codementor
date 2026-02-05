import { anthropic, MODELS } from '../client';

export interface AntiPattern {
  type: AntiPatternType;
  category: AntiPatternCategory;
  location: {
    file: string;
    line: number;
    column?: number | undefined;
  };
  code: string;
  message: string;
  suggestion: string;
  severity: 'warning' | 'error';
  educational: string;
}

export type AntiPatternCategory =
  | 'type_safety'
  | 'mutation'
  | 'error_handling'
  | 'complexity'
  | 'best_practices';

export type AntiPatternType =
  | 'any_abuse'
  | 'missing_null_check'
  | 'unsafe_type_assertion'
  | 'direct_mutation'
  | 'array_mutation'
  | 'empty_catch'
  | 'swallowed_error'
  | 'deep_nesting'
  | 'long_function'
  | 'magic_number'
  | 'console_log'
  | 'hardcoded_value'
  | 'no_error_handling'
  | 'implicit_any';

export interface AntiPatternDetectionRequest {
  files: Array<{ path: string; content: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AntiPatternDetectionResult {
  antiPatterns: AntiPattern[];
  summary: {
    total: number;
    byCategory: Record<AntiPatternCategory, number>;
    bySeverity: { warning: number; error: number };
  };
}

interface StaticAntiPattern {
  pattern: RegExp;
  type: AntiPatternType;
  category: AntiPatternCategory;
  message: string;
  suggestion: string;
  educational: string;
  severity: 'warning' | 'error';
  multiline?: boolean;
}

const STATIC_PATTERNS: StaticAntiPattern[] = [
  {
    pattern: /:\s*any\b/,
    type: 'any_abuse',
    category: 'type_safety',
    message: "Using 'any' type defeats TypeScript's type checking",
    suggestion: 'Define a proper interface or use a more specific type like unknown',
    educational:
      "The 'any' type tells TypeScript to skip type checking. This removes the safety net that catches bugs at compile time. Consider: what specific shape does this data have?",
    severity: 'warning',
  },
  {
    pattern: /as\s+\w+(?:\[\])?(?:\s*\|.*)?>/,
    type: 'unsafe_type_assertion',
    category: 'type_safety',
    message: 'Type assertion bypasses type safety',
    suggestion: 'Use type guards or proper type narrowing instead',
    educational:
      "Type assertions (using 'as') tell TypeScript to trust you. But what if you're wrong? Type guards let TypeScript verify the type at runtime.",
    severity: 'warning',
  },
  {
    pattern: /catch\s*\([^)]*\)\s*{\s*}/,
    type: 'empty_catch',
    category: 'error_handling',
    message: 'Empty catch block silently swallows errors',
    suggestion: 'Log the error or re-throw it after handling',
    educational:
      'When errors happen silently, bugs become invisible. At minimum, log the error. Better yet, handle it appropriately or let it bubble up.',
    severity: 'error',
  },
  {
    pattern: /catch\s*\([^)]*\)\s*{\s*(?:\/\/.*\n\s*)*}/,
    type: 'swallowed_error',
    category: 'error_handling',
    message: 'Error is caught but not handled',
    suggestion: 'Add proper error handling or logging',
    educational:
      'Catching an error creates a responsibility to handle it. Swallowing errors makes debugging nearly impossible.',
    severity: 'warning',
  },
  {
    pattern: /console\.log\(/,
    type: 'console_log',
    category: 'best_practices',
    message: 'console.log left in code',
    suggestion: 'Remove debug logs or use a proper logging system',
    educational:
      'console.log is great for debugging, but should be removed before submitting. In production, use structured logging.',
    severity: 'warning',
  },
  {
    pattern: /(?:^|\s)(\d{2,})\b(?!\s*[=<>!])/,
    type: 'magic_number',
    category: 'complexity',
    message: 'Magic number without explanation',
    suggestion: 'Extract to a named constant that explains its purpose',
    educational:
      'Magic numbers make code hard to understand. const MAX_RETRIES = 3 is clearer than just 3. What does this number represent?',
    severity: 'warning',
  },
  {
    pattern: /\.push\(|\.pop\(|\.shift\(|\.unshift\(|\.splice\(/,
    type: 'array_mutation',
    category: 'mutation',
    message: 'Direct array mutation',
    suggestion: 'Consider using immutable operations like [...arr, item] or arr.filter()',
    educational:
      'Mutating arrays directly can cause unexpected bugs, especially in React. Immutable operations create new arrays, making state changes predictable.',
    severity: 'warning',
  },
];

function detectStaticPatterns(files: Array<{ path: string; content: string }>): AntiPattern[] {
  const antiPatterns: AntiPattern[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? '';
      const lineNumber = lineIndex + 1;

      for (const pattern of STATIC_PATTERNS) {
        const match = line.match(pattern.pattern);
        if (match) {
          antiPatterns.push({
            type: pattern.type,
            category: pattern.category,
            location: {
              file: file.path,
              line: lineNumber,
              column: match.index,
            },
            code: line.trim(),
            message: pattern.message,
            suggestion: pattern.suggestion,
            severity: pattern.severity,
            educational: pattern.educational,
          });
        }
      }
    }

    // Check for deep nesting
    const nestingAntiPatterns = detectDeepNesting(file.path, file.content);
    antiPatterns.push(...nestingAntiPatterns);

    // Check for long functions
    const longFunctionPatterns = detectLongFunctions(file.path, file.content);
    antiPatterns.push(...longFunctionPatterns);
  }

  return antiPatterns;
}

function detectDeepNesting(filePath: string, content: string): AntiPattern[] {
  const antiPatterns: AntiPattern[] = [];
  const lines = content.split('\n');
  const MAX_NESTING = 4;

  let currentNesting = 0;
  let _maxNestingLine = 0;
  let maxNesting = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;

    currentNesting += opens - closes;

    if (currentNesting > maxNesting) {
      maxNesting = currentNesting;
      _maxNestingLine = i + 1;
    }

    if (currentNesting > MAX_NESTING && opens > 0) {
      antiPatterns.push({
        type: 'deep_nesting',
        category: 'complexity',
        location: { file: filePath, line: i + 1 },
        code: line.trim(),
        message: `Nesting level ${currentNesting} exceeds recommended maximum of ${MAX_NESTING}`,
        suggestion: 'Extract nested logic into separate functions or use early returns',
        severity: 'warning',
        educational:
          'Deep nesting makes code hard to follow. Try inverting conditions with early returns, or breaking complex logic into smaller functions.',
      });
      break; // Only report once per file
    }
  }

  return antiPatterns;
}

function detectLongFunctions(filePath: string, content: string): AntiPattern[] {
  const antiPatterns: AntiPattern[] = [];
  const MAX_FUNCTION_LINES = 50;

  // Match function declarations
  const functionPattern =
    /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;

  const lines = content.split('\n');
  let inFunction = false;
  let functionStart = 0;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (!inFunction && functionPattern.test(line)) {
      inFunction = true;
      functionStart = i;
      braceCount = 0;
    }

    if (inFunction) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount === 0 && i > functionStart) {
        const functionLength = i - functionStart + 1;
        if (functionLength > MAX_FUNCTION_LINES) {
          antiPatterns.push({
            type: 'long_function',
            category: 'complexity',
            location: { file: filePath, line: functionStart + 1 },
            code: (lines[functionStart] ?? '').trim(),
            message: `Function is ${functionLength} lines long (recommended: < ${MAX_FUNCTION_LINES})`,
            suggestion: 'Break down into smaller, focused functions',
            severity: 'warning',
            educational:
              'Long functions are hard to understand, test, and maintain. Each function should do one thing well. Look for logical sections that could be extracted.',
          });
        }
        inFunction = false;
      }
    }
  }

  return antiPatterns;
}

const antiPatternDetectionTool = {
  name: 'detect_antipatterns',
  description: 'Detect anti-patterns in student code with educational explanations',
  input_schema: {
    type: 'object' as const,
    properties: {
      antiPatterns: {
        type: 'array',
        description: 'Detected anti-patterns in the code',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Type of anti-pattern',
            },
            category: {
              type: 'string',
              enum: ['type_safety', 'mutation', 'error_handling', 'complexity', 'best_practices'],
            },
            file: {
              type: 'string',
              description: 'File path',
            },
            line: {
              type: 'number',
              description: 'Line number (1-indexed)',
            },
            code: {
              type: 'string',
              description: 'The problematic code snippet',
            },
            message: {
              type: 'string',
              description: 'Brief description of the issue',
            },
            suggestion: {
              type: 'string',
              description: 'How to fix it',
            },
            educational: {
              type: 'string',
              description: 'Educational explanation of why this is problematic',
            },
            severity: {
              type: 'string',
              enum: ['warning', 'error'],
            },
          },
          required: [
            'type',
            'category',
            'file',
            'line',
            'message',
            'suggestion',
            'educational',
            'severity',
          ],
        },
      },
    },
    required: ['antiPatterns'],
  },
};

export async function detectAntiPatterns(
  request: AntiPatternDetectionRequest
): Promise<AntiPatternDetectionResult> {
  // First, run static detection
  const staticAntiPatterns = detectStaticPatterns(request.files);

  // For advanced difficulty, also use AI for context-aware detection
  let aiAntiPatterns: AntiPattern[] = [];

  if (request.difficulty === 'advanced' && request.files.length > 0) {
    try {
      aiAntiPatterns = await detectWithAI(request.files);
    } catch (error) {
      console.warn('AI anti-pattern detection failed, using static only:', error);
    }
  }

  // Merge and deduplicate
  const allAntiPatterns = [...staticAntiPatterns, ...aiAntiPatterns];
  const uniqueAntiPatterns = deduplicateAntiPatterns(allAntiPatterns);

  // Build summary
  const summary = buildSummary(uniqueAntiPatterns);

  return {
    antiPatterns: uniqueAntiPatterns,
    summary,
  };
}

async function detectWithAI(
  files: Array<{ path: string; content: string }>
): Promise<AntiPattern[]> {
  const filesContext = files
    .map((f) => {
      const lines = f.content.split('\n');
      const numbered = lines.map((line, i) => `${i + 1}| ${line}`).join('\n');
      return `### ${f.path}\n\`\`\`\n${numbered}\n\`\`\``;
    })
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 2048,
    system: `You are a code quality expert analyzing student code for anti-patterns.

Focus on issues that are:
1. Educational - help students learn better practices
2. Practical - issues that cause real problems
3. Contextual - consider the code's purpose

Categories to check:
- type_safety: any abuse, missing null checks, unsafe assertions
- mutation: direct state/array mutation when immutability preferred
- error_handling: empty catches, swallowed errors, no error boundaries
- complexity: deep nesting, long functions, unclear logic
- best_practices: debug code, hardcoded values, naming issues

Only report significant issues. Be educational, not nitpicky.`,
    tools: [antiPatternDetectionTool],
    tool_choice: { type: 'tool', name: 'detect_antipatterns' },
    messages: [
      {
        role: 'user',
        content: `Analyze this code for anti-patterns:\n\n${filesContext}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return [];
  }

  const result = toolUse.input as {
    antiPatterns: Array<{
      type: string;
      category: AntiPatternCategory;
      file: string;
      line: number;
      code?: string;
      message: string;
      suggestion: string;
      educational: string;
      severity: 'warning' | 'error';
    }>;
  };

  return result.antiPatterns.map((ap) => ({
    type: ap.type as AntiPatternType,
    category: ap.category,
    location: { file: ap.file, line: ap.line },
    code: ap.code ?? '',
    message: ap.message,
    suggestion: ap.suggestion,
    educational: ap.educational,
    severity: ap.severity,
  }));
}

function deduplicateAntiPatterns(antiPatterns: AntiPattern[]): AntiPattern[] {
  const seen = new Set<string>();
  return antiPatterns.filter((ap) => {
    const key = `${ap.location.file}:${ap.location.line}:${ap.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildSummary(antiPatterns: AntiPattern[]): AntiPatternDetectionResult['summary'] {
  const byCategory: Record<AntiPatternCategory, number> = {
    type_safety: 0,
    mutation: 0,
    error_handling: 0,
    complexity: 0,
    best_practices: 0,
  };

  const bySeverity = { warning: 0, error: 0 };

  for (const ap of antiPatterns) {
    byCategory[ap.category]++;
    bySeverity[ap.severity]++;
  }

  return {
    total: antiPatterns.length,
    byCategory,
    bySeverity,
  };
}
