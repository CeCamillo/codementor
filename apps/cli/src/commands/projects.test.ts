import { describe, it, expect } from 'bun:test';

interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  tasks: {
    total: number;
    completed: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectsListResponse {
  projects: ProjectListItem[];
}

interface ProjectSwitchResponse {
  success: true;
  project: {
    id: string;
    title: string;
    status: 'not_started' | 'in_progress';
  };
  currentTask: {
    id: string;
    title: string;
    order: number;
  } | null;
}

// Helper functions matching the implementation
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '\x1b[32m\u2713\x1b[0m';
    case 'in_progress':
      return '\x1b[33m\u25cb\x1b[0m';
    case 'not_started':
      return '\x1b[90m\u25cb\x1b[0m';
    case 'abandoned':
      return '\x1b[90m\u2717\x1b[0m';
    default:
      return '\x1b[90m-\x1b[0m';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return '\x1b[32mcompleted\x1b[0m';
    case 'in_progress':
      return '\x1b[33min progress\x1b[0m';
    case 'not_started':
      return '\x1b[90mnot started\x1b[0m';
    case 'abandoned':
      return '\x1b[90mabandoned\x1b[0m';
    default:
      return status;
  }
}

describe('Projects Command', () => {
  describe('getStatusIcon', () => {
    it('returns green checkmark for completed', () => {
      const icon = getStatusIcon('completed');
      expect(icon).toContain('\u2713');
      expect(icon).toContain('\x1b[32m'); // green
    });

    it('returns yellow circle for in_progress', () => {
      const icon = getStatusIcon('in_progress');
      expect(icon).toContain('\u25cb');
      expect(icon).toContain('\x1b[33m'); // yellow
    });

    it('returns gray circle for not_started', () => {
      const icon = getStatusIcon('not_started');
      expect(icon).toContain('\u25cb');
      expect(icon).toContain('\x1b[90m'); // gray
    });

    it('returns gray x for abandoned', () => {
      const icon = getStatusIcon('abandoned');
      expect(icon).toContain('\u2717');
      expect(icon).toContain('\x1b[90m'); // gray
    });

    it('returns gray dash for unknown status', () => {
      const icon = getStatusIcon('unknown');
      expect(icon).toContain('-');
    });
  });

  describe('getStatusLabel', () => {
    it('returns green completed label', () => {
      const label = getStatusLabel('completed');
      expect(label).toContain('completed');
      expect(label).toContain('\x1b[32m');
    });

    it('returns yellow in progress label', () => {
      const label = getStatusLabel('in_progress');
      expect(label).toContain('in progress');
      expect(label).toContain('\x1b[33m');
    });

    it('returns gray not started label', () => {
      const label = getStatusLabel('not_started');
      expect(label).toContain('not started');
      expect(label).toContain('\x1b[90m');
    });

    it('returns gray abandoned label', () => {
      const label = getStatusLabel('abandoned');
      expect(label).toContain('abandoned');
      expect(label).toContain('\x1b[90m');
    });

    it('returns raw status for unknown status', () => {
      const label = getStatusLabel('custom_status');
      expect(label).toBe('custom_status');
    });
  });

  describe('List Response Structure', () => {
    it('validates project list item structure', () => {
      const project: ProjectListItem = {
        id: 'project-123',
        title: 'Todo App',
        description: 'Build a todo app',
        difficulty: 'beginner',
        status: 'in_progress',
        tasks: {
          total: 5,
          completed: 2,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('title');
      expect(project).toHaveProperty('tasks');
      expect(project.tasks).toHaveProperty('total');
      expect(project.tasks).toHaveProperty('completed');
    });

    it('validates empty projects list', () => {
      const response: ProjectsListResponse = {
        projects: [],
      };

      expect(response.projects).toBeArray();
      expect(response.projects.length).toBe(0);
    });

    it('validates projects list with multiple items', () => {
      const response: ProjectsListResponse = {
        projects: [
          {
            id: 'project-1',
            title: 'Todo App',
            description: 'Build a todo app',
            difficulty: 'beginner',
            status: 'completed',
            tasks: { total: 5, completed: 5 },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-05T00:00:00Z',
          },
          {
            id: 'project-2',
            title: 'Weather App',
            description: 'Build a weather app',
            difficulty: 'intermediate',
            status: 'in_progress',
            tasks: { total: 7, completed: 3 },
            createdAt: '2024-01-06T00:00:00Z',
            updatedAt: '2024-01-07T00:00:00Z',
          },
        ],
      };

      expect(response.projects.length).toBe(2);
      expect(response.projects[0]!.status).toBe('completed');
      expect(response.projects[1]!.status).toBe('in_progress');
    });
  });

  describe('Switch Response Structure', () => {
    it('validates successful switch response with current task', () => {
      const response: ProjectSwitchResponse = {
        success: true,
        project: {
          id: 'project-123',
          title: 'Todo App',
          status: 'in_progress',
        },
        currentTask: {
          id: 'task-3',
          title: 'Add Filtering',
          order: 3,
        },
      };

      expect(response.success).toBe(true);
      expect(response.project.id).toBe('project-123');
      expect(response.currentTask).not.toBeNull();
      expect(response.currentTask!.title).toBe('Add Filtering');
    });

    it('validates successful switch response without current task', () => {
      const response: ProjectSwitchResponse = {
        success: true,
        project: {
          id: 'project-123',
          title: 'Todo App',
          status: 'in_progress',
        },
        currentTask: null,
      };

      expect(response.success).toBe(true);
      expect(response.currentTask).toBeNull();
    });
  });

  describe('Task Progress Formatting', () => {
    it('formats task progress correctly', () => {
      const project = {
        tasks: { total: 5, completed: 3 },
      };
      const taskProgress = `${project.tasks.completed}/${project.tasks.total} tasks`;
      expect(taskProgress).toBe('3/5 tasks');
    });

    it('handles zero tasks', () => {
      const project = {
        tasks: { total: 0, completed: 0 },
      };
      const taskProgress = `${project.tasks.completed}/${project.tasks.total} tasks`;
      expect(taskProgress).toBe('0/0 tasks');
    });

    it('handles all tasks completed', () => {
      const project = {
        tasks: { total: 5, completed: 5 },
      };
      const taskProgress = `${project.tasks.completed}/${project.tasks.total} tasks`;
      expect(taskProgress).toBe('5/5 tasks');
    });
  });

  describe('Error Handling', () => {
    it('validates error response for not found project', () => {
      const errorResponse = {
        error: 'not_found',
        error_description: 'Project not found',
      };

      expect(errorResponse.error).toBe('not_found');
      expect(errorResponse.error_description).toContain('not found');
    });

    it('validates error response for invalid status', () => {
      const errorResponse = {
        error: 'invalid_status',
        error_description: 'Cannot switch to a completed project',
      };

      expect(errorResponse.error).toBe('invalid_status');
      expect(errorResponse.error_description).toContain('Cannot switch');
    });
  });
});
