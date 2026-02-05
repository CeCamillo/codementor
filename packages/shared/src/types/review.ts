export interface Review {
  id: string;
  submissionId: string;
  overallFeedback: string;
  passed: boolean;
  conceptsFeedback: ConceptFeedback[];
  codeComments: CodeComment[];
  suggestedResources: string[];
  createdAt: Date;
}

export interface ConceptFeedback {
  conceptId: string;
  demonstrated: boolean;
  feedback: string;
  masteryDelta: number; // How much to adjust mastery (-10 to +10)
}

export interface CodeComment {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  severity: 'praise' | 'suggestion' | 'issue' | 'critical';
  message: string;
  conceptId?: string;
}

export interface HintRequest {
  taskId: string;
  userId: string;
  context: string; // What the user has tried
  hintsUsed: number;
}

export interface HintResponse {
  hint: string;
  isLastHint: boolean;
  conceptPointers: string[]; // Concepts to review
}

// Execution result types for sandbox testing
export interface TestResult {
  testName: string;
  passed: boolean;
  executionTimeMs: number;
  error?: string;
}

export interface ExecutionResults {
  passed: number;
  failed: number;
  total: number;
  tests: TestResult[];
  sandboxAvailable: boolean;
  fallbackUsed: boolean;
}

// Anti-pattern types
export type AntiPatternCategory =
  | 'type_safety'
  | 'mutation'
  | 'error_handling'
  | 'complexity'
  | 'best_practices';

export interface DetectedAntiPattern {
  type: string;
  category: AntiPatternCategory;
  location: {
    file: string;
    line: number;
  };
  message: string;
  suggestion: string;
  educational: string;
  severity: 'warning' | 'error';
}

// Reasoning assessment types
export interface ReasoningQuestion {
  question: string;
  context: string;
  category: 'design_choice' | 'trade_off' | 'alternative' | 'understanding';
}
