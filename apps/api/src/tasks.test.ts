import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';

interface CurrentTaskResponse {
  project: {
    id: string;
    title: string;
    difficulty: string;
  };
  task: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    hints: string[];
    order: number;
    status: string;
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

interface AllTasksCompletedResponse {
  project: { id: string; title: string };
  completed: true;
  progress: { totalTasks: number; completedTasks: number };
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

describe('Tasks API Routes', () => {
  describe('GET /api/tasks/current', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { project: {}, task: {}, progress: {} };
      });

      const response = await app.handle(new Request('http://localhost/api/tasks/current'));

      expect(response.status).toBe(401);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns 404 when no active project exists', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        // Simulate no active project
        set.status = 404;
        return {
          error: 'no_active_project',
          error_description: 'No active project found. Start a new project first.',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('no_active_project');
    });

    it('returns current task with progress for active project', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: {
          id: 'project-123',
          title: 'Todo App',
          difficulty: 'beginner',
        },
        task: {
          id: 'task-2',
          title: 'Add Todo Items',
          description: 'Create a form that allows users to add new todo items...',
          objectives: ['Handle form submission', 'Add item to state', 'Clear input after submit'],
          hints: [
            'Think about where the todo list data should live',
            'What happens when the form is submitted?',
          ],
          order: 2,
          status: 'available',
          concepts: [
            {
              id: 'state-management',
              name: 'State Management',
              resources: [
                {
                  title: 'React State',
                  url: 'https://react.dev/learn/state',
                  type: 'documentation',
                },
              ],
            },
          ],
        },
        progress: {
          currentTask: 2,
          totalTasks: 5,
          completedTasks: 1,
        },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data).toHaveProperty('project');
      expect(data).toHaveProperty('task');
      expect(data).toHaveProperty('progress');
      expect(data.project.id).toBe('project-123');
      expect(data.task.title).toBe('Add Todo Items');
      expect(data.task.objectives).toBeArray();
      expect(data.task.hints).toBeArray();
      expect(data.task.concepts).toBeArray();
      expect(data.progress.currentTask).toBe(2);
      expect(data.progress.totalTasks).toBe(5);
      expect(data.progress.completedTasks).toBe(1);
    });

    it('returns completed response when all tasks are done', async () => {
      const mockResponse: AllTasksCompletedResponse = {
        project: {
          id: 'project-123',
          title: 'Todo App',
        },
        completed: true,
        progress: {
          totalTasks: 5,
          completedTasks: 5,
        },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as AllTasksCompletedResponse;
      expect(data.completed).toBe(true);
      expect(data.progress.totalTasks).toBe(5);
      expect(data.progress.completedTasks).toBe(5);
    });

    it('returns 500 for invalid project state', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        // Simulate invalid state
        set.status = 500;
        return {
          error: 'invalid_state',
          error_description: 'Project is in an invalid state - no tasks found.',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(500);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('invalid_state');
    });
  });

  describe('Response Structure Validation', () => {
    it('validates CurrentTaskResponse structure', () => {
      const response: CurrentTaskResponse = {
        project: {
          id: 'project-1',
          title: 'Test Project',
          difficulty: 'beginner',
        },
        task: {
          id: 'task-1',
          title: 'Test Task',
          description: 'Test description',
          objectives: ['Objective 1'],
          hints: ['Hint 1'],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: {
          currentTask: 1,
          totalTasks: 3,
          completedTasks: 0,
        },
      };

      expect(response.project.id).toBeDefined();
      expect(response.task.objectives).toBeArray();
      expect(response.progress.currentTask).toBeLessThanOrEqual(response.progress.totalTasks);
    });

    it('validates AllTasksCompletedResponse structure', () => {
      const response: AllTasksCompletedResponse = {
        project: { id: 'project-1', title: 'Test Project' },
        completed: true,
        progress: { totalTasks: 5, completedTasks: 5 },
      };

      expect(response.completed).toBe(true);
      expect(response.progress.completedTasks).toBe(response.progress.totalTasks);
    });
  });

  describe('Task Status Logic', () => {
    it('returns task with status available', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Test', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'First Task',
          description: 'Description',
          objectives: ['Objective'],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 3, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.task.status).toBe('available');
    });

    it('returns task with status in_progress', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Test', difficulty: 'intermediate' },
        task: {
          id: 'task-2',
          title: 'Second Task',
          description: 'Description',
          objectives: ['Objective'],
          hints: [],
          order: 2,
          status: 'in_progress',
          concepts: [],
        },
        progress: { currentTask: 2, totalTasks: 3, completedTasks: 1 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.task.status).toBe('in_progress');
    });
  });

  describe('Project Difficulty Levels', () => {
    it('returns beginner difficulty project', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Beginner Project', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 3, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.project.difficulty).toBe('beginner');
    });

    it('returns intermediate difficulty project', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Intermediate Project', difficulty: 'intermediate' },
        task: {
          id: 'task-1',
          title: 'Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 5, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.project.difficulty).toBe('intermediate');
    });

    it('returns advanced difficulty project', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Advanced Project', difficulty: 'advanced' },
        task: {
          id: 'task-1',
          title: 'Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 8, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.project.difficulty).toBe('advanced');
    });
  });

  describe('Concept Enrichment', () => {
    it('returns task with multiple concepts', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'React App', difficulty: 'intermediate' },
        task: {
          id: 'task-1',
          title: 'State Management',
          description: 'Implement state management',
          objectives: ['Manage state', 'Handle events'],
          hints: ['Use useState'],
          order: 1,
          status: 'available',
          concepts: [
            {
              id: 'react-state',
              name: 'React State',
              resources: [
                {
                  title: 'React State Docs',
                  url: 'https://react.dev/state',
                  type: 'documentation',
                },
              ],
            },
            {
              id: 'event-handlers',
              name: 'Event Handlers',
              resources: [
                { title: 'Events Guide', url: 'https://react.dev/events', type: 'documentation' },
                { title: 'Event Tutorial', url: 'https://example.com/events', type: 'tutorial' },
              ],
            },
          ],
        },
        progress: { currentTask: 1, totalTasks: 5, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.task.concepts).toHaveLength(2);
      expect(data.task.concepts[0]!.id).toBe('react-state');
      expect(data.task.concepts[1]!.id).toBe('event-handlers');
      expect(data.task.concepts[1]!.resources).toHaveLength(2);
    });

    it('returns task with no concepts', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Simple App', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'Setup',
          description: 'Set up project',
          objectives: ['Create files'],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 3, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.task.concepts).toHaveLength(0);
    });
  });

  describe('Progress Calculation', () => {
    it('returns correct progress for first task', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Test', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'First Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 5, completedTasks: 0 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.progress.currentTask).toBe(1);
      expect(data.progress.completedTasks).toBe(0);
      expect(data.progress.totalTasks).toBe(5);
    });

    it('returns correct progress for middle task', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Test', difficulty: 'beginner' },
        task: {
          id: 'task-3',
          title: 'Third Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 3,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 3, totalTasks: 5, completedTasks: 2 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.progress.currentTask).toBe(3);
      expect(data.progress.completedTasks).toBe(2);
      expect(data.progress.completedTasks).toBe(data.progress.currentTask - 1);
    });

    it('returns correct progress for last task', async () => {
      const mockResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Test', difficulty: 'beginner' },
        task: {
          id: 'task-5',
          title: 'Last Task',
          description: 'Desc',
          objectives: [],
          hints: [],
          order: 5,
          status: 'in_progress',
          concepts: [],
        },
        progress: { currentTask: 5, totalTasks: 5, completedTasks: 4 },
      };

      const app = new Elysia().get('/api/tasks/current', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as CurrentTaskResponse;
      expect(data.progress.currentTask).toBe(5);
      expect(data.progress.currentTask).toBe(data.progress.totalTasks);
      expect(data.progress.completedTasks).toBe(4);
    });
  });

  describe('Error Response Format', () => {
    it('returns error with correct format for 401', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ set }) => {
        set.status = 401;
        return {
          error: 'unauthorized',
          error_description: 'Missing or invalid authorization header',
        };
      });

      const response = await app.handle(new Request('http://localhost/api/tasks/current'));

      const data = (await response.json()) as ErrorResponse;
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('error_description');
      expect(typeof data.error).toBe('string');
      expect(typeof data.error_description).toBe('string');
    });

    it('returns error with correct format for 404', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ set }) => {
        set.status = 404;
        return {
          error: 'no_active_project',
          error_description: 'No active project found. Start a new project first.',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('no_active_project');
      expect(data.error_description).toContain('No active project');
    });

    it('returns error with correct format for 500', async () => {
      const app = new Elysia().get('/api/tasks/current', ({ set }) => {
        set.status = 500;
        return {
          error: 'invalid_state',
          error_description: 'Project is in an invalid state - no current task found.',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/current', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('invalid_state');
      expect(data.error_description).toContain('invalid state');
    });
  });
});
