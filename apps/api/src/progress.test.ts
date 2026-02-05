import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';

interface ProgressResponse {
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

interface NoActiveProjectResponse {
  hasActiveProject: false;
  message: string;
}

type ProgressApiResponse = ProgressResponse | NoActiveProjectResponse;

interface ErrorResponse {
  error: string;
  error_description: string;
}

describe('Progress API Routes', () => {
  describe('GET /api/progress', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/progress', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { hasActiveProject: false, message: 'No active project' };
      });

      const response = await app.handle(new Request('http://localhost/api/progress'));

      expect(response.status).toBe(401);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns no active project response when no projects exist', async () => {
      const mockResponse: NoActiveProjectResponse = {
        hasActiveProject: false,
        message: 'No active project. Start one with: codementor start "<description>"',
      };

      const app = new Elysia().get('/api/progress', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/progress', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as NoActiveProjectResponse;
      expect(data.hasActiveProject).toBe(false);
      expect(data.message).toContain('No active project');
    });

    it('returns progress response with active project', async () => {
      const mockResponse: ProgressResponse = {
        project: {
          id: 'project-123',
          title: 'Todo App',
          difficulty: 'beginner',
          status: 'in_progress',
        },
        tasks: {
          total: 5,
          completed: 3,
        },
        currentTask: {
          id: 'task-4',
          title: 'Add Filtering',
          order: 4,
        },
        concepts: {
          mastered: 8,
          inProgress: 3,
          recent: [
            { name: 'HTML Document Structure', masteryLevel: 85 },
            { name: 'CSS Flexbox', masteryLevel: 80 },
          ],
        },
        time: {
          investedMinutes: 150,
        },
        streak: {
          currentDays: 5,
          activeToday: true,
        },
      };

      const app = new Elysia().get('/api/progress', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/progress', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ProgressResponse;
      expect(data).toHaveProperty('project');
      expect(data).toHaveProperty('tasks');
      expect(data).toHaveProperty('currentTask');
      expect(data).toHaveProperty('concepts');
      expect(data).toHaveProperty('time');
      expect(data).toHaveProperty('streak');
      expect(data.project.id).toBe('project-123');
      expect(data.tasks.completed).toBe(3);
      expect(data.tasks.total).toBe(5);
    });
  });

  describe('Response Structure Validation', () => {
    it('validates progress response structure', () => {
      const response: ProgressResponse = {
        project: {
          id: 'project-1',
          title: 'Test Project',
          difficulty: 'beginner',
          status: 'in_progress',
        },
        tasks: { total: 5, completed: 2 },
        currentTask: { id: 'task-3', title: 'Task 3', order: 3 },
        concepts: { mastered: 5, inProgress: 2, recent: [] },
        time: { investedMinutes: 60 },
        streak: { currentDays: 3, activeToday: true },
      };

      expect(response.project.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
      expect(response.project.status).toMatch(/^(not_started|in_progress)$/);
      expect(response.tasks.completed).toBeLessThanOrEqual(response.tasks.total);
    });

    it('validates no active project response structure', () => {
      const response: NoActiveProjectResponse = {
        hasActiveProject: false,
        message: 'No active project',
      };

      expect(response.hasActiveProject).toBe(false);
      expect(typeof response.message).toBe('string');
    });

    it('validates recent concepts structure', () => {
      const recent = [
        { name: 'HTML Basics', masteryLevel: 85 },
        { name: 'CSS Flexbox', masteryLevel: 80 },
      ];

      for (const concept of recent) {
        expect(concept).toHaveProperty('name');
        expect(concept).toHaveProperty('masteryLevel');
        expect(concept.masteryLevel).toBeGreaterThanOrEqual(0);
        expect(concept.masteryLevel).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Time Calculation', () => {
    it('calculates invested time correctly', () => {
      // Time invested should be sum of (completedAt - createdAt) for completed tasks
      const completedTasks = [
        {
          createdAt: new Date('2024-01-01T10:00:00Z'),
          completedAt: new Date('2024-01-01T10:30:00Z'),
        },
        {
          createdAt: new Date('2024-01-01T11:00:00Z'),
          completedAt: new Date('2024-01-01T12:00:00Z'),
        },
      ];

      let totalMinutes = 0;
      for (const task of completedTasks) {
        const duration = task.completedAt!.getTime() - task.createdAt.getTime();
        totalMinutes += Math.round(duration / (1000 * 60));
      }

      expect(totalMinutes).toBe(90); // 30 + 60 minutes
    });

    it('handles zero time when no tasks completed', () => {
      const response: ProgressResponse = {
        project: {
          id: 'project-1',
          title: 'Test',
          difficulty: 'beginner',
          status: 'not_started',
        },
        tasks: { total: 5, completed: 0 },
        currentTask: { id: 'task-1', title: 'Task 1', order: 1 },
        concepts: { mastered: 0, inProgress: 0, recent: [] },
        time: { investedMinutes: 0 },
        streak: { currentDays: 0, activeToday: false },
      };

      expect(response.time.investedMinutes).toBe(0);
    });
  });

  describe('Concept Counting', () => {
    it('counts mastered concepts correctly (mastery >= 80)', () => {
      const userConcepts = [
        { masteryLevel: 85 },
        { masteryLevel: 80 },
        { masteryLevel: 79 },
        { masteryLevel: 50 },
        { masteryLevel: 90 },
      ];

      const mastered = userConcepts.filter((c) => c.masteryLevel >= 80);
      const inProgress = userConcepts.filter((c) => c.masteryLevel > 0 && c.masteryLevel < 80);

      expect(mastered.length).toBe(3);
      expect(inProgress.length).toBe(2);
    });
  });

  describe('Type Guard', () => {
    it('isNoActiveProjectResponse correctly identifies response type', () => {
      const noActiveProject: NoActiveProjectResponse = {
        hasActiveProject: false,
        message: 'No active project',
      };

      const activeProject: ProgressResponse = {
        project: {
          id: 'project-1',
          title: 'Test',
          difficulty: 'beginner',
          status: 'in_progress',
        },
        tasks: { total: 5, completed: 2 },
        currentTask: null,
        concepts: { mastered: 0, inProgress: 0, recent: [] },
        time: { investedMinutes: 0 },
        streak: { currentDays: 0, activeToday: false },
      };

      function isNoActiveProjectResponse(
        response: ProgressApiResponse
      ): response is NoActiveProjectResponse {
        return 'hasActiveProject' in response && response.hasActiveProject === false;
      }

      expect(isNoActiveProjectResponse(noActiveProject)).toBe(true);
      expect(isNoActiveProjectResponse(activeProject)).toBe(false);
    });
  });
});
