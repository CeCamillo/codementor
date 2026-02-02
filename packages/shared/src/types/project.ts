export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  objectives: string[];
  hints: string[];
  order: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  conceptIds: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  code: string;
  filePath: string;
  status: 'pending' | 'reviewing' | 'passed' | 'needs_work';
  createdAt: Date;
}
