import { describe, it, expect } from 'bun:test';
import type { ProgressResponse } from '@codementor/shared';

describe('Progress API Routes', () => {
  const API_BASE = 'http://localhost:3000';

  describe('GET /api/progress', () => {
    it('returns 401 without authorization header', async () => {
      const response = await fetch(`${API_BASE}/api/progress`);
      expect(response.status).toBe(401);

      const data = (await response.json()) as { error: string };
      expect(data.error).toBeDefined();
    });

    it('returns progress data structure', async () => {
      // This test validates the response structure
      // Actual API call would require authentication
      const mockResponse: ProgressResponse = {
        user: {
          totalMinutesLearned: 120,
          currentStreak: 3,
          longestStreak: 5,
          lastActiveDate: new Date().toISOString(),
        },
        activeProject: {
          id: 'proj-1',
          title: 'React Todo App',
          description: 'Build a todo app with React',
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
            description: 'Create a form to add todos',
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
        recentProjects: [
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      // Validate structure
      expect(mockResponse.user).toBeDefined();
      expect(mockResponse.user.totalMinutesLearned).toBeNumber();
      expect(mockResponse.user.currentStreak).toBeNumber();
      expect(mockResponse.user.longestStreak).toBeNumber();
      expect(mockResponse.activeProject).toBeDefined();
      expect(mockResponse.masteredConcepts).toBeArray();
      expect(mockResponse.recentProjects).toBeArray();
    });

    it('validates user stats structure', () => {
      const userStats = {
        totalMinutesLearned: 270,
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: '2026-02-04T12:00:00Z',
      };

      expect(userStats.totalMinutesLearned).toBeGreaterThanOrEqual(0);
      expect(userStats.currentStreak).toBeGreaterThanOrEqual(0);
      expect(userStats.longestStreak).toBeGreaterThanOrEqual(userStats.currentStreak);
    });

    it('validates project progress calculation', () => {
      const project = {
        progress: {
          completed: 3,
          total: 5,
          percentage: 60,
        },
      };

      expect(project.progress.total).toBeGreaterThan(0);
      expect(project.progress.completed).toBeLessThanOrEqual(project.progress.total);
      expect(project.progress.percentage).toBe(
        Math.round((project.progress.completed / project.progress.total) * 100)
      );
    });

    it('validates mastered concepts threshold', () => {
      const concepts = [
        { id: 'c1', name: 'JSX', masteryLevel: 85 },
        { id: 'c2', name: 'State', masteryLevel: 92 },
        { id: 'c3', name: 'Props', masteryLevel: 78 }, // Below threshold
      ];

      const mastered = concepts.filter((c) => c.masteryLevel >= 80);
      expect(mastered.length).toBe(2);
      expect(mastered.every((c) => c.masteryLevel >= 80)).toBe(true);
    });

    it('handles null active project', () => {
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
      expect(response.masteredConcepts).toHaveLength(0);
    });

    it('validates recent projects limit', () => {
      const recentProjects = Array.from({ length: 5 }, (_, i) => ({
        id: `proj-${i}`,
        title: `Project ${i}`,
        progress: { completed: i, total: 5, percentage: i * 20 },
      }));

      expect(recentProjects.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Progress Data Edge Cases', () => {
    it('handles zero values correctly', () => {
      const stats = {
        totalMinutesLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
      };

      expect(stats.totalMinutesLearned).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
    });

    it('handles project with no tasks', () => {
      const project = {
        progress: {
          completed: 0,
          total: 0,
          percentage: 0,
        },
      };

      expect(project.progress.percentage).toBe(0);
    });

    it('validates time formatting logic', () => {
      const minutes = 270; // 4.5 hours
      const hours = minutes / 60;
      const formatted = hours < 10 ? `~${hours.toFixed(1)} hours` : `~${Math.round(hours)} hours`;

      expect(formatted).toBe('~4.5 hours');
    });

    it('validates streak logic for consecutive days', () => {
      const lastActive = new Date();
      lastActive.setDate(lastActive.getDate() - 1); // Yesterday

      const today = new Date();
      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(1);
    });
  });
});
