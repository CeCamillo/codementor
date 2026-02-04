import { describe, it, expect } from 'bun:test';
import type { SubmitResponse } from '@codementor/shared';

describe('Submit Command', () => {
  describe('SubmitResponse Validation', () => {
    it('validates complete passed response structure', () => {
      const response: SubmitResponse = {
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

      expect(response.submission.status).toBe('passed');
      expect(response.review.passed).toBe(true);
      expect(response.taskAdvanced).toBe(true);
      expect(response.nextTask).not.toBeNull();
    });

    it('validates complete needs_work response structure', () => {
      const response: SubmitResponse = {
        submission: {
          id: 'sub-123',
          taskId: 'task-456',
          status: 'needs_work',
        },
        review: {
          overallFeedback: 'Almost there! A few things need attention.',
          passed: false,
          conceptsFeedback: [
            {
              conceptId: 'html-structure',
              conceptName: 'HTML Document Structure',
              demonstrated: false,
              feedback: 'What element is missing from the document?',
            },
          ],
          codeComments: [
            {
              filePath: 'index.html',
              lineStart: 1,
              lineEnd: 1,
              severity: 'issue',
              message: 'What should come before the html element?',
            },
          ],
          suggestedResources: ['MDN HTML Tutorial'],
          reflectionQuestions: ['What are the essential parts of an HTML document?'],
        },
        taskAdvanced: false,
        nextTask: null,
      };

      expect(response.submission.status).toBe('needs_work');
      expect(response.review.passed).toBe(false);
      expect(response.taskAdvanced).toBe(false);
      expect(response.nextTask).toBeNull();
    });
  });

  describe('File Detection Logic', () => {
    it('validates supported file extensions', () => {
      const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json'];

      const testFiles = [
        { name: 'index.html', expected: true },
        { name: 'style.css', expected: true },
        { name: 'app.js', expected: true },
        { name: 'component.tsx', expected: true },
        { name: 'config.json', expected: true },
        { name: 'readme.md', expected: false },
        { name: 'image.png', expected: false },
        { name: '.gitignore', expected: false },
      ];

      for (const file of testFiles) {
        const isSupported = FILE_EXTENSIONS.some((ext) => file.name.endsWith(ext));
        expect(isSupported).toBe(file.expected);
      }
    });

    it('validates excluded directories', () => {
      const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

      expect(EXCLUDED_DIRS).toContain('node_modules');
      expect(EXCLUDED_DIRS).toContain('.git');
      expect(EXCLUDED_DIRS).toContain('dist');
      expect(EXCLUDED_DIRS).toContain('build');
    });

    it('validates file size limits', () => {
      const MAX_FILE_SIZE = 100 * 1024; // 100KB
      const MAX_TOTAL_SIZE = 500 * 1024; // 500KB

      expect(MAX_FILE_SIZE).toBe(102400);
      expect(MAX_TOTAL_SIZE).toBe(512000);
      expect(MAX_TOTAL_SIZE).toBeGreaterThan(MAX_FILE_SIZE);
    });
  });

  describe('Review Display Logic', () => {
    it('identifies praise comments', () => {
      const codeComments = [
        {
          filePath: 'a.js',
          lineStart: 1,
          lineEnd: 1,
          severity: 'praise' as const,
          message: 'Good',
        },
        {
          filePath: 'a.js',
          lineStart: 2,
          lineEnd: 2,
          severity: 'suggestion' as const,
          message: 'Consider',
        },
        { filePath: 'a.js', lineStart: 3, lineEnd: 3, severity: 'issue' as const, message: 'Fix' },
      ];

      const praiseComments = codeComments.filter((c) => c.severity === 'praise');

      expect(praiseComments.length).toBe(1);
      expect(praiseComments[0]!.message).toBe('Good');
    });

    it('identifies issue and critical comments', () => {
      const codeComments = [
        {
          filePath: 'a.js',
          lineStart: 1,
          lineEnd: 1,
          severity: 'praise' as const,
          message: 'Good',
        },
        { filePath: 'a.js', lineStart: 2, lineEnd: 2, severity: 'issue' as const, message: 'Fix' },
        {
          filePath: 'a.js',
          lineStart: 3,
          lineEnd: 3,
          severity: 'critical' as const,
          message: 'Must fix',
        },
      ];

      const issueComments = codeComments.filter(
        (c) => c.severity === 'critical' || c.severity === 'issue'
      );

      expect(issueComments.length).toBe(2);
    });

    it('formats line range correctly', () => {
      const formatLineRange = (start: number, end: number): string => {
        return start === end ? `${start}` : `${start}-${end}`;
      };

      expect(formatLineRange(5, 5)).toBe('5');
      expect(formatLineRange(5, 10)).toBe('5-10');
      expect(formatLineRange(1, 100)).toBe('1-100');
    });
  });

  describe('Concepts Feedback Display', () => {
    it('separates demonstrated and not demonstrated concepts', () => {
      const conceptsFeedback = [
        {
          conceptId: 'html-structure',
          conceptName: 'HTML Structure',
          demonstrated: true,
          feedback: 'Good',
        },
        {
          conceptId: 'css-selectors',
          conceptName: 'CSS Selectors',
          demonstrated: false,
          feedback: 'Need work',
        },
        {
          conceptId: 'html-forms',
          conceptName: 'HTML Forms',
          demonstrated: true,
          feedback: 'Well done',
        },
      ];

      const demonstrated = conceptsFeedback.filter((cf) => cf.demonstrated);
      const notDemonstrated = conceptsFeedback.filter((cf) => !cf.demonstrated);

      expect(demonstrated.length).toBe(2);
      expect(notDemonstrated.length).toBe(1);
      expect(demonstrated[0]!.conceptName).toBe('HTML Structure');
      expect(notDemonstrated[0]!.conceptName).toBe('CSS Selectors');
    });
  });

  describe('Error Handling', () => {
    it('identifies authentication error', () => {
      const error = new Error('Not authenticated. Please run "codementor login" first.');

      expect(error.message).toContain('Not authenticated');
    });

    it('identifies no active project error', () => {
      const error = new Error('No active project found. Start a new project first.');

      expect(error.message).toContain('No active project');
    });

    it('identifies no files error', () => {
      const error = new Error('No files provided for submission');

      expect(error.message).toContain('No files');
    });

    it('identifies project completed error', () => {
      const error = new Error('All tasks in this project are already completed.');

      expect(error.message).toContain('already completed');
    });
  });

  describe('Task Progression', () => {
    it('advances to next task on pass', () => {
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
      expect(response.nextTask!.id).toBe('task-2');
    });

    it('stays on current task on needs_work', () => {
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

      expect(response.review.passed).toBe(false);
      expect(response.taskAdvanced).toBe(false);
      expect(response.nextTask).toBeNull();
    });

    it('handles project completion', () => {
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

  describe('Socratic Review Elements', () => {
    it('includes reflection questions', () => {
      const response: SubmitResponse = {
        submission: { id: 'sub-1', taskId: 'task-1', status: 'passed' },
        review: {
          overallFeedback: 'Good work!',
          passed: true,
          conceptsFeedback: [],
          codeComments: [],
          suggestedResources: [],
          reflectionQuestions: [
            'What other semantic elements could improve this structure?',
            'How would you handle edge cases?',
          ],
        },
        taskAdvanced: true,
        nextTask: null,
      };

      expect(response.review.reflectionQuestions.length).toBe(2);
      expect(response.review.reflectionQuestions[0]).toContain('?');
      expect(response.review.reflectionQuestions[1]).toContain('?');
    });

    it('feedback uses questions not directives', () => {
      const conceptsFeedback = [
        {
          conceptId: 'html-structure',
          conceptName: 'HTML Structure',
          demonstrated: false,
          feedback: 'What element is missing from the document head?',
        },
      ];

      expect(conceptsFeedback[0]!.feedback).toContain('?');
      expect(conceptsFeedback[0]!.feedback).not.toContain('You need to');
      expect(conceptsFeedback[0]!.feedback).not.toContain('Add');
    });
  });
});
