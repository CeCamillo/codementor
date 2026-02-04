export interface ProgressResponse {
  user: {
    totalMinutesLearned: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  activeProject: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
    currentTask: {
      id: string;
      title: string;
      description: string;
      status: string;
      order: number;
      conceptIds: string[];
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  masteredConcepts: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    masteryLevel: number;
  }>;
  recentProjects: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ProjectsListResponse {
  projects: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
    currentTask: {
      id: string;
      title: string;
      order: number;
      status: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface SwitchProjectResponse {
  success: boolean;
  message: string;
  projectId: string;
}
