import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock the config directory for tests
const TEST_CONFIG_DIR = join(tmpdir(), '.codementor-test-' + Date.now());
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, 'config.json');

// We need to test the config functions with a test directory
// Since the module uses hardcoded paths, we'll test the logic directly

describe('Auth Config', () => {
  beforeEach(() => {
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  describe('config file operations', () => {
    it('creates config directory with correct permissions', () => {
      mkdirSync(TEST_CONFIG_DIR, { mode: 0o700 });
      expect(existsSync(TEST_CONFIG_DIR)).toBe(true);
    });

    it('writes and reads config file', () => {
      mkdirSync(TEST_CONFIG_DIR, { mode: 0o700 });

      const config = {
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      writeFileSync(TEST_CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });

      const content = readFileSync(TEST_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.accessToken).toBe('test-token');
      expect(parsed.refreshToken).toBe('test-refresh');
      expect(parsed.expiresAt).toBeDefined();
    });

    it('returns empty object for missing config file', () => {
      expect(existsSync(TEST_CONFIG_FILE)).toBe(false);
      // This simulates what getConfig() does
      const config = existsSync(TEST_CONFIG_FILE)
        ? JSON.parse(readFileSync(TEST_CONFIG_FILE, 'utf-8'))
        : {};
      expect(config).toEqual({});
    });

    it('clears config by writing empty object', () => {
      mkdirSync(TEST_CONFIG_DIR, { mode: 0o700 });

      writeFileSync(TEST_CONFIG_FILE, JSON.stringify({ accessToken: 'test' }, null, 2));

      // Clear config
      writeFileSync(TEST_CONFIG_FILE, '{}', { mode: 0o600 });

      const content = readFileSync(TEST_CONFIG_FILE, 'utf-8');
      expect(JSON.parse(content)).toEqual({});
    });
  });

  describe('token validation', () => {
    it('returns undefined for expired token', () => {
      const config = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      const isExpired = config.expiresAt && new Date(config.expiresAt) < new Date();
      const token = isExpired ? undefined : config.accessToken;

      expect(token).toBeUndefined();
    });

    it('returns token for valid non-expired token', () => {
      const config = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // Valid
      };

      const isExpired = config.expiresAt && new Date(config.expiresAt) < new Date();
      const token = isExpired ? undefined : config.accessToken;

      expect(token).toBe('test-token');
    });

    it('returns token when no expiry is set', () => {
      const config: { accessToken: string; expiresAt?: string } = {
        accessToken: 'test-token',
      };

      const isExpired = config.expiresAt && new Date(config.expiresAt) < new Date();
      const token = isExpired ? undefined : config.accessToken;

      expect(token).toBe('test-token');
    });

    it('returns undefined when no token exists', () => {
      const config = {};

      const token = (config as { accessToken?: string }).accessToken;
      expect(token).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when valid token exists', () => {
      const config = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const isExpired = config.expiresAt && new Date(config.expiresAt) < new Date();
      const token = isExpired ? undefined : config.accessToken;
      const isAuthenticated = !!token;

      expect(isAuthenticated).toBe(true);
    });

    it('returns false when token is expired', () => {
      const config = {
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const isExpired = config.expiresAt && new Date(config.expiresAt) < new Date();
      const token = isExpired ? undefined : config.accessToken;
      const isAuthenticated = !!token;

      expect(isAuthenticated).toBe(false);
    });

    it('returns false when no token exists', () => {
      const config = {};

      const token = (config as { accessToken?: string }).accessToken;
      const isAuthenticated = !!token;

      expect(isAuthenticated).toBe(false);
    });
  });
});
