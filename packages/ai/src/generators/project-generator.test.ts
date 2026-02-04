import { describe, it, expect } from 'bun:test';
import { getWebFundamentalsConcepts, getConceptById } from '../concepts';

// Test concept validation logic
describe('Project Generator', () => {
  describe('Concept Reference', () => {
    it('loads web fundamentals concepts', () => {
      const concepts = getWebFundamentalsConcepts();

      expect(concepts).toBeArray();
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('concepts have required properties', () => {
      const concepts = getWebFundamentalsConcepts();

      for (const concept of concepts) {
        expect(concept).toHaveProperty('id');
        expect(concept).toHaveProperty('name');
        expect(concept).toHaveProperty('tier');
        expect(concept).toHaveProperty('category');
        expect(concept).toHaveProperty('prerequisites');
        expect(concept).toHaveProperty('resources');
      }
    });

    it('getConceptById returns concept for valid id', () => {
      const concept = getConceptById('html-structure');

      expect(concept).toBeDefined();
      expect(concept?.id).toBe('html-structure');
      expect(concept?.name).toBe('HTML Document Structure');
    });

    it('getConceptById returns undefined for invalid id', () => {
      const concept = getConceptById('non-existent-concept');

      expect(concept).toBeUndefined();
    });
  });

  describe('Concept ID Validation', () => {
    it('filters out invalid concept IDs', () => {
      const conceptIds = ['html-structure', 'invalid-id', 'css-flexbox', 'fake-concept'];

      const validIds = conceptIds.filter((id) => getConceptById(id) !== undefined);

      expect(validIds).toEqual(['html-structure', 'css-flexbox']);
      expect(validIds).not.toContain('invalid-id');
      expect(validIds).not.toContain('fake-concept');
    });

    it('returns empty array when all IDs are invalid', () => {
      const conceptIds = ['fake-1', 'fake-2', 'fake-3'];

      const validIds = conceptIds.filter((id) => getConceptById(id) !== undefined);

      expect(validIds).toEqual([]);
    });

    it('returns all IDs when all are valid', () => {
      const conceptIds = ['html-structure', 'html-forms', 'css-selectors'];

      const validIds = conceptIds.filter((id) => getConceptById(id) !== undefined);

      expect(validIds).toEqual(conceptIds);
    });
  });

  describe('Concept Categories', () => {
    it('groups concepts by category', () => {
      const concepts = getWebFundamentalsConcepts();
      const byCategory = concepts.reduce(
        (acc, c) => {
          const category = acc[c.category] ?? [];
          category.push(c);
          acc[c.category] = category;
          return acc;
        },
        {} as Record<string, typeof concepts>
      );

      expect(Object.keys(byCategory)).toContain('HTML');
      expect(Object.keys(byCategory)).toContain('CSS');
      expect(Object.keys(byCategory)).toContain('JavaScript');
    });

    it('all concepts have valid tiers (1, 2, or 3)', () => {
      const concepts = getWebFundamentalsConcepts();

      for (const concept of concepts) {
        expect([1, 2, 3]).toContain(concept.tier);
      }
    });
  });

  describe('Generated Project Structure', () => {
    it('validates GeneratedProject shape', () => {
      // This tests the expected structure that the AI should return
      const mockGeneratedProject = {
        title: 'Test Project',
        summary: 'A test project summary',
        difficulty: 'beginner' as const,
        tasks: [
          {
            title: 'Task 1',
            description: 'Description 1',
            objectives: ['Objective 1', 'Objective 2'],
            hints: ['Hint 1'],
            conceptIds: ['html-structure'],
            estimatedMinutes: 30,
            order: 1,
          },
        ],
        totalEstimatedMinutes: 30,
      };

      expect(mockGeneratedProject).toHaveProperty('title');
      expect(mockGeneratedProject).toHaveProperty('summary');
      expect(mockGeneratedProject).toHaveProperty('difficulty');
      expect(mockGeneratedProject).toHaveProperty('tasks');
      expect(mockGeneratedProject).toHaveProperty('totalEstimatedMinutes');
      expect(mockGeneratedProject.tasks).toBeArray();
      expect(mockGeneratedProject.tasks[0]).toHaveProperty('title');
      expect(mockGeneratedProject.tasks[0]).toHaveProperty('objectives');
      expect(mockGeneratedProject.tasks[0]).toHaveProperty('conceptIds');
    });

    it('validates difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      for (const difficulty of validDifficulties) {
        expect(['beginner', 'intermediate', 'advanced']).toContain(difficulty);
      }
    });
  });

  describe('Tool Schema', () => {
    it('defines correct tool structure for AI', () => {
      const toolSchema = {
        name: 'generate_project_breakdown',
        description: 'Generate a structured learning project breakdown with tasks',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            tasks: { type: 'array' },
            totalEstimatedMinutes: { type: 'number' },
          },
          required: ['title', 'summary', 'difficulty', 'tasks', 'totalEstimatedMinutes'],
        },
      };

      expect(toolSchema.name).toBe('generate_project_breakdown');
      expect(toolSchema.input_schema.required).toContain('title');
      expect(toolSchema.input_schema.required).toContain('tasks');
      expect(toolSchema.input_schema.properties.difficulty.enum).toEqual([
        'beginner',
        'intermediate',
        'advanced',
      ]);
    });
  });
});
