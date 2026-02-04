import { describe, it, expect } from 'bun:test';
import { getApiUrl, ApiClient } from './api';

describe('API Utilities', () => {
  describe('getApiUrl', () => {
    it('returns default URL when env var is not set', () => {
      const originalEnv = process.env['CODEMENTOR_API_URL'];
      delete process.env['CODEMENTOR_API_URL'];

      const url = getApiUrl();
      expect(url).toBe('http://localhost:3000');

      if (originalEnv) {
        process.env['CODEMENTOR_API_URL'] = originalEnv;
      }
    });

    it('returns custom URL from env var', () => {
      const originalEnv = process.env['CODEMENTOR_API_URL'];
      process.env['CODEMENTOR_API_URL'] = 'https://api.example.com';

      const url = getApiUrl();
      expect(url).toBe('https://api.example.com');

      if (originalEnv) {
        process.env['CODEMENTOR_API_URL'] = originalEnv;
      } else {
        delete process.env['CODEMENTOR_API_URL'];
      }
    });
  });

  describe('ApiClient', () => {
    it('creates client with default base URL', () => {
      const client = new ApiClient();
      expect(client).toBeDefined();
    });

    it('creates client with custom base URL', () => {
      const client = new ApiClient('https://custom.api.com');
      expect(client).toBeDefined();
    });

    it('throws error for authenticated request without token', async () => {
      const client = new ApiClient('https://api.example.com');

      try {
        await client.get('/test', { requireAuth: true });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Not authenticated');
      }
    });

    it('allows unauthenticated requests when requireAuth is false', async () => {
      const client = new ApiClient('https://httpbin.org');

      // This will fail because httpbin doesn't have /test, but it proves
      // the request was attempted (no auth error thrown)
      try {
        await client.get('/get', { requireAuth: false });
      } catch (error) {
        // Network error or 404 is fine - we just want to ensure no auth error
        expect((error as Error).message).not.toContain('Not authenticated');
      }
    });
  });
});
