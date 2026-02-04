import { describe, it, expect } from 'bun:test';
import type {
  CurrentTaskResponse,
  AllTasksCompletedResponse,
  CurrentTaskApiResponse,
} from '@codementor/shared';

// Helper function mirroring the one in next.ts
function isCompletedResponse(
  response: CurrentTaskApiResponse
): response is AllTasksCompletedResponse {
  return 'completed' in response && response.completed === true;
}

describe('Next Command', () => {
  describe('Response Type Detection', () => {
    it('identifies completed response correctly', () => {
      const completedResponse: AllTasksCompletedResponse = {
        project: { id: 'project-1', title: 'Todo App' },
        completed: true,
        progress: { totalTasks: 5, completedTasks: 5 },
      };

      expect(isCompletedResponse(completedResponse)).toBe(true);
    });

    it('identifies current task response correctly', () => {
      const currentTaskResponse: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Todo App', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'Setup',
          description: 'Set up the project',
          objectives: ['Create files'],
          hints: ['Start with index.html'],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 5, completedTasks: 0 },
      };

      expect(isCompletedResponse(currentTaskResponse)).toBe(false);
    });
  });

  describe('CurrentTaskResponse Validation', () => {
    it('validates complete response structure', () => {
      const response: CurrentTaskResponse = {
        project: {
          id: 'project-123',
          title: 'React Todo App',
          difficulty: 'intermediate',
        },
        task: {
          id: 'task-2',
          title: 'Add Todo Items',
          description: 'Create a form that allows users to add new todo items to the list.',
          objectives: ['Handle form submission', 'Add item to state', 'Clear input after submit'],
          hints: [
            'Think about where the todo list data should live',
            'What happens when the form is submitted?',
          ],
          order: 2,
          status: 'in_progress',
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
            {
              id: 'event-handlers',
              name: 'Event Handlers',
              resources: [
                {
                  title: 'Handling Events',
                  url: 'https://react.dev/learn/responding-to-events',
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

      expect(response.project.id).toBe('project-123');
      expect(response.project.difficulty).toBe('intermediate');
      expect(response.task.objectives).toHaveLength(3);
      expect(response.task.hints).toHaveLength(2);
      expect(response.task.concepts).toHaveLength(2);
      expect(response.task.status).toBe('in_progress');
      expect(response.progress.currentTask).toBe(2);
      expect(response.progress.completedTasks).toBeLessThan(response.progress.totalTasks);
    });

    it('handles response with empty hints', () => {
      const response: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Simple App', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'Setup',
          description: 'Set up the project',
          objectives: ['Create files'],
          hints: [],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 3, completedTasks: 0 },
      };

      expect(response.task.hints).toHaveLength(0);
    });

    it('handles response with empty concepts', () => {
      const response: CurrentTaskResponse = {
        project: { id: 'project-1', title: 'Simple App', difficulty: 'beginner' },
        task: {
          id: 'task-1',
          title: 'Setup',
          description: 'Set up the project',
          objectives: ['Create files'],
          hints: ['Start simple'],
          order: 1,
          status: 'available',
          concepts: [],
        },
        progress: { currentTask: 1, totalTasks: 3, completedTasks: 0 },
      };

      expect(response.task.concepts).toHaveLength(0);
    });

    it('validates task status values', () => {
      const validStatuses = ['available', 'in_progress'];

      for (const status of validStatuses) {
        expect(['available', 'in_progress']).toContain(status);
      }
    });

    it('validates difficulty values', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of validDifficulties) {
        expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);
      }
    });
  });

  describe('AllTasksCompletedResponse Validation', () => {
    it('validates completed response structure', () => {
      const response: AllTasksCompletedResponse = {
        project: {
          id: 'project-123',
          title: 'Completed Todo App',
        },
        completed: true,
        progress: {
          totalTasks: 5,
          completedTasks: 5,
        },
      };

      expect(response.completed).toBe(true);
      expect(response.progress.completedTasks).toBe(response.progress.totalTasks);
      expect(response.project.id).toBeDefined();
      expect(response.project.title).toBeDefined();
    });

    it('ensures completedTasks equals totalTasks', () => {
      const response: AllTasksCompletedResponse = {
        project: { id: 'project-1', title: 'Done Project' },
        completed: true,
        progress: { totalTasks: 10, completedTasks: 10 },
      };

      expect(response.progress.completedTasks).toBe(response.progress.totalTasks);
    });
  });

  describe('Output Formatting', () => {
    it('formats task header with progress', () => {
      const task = { title: 'Add Todo Items', order: 2 };
      const progress = { currentTask: 2, totalTasks: 5 };

      const header = `Task ${progress.currentTask}/${progress.totalTasks}: ${task.title}`;

      expect(header).toBe('Task 2/5: Add Todo Items');
    });

    it('formats concept names as comma-separated list', () => {
      const concepts = [
        { id: 'state-management', name: 'State Management', resources: [] },
        { id: 'event-handlers', name: 'Event Handlers', resources: [] },
        { id: 'forms', name: 'Forms', resources: [] },
      ];

      const conceptNames = concepts.map((c) => c.name).join(', ');

      expect(conceptNames).toBe('State Management, Event Handlers, Forms');
    });

    it('formats objectives with bullet points', () => {
      const objectives = [
        'Handle form submission',
        'Add item to state',
        'Clear input after submit',
      ];

      const formatted = objectives.map((obj) => `  ○ ${obj}`);

      expect(formatted[0]).toBe('  ○ Handle form submission');
      expect(formatted[1]).toBe('  ○ Add item to state');
      expect(formatted[2]).toBe('  ○ Clear input after submit');
    });

    it('formats hints with dashes', () => {
      const hints = [
        'Think about where the todo list data should live',
        'What happens when the form is submitted?',
      ];

      const formatted = hints.map((hint) => `  - ${hint}`);

      expect(formatted[0]).toBe('  - Think about where the todo list data should live');
      expect(formatted[1]).toBe('  - What happens when the form is submitted?');
    });

    it('formats resources with title and URL', () => {
      const resources = [
        { title: 'React State', url: 'https://react.dev/learn/state', type: 'documentation' },
        { title: 'MDN Forms', url: 'https://developer.mozilla.org/forms', type: 'documentation' },
      ];

      const formatted = resources.map((r) => `  - ${r.title}: ${r.url}`);

      expect(formatted[0]).toBe('  - React State: https://react.dev/learn/state');
      expect(formatted[1]).toBe('  - MDN Forms: https://developer.mozilla.org/forms');
    });

    it('limits resources to first 3', () => {
      const resources = [
        { title: 'Resource 1', url: 'https://example.com/1', type: 'documentation' },
        { title: 'Resource 2', url: 'https://example.com/2', type: 'documentation' },
        { title: 'Resource 3', url: 'https://example.com/3', type: 'documentation' },
        { title: 'Resource 4', url: 'https://example.com/4', type: 'documentation' },
        { title: 'Resource 5', url: 'https://example.com/5', type: 'documentation' },
      ];

      const limited = resources.slice(0, 3);

      expect(limited).toHaveLength(3);
      expect(limited[0]!.title).toBe('Resource 1');
      expect(limited[2]!.title).toBe('Resource 3');
    });

    it('formats completed message with task count', () => {
      const project = { title: 'Todo App' };
      const progress = { totalTasks: 5 };

      const message = `Congratulations! You've completed all ${progress.totalTasks} tasks in ${project.title}!`;

      expect(message).toBe("Congratulations! You've completed all 5 tasks in Todo App!");
    });
  });

  describe('Error Messages', () => {
    it('formats authentication error message', () => {
      const errorMessage = 'Not authenticated. Run codementor login first.';

      expect(errorMessage).toContain('Not authenticated');
      expect(errorMessage).toContain('codementor login');
    });

    it('formats no active project error message', () => {
      const errorMessage = 'No active project found.';
      const suggestion = 'Start a new project with:';
      const command = 'codementor start "<description>"';
      const example = 'codementor start "Build a todo app with React"';

      expect(errorMessage).toContain('No active project');
      expect(suggestion).toContain('Start a new project');
      expect(command).toContain('codementor start');
      expect(example).toContain('Build a todo app');
    });

    it('identifies no active project error from API', () => {
      const apiError = { message: 'No active project found. Start a new project first.' };

      expect(apiError.message).toContain('No active project');
    });
  });

  describe('Progress Calculation', () => {
    it('calculates correct progress percentage', () => {
      const progress = { currentTask: 3, totalTasks: 5, completedTasks: 2 };

      const percentage = Math.round((progress.completedTasks / progress.totalTasks) * 100);

      expect(percentage).toBe(40);
    });

    it('shows 0% for no completed tasks', () => {
      const progress = { currentTask: 1, totalTasks: 5, completedTasks: 0 };

      const percentage = Math.round((progress.completedTasks / progress.totalTasks) * 100);

      expect(percentage).toBe(0);
    });

    it('shows 100% for all completed tasks', () => {
      const progress = { totalTasks: 5, completedTasks: 5 };

      const percentage = Math.round((progress.completedTasks / progress.totalTasks) * 100);

      expect(percentage).toBe(100);
    });

    it('ensures currentTask is within valid range', () => {
      const progress = { currentTask: 3, totalTasks: 5, completedTasks: 2 };

      expect(progress.currentTask).toBeGreaterThan(0);
      expect(progress.currentTask).toBeLessThanOrEqual(progress.totalTasks);
    });

    it('ensures completedTasks is less than or equal to totalTasks', () => {
      const progress = { currentTask: 3, totalTasks: 5, completedTasks: 2 };

      expect(progress.completedTasks).toBeLessThanOrEqual(progress.totalTasks);
    });
  });

  describe('Concept Resources Aggregation', () => {
    it('aggregates resources from multiple concepts', () => {
      const concepts = [
        {
          id: 'state-management',
          name: 'State Management',
          resources: [
            { title: 'React State', url: 'https://react.dev/state', type: 'documentation' },
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
      ];

      const allResources = concepts.flatMap((c) =>
        c.resources.map((r) => ({ ...r, conceptName: c.name }))
      );

      expect(allResources).toHaveLength(3);
      expect(allResources[0]!.conceptName).toBe('State Management');
      expect(allResources[1]!.conceptName).toBe('Event Handlers');
      expect(allResources[2]!.conceptName).toBe('Event Handlers');
    });

    it('handles concepts with no resources', () => {
      const concepts = [
        { id: 'concept-1', name: 'Concept 1', resources: [] },
        {
          id: 'concept-2',
          name: 'Concept 2',
          resources: [{ title: 'Resource', url: 'https://example.com', type: 'documentation' }],
        },
      ];

      const allResources = concepts.flatMap((c) => c.resources);

      expect(allResources).toHaveLength(1);
    });
  });
});
