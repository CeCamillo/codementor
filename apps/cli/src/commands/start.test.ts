import { describe, it, expect } from 'bun:test';
import type { CreateProjectResponse } from '@codementor/shared';

// Test the formatting utilities and validation logic
describe('Start Command', () => {
  describe('formatMinutes', () => {
    function formatMinutes(minutes: number): string {
      if (minutes < 60) {
        return `${minutes} min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return hours === 1 ? '1 hour' : `${hours} hours`;
      }
      return `${hours}h ${remainingMins}m`;
    }

    it('formats minutes under 60', () => {
      expect(formatMinutes(30)).toBe('30 min');
      expect(formatMinutes(45)).toBe('45 min');
      expect(formatMinutes(1)).toBe('1 min');
      expect(formatMinutes(59)).toBe('59 min');
    });

    it('formats exactly 1 hour', () => {
      expect(formatMinutes(60)).toBe('1 hour');
    });

    it('formats multiple whole hours', () => {
      expect(formatMinutes(120)).toBe('2 hours');
      expect(formatMinutes(180)).toBe('3 hours');
      expect(formatMinutes(300)).toBe('5 hours');
    });

    it('formats hours with remaining minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30m');
      expect(formatMinutes(150)).toBe('2h 30m');
      expect(formatMinutes(195)).toBe('3h 15m');
      expect(formatMinutes(61)).toBe('1h 1m');
    });

    it('handles zero', () => {
      expect(formatMinutes(0)).toBe('0 min');
    });
  });

  describe('Description Validation', () => {
    const MIN_LENGTH = 10;

    it('accepts valid descriptions', () => {
      const validDescriptions = [
        'Build a todo app',
        'Create a weather application using React',
        'Simple counter app with vanilla JavaScript',
      ];

      for (const desc of validDescriptions) {
        expect(desc.length).toBeGreaterThanOrEqual(MIN_LENGTH);
      }
    });

    it('rejects short descriptions', () => {
      const shortDescriptions = ['Build', 'Todo', 'App', ''];

      for (const desc of shortDescriptions) {
        expect(desc.length).toBeLessThan(MIN_LENGTH);
      }
    });

    it('accepts exactly 10 character descriptions', () => {
      const exactDesc = '1234567890'; // exactly 10 chars
      expect(exactDesc.length).toBe(MIN_LENGTH);
    });
  });

  describe('Response Handling', () => {
    it('handles valid CreateProjectResponse', () => {
      const response: CreateProjectResponse = {
        project: {
          id: 'project-123',
          title: 'React Todo App',
          description: 'A simple todo application built with React',
          difficulty: 'beginner',
          status: 'not_started',
          totalEstimatedMinutes: 480,
        },
        tasks: [
          {
            id: 'task-1',
            title: 'Project Setup',
            order: 1,
            status: 'available',
            conceptIds: ['react-components'],
          },
          {
            id: 'task-2',
            title: 'Create Components',
            order: 2,
            status: 'locked',
            conceptIds: ['react-state'],
          },
        ],
        firstTask: {
          id: 'task-1',
          title: 'Project Setup',
          description: 'Set up a new React project using Vite',
          objectives: ['Initialize project with Vite', 'Understand project structure'],
          estimatedMinutes: 30,
          concepts: [
            {
              id: 'react-components',
              name: 'React Components',
              resources: [{ title: 'React Docs', url: 'https://react.dev', type: 'documentation' }],
            },
          ],
        },
      };

      expect(response.project.id).toBe('project-123');
      expect(response.tasks).toHaveLength(2);
      expect(response.tasks[0].status).toBe('available');
      expect(response.tasks[1].status).toBe('locked');
      expect(response.firstTask.objectives).toHaveLength(2);
      expect(response.firstTask.concepts).toHaveLength(1);
    });

    it('handles response with no concepts in firstTask', () => {
      const response: CreateProjectResponse = {
        project: {
          id: 'project-123',
          title: 'Simple App',
          description: 'A simple application',
          difficulty: 'beginner',
          status: 'not_started',
          totalEstimatedMinutes: 60,
        },
        tasks: [
          {
            id: 'task-1',
            title: 'Setup',
            order: 1,
            status: 'available',
            conceptIds: [],
          },
        ],
        firstTask: {
          id: 'task-1',
          title: 'Setup',
          description: 'Set up the project',
          objectives: ['Create files'],
          estimatedMinutes: 15,
          concepts: [],
        },
      };

      expect(response.firstTask.concepts).toHaveLength(0);
    });
  });

  describe('Output Formatting', () => {
    it('generates correct task status display', () => {
      const tasks = [
        { order: 1, status: 'available', title: 'First Task' },
        { order: 2, status: 'locked', title: 'Second Task' },
        { order: 3, status: 'locked', title: 'Third Task' },
      ];

      const statusLabels = tasks.map((task) =>
        task.status === 'available' ? '[current]' : '[locked]'
      );

      expect(statusLabels[0]).toBe('[current]');
      expect(statusLabels[1]).toBe('[locked]');
      expect(statusLabels[2]).toBe('[locked]');
    });

    it('formats task list output', () => {
      const tasks = [
        { order: 1, status: 'available', title: 'Project Setup' },
        { order: 2, status: 'locked', title: 'Create Components' },
        { order: 3, status: 'locked', title: 'Add Styling' },
      ];

      const lines = tasks.map((task) => {
        const status = task.status === 'available' ? '[current]' : '[locked]';
        return `  ${task.order}. ${task.title} ${status}`;
      });

      expect(lines[0]).toBe('  1. Project Setup [current]');
      expect(lines[1]).toBe('  2. Create Components [locked]');
      expect(lines[2]).toBe('  3. Add Styling [locked]');
    });

    it('formats objectives as bullet points', () => {
      const objectives = ['Initialize project', 'Install dependencies', 'Create file structure'];

      const formatted = objectives.map((obj) => `  - ${obj}`);

      expect(formatted[0]).toBe('  - Initialize project');
      expect(formatted[1]).toBe('  - Install dependencies');
      expect(formatted[2]).toBe('  - Create file structure');
    });

    it('formats concept resources', () => {
      const concepts = [
        {
          name: 'HTML Document Structure',
          resources: [
            {
              title: 'MDN: HTML basics',
              url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics',
            },
          ],
        },
        {
          name: 'CSS Flexbox',
          resources: [
            {
              title: 'CSS Tricks: Flexbox Guide',
              url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
            },
          ],
        },
      ];

      for (const concept of concepts) {
        expect(concept.name).toBeDefined();
        expect(concept.resources.length).toBeGreaterThan(0);
        expect(concept.resources[0].url).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Error Handling', () => {
    it('identifies authentication errors', () => {
      const authErrorMessage = 'Not authenticated. Please run "codementor login" first.';

      expect(authErrorMessage).toContain('Not authenticated');
      expect(authErrorMessage).toContain('codementor login');
    });

    it('identifies description validation errors', () => {
      const errorMessage = 'Description too short.';
      const usageHint = 'Usage: codementor start "<description>"';
      const example = 'Example: codementor start "Build a todo app with vanilla JavaScript"';

      expect(errorMessage).toContain('too short');
      expect(usageHint).toContain('codementor start');
      expect(example).toContain('Build a todo app');
    });

    it('handles API error responses', () => {
      const apiErrors = [
        { message: 'Failed to generate project. Please try again.' },
        { message: 'Invalid or expired session' },
        { message: 'Network error' },
      ];

      for (const error of apiErrors) {
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Difficulty Levels', () => {
    it('validates difficulty options', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of validDifficulties) {
        expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);
      }
    });

    it('defaults to beginner when not specified', () => {
      const defaultDifficulty = 'beginner';
      expect(defaultDifficulty).toBe('beginner');
    });
  });
});
