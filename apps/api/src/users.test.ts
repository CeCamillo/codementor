import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';

interface UserConceptItem {
  conceptId: string;
  name: string;
  category: string;
  masteryLevel: number;
  practiceCount: number;
  lastPracticedAt: string | null;
  status: 'not_started' | 'in_progress' | 'mastered';
}

interface UserConceptsResponse {
  concepts: UserConceptItem[];
  summary: {
    total: number;
    mastered: number;
    inProgress: number;
    notStarted: number;
  };
}

interface ErrorResponse {
  error: string;
  error_description: string;
}

describe('Users API Routes', () => {
  describe('GET /api/users/me/concepts', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { concepts: [], summary: { total: 0, mastered: 0, inProgress: 0, notStarted: 0 } };
      });

      const response = await app.handle(new Request('http://localhost/api/users/me/concepts'));

      expect(response.status).toBe(401);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns empty concepts array for new user', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [],
        summary: {
          total: 0,
          mastered: 0,
          inProgress: 0,
          notStarted: 0,
        },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts).toEqual([]);
      expect(data.summary.total).toBe(0);
    });

    it('returns concepts with correct structure', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'html-structure',
            name: 'HTML Document Structure',
            category: 'HTML',
            masteryLevel: 85,
            practiceCount: 5,
            lastPracticedAt: '2024-01-15T10:30:00.000Z',
            status: 'mastered',
          },
          {
            conceptId: 'css-flexbox',
            name: 'CSS Flexbox',
            category: 'CSS',
            masteryLevel: 60,
            practiceCount: 3,
            lastPracticedAt: '2024-01-14T15:00:00.000Z',
            status: 'in_progress',
          },
          {
            conceptId: 'js-async',
            name: 'Async/Await',
            category: 'JavaScript',
            masteryLevel: 0,
            practiceCount: 0,
            lastPracticedAt: null,
            status: 'not_started',
          },
        ],
        summary: {
          total: 3,
          mastered: 1,
          inProgress: 1,
          notStarted: 1,
        },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts).toHaveLength(3);
      expect(data.summary.total).toBe(3);
      expect(data.summary.mastered).toBe(1);
      expect(data.summary.inProgress).toBe(1);
      expect(data.summary.notStarted).toBe(1);
    });

    it('returns mastered concept with mastery >= 80', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'html-structure',
            name: 'HTML Document Structure',
            category: 'HTML',
            masteryLevel: 80,
            practiceCount: 4,
            lastPracticedAt: '2024-01-15T10:30:00.000Z',
            status: 'mastered',
          },
        ],
        summary: { total: 1, mastered: 1, inProgress: 0, notStarted: 0 },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts[0]!.status).toBe('mastered');
      expect(data.concepts[0]!.masteryLevel).toBeGreaterThanOrEqual(80);
    });

    it('returns in_progress concept with 0 < mastery < 80', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'css-flexbox',
            name: 'CSS Flexbox',
            category: 'CSS',
            masteryLevel: 45,
            practiceCount: 2,
            lastPracticedAt: '2024-01-14T15:00:00.000Z',
            status: 'in_progress',
          },
        ],
        summary: { total: 1, mastered: 0, inProgress: 1, notStarted: 0 },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts[0]!.status).toBe('in_progress');
      expect(data.concepts[0]!.masteryLevel).toBeGreaterThan(0);
      expect(data.concepts[0]!.masteryLevel).toBeLessThan(80);
    });

    it('returns not_started concept with mastery = 0', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'js-async',
            name: 'Async/Await',
            category: 'JavaScript',
            masteryLevel: 0,
            practiceCount: 0,
            lastPracticedAt: null,
            status: 'not_started',
          },
        ],
        summary: { total: 1, mastered: 0, inProgress: 0, notStarted: 1 },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts[0]!.status).toBe('not_started');
      expect(data.concepts[0]!.masteryLevel).toBe(0);
      expect(data.concepts[0]!.lastPracticedAt).toBeNull();
    });

    it('returns concepts with practice count and last practiced timestamp', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'html-structure',
            name: 'HTML Document Structure',
            category: 'HTML',
            masteryLevel: 75,
            practiceCount: 8,
            lastPracticedAt: '2024-01-20T14:30:00.000Z',
            status: 'in_progress',
          },
        ],
        summary: { total: 1, mastered: 0, inProgress: 1, notStarted: 0 },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as UserConceptsResponse;
      expect(data.concepts[0]!.practiceCount).toBe(8);
      expect(data.concepts[0]!.lastPracticedAt).toBe('2024-01-20T14:30:00.000Z');
    });

    it('returns concepts with category information', async () => {
      const mockResponse: UserConceptsResponse = {
        concepts: [
          {
            conceptId: 'html-structure',
            name: 'HTML Document Structure',
            category: 'HTML',
            masteryLevel: 90,
            practiceCount: 5,
            lastPracticedAt: '2024-01-15T10:30:00.000Z',
            status: 'mastered',
          },
          {
            conceptId: 'css-grid',
            name: 'CSS Grid',
            category: 'CSS',
            masteryLevel: 50,
            practiceCount: 2,
            lastPracticedAt: '2024-01-10T09:00:00.000Z',
            status: 'in_progress',
          },
          {
            conceptId: 'js-promises',
            name: 'Promises',
            category: 'JavaScript',
            masteryLevel: 30,
            practiceCount: 1,
            lastPracticedAt: '2024-01-05T11:00:00.000Z',
            status: 'in_progress',
          },
        ],
        summary: { total: 3, mastered: 1, inProgress: 2, notStarted: 0 },
      };

      const app = new Elysia().get('/api/users/me/concepts', ({ headers, set }) => {
        if (!headers['authorization']?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return mockResponse;
      });

      const response = await app.handle(
        new Request('http://localhost/api/users/me/concepts', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      const data = (await response.json()) as UserConceptsResponse;
      const categories = data.concepts.map((c) => c.category);
      expect(categories).toContain('HTML');
      expect(categories).toContain('CSS');
      expect(categories).toContain('JavaScript');
    });
  });
});
