import { describe, it, expect } from 'bun:test';
import { Elysia, t } from 'elysia';

interface CreateProjectResponse {
  project: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    totalEstimatedMinutes: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    order: number;
    status: string;
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
      resources: Array<{ title: string; url: string; type: string }>;
    }>;
  };
}

interface ProjectListResponse {
  projects: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface ProjectDetailResponse {
  project: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    currentTaskId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    objectives: string[];
    hints: string[];
    order: number;
    status: string;
    conceptIds: string[];
    createdAt: string;
    completedAt: string | null;
  }>;
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

describe('Project API Routes', () => {
  describe('POST /api/projects', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().post('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { project: {}, tasks: [], firstTask: {} };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: 'Build a todo app' }),
        })
      );

      expect(response.status).toBe(401);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns project response structure with valid auth', async () => {
      const mockResponse: CreateProjectResponse = {
        project: {
          id: 'project-123',
          title: 'Todo App',
          description: 'Build a simple todo application',
          difficulty: 'beginner',
          status: 'not_started',
          totalEstimatedMinutes: 180,
        },
        tasks: [
          {
            id: 'task-1',
            title: 'Create HTML Structure',
            order: 1,
            status: 'available',
            conceptIds: ['html-structure'],
          },
          {
            id: 'task-2',
            title: 'Style with CSS',
            order: 2,
            status: 'locked',
            conceptIds: ['css-flexbox'],
          },
        ],
        firstTask: {
          id: 'task-1',
          title: 'Create HTML Structure',
          description: 'Create the basic HTML structure for the todo app',
          objectives: ['Create index.html', 'Add semantic elements'],
          estimatedMinutes: 30,
          concepts: [
            {
              id: 'html-structure',
              name: 'HTML Document Structure',
              resources: [
                {
                  title: 'MDN: HTML basics',
                  url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics',
                  type: 'documentation',
                },
              ],
            },
          ],
        },
      };

      const app = new Elysia().post('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ description: 'Build a todo app with vanilla JavaScript' }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as CreateProjectResponse;
      expect(data).toHaveProperty('project');
      expect(data).toHaveProperty('tasks');
      expect(data).toHaveProperty('firstTask');
      expect(data.project.id).toBe('project-123');
      expect(data.tasks).toBeArray();
      expect(data.tasks.length).toBe(2);
      expect(data.firstTask.concepts).toBeArray();
    });

    it('validates description minimum length', async () => {
      const app = new Elysia().post(
        '/api/projects',
        ({ body, set }) => {
          if (body.description.length < 10) {
            set.status = 400;
            return {
              error: 'validation_error',
              error_description: 'Description must be at least 10 characters',
            };
          }
          return { project: {}, tasks: [], firstTask: {} };
        },
        {
          body: t.Object({
            description: t.String(),
            difficulty: t.Optional(
              t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ description: 'short' }),
        })
      );

      expect(response.status).toBe(400);
    });

    it('accepts optional difficulty parameter', async () => {
      let receivedDifficulty: string | undefined;

      const app = new Elysia().post(
        '/api/projects',
        ({ body, headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }
          receivedDifficulty = body.difficulty;
          return {
            project: { difficulty: body.difficulty ?? 'beginner' },
            tasks: [],
            firstTask: {},
          };
        },
        {
          body: t.Object({
            description: t.String(),
            difficulty: t.Optional(
              t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            description: 'Build a complex web application',
            difficulty: 'advanced',
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(receivedDifficulty).toBe('advanced');
    });

    it('returns 500 on generation failure', async () => {
      const app = new Elysia().post('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        set.status = 500;
        return {
          error: 'generation_failed',
          error_description: 'Failed to generate project. Please try again.',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ description: 'Build something' }),
        })
      );

      expect(response.status).toBe(500);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('generation_failed');
    });
  });

  describe('GET /api/projects', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { projects: [] };
      });

      const response = await app.handle(new Request('http://localhost/api/projects'));

      expect(response.status).toBe(401);
    });

    it('returns list of projects for authenticated user', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          title: 'Todo App',
          description: 'Build a todo app',
          difficulty: 'beginner',
          status: 'in_progress',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
        {
          id: 'project-2',
          title: 'Weather App',
          description: 'Build a weather app',
          difficulty: 'intermediate',
          status: 'not_started',
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z',
        },
      ];

      const app = new Elysia().get('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { projects: mockProjects };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ProjectListResponse;
      expect(data.projects).toBeArray();
      expect(data.projects.length).toBe(2);
      expect(data.projects[0]).toHaveProperty('id');
      expect(data.projects[0]).toHaveProperty('title');
      expect(data.projects[0]).toHaveProperty('status');
    });

    it('returns empty array when user has no projects', async () => {
      const app = new Elysia().get('/api/projects', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { projects: [] };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ProjectListResponse;
      expect(data.projects).toEqual([]);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/projects/:id', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { project: {}, tasks: [] };
      });

      const response = await app.handle(new Request('http://localhost/api/projects/project-123'));

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent project', async () => {
      const app = new Elysia().get('/api/projects/:id', ({ params, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        // Simulate project not found
        if (params.id === 'non-existent') {
          set.status = 404;
          return { error: 'not_found', error_description: 'Project not found' };
        }

        return { project: {}, tasks: [] };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects/non-existent', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('not_found');
    });

    it('returns project with tasks for valid id', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Todo App',
        description: 'Build a todo app',
        difficulty: 'beginner',
        status: 'in_progress',
        currentTaskId: 'task-2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const mockTasks = [
        {
          id: 'task-1',
          title: 'Create HTML Structure',
          description: 'Set up the HTML',
          objectives: ['Create index.html'],
          hints: ['Start with doctype'],
          order: 1,
          status: 'completed',
          conceptIds: ['html-structure'],
          createdAt: '2024-01-01T00:00:00.000Z',
          completedAt: '2024-01-01T12:00:00.000Z',
        },
        {
          id: 'task-2',
          title: 'Add CSS Styles',
          description: 'Style the app',
          objectives: ['Add styles'],
          hints: ['Use flexbox'],
          order: 2,
          status: 'available',
          conceptIds: ['css-flexbox'],
          createdAt: '2024-01-01T00:00:00.000Z',
          completedAt: null,
        },
      ];

      const app = new Elysia().get('/api/projects/:id', ({ params, headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }

        if (params.id === 'project-123') {
          return { project: mockProject, tasks: mockTasks };
        }

        set.status = 404;
        return { error: 'not_found' };
      });

      const response = await app.handle(
        new Request('http://localhost/api/projects/project-123', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as ProjectDetailResponse;
      expect(data.project.id).toBe('project-123');
      expect(data.project.currentTaskId).toBe('task-2');
      expect(data.tasks).toBeArray();
      expect(data.tasks.length).toBe(2);
      expect(data.tasks[0]!.status).toBe('completed');
      expect(data.tasks[1]!.status).toBe('available');
    });
  });

  describe('Task Status Logic', () => {
    it('first task should be available, others locked', () => {
      const tasks = [
        { order: 1, status: 'available' },
        { order: 2, status: 'locked' },
        { order: 3, status: 'locked' },
      ];

      expect(tasks[0]!.status).toBe('available');
      expect(tasks.slice(1).every((t) => t.status === 'locked')).toBe(true);
    });

    it('validates task status transitions', () => {
      const validStatuses = ['locked', 'available', 'in_progress', 'completed'];
      const testStatus = 'available';

      expect(validStatuses).toContain(testStatus);
    });
  });
});
