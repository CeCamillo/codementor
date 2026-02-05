export interface SubmitRequest {
  files: Array<{ path: string; content: string }>;
}

export interface ConceptMasteryUpdate {
  conceptId: string;
  conceptName: string;
  newMasteryLevel: number;
  nextReviewAt: string;
  isStruggling: boolean;
}

export interface SubmitResponse {
  submission: {
    id: string;
    taskId: string;
    status: 'passed' | 'needs_work';
  };
  review: {
    overallFeedback: string;
    passed: boolean;
    conceptsFeedback: Array<{
      conceptId: string;
      conceptName: string;
      demonstrated: boolean;
      feedback: string;
    }>;
    codeComments: Array<{
      filePath: string;
      lineStart: number;
      lineEnd: number;
      severity: 'praise' | 'suggestion' | 'issue' | 'critical';
      message: string;
    }>;
    suggestedResources: string[];
    reflectionQuestions: string[];
  };
  taskAdvanced: boolean;
  nextTask: { id: string; title: string; order: number } | null;
  conceptMastery?: ConceptMasteryUpdate[] | undefined;
  strugglingConcepts?:
    | Array<{
        conceptId: string;
        conceptName: string;
        consecutiveFailures: number;
      }>
    | undefined;
  // New fields for enhanced review
  executionResults?: {
    passed: number;
    failed: number;
    total: number;
    tests: Array<{
      name: string;
      passed: boolean;
      error?: string;
    }>;
    sandboxAvailable: boolean;
  };
  antiPatterns?: Array<{
    type: string;
    category: string;
    location: { file: string; line: number };
    message: string;
    suggestion: string;
    severity: 'warning' | 'error';
  }>;
  reasoningQuestions?: string[];
}

export interface ReflectionRespondRequest {
  submissionId: string;
  responses: Array<{
    questionIndex: number;
    answer: string;
  }>;
}

export interface ReflectionRespondResponse {
  success: true;
  followupFeedback: string;
  encouragement: string;
}
