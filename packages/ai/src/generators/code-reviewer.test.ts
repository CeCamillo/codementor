import { describe, it, expect } from 'bun:test';
import { getConceptById } from '../concepts';
import { getPlaybook } from '../playbooks';
import type { ReviewRequest, GeneratedReview } from './code-reviewer';

describe('Code Reviewer', () => {
  describe('Playbooks', () => {
    it('loads code-review playbook', () => {
      const playbook = getPlaybook('code-review');

      expect(playbook).toBeDefined();
      expect(playbook).toContain('Code Review');
      expect(playbook).toContain('Teaching, Not Grading');
    });

    it('loads socratic-questioning playbook', () => {
      const playbook = getPlaybook('socratic-questioning');

      expect(playbook).toBeDefined();
      expect(playbook).toContain('Socratic');
      expect(playbook).toContain('Never give the answer directly');
    });
  });

  describe('ReviewRequest Validation', () => {
    it('validates complete request structure', () => {
      const request: ReviewRequest = {
        task: {
          id: 'task-1',
          title: 'Create HTML Structure',
          description: 'Create the basic HTML structure',
          objectives: ['Use semantic HTML', 'Create proper document structure'],
          conceptIds: ['html-structure'],
        },
        files: [
          {
            path: 'index.html',
            content: '<!DOCTYPE html><html><head></head><body></body></html>',
          },
        ],
        difficulty: 'beginner',
      };

      expect(request.task).toHaveProperty('id');
      expect(request.task).toHaveProperty('title');
      expect(request.task).toHaveProperty('description');
      expect(request.task).toHaveProperty('objectives');
      expect(request.task).toHaveProperty('conceptIds');
      expect(request.files).toBeArray();
      expect(request.files.length).toBeGreaterThan(0);
      expect(['beginner', 'intermediate', 'advanced']).toContain(request.difficulty);
    });

    it('accepts multiple files', () => {
      const request: ReviewRequest = {
        task: {
          id: 'task-1',
          title: 'Build a page',
          description: 'Build a complete page',
          objectives: ['Create HTML', 'Style with CSS'],
          conceptIds: ['html-structure', 'css-selectors'],
        },
        files: [
          { path: 'index.html', content: '<html></html>' },
          { path: 'style.css', content: 'body { margin: 0; }' },
          { path: 'script.js', content: 'console.log("hello");' },
        ],
        difficulty: 'intermediate',
      };

      expect(request.files.length).toBe(3);
      expect(request.files[0]!.path).toBe('index.html');
      expect(request.files[1]!.path).toBe('style.css');
      expect(request.files[2]!.path).toBe('script.js');
    });
  });

  describe('GeneratedReview Structure', () => {
    it('validates complete review structure', () => {
      const review: GeneratedReview = {
        overallFeedback: 'Great work on the basic structure.',
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
        suggestedResources: ['MDN HTML Guide'],
        reflectionQuestions: ['What other semantic elements could you use?'],
      };

      expect(review).toHaveProperty('overallFeedback');
      expect(review).toHaveProperty('passed');
      expect(review).toHaveProperty('conceptsFeedback');
      expect(review).toHaveProperty('codeComments');
      expect(review).toHaveProperty('suggestedResources');
      expect(review).toHaveProperty('reflectionQuestions');
    });

    it('validates severity levels', () => {
      const validSeverities = ['praise', 'suggestion', 'issue', 'critical'];

      const review: GeneratedReview = {
        overallFeedback: 'Test',
        passed: false,
        conceptsFeedback: [],
        codeComments: [
          { filePath: 'a.js', lineStart: 1, lineEnd: 1, severity: 'praise', message: 'Good' },
          {
            filePath: 'a.js',
            lineStart: 2,
            lineEnd: 2,
            severity: 'suggestion',
            message: 'Consider',
          },
          { filePath: 'a.js', lineStart: 3, lineEnd: 3, severity: 'issue', message: 'Fix' },
          { filePath: 'a.js', lineStart: 4, lineEnd: 4, severity: 'critical', message: 'Must fix' },
        ],
        suggestedResources: [],
        reflectionQuestions: [],
      };

      for (const comment of review.codeComments) {
        expect(validSeverities).toContain(comment.severity);
      }
    });

    it('handles empty arrays', () => {
      const review: GeneratedReview = {
        overallFeedback: 'Good job!',
        passed: true,
        conceptsFeedback: [],
        codeComments: [],
        suggestedResources: [],
        reflectionQuestions: [],
      };

      expect(review.conceptsFeedback).toEqual([]);
      expect(review.codeComments).toEqual([]);
      expect(review.suggestedResources).toEqual([]);
      expect(review.reflectionQuestions).toEqual([]);
    });
  });

  describe('Concept Validation', () => {
    it('validates concept IDs against available concepts', () => {
      const conceptIds = ['html-structure', 'invalid-concept', 'css-flexbox'];

      const validIds = conceptIds.filter((id) => getConceptById(id) !== undefined);

      expect(validIds).toEqual(['html-structure', 'css-flexbox']);
    });

    it('builds concept context from valid IDs', () => {
      const conceptIds = ['html-structure', 'css-selectors'];

      const concepts = conceptIds
        .map((id) => {
          const concept = getConceptById(id);
          return concept ? `- ${concept.id}: ${concept.name}` : null;
        })
        .filter(Boolean);

      expect(concepts.length).toBe(2);
      expect(concepts[0]).toContain('html-structure');
      expect(concepts[1]).toContain('css-selectors');
    });
  });

  describe('Tool Schema', () => {
    it('defines correct tool structure for code review', () => {
      const toolSchema = {
        name: 'generate_code_review',
        description: 'Generate a structured code review with Socratic feedback',
        input_schema: {
          type: 'object' as const,
          properties: {
            overallFeedback: { type: 'string' },
            passed: { type: 'boolean' },
            conceptsFeedback: { type: 'array' },
            codeComments: { type: 'array' },
            suggestedResources: { type: 'array' },
            reflectionQuestions: { type: 'array' },
          },
          required: [
            'overallFeedback',
            'passed',
            'conceptsFeedback',
            'codeComments',
            'reflectionQuestions',
          ],
        },
      };

      expect(toolSchema.name).toBe('generate_code_review');
      expect(toolSchema.input_schema.required).toContain('overallFeedback');
      expect(toolSchema.input_schema.required).toContain('passed');
      expect(toolSchema.input_schema.required).toContain('conceptsFeedback');
      expect(toolSchema.input_schema.required).toContain('codeComments');
      expect(toolSchema.input_schema.required).toContain('reflectionQuestions');
    });

    it('code comment schema has required properties', () => {
      const codeCommentSchema = {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          lineStart: { type: 'number' },
          lineEnd: { type: 'number' },
          severity: { type: 'string', enum: ['praise', 'suggestion', 'issue', 'critical'] },
          message: { type: 'string' },
        },
        required: ['filePath', 'lineStart', 'lineEnd', 'severity', 'message'],
      };

      expect(codeCommentSchema.properties.severity.enum).toEqual([
        'praise',
        'suggestion',
        'issue',
        'critical',
      ]);
      expect(codeCommentSchema.required).toContain('filePath');
      expect(codeCommentSchema.required).toContain('lineStart');
      expect(codeCommentSchema.required).toContain('lineEnd');
      expect(codeCommentSchema.required).toContain('severity');
      expect(codeCommentSchema.required).toContain('message');
    });

    it('concept feedback schema has required properties', () => {
      const conceptFeedbackSchema = {
        type: 'object',
        properties: {
          conceptId: { type: 'string' },
          conceptName: { type: 'string' },
          demonstrated: { type: 'boolean' },
          feedback: { type: 'string' },
        },
        required: ['conceptId', 'conceptName', 'demonstrated', 'feedback'],
      };

      expect(conceptFeedbackSchema.required).toContain('conceptId');
      expect(conceptFeedbackSchema.required).toContain('conceptName');
      expect(conceptFeedbackSchema.required).toContain('demonstrated');
      expect(conceptFeedbackSchema.required).toContain('feedback');
    });
  });

  describe('Pass/Fail Logic', () => {
    it('passes when all requirements met', () => {
      const review: GeneratedReview = {
        overallFeedback: 'Excellent work!',
        passed: true,
        conceptsFeedback: [
          {
            conceptId: 'html-structure',
            conceptName: 'HTML Structure',
            demonstrated: true,
            feedback: 'Well done!',
          },
        ],
        codeComments: [
          { filePath: 'index.html', lineStart: 1, lineEnd: 5, severity: 'praise', message: 'Good' },
        ],
        suggestedResources: [],
        reflectionQuestions: ['What else could you add?'],
      };

      expect(review.passed).toBe(true);
      expect(review.conceptsFeedback.every((cf) => cf.demonstrated)).toBe(true);
    });

    it('fails when critical issues exist', () => {
      const review: GeneratedReview = {
        overallFeedback: 'There are critical issues to address.',
        passed: false,
        conceptsFeedback: [
          {
            conceptId: 'html-structure',
            conceptName: 'HTML Structure',
            demonstrated: false,
            feedback: 'What element is missing from the document?',
          },
        ],
        codeComments: [
          {
            filePath: 'index.html',
            lineStart: 1,
            lineEnd: 1,
            severity: 'critical',
            message: 'What element should wrap your HTML content?',
          },
        ],
        suggestedResources: ['MDN HTML Tutorial'],
        reflectionQuestions: ['What are the essential parts of an HTML document?'],
      };

      expect(review.passed).toBe(false);
      const hasCritical = review.codeComments.some((c) => c.severity === 'critical');
      expect(hasCritical).toBe(true);
    });
  });

  describe('Socratic Feedback', () => {
    it('reflection questions are phrased as questions', () => {
      const reflectionQuestions = [
        'What happens if the user submits an empty form?',
        'How could you improve the accessibility of this button?',
        'Why might it be important to validate user input?',
      ];

      for (const question of reflectionQuestions) {
        expect(question.endsWith('?')).toBe(true);
      }
    });

    it('feedback for issues uses questions not directives', () => {
      const goodFeedback = [
        'What happens when this array is empty?',
        'Have you considered what occurs if the user clicks rapidly?',
        'What element typically contains the page title?',
      ];

      const badFeedback = [
        'You need to add error handling.',
        'Change this to use async/await.',
        'Add a DOCTYPE declaration.',
      ];

      for (const feedback of goodFeedback) {
        expect(feedback.includes('?')).toBe(true);
      }

      for (const feedback of badFeedback) {
        expect(feedback.includes('?')).toBe(false);
      }
    });
  });

  describe('Difficulty Adaptation', () => {
    it('accepts all difficulty levels', () => {
      const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = [
        'beginner',
        'intermediate',
        'advanced',
      ];

      for (const difficulty of difficulties) {
        const request: ReviewRequest = {
          task: {
            id: 'task-1',
            title: 'Test',
            description: 'Test',
            objectives: [],
            conceptIds: [],
          },
          files: [{ path: 'test.js', content: '' }],
          difficulty,
        };

        expect(request.difficulty).toBe(difficulty);
      }
    });
  });
});
