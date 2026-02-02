import { describe, expect, it } from 'bun:test';
import { ok, err, isOk, isErr, unwrap, unwrapOr, tryCatch } from './result';

describe('Result utilities', () => {
  describe('ok', () => {
    it('creates an ok result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe('err', () => {
    it('creates an error result', () => {
      const result = err('something went wrong');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('something went wrong');
      }
    });
  });

  describe('isOk', () => {
    it('returns true for ok results', () => {
      expect(isOk(ok(1))).toBe(true);
    });

    it('returns false for error results', () => {
      expect(isOk(err('error'))).toBe(false);
    });
  });

  describe('isErr', () => {
    it('returns true for error results', () => {
      expect(isErr(err('error'))).toBe(true);
    });

    it('returns false for ok results', () => {
      expect(isErr(ok(1))).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('returns value for ok results', () => {
      expect(unwrap(ok(42))).toBe(42);
    });

    it('throws for error results', () => {
      expect(() => unwrap(err(new Error('test')))).toThrow('test');
    });
  });

  describe('unwrapOr', () => {
    it('returns value for ok results', () => {
      expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('returns default for error results', () => {
      expect(unwrapOr(err('error'), 0)).toBe(0);
    });
  });

  describe('tryCatch', () => {
    it('returns ok for successful async functions', async () => {
      const result = await tryCatch(async () => 42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('returns err for failed async functions', async () => {
      const result = await tryCatch(async () => {
        throw new Error('async error');
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('async error');
      }
    });
  });
});
