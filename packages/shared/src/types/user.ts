export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes: number;
  preferredLanguages: string[];
  notificationsEnabled: boolean;
}
