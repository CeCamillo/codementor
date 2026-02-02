export const APP_NAME = 'CodeMentor';
export const APP_VERSION = '0.1.0';

export const CONFIG_DIR = '.codementor';
export const CONFIG_FILE = 'config.json';

export const API_BASE_URL = process.env['CODEMENTOR_API_URL'] ?? 'http://localhost:3000';

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const PROJECT_STATUSES = ['not_started', 'in_progress', 'completed', 'abandoned'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ['locked', 'available', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MAX_HINTS_PER_TASK = 3;
export const MASTERY_THRESHOLD = 80; // Minimum mastery to consider concept "learned"

// Spaced repetition intervals (in days)
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60, 120] as const;
