export interface ConceptForReview {
  conceptId: string;
  conceptName: string;
  masteryLevel: number;
  priority: number;
}

export interface GenerateProjectRequest {
  description: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  conceptsForReview?: ConceptForReview[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  objectives: string[];
  hints: string[];
  conceptIds: string[];
  estimatedMinutes: number;
  order: number;
}

export interface GeneratedProject {
  title: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tasks: GeneratedTask[];
  totalEstimatedMinutes: number;
}

export interface CreateProjectResponse {
  project: {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
    totalEstimatedMinutes: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    order: number;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    conceptIds: string[];
  }>;
  firstTask: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    estimatedMinutes: number;
    concepts: Array<{
      id: string;
      name: string;
      resources: Array<{
        title: string;
        url: string;
        type: string;
      }>;
    }>;
  };
}
