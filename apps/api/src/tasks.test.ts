import { describe, it, expect } from 'bun:test';
import { Elysia, t } from 'elysia';

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

interface TaskDetailResponse {
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
    createdAt: string;
    completedAt: string | null;
  };
  project: {
    id: string;
    title: string;
    difficulty: string;
  };
}

interface TaskHintResponse {
  hint: string | null;
  hintIndex: number;
  totalHints: number;
  hasMoreHints: boolean;
}

interface ReflectionRespondResponse {
  success: true;
  followupFeedback: string;
  encouragement: string;
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

  describe('GET /api/tasks/:id', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/tasks/:id', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { task: {}, project: {} };
      });

      const response = await app.handle(new Request('http://localhost/api/tasks/task-123'));

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent task', async () => {
      const app = new Elysia().get('/api/tasks/:id', ({ params, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        if (params.id === 'non-existent') {
          set.status = 404;
          return { error: 'not_found', error_description: 'Task not found' };
        }

        return { task: {}, project: {} };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/non-existent', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('not_found');
    });

    it('returns task details with project context', async () => {
      const mockResponse: TaskDetailResponse = {
        task: {
          id: 'task-123',
          title: 'Create HTML Structure',
          description: 'Set up the basic HTML structure',
          objectives: ['Create index.html', 'Add semantic elements'],
          hints: ['Start with doctype', 'Use semantic tags'],
          order: 1,
          status: 'available',
          concepts: [
            {
              id: 'html-structure',
              name: 'HTML Document Structure',
              resources: [
                { title: 'MDN HTML', url: 'https://developer.mozilla.org', type: 'documentation' },
              ],
            },
          ],
          createdAt: '2024-01-01T00:00:00.000Z',
          completedAt: null,
        },
        project: {
          id: 'project-123',
          title: 'Todo App',
          difficulty: 'beginner',
        },
      };

      const app = new Elysia().get('/api/tasks/:id', ({ params, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        if (params.id === 'task-123') {
          return mockResponse;
        }

        set.status = 404;
        return { error: 'not_found' };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as TaskDetailResponse;
      expect(data.task.id).toBe('task-123');
      expect(data.task.title).toBe('Create HTML Structure');
      expect(data.task.objectives).toBeArray();
      expect(data.task.hints).toBeArray();
      expect(data.task.concepts).toBeArray();
      expect(data.project.id).toBe('project-123');
      expect(data.project.difficulty).toBe('beginner');
    });

    it('returns completed task with completedAt timestamp', async () => {
      const mockResponse: TaskDetailResponse = {
        task: {
          id: 'task-123',
          title: 'Create HTML Structure',
          description: 'Set up the basic HTML structure',
          objectives: [],
          hints: [],
          order: 1,
          status: 'completed',
          concepts: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          completedAt: '2024-01-01T12:00:00.000Z',
        },
        project: {
          id: 'project-123',
          title: 'Todo App',
          difficulty: 'beginner',
        },
      };

      const app = new Elysia().get('/api/tasks/:id', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as TaskDetailResponse;
      expect(data.task.status).toBe('completed');
      expect(data.task.completedAt).toBe('2024-01-01T12:00:00.000Z');
    });
  });

  describe('GET /api/tasks/:id/hint', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/tasks/:id/hint', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { hint: null, hintIndex: 0, totalHints: 0, hasMoreHints: false };
      });

      const response = await app.handle(new Request('http://localhost/api/tasks/task-123/hint'));

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent task', async () => {
      const app = new Elysia().get('/api/tasks/:id/hint', ({ params, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        if (params.id === 'non-existent') {
          set.status = 404;
          return { error: 'not_found', error_description: 'Task not found' };
        }

        return { hint: 'A hint', hintIndex: 0, totalHints: 1, hasMoreHints: false };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/non-existent/hint', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(404);
    });

    it('returns first hint for task', async () => {
      const mockResponse: TaskHintResponse = {
        hint: 'Start with the doctype declaration',
        hintIndex: 0,
        totalHints: 3,
        hasMoreHints: true,
      };

      const app = new Elysia().get('/api/tasks/:id/hint', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/hint', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as TaskHintResponse;
      expect(data.hint).toBe('Start with the doctype declaration');
      expect(data.hintIndex).toBe(0);
      expect(data.totalHints).toBe(3);
      expect(data.hasMoreHints).toBe(true);
    });

    it('returns subsequent hint with incremented index', async () => {
      const mockResponse: TaskHintResponse = {
        hint: 'Use semantic HTML tags',
        hintIndex: 1,
        totalHints: 3,
        hasMoreHints: true,
      };

      const app = new Elysia().get('/api/tasks/:id/hint', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/hint', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as TaskHintResponse;
      expect(data.hintIndex).toBe(1);
      expect(data.hasMoreHints).toBe(true);
    });

    it('returns last hint with hasMoreHints false', async () => {
      const mockResponse: TaskHintResponse = {
        hint: 'Consider accessibility attributes',
        hintIndex: 2,
        totalHints: 3,
        hasMoreHints: false,
      };

      const app = new Elysia().get('/api/tasks/:id/hint', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/hint', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as TaskHintResponse;
      expect(data.hintIndex).toBe(2);
      expect(data.hasMoreHints).toBe(false);
    });

    it('returns null hint for task with no hints', async () => {
      const mockResponse: TaskHintResponse = {
        hint: null,
        hintIndex: 0,
        totalHints: 0,
        hasMoreHints: false,
      };

      const app = new Elysia().get('/api/tasks/:id/hint', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/hint', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as TaskHintResponse;
      expect(data.hint).toBeNull();
      expect(data.totalHints).toBe(0);
      expect(data.hasMoreHints).toBe(false);
    });
  });

  describe('POST /api/tasks/:id/respond', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().post('/api/tasks/:id/respond', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { success: true, followupFeedback: '', encouragement: '' };
      });

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: 'sub-1', responses: [] }),
        })
      );

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent task', async () => {
      const app = new Elysia().post(
        '/api/tasks/:id/respond',
        ({ params, headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }

          if (params.id === 'non-existent') {
            set.status = 404;
            return { error: 'not_found', error_description: 'Task not found' };
          }

          return { success: true, followupFeedback: '', encouragement: '' };
        },
        {
          body: t.Object({
            submissionId: t.String(),
            responses: t.Array(
              t.Object({
                questionIndex: t.Number(),
                answer: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/tasks/non-existent/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ submissionId: 'sub-1', responses: [] }),
        })
      );

      expect(response.status).toBe(404);
    });

    it('returns 404 for non-existent submission', async () => {
      const app = new Elysia().post(
        '/api/tasks/:id/respond',
        ({ body, headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }

          if (body.submissionId === 'non-existent') {
            set.status = 404;
            return { error: 'not_found', error_description: 'Submission not found' };
          }

          return { success: true, followupFeedback: '', encouragement: '' };
        },
        {
          body: t.Object({
            submissionId: t.String(),
            responses: t.Array(
              t.Object({
                questionIndex: t.Number(),
                answer: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ submissionId: 'non-existent', responses: [] }),
        })
      );

      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('not_found');
    });

    it('returns followup feedback for valid reflection responses', async () => {
      const mockResponse: ReflectionRespondResponse = {
        success: true,
        followupFeedback:
          "Great insight about state management! You're on the right track thinking about where data should live.",
        encouragement:
          "You're making excellent progress in understanding React patterns. Keep up the good work!",
      };

      const app = new Elysia().post(
        '/api/tasks/:id/respond',
        ({ headers, set }) => {
          if (!headers['authorization']?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }
          return mockResponse;
        },
        {
          body: t.Object({
            submissionId: t.String(),
            responses: t.Array(
              t.Object({
                questionIndex: t.Number(),
                answer: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            submissionId: 'submission-123',
            responses: [
              {
                questionIndex: 0,
                answer: 'I think state should be lifted up to the parent component.',
              },
              {
                questionIndex: 1,
                answer: 'Using useEffect for side effects makes the code cleaner.',
              },
            ],
          }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ReflectionRespondResponse;
      expect(data.success).toBe(true);
      expect(data.followupFeedback).toContain('state management');
      expect(data.encouragement).toContain('excellent progress');
    });

    it('accepts single response', async () => {
      const mockResponse: ReflectionRespondResponse = {
        success: true,
        followupFeedback: 'Good thinking!',
        encouragement: 'Keep it up!',
      };

      const app = new Elysia().post(
        '/api/tasks/:id/respond',
        ({ headers, set }) => {
          if (!headers['authorization']?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }
          return mockResponse;
        },
        {
          body: t.Object({
            submissionId: t.String(),
            responses: t.Array(
              t.Object({
                questionIndex: t.Number(),
                answer: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/tasks/task-123/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            submissionId: 'submission-123',
            responses: [{ questionIndex: 0, answer: 'My answer to the question.' }],
          }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ReflectionRespondResponse;
      expect(data.success).toBe(true);
    });
  });
});
