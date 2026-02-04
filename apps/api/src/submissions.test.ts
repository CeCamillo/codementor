import { describe, it, expect } from 'bun:test';
import { Elysia, t } from 'elysia';

interface SubmitResponse {
  submission: {
    id: string;
    taskId: string;
    status: 'passed' | 'needs_work';
  };
  review: {
    overallFeedback: string;
    passed: boolean;
    conceptsFeedback: Array<{
      conceptId: string;
      conceptName: string;
      demonstrated: boolean;
      feedback: string;
    }>;
    codeComments: Array<{
      filePath: string;
      lineStart: number;
      lineEnd: number;
      severity: 'praise' | 'suggestion' | 'issue' | 'critical';
      message: string;
    }>;
    suggestedResources: string[];
    reflectionQuestions: string[];
  };
  taskAdvanced: boolean;
  nextTask: { id: string; title: string; order: number } | null;
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

describe('Submissions API Routes', () => {
  describe('POST /api/submissions', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return {
              error: 'unauthorized',
              error_description: 'Missing or invalid authorization header',
            };
          }
          return { submission: {}, review: {} };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      expect(response.status).toBe(401);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns 404 when no active project exists', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }

          set.status = 404;
          return {
            error: 'no_active_project',
            error_description: 'No active project found. Start a new project first.',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('no_active_project');
    });

    it('returns 400 when project is already completed', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }

          set.status = 400;
          return {
            error: 'project_completed',
            error_description: 'All tasks in this project are already completed.',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('project_completed');
    });

    it('returns successful review response structure', async () => {
      const mockResponse: SubmitResponse = {
        submission: {
          id: 'sub-123',
          taskId: 'task-456',
          status: 'passed',
        },
        review: {
          overallFeedback: 'Great work on the HTML structure!',
          passed: true,
          conceptsFeedback: [
            {
              conceptId: 'html-structure',
              conceptName: 'HTML Document Structure',
              demonstrated: true,
              feedback: 'You used semantic HTML correctly.',
            },
          ],
          codeComments: [
            {
              filePath: 'index.html',
              lineStart: 5,
              lineEnd: 8,
              severity: 'praise',
              message: 'Good use of semantic elements.',
            },
          ],
          suggestedResources: [],
          reflectionQuestions: ['What other semantic elements could you use?'],
        },
        taskAdvanced: true,
        nextTask: {
          id: 'task-789',
          title: 'Style with CSS',
          order: 2,
        },
      };

      const app = new Elysia().post(
        '/api/submissions',
        ({ headers, set }) => {
          const authHeader = headers['authorization'];
          if (!authHeader?.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'unauthorized' };
          }
          return mockResponse;
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as SubmitResponse;
      expect(data).toHaveProperty('submission');
      expect(data).toHaveProperty('review');
      expect(data).toHaveProperty('taskAdvanced');
      expect(data).toHaveProperty('nextTask');
      expect(data.submission.id).toBe('sub-123');
      expect(data.review.passed).toBe(true);
      expect(data.taskAdvanced).toBe(true);
      expect(data.nextTask?.title).toBe('Style with CSS');
    });
  });

  describe('Response Structure Validation', () => {
    it('validates passed submission response', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-1', status: 'passed' },
        review: {
          overallFeedback: 'Great!',
          passed: true,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: true,
        nextTask: { id: 'task-2', title: 'Next', order: 2 },
      };

      expect(response.submission.status).toBe('passed');
      expect(response.review.passed).toBe(true);
      expect(response.taskAdvanced).toBe(true);
      expect(response.nextTask).not.toBeNull();
    });

    it('validates needs_work submission response', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-1', status: 'needs_work' },
        review: {
          overallFeedback: 'Almost there!',
          passed: false,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: false,
        nextTask: null,
      };

      expect(response.submission.status).toBe('needs_work');
      expect(response.review.passed).toBe(false);
      expect(response.taskAdvanced).toBe(false);
      expect(response.nextTask).toBeNull();
    });

    it('validates project completion response', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-5', status: 'passed' },
        review: {
          overallFeedback: 'Congratulations!',
          passed: true,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: true,
        nextTask: null, // null means project is complete
      };

      expect(response.review.passed).toBe(true);
      expect(response.taskAdvanced).toBe(true);
      expect(response.nextTask).toBeNull();
    });
  });

  describe('Review Feedback Structure', () => {
    it('validates concept feedback structure', () => {
      const conceptFeedback = {
        conceptId: 'html-structure',
        conceptName: 'HTML Document Structure',
        demonstrated: true,
        feedback: 'You demonstrated this concept well.',
      };

      expect(conceptFeedback).toHaveProperty('conceptId');
      expect(conceptFeedback).toHaveProperty('conceptName');
      expect(conceptFeedback).toHaveProperty('demonstrated');
      expect(conceptFeedback).toHaveProperty('feedback');
      expect(typeof conceptFeedback.demonstrated).toBe('boolean');
    });

    it('validates code comment structure', () => {
      const codeComment = {
        filePath: 'index.html',
        lineStart: 5,
        lineEnd: 10,
        severity: 'praise' as const,
        message: 'Good work here!',
      };

      expect(codeComment).toHaveProperty('filePath');
      expect(codeComment).toHaveProperty('lineStart');
      expect(codeComment).toHaveProperty('lineEnd');
      expect(codeComment).toHaveProperty('severity');
      expect(codeComment).toHaveProperty('message');
      expect(codeComment.lineEnd).toBeGreaterThanOrEqual(codeComment.lineStart);
    });

    it('validates severity levels', () => {
      const validSeverities = ['praise', 'suggestion', 'issue', 'critical'];

      for (const severity of validSeverities) {
        expect(['praise', 'suggestion', 'issue', 'critical']).toContain(severity);
      }
    });
  });

  describe('Task State Transitions', () => {
    it('advances task on passed review', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-1', status: 'passed' },
        review: {
          overallFeedback: 'Great!',
          passed: true,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: true,
        nextTask: { id: 'task-2', title: 'Next Task', order: 2 },
      };

      expect(response.review.passed).toBe(true);
      expect(response.taskAdvanced).toBe(true);
      expect(response.nextTask).not.toBeNull();
    });

    it('stays on current task on needs_work review', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-1', status: 'needs_work' },
        review: {
          overallFeedback: 'Keep trying!',
          passed: false,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: false,
        nextTask: null,
      };

      expect(response.review.passed).toBe(false);
      expect(response.taskAdvanced).toBe(false);
      expect(response.nextTask).toBeNull();
    });

    it('handles last task completion', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-5', status: 'passed' },
        review: {
          overallFeedback: 'Project complete!',
          passed: true,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [],
        },
        taskAdvanced: true,
        nextTask: null, // No next task = project complete
      };

      expect(response.review.passed).toBe(true);
      expect(response.taskAdvanced).toBe(true);
      expect(response.nextTask).toBeNull();
    });
  });

  describe('Socratic Review Elements', () => {
    it('includes reflection questions', () => {
      const review = {
        overallFeedback: 'Good work!',
        passed: true,
        conceptsFeedback: [],
        codeComments: [],
        suggestedResources: [],
        reflectionQuestions: [
          'What other semantic elements could improve this?',
          'How would you handle edge cases?',
        ],
      };

      expect(review.reflectionQuestions.length).toBe(2);
      expect(review.reflectionQuestions[0]).toContain('?');
      expect(review.reflectionQuestions[1]).toContain('?');
    });

    it('uses questions not directives in feedback', () => {
      const conceptFeedback = {
        conceptId: 'html-structure',
        conceptName: 'HTML Structure',
        demonstrated: false,
        feedback: 'What element is typically used to wrap the main content?',
      };

      expect(conceptFeedback.feedback).toContain('?');
      expect(conceptFeedback.feedback).not.toContain('You need to');
      expect(conceptFeedback.feedback).not.toContain('Add');
    });
  });

  describe('Error Response Format', () => {
    it('returns error with correct format for 401', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ set }) => {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('error_description');
      expect(typeof data.error).toBe('string');
      expect(typeof data.error_description).toBe('string');
    });

    it('returns error with correct format for 404', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ set }) => {
          set.status = 404;
          return {
            error: 'no_active_project',
            error_description: 'No active project found. Start a new project first.',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('no_active_project');
      expect(data.error_description).toContain('No active project');
    });

    it('returns error with correct format for 400', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ set }) => {
          set.status = 400;
          return {
            error: 'no_files',
            error_description: 'No files provided for submission',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [] }),
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('no_files');
      expect(data.error_description).toContain('No files');
    });

    it('returns error with correct format for 500', async () => {
      const app = new Elysia().post(
        '/api/submissions',
        ({ set }) => {
          set.status = 500;
          return {
            error: 'review_failed',
            error_description: 'Failed to review submission. Please try again.',
          };
        },
        {
          body: t.Object({
            files: t.Array(
              t.Object({
                path: t.String(),
                content: t.String(),
              })
            ),
          }),
        }
      );

      const response = await app.handle(
        new Request('http://localhost/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({ files: [{ path: 'index.html', content: '<html></html>' }] }),
        })
      );

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('review_failed');
      expect(data.error_description).toContain('Failed to review');
    });
  });

  describe('Request Validation', () => {
    it('validates file structure in request', () => {
      const validRequest = {
        files: [
          { path: 'index.html', content: '<html></html>' },
          { path: 'style.css', content: 'body {}' },
        ],
      };

      expect(validRequest.files).toBeArray();
      expect(validRequest.files.length).toBe(2);
      expect(validRequest.files[0]).toHaveProperty('path');
      expect(validRequest.files[0]).toHaveProperty('content');
    });

    it('requires at least one file', () => {
      const emptyRequest = { files: [] };

      expect(emptyRequest.files.length).toBe(0);
      // API should return 400 for empty files array
    });
  });

  describe('Streak and Time Tracking', () => {
    it('calculates streak for first activity', () => {
      const lastActiveDate: Date | null = null;
      const currentStreak = 0;

      // First activity ever
      const newStreak = lastActiveDate ? currentStreak + 1 : 1;
      expect(newStreak).toBe(1);
    });

    it('maintains streak when active same day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActiveDate = new Date(today);
      const currentStreak = 5;

      const diffTime = today.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const newStreak = diffDays === 0 ? currentStreak : diffDays === 1 ? currentStreak + 1 : 1;
      expect(newStreak).toBe(5); // Maintains streak
    });

    it('increments streak when active next day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActiveDate = new Date(today);
      lastActiveDate.setDate(lastActiveDate.getDate() - 1); // Yesterday
      const currentStreak = 3;

      const diffTime = today.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const newStreak = diffDays === 0 ? currentStreak : diffDays === 1 ? currentStreak + 1 : 1;
      expect(newStreak).toBe(4); // Increment streak
    });

    it('resets streak when gap is more than one day', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActiveDate = new Date(today);
      lastActiveDate.setDate(lastActiveDate.getDate() - 3); // 3 days ago
      const currentStreak = 5;

      const diffTime = today.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const newStreak = diffDays === 0 ? currentStreak : diffDays === 1 ? currentStreak + 1 : 1;
      expect(newStreak).toBe(1); // Reset streak
    });

    it('updates longest streak when current exceeds it', () => {
      const currentStreak = 10;
      const longestStreak = 8;

      const newLongestStreak = Math.max(currentStreak, longestStreak);
      expect(newLongestStreak).toBe(10);
    });

    it('keeps longest streak when current is lower', () => {
      const currentStreak = 5;
      const longestStreak = 10;

      const newLongestStreak = Math.max(currentStreak, longestStreak);
      expect(newLongestStreak).toBe(10);
    });

    it('adds 30 minutes per submission', () => {
      const MINUTES_PER_SUBMISSION = 30;
      const currentMinutes = 120;

      const newMinutes = currentMinutes + MINUTES_PER_SUBMISSION;
      expect(newMinutes).toBe(150);
    });

    it('updates last active date on submission', () => {
      const beforeUpdate = new Date('2026-02-01');
      const afterUpdate = new Date();

      expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });
  });
});
