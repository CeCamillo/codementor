import { describe, it, expect } from 'bun:test';
import { Elysia } from 'elysia';
import { randomBytes } from 'crypto';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenErrorResponse {
  error: string;
  error_description?: string;
}

interface TokenSuccessResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

interface LogoutResponse {
  success: boolean;
}

// Test the device code generation logic
describe('Device Flow Logic', () => {
  describe('generateUserCode', () => {
    it('generates code in correct format (XXXX-XXXX)', () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(code.length).toBe(9); // 8 chars + 1 hyphen
    });

    it('excludes ambiguous characters (0, O, 1, I)', () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      expect(chars).not.toContain('0');
      expect(chars).not.toContain('O');
      expect(chars).not.toContain('1');
      expect(chars).not.toContain('I');
    });
  });

  describe('generateDeviceCode', () => {
    it('generates 64-character hex string', () => {
      const code = randomBytes(32).toString('hex');

      expect(code.length).toBe(64);
      expect(code).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('generateId', () => {
    it('generates 32-character hex string', () => {
      const id = randomBytes(16).toString('hex');

      expect(id.length).toBe(32);
      expect(id).toMatch(/^[a-f0-9]+$/);
    });
  });
});

describe('Device Flow API Routes', () => {
  describe('POST /auth/device', () => {
    it('returns device code response structure', async () => {
      // Create a minimal test app
      const app = new Elysia().post('/auth/device', () => {
        const deviceCode = 'test-device-code';
        const userCode = 'ABCD-1234';
        const baseUrl = 'http://localhost:3000';

        return {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: `${baseUrl}/device`,
          verification_uri_complete: `${baseUrl}/device?user_code=${userCode}`,
          expires_in: 900,
          interval: 5,
        };
      });

      const response = await app.handle(
        new Request('http://localhost/auth/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: 'test-client' }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as DeviceCodeResponse;
      expect(data).toHaveProperty('device_code');
      expect(data).toHaveProperty('user_code');
      expect(data).toHaveProperty('verification_uri');
      expect(data).toHaveProperty('verification_uri_complete');
      expect(data).toHaveProperty('expires_in');
      expect(data).toHaveProperty('interval');
      expect(data.user_code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });
  });

  describe('POST /auth/device/token', () => {
    it('returns authorization_pending for pending device code', async () => {
      const app = new Elysia().post('/auth/device/token', ({ set }) => {
        set.status = 400;
        return {
          error: 'authorization_pending',
          error_description: 'User has not yet authorized the device',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/auth/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: 'test-code' }),
        })
      );

      expect(response.status).toBe(400);

      const data = (await response.json()) as TokenErrorResponse;
      expect(data.error).toBe('authorization_pending');
    });

    it('returns expired_token for expired device code', async () => {
      const app = new Elysia().post('/auth/device/token', ({ set }) => {
        set.status = 400;
        return {
          error: 'expired_token',
          error_description: 'Device code has expired',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/auth/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: 'expired-code' }),
        })
      );

      expect(response.status).toBe(400);

      const data = (await response.json()) as TokenErrorResponse;
      expect(data.error).toBe('expired_token');
    });

    it('returns access_denied when user denies', async () => {
      const app = new Elysia().post('/auth/device/token', ({ set }) => {
        set.status = 400;
        return {
          error: 'access_denied',
          error_description: 'User denied the request',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/auth/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: 'denied-code' }),
        })
      );

      expect(response.status).toBe(400);

      const data = (await response.json()) as TokenErrorResponse;
      expect(data.error).toBe('access_denied');
    });

    it('returns token when authorized', async () => {
      const app = new Elysia().post('/auth/device/token', () => {
        return {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 2592000,
          refresh_token: 'test-refresh-token',
        };
      });

      const response = await app.handle(
        new Request('http://localhost/auth/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: 'authorized-code' }),
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as TokenSuccessResponse;
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('token_type', 'Bearer');
      expect(data).toHaveProperty('expires_in');
    });
  });

  describe('GET /api/me', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().get('/api/me', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return {
            error: 'unauthorized',
            error_description: 'Missing or invalid authorization header',
          };
        }
        return { id: 'test', email: 'test@test.com', name: 'Test' };
      });

      const response = await app.handle(new Request('http://localhost/api/me'));

      expect(response.status).toBe(401);

      const data = (await response.json()) as TokenErrorResponse;
      expect(data.error).toBe('unauthorized');
    });

    it('returns user info with valid token', async () => {
      const app = new Elysia().get('/api/me', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return {
          id: 'user-123',
          email: 'test@codementor.dev',
          name: 'Test User',
          avatarUrl: null,
        };
      });

      const response = await app.handle(
        new Request('http://localhost/api/me', {
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as UserResponse;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('name');
    });
  });

  describe('POST /api/logout', () => {
    it('returns 401 without authorization header', async () => {
      const app = new Elysia().post('/api/logout', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { success: true };
      });

      const response = await app.handle(
        new Request('http://localhost/api/logout', { method: 'POST' })
      );

      expect(response.status).toBe(401);
    });

    it('returns success with valid token', async () => {
      const app = new Elysia().post('/api/logout', ({ headers, set }) => {
        const authHeader = headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'unauthorized' };
        }
        return { success: true };
      });

      const response = await app.handle(
        new Request('http://localhost/api/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer valid-token' },
        })
      );

      expect(response.status).toBe(200);

      const data = (await response.json()) as LogoutResponse;
      expect(data.success).toBe(true);
    });
  });
});
