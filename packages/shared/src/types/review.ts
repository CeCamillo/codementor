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
