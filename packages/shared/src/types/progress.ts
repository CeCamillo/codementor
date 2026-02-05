export interface ProgressResponse {
  project: {
    id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'not_started' | 'in_progress';
  };
  tasks: {
    total: number;
    completed: number;
  };
  currentTask: {
    id: string;
    title: string;
    order: number;
  } | null;
  concepts: {
    mastered: number;
    inProgress: number;
    recent: Array<{
      name: string;
      masteryLevel: number;
    }>;
  };
  time: {
    investedMinutes: number;
  };
  streak: {
    currentDays: number;
    activeToday: boolean;
  };
}

export interface NoActiveProjectResponse {
  hasActiveProject: false;
  message: string;
}

export type ProgressApiResponse = ProgressResponse | NoActiveProjectResponse;

export interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  tasks: {
    total: number;
    completed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsListResponse {
  projects: ProjectListItem[];
}

export interface ProjectSwitchResponse {
  success: true;
  project: {
    id: string;
    title: string;
    status: 'not_started' | 'in_progress';
  };
  currentTask: {
    id: string;
    title: string;
    order: number;
  } | null;
}

export function isNoActiveProjectResponse(
  response: ProgressApiResponse
): response is NoActiveProjectResponse {
  return 'hasActiveProject' in response && response.hasActiveProject === false;
}

export interface UserConceptItem {
  conceptId: string;
  name: string;
  category: string;
  masteryLevel: number;
  practiceCount: number;
  consecutiveFailures: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  status: 'not_started' | 'in_progress' | 'mastered';
  isDueForReview: boolean;
  isStruggling: boolean;
}

export interface UserConceptsResponse {
  concepts: UserConceptItem[];
  summary: {
    total: number;
    mastered: number;
    inProgress: number;
    notStarted: number;
    dueForReview: number;
    struggling: number;
  };
}

export interface ConceptsDueResponse {
  concepts: UserConceptItem[];
  total: number;
}

export interface ConceptGraphNode {
  id: string;
  name: string;
  category: string;
  tier: 1 | 2 | 3;
  masteryLevel: number | null;
  status: 'not_started' | 'in_progress' | 'mastered';
  isDueForReview: boolean;
  isStruggling: boolean;
  lastPracticedAt: string | null;
}

export interface ConceptGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface ConceptGraphResponse {
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
  summary: {
    total: number;
    mastered: number;
    inProgress: number;
    notStarted: number;
  };
}
