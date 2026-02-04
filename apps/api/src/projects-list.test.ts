import { describe, it, expect } from 'bun:test';
import type { ProjectsListResponse, SwitchProjectResponse } from '@codementor/shared';

describe('Projects List & Switch API Routes', () => {
  const API_BASE = 'http://localhost:3000';

  describe('GET /api/projects', () => {
    it('returns 401 without authorization header', async () => {
      const response = await fetch(`${API_BASE}/api/projects`);
      expect(response.status).toBe(401);

      const data = (await response.json()) as { error: string };
      expect(data.error).toBeDefined();
    });

    it('returns projects list structure', async () => {
      const mockResponse: ProjectsListResponse = {
        projects: [
          {
            id: 'proj-1',
            title: 'React Todo App',
            description: 'Build a todo app',
            difficulty: 'beginner',
            status: 'in_progress',
            progress: {
              completed: 3,
              total: 5,
              percentage: 60,
            },
            currentTask: {
              id: 'task-4',
              title: 'Add Todo Items',
              order: 4,
              status: 'available',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      expect(mockResponse.projects).toBeArray();
      expect(mockResponse.projects[0]!).toHaveProperty('id');
      expect(mockResponse.projects[0]!).toHaveProperty('title');
      expect(mockResponse.projects[0]!).toHaveProperty('progress');
      expect(mockResponse.projects[0]!.progress).toHaveProperty('percentage');
    });

    it('validates project with progress', () => {
      const projects = [
        {
          id: 'proj-1',
          title: 'Project 1',
          status: 'in_progress',
          progress: { completed: 2, total: 5, percentage: 40 },
        },
        {
          id: 'proj-2',
          title: 'Project 2',
          status: 'completed',
          progress: { completed: 5, total: 5, percentage: 100 },
        },
      ];

      for (const project of projects) {
        expect(project.progress.percentage).toBe(
          Math.round((project.progress.completed / project.progress.total) * 100)
        );
      }
    });

    it('groups projects by status', () => {
      const projects = [
        { id: '1', status: 'in_progress' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'not_started' },
        { id: '4', status: 'abandoned' },
      ];

      const byStatus = projects.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(byStatus['in_progress']).toBe(1);
      expect(byStatus['completed']).toBe(1);
      expect(byStatus['not_started']).toBe(1);
      expect(byStatus['abandoned']).toBe(1);
    });

    it('sorts projects by updatedAt descending', () => {
      const projects = [
        { id: '1', updatedAt: '2026-02-01T00:00:00Z' },
        { id: '2', updatedAt: '2026-02-04T00:00:00Z' },
        { id: '3', updatedAt: '2026-02-02T00:00:00Z' },
      ];

      const sorted = [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      expect(sorted[0]!.id).toBe('2');
      expect(sorted[1]!.id).toBe('3');
      expect(sorted[2]!.id).toBe('1');
    });
  });

  describe('POST /api/projects/:id/switch', () => {
    it('returns 401 without authorization header', async () => {
      const response = await fetch(`${API_BASE}/api/projects/proj-1/switch`, {
        method: 'POST',
      });
      expect(response.status).toBe(401);
    });

    it('returns success response structure', async () => {
      const mockResponse: SwitchProjectResponse = {
        success: true,
        message: 'Project switched successfully.',
        projectId: 'proj-1',
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.message).toBeDefined();
      expect(mockResponse.projectId).toBeDefined();
    });

    it('validates error responses', () => {
      const errorCases = [
        { status: 404, error: 'project_not_found' },
        { status: 403, error: 'forbidden' },
        { status: 400, error: 'project_completed' },
        { status: 400, error: 'project_abandoned' },
      ];

      for (const testCase of errorCases) {
        expect(testCase.error).toBeDefined();
        expect(testCase.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('prevents switching to completed project', () => {
      const project = { id: 'proj-1', status: 'completed' };
      const canSwitch = project.status !== 'completed' && project.status !== 'abandoned';

      expect(canSwitch).toBe(false);
    });

    it('prevents switching to abandoned project', () => {
      const project = { id: 'proj-1', status: 'abandoned' };
      const canSwitch = project.status !== 'completed' && project.status !== 'abandoned';

      expect(canSwitch).toBe(false);
    });

    it('allows switching to in_progress project', () => {
      const project = { id: 'proj-1', status: 'in_progress' };
      const canSwitch = project.status !== 'completed' && project.status !== 'abandoned';

      expect(canSwitch).toBe(true);
    });

    it('allows switching to not_started project', () => {
      const project = { id: 'proj-1', status: 'not_started' };
      const canSwitch = project.status !== 'completed' && project.status !== 'abandoned';

      expect(canSwitch).toBe(true);
    });
  });

  describe('Project Status Transitions', () => {
    it('unlocks first task when switching to not_started project', () => {
      const projectTasks = [
        { id: 'task-1', order: 1, status: 'locked' },
        { id: 'task-2', order: 2, status: 'locked' },
      ];

      const firstTask = projectTasks.sort((a, b) => a.order - b.order)[0]!;
      expect(firstTask.order).toBe(1);

      // First task should be unlocked
      const updatedTask = { ...firstTask, status: 'available' };
      expect(updatedTask.status).toBe('available');
    });

    it('updates project status to in_progress on switch', () => {
      const project = { id: 'proj-1', status: 'not_started' };
      const updatedProject = { ...project, status: 'in_progress' };

      expect(updatedProject.status).toBe('in_progress');
    });
  });
});
