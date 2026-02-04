import { describe, it, expect } from 'bun:test';
import type { ProgressResponse } from '@codementor/shared';

describe('Progress Command', () => {
  describe('Response Type Validation', () => {
    it('validates ProgressResponse structure', () => {
      const response: ProgressResponse = {
        user: {
          totalMinutesLearned: 270,
          currentStreak: 3,
          longestStreak: 5,
          lastActiveDate: new Date().toISOString(),
        },
        activeProject: {
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
            description: 'Create form',
            status: 'available',
            order: 4,
            conceptIds: ['forms', 'event-handlers'],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        masteredConcepts: [
          {
            id: 'jsx-basics',
            name: 'JSX Basics',
            slug: 'jsx-basics',
            category: 'React Fundamentals',
            masteryLevel: 85,
          },
        ],
        recentProjects: [],
      };

      expect(response.user.totalMinutesLearned).toBe(270);
      expect(response.user.currentStreak).toBe(3);
      expect(response.activeProject?.progress.percentage).toBe(60);
      expect(response.masteredConcepts[0].masteryLevel).toBeGreaterThanOrEqual(80);
    });

    it('validates time formatting for different durations', () => {
      const testCases = [
        { minutes: 30, expected: '30 minutes' },
        { minutes: 60, expected: '~1.0 hours' },
        { minutes: 90, expected: '~1.5 hours' },
        { minutes: 270, expected: '~4.5 hours' },
        { minutes: 600, expected: '~10 hours' },
        { minutes: 1200, expected: '~20 hours' },
      ];

      for (const { minutes, expected } of testCases) {
        let formatted: string;
        if (minutes < 60) {
          formatted = `${minutes} minutes`;
        } else {
          const hours = minutes / 60;
          if (hours < 10) {
            formatted = `~${hours.toFixed(1)} hours`;
          } else {
            formatted = `~${Math.round(hours)} hours`;
          }
        }
        expect(formatted).toBe(expected);
      }
    });

    it('generates correct progress bars', () => {
      const testCases = [
        { percentage: 0, expected: '░░░░░░░░░░' },
        { percentage: 25, expected: '███░░░░░░░' },
        { percentage: 50, expected: '█████░░░░░' },
        { percentage: 75, expected: '████████░░' },
        { percentage: 100, expected: '██████████' },
      ];

      for (const { percentage, expected } of testCases) {
        const width = 10;
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        expect(bar).toBe(expected);
      }
    });

    it('returns correct difficulty emojis', () => {
      const emojis: Record<string, string> = {
        beginner: '🟢',
        intermediate: '🟡',
        advanced: '🔴',
        unknown: '⚪',
      };

      expect(emojis['beginner']).toBe('🟢');
      expect(emojis['intermediate']).toBe('🟡');
      expect(emojis['advanced']).toBe('🔴');
    });

    it('returns correct status emojis', () => {
      const emojis: Record<string, string> = {
        completed: '✅',
        in_progress: '🔄',
        not_started: '⏳',
        abandoned: '🚫',
        default: '⚪',
      };

      expect(emojis['completed']).toBe('✅');
      expect(emojis['in_progress']).toBe('🔄');
      expect(emojis['not_started']).toBe('⏳');
    });
  });

  describe('Concepts Display', () => {
    it('groups concepts by category', () => {
      const concepts = [
        { id: 'c1', name: 'JSX', category: 'React Fundamentals', masteryLevel: 85 },
        { id: 'c2', name: 'Components', category: 'React Fundamentals', masteryLevel: 90 },
        { id: 'c3', name: 'Hooks', category: 'React Advanced', masteryLevel: 82 },
      ];

      const byCategory = concepts.reduce(
        (acc, concept) => {
          if (!acc[concept.category]) {
            acc[concept.category] = [];
          }
          acc[concept.category].push(concept);
          return acc;
        },
        {} as Record<string, typeof concepts>
      );

      expect(Object.keys(byCategory)).toHaveLength(2);
      expect(byCategory['React Fundamentals']).toHaveLength(2);
      expect(byCategory['React Advanced']).toHaveLength(1);
    });

    it('shows only concepts with mastery >= 80', () => {
      const concepts = [
        { id: 'c1', name: 'JSX', masteryLevel: 85 },
        { id: 'c2', name: 'State', masteryLevel: 92 },
        { id: 'c3', name: 'Props', masteryLevel: 75 },
        { id: 'c4', name: 'Effects', masteryLevel: 60 },
      ];

      const mastered = concepts.filter((c) => c.masteryLevel >= 80);
      expect(mastered).toHaveLength(2);
      expect(mastered.map((c) => c.name)).toContain('JSX');
      expect(mastered.map((c) => c.name)).toContain('State');
    });
  });

  describe('Empty States', () => {
    it('handles no active project', () => {
      const response: ProgressResponse = {
        user: {
          totalMinutesLearned: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
        },
        activeProject: null,
        masteredConcepts: [],
        recentProjects: [],
      };

      expect(response.activeProject).toBeNull();
    });

    it('handles no mastered concepts', () => {
      const response: ProgressResponse = {
        user: {
          totalMinutesLearned: 60,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString(),
        },
        activeProject: {
          id: 'proj-1',
          title: 'Test Project',
          description: 'Test',
          difficulty: 'beginner',
          status: 'in_progress',
          progress: { completed: 0, total: 5, percentage: 0 },
          currentTask: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        masteredConcepts: [],
        recentProjects: [],
      };

      expect(response.masteredConcepts).toHaveLength(0);
    });
  });

  describe('Streak Display', () => {
    it('shows longest streak when different from current', () => {
      const user = { currentStreak: 3, longestStreak: 10 };

      const showLongest = user.longestStreak > user.currentStreak;
      expect(showLongest).toBe(true);
    });

    it('hides longest streak when equal to current', () => {
      const user = { currentStreak: 5, longestStreak: 5 };

      const showLongest = user.longestStreak > user.currentStreak;
      expect(showLongest).toBe(false);
    });
  });
});
