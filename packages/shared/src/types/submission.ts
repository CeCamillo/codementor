export interface SubmitRequest {
  files: Array<{ path: string; content: string }>;
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
}
