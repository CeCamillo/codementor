export interface CurrentTaskResponse {
  project: {
    id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  task: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    hints: string[];
    order: number;
    status: 'available' | 'in_progress';
    concepts: Array<{
      id: string;
      name: string;
      resources: Array<{ title: string; url: string; type: string }>;
    }>;
  };
  progress: {
    currentTask: number;
    totalTasks: number;
    completedTasks: number;
  };
}

export interface AllTasksCompletedResponse {
  project: { id: string; title: string };
  completed: true;
  progress: { totalTasks: number; completedTasks: number };
}

export type CurrentTaskApiResponse = CurrentTaskResponse | AllTasksCompletedResponse;
