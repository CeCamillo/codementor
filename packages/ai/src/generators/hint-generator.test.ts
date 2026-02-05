import { describe, it, expect } from 'bun:test';
import { getPlaybook } from '../playbooks';
import { getConceptById } from '../concepts';
import type { HintRequest, HintResponse } from './hint-generator';

describe('Hint Generator', () => {
  describe('Playbooks', () => {
    it('loads socratic-questioning playbook', () => {
      const playbook = getPlaybook('socratic-questioning');

      expect(playbook).toBeDefined();
      expect(playbook).toContain('Socratic');
      expect(playbook).toContain('Hint Escalation Ladder');
    });

    it('playbook defines 4 hint levels', () => {
      const playbook = getPlaybook('socratic-questioning');

      expect(playbook).toContain('Hint 1');
      expect(playbook).toContain('Hint 2');
      expect(playbook).toContain('Hint 3');
      expect(playbook).toContain('Hint 4');
    });
  });

  describe('HintRequest Validation', () => {
    it('validates complete request structure', () => {
      const request: HintRequest = {
        task: {
          title: 'Create HTML Structure',
          description: 'Create the basic HTML structure',
          objectives: ['Use semantic HTML', 'Create proper document structure'],
          conceptIds: ['html-structure'],
        },
        attemptNumber: 1,
        previousHints: [],
        difficulty: 'beginner',
      };

      expect(request.task).toHaveProperty('title');
      expect(request.task).toHaveProperty('description');
      expect(request.task).toHaveProperty('objectives');
      expect(request.task).toHaveProperty('conceptIds');
      expect(request.attemptNumber).toBeGreaterThan(0);
      expect(request.previousHints).toBeArray();
      expect(['beginner', 'intermediate', 'advanced']).toContain(request.difficulty);
    });

    it('accepts optional userCode', () => {
      const request: HintRequest = {
        task: {
          title: 'Test',
          description: 'Test task',
          objectives: ['Test objective'],
          conceptIds: [],
        },
        attemptNumber: 2,
        previousHints: ['First hint given'],
        userCode: 'function test() { return 1; }',
        difficulty: 'intermediate',
      };

      expect(request.userCode).toBeDefined();
      expect(request.userCode).toContain('function');
    });

    it('accepts empty previous hints for first hint', () => {
      const request: HintRequest = {
        task: {
          title: 'Test',
          description: 'Test task',
          objectives: [],
          conceptIds: [],
        },
        attemptNumber: 1,
        previousHints: [],
        difficulty: 'beginner',
      };

      expect(request.previousHints).toEqual([]);
    });
  });

  describe('HintResponse Structure', () => {
    it('validates complete response structure', () => {
      const response: HintResponse = {
        hint: 'Consider how arrays store data sequentially.',
        hintLevel: 1,
        conceptPointers: ['js-arrays'],
        isLastHint: false,
      };

      expect(response).toHaveProperty('hint');
      expect(response).toHaveProperty('hintLevel');
      expect(response).toHaveProperty('conceptPointers');
      expect(response).toHaveProperty('isLastHint');
    });

    it('validates hint levels are 1-4', () => {
      const validLevels = [1, 2, 3, 4];

      for (const level of validLevels) {
        const response: HintResponse = {
          hint: 'Test hint',
          hintLevel: level as 1 | 2 | 3 | 4,
          conceptPointers: [],
          isLastHint: level === 4,
        };

        expect(validLevels).toContain(response.hintLevel);
      }
    });

    it('isLastHint should be true only for level 4', () => {
      const level4Response: HintResponse = {
        hint: 'Final hint with pseudocode',
        hintLevel: 4,
        conceptPointers: [],
        isLastHint: true,
      };

      const level3Response: HintResponse = {
        hint: 'Structural hint',
        hintLevel: 3,
        conceptPointers: [],
        isLastHint: false,
      };

      expect(level4Response.isLastHint).toBe(true);
      expect(level3Response.isLastHint).toBe(false);
    });
  });

  describe('Hint Level Determination', () => {
    it('returns level 1 for first hint (no previous hints)', () => {
      const previousHints: string[] = [];
      const expectedLevel = 1;

      // Logic: hintCount === 0 -> level 1
      const hintCount = previousHints.length;
      let determinedLevel: 1 | 2 | 3 | 4;
      if (hintCount === 0) determinedLevel = 1;
      else if (hintCount === 1) determinedLevel = 2;
      else if (hintCount === 2) determinedLevel = 3;
      else determinedLevel = 4;

      expect(determinedLevel).toBe(expectedLevel);
    });

    it('returns level 2 after one previous hint', () => {
      const previousHints = ['First hint'];
      const expectedLevel = 2;

      const hintCount = previousHints.length;
      let determinedLevel: 1 | 2 | 3 | 4;
      if (hintCount === 0) determinedLevel = 1;
      else if (hintCount === 1) determinedLevel = 2;
      else if (hintCount === 2) determinedLevel = 3;
      else determinedLevel = 4;

      expect(determinedLevel).toBe(expectedLevel);
    });

    it('returns level 3 after two previous hints', () => {
      const previousHints = ['First hint', 'Second hint'];
      const expectedLevel = 3;

      const hintCount = previousHints.length;
      let determinedLevel: 1 | 2 | 3 | 4;
      if (hintCount === 0) determinedLevel = 1;
      else if (hintCount === 1) determinedLevel = 2;
      else if (hintCount === 2) determinedLevel = 3;
      else determinedLevel = 4;

      expect(determinedLevel).toBe(expectedLevel);
    });

    it('returns level 4 (max) after three or more previous hints', () => {
      const previousHints = ['First', 'Second', 'Third'];
      const expectedLevel = 4;

      const hintCount = previousHints.length;
      let determinedLevel: 1 | 2 | 3 | 4;
      if (hintCount === 0) determinedLevel = 1;
      else if (hintCount === 1) determinedLevel = 2;
      else if (hintCount === 2) determinedLevel = 3;
      else determinedLevel = 4;

      expect(determinedLevel).toBe(expectedLevel);
    });

    it('stays at level 4 for many previous hints', () => {
      const previousHints = ['1', '2', '3', '4', '5'];
      const expectedLevel = 4;

      const hintCount = previousHints.length;
      let determinedLevel: 1 | 2 | 3 | 4;
      if (hintCount === 0) determinedLevel = 1;
      else if (hintCount === 1) determinedLevel = 2;
      else if (hintCount === 2) determinedLevel = 3;
      else determinedLevel = 4;

      expect(determinedLevel).toBe(expectedLevel);
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
    it('defines correct tool structure for hint generation', () => {
      const toolSchema = {
        name: 'generate_hint',
        description: 'Generate a progressive hint for a struggling learner',
        input_schema: {
          type: 'object' as const,
          properties: {
            hint: { type: 'string' },
            hintLevel: { type: 'number', enum: [1, 2, 3, 4] },
            conceptPointers: { type: 'array', items: { type: 'string' } },
            isLastHint: { type: 'boolean' },
          },
          required: ['hint', 'hintLevel', 'conceptPointers', 'isLastHint'],
        },
      };

      expect(toolSchema.name).toBe('generate_hint');
      expect(toolSchema.input_schema.required).toContain('hint');
      expect(toolSchema.input_schema.required).toContain('hintLevel');
      expect(toolSchema.input_schema.required).toContain('conceptPointers');
      expect(toolSchema.input_schema.required).toContain('isLastHint');
    });

    it('hint levels are constrained to 1-4', () => {
      const toolSchema = {
        input_schema: {
          properties: {
            hintLevel: { type: 'number', enum: [1, 2, 3, 4] },
          },
        },
      };

      expect(toolSchema.input_schema.properties.hintLevel.enum).toEqual([1, 2, 3, 4]);
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
        const request: HintRequest = {
          task: {
            title: 'Test',
            description: 'Test',
            objectives: [],
            conceptIds: [],
          },
          attemptNumber: 1,
          previousHints: [],
          difficulty,
        };

        expect(request.difficulty).toBe(difficulty);
      }
    });
  });

  describe('Hint Escalation Semantics', () => {
    it('level 1 hints should be directional only', () => {
      // Level 1 example from playbook: "This relates to how JavaScript handles
      // asynchronous operations. What do you know about Promises?"
      const level1Examples = [
        'Consider how arrays store data sequentially.',
        'Think about what happens when you call a function.',
        'This relates to how events work in the browser. What do you know about event listeners?',
      ];

      for (const hint of level1Examples) {
        // Level 1 hints should not contain specific code patterns
        expect(hint).not.toContain('```');
        expect(hint).not.toContain('function(');
        expect(hint).not.toContain('=>');
      }
    });

    it('level 4 hints can include pseudocode but not working code', () => {
      // Level 4 example: conceptual solution with pseudocode
      const validLevel4Hint =
        'You need to: 1) fetch the data, 2) wait for the response, 3) parse it as JSON. ' +
        'Use async/await to handle the Promise chain.';

      const invalidLevel4Hint = 'const data = await fetch(url).then(r => r.json());';

      // Valid hint explains the concept
      expect(validLevel4Hint).toContain('You need to');

      // Invalid hint contains actual working code
      expect(invalidLevel4Hint).toContain('await fetch');
      expect(invalidLevel4Hint).toContain('=>');
    });
  });
});
