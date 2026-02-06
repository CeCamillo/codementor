import { describe, it, expect } from 'bun:test';
import {
  formatMasteryBar,
  formatProgressBar,
  formatMinutes,
  formatRelativeTime,
  formatTimeUntilDue,
  formatMasteryLevel,
  getStatusIcon,
  getStatusLabel,
} from './format';

describe('UI Format Utilities', () => {
  describe('formatMasteryBar', () => {
    it('returns empty bar for 0%', () => {
      const bar = formatMasteryBar(0, 10);
      expect(bar).toContain('\u2591'.repeat(10));
    });

    it('returns full bar for 100%', () => {
      const bar = formatMasteryBar(100, 10);
      expect(bar).toContain('\u2588'.repeat(10));
    });

    it('returns half bar for 50%', () => {
      const bar = formatMasteryBar(50, 10);
      expect(bar).toContain('\u2588'.repeat(5));
      expect(bar).toContain('\u2591'.repeat(5));
    });

    it('defaults to width 10', () => {
      const bar = formatMasteryBar(100);
      expect(bar).toContain('\u2588'.repeat(10));
    });

    it('respects custom width', () => {
      const bar = formatMasteryBar(100, 20);
      expect(bar).toContain('\u2588'.repeat(20));
    });
  });

  describe('formatProgressBar', () => {
    it('returns empty bar for 0 of N', () => {
      const bar = formatProgressBar(0, 5, 10);
      expect(bar).toBe('\u2591'.repeat(10));
    });

    it('returns full bar for N of N', () => {
      const bar = formatProgressBar(5, 5, 10);
      expect(bar).toBe('\u2588'.repeat(10));
    });

    it('returns empty bar for 0 of 0', () => {
      const bar = formatProgressBar(0, 0, 10);
      expect(bar).toBe('\u2591'.repeat(10));
    });

    it('defaults to width 12', () => {
      const bar = formatProgressBar(6, 12);
      expect(bar.length).toBe(12);
    });
  });

  describe('formatMinutes', () => {
    it('formats minutes under 60', () => {
      expect(formatMinutes(30)).toBe('30m');
    });

    it('formats exact hours', () => {
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(120)).toBe('2h');
    });

    it('formats hours and minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30m');
      expect(formatMinutes(150)).toBe('2h 30m');
    });

    it('formats zero minutes', () => {
      expect(formatMinutes(0)).toBe('0m');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns Never for null', () => {
      expect(formatRelativeTime(null)).toBe('Never');
    });

    it('returns Today for today', () => {
      expect(formatRelativeTime(new Date().toISOString())).toBe('Today');
    });

    it('returns Yesterday for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeTime(yesterday.toISOString())).toBe('Yesterday');
    });

    it('returns days ago for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
    });
  });

  describe('formatTimeUntilDue', () => {
    it('returns empty string for null', () => {
      expect(formatTimeUntilDue(null)).toBe('');
    });

    it('returns overdue for past dates', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(formatTimeUntilDue(twoDaysAgo.toISOString())).toContain('2d overdue');
    });

    it('returns Due today for today', () => {
      expect(formatTimeUntilDue(new Date().toISOString())).toContain('Due today');
    });

    it('returns Due tomorrow for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatTimeUntilDue(tomorrow.toISOString())).toContain('Due tomorrow');
    });

    it('returns Due in Nd for future dates', () => {
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
      expect(formatTimeUntilDue(fiveDaysLater.toISOString())).toContain('Due in 5d');
    });
  });

  describe('formatMasteryLevel', () => {
    it('returns Mastered for 80+', () => {
      expect(formatMasteryLevel(80)).toContain('Mastered');
      expect(formatMasteryLevel(100)).toContain('Mastered');
    });

    it('returns Proficient for 50-79', () => {
      expect(formatMasteryLevel(50)).toContain('Proficient');
      expect(formatMasteryLevel(79)).toContain('Proficient');
    });

    it('returns Familiar for 25-49', () => {
      expect(formatMasteryLevel(25)).toContain('Familiar');
      expect(formatMasteryLevel(49)).toContain('Familiar');
    });

    it('returns Novice for under 25', () => {
      expect(formatMasteryLevel(0)).toContain('Novice');
      expect(formatMasteryLevel(24)).toContain('Novice');
    });
  });

  describe('getStatusIcon', () => {
    it('returns green checkmark for completed', () => {
      expect(getStatusIcon('completed')).toContain('\u2713');
    });

    it('returns circle for in_progress', () => {
      expect(getStatusIcon('in_progress')).toContain('\u25cb');
    });

    it('returns circle for not_started', () => {
      expect(getStatusIcon('not_started')).toContain('\u25cb');
    });

    it('returns x for abandoned', () => {
      expect(getStatusIcon('abandoned')).toContain('\u2717');
    });

    it('returns dash for unknown status', () => {
      expect(getStatusIcon('unknown')).toContain('-');
    });
  });

  describe('getStatusLabel', () => {
    it('returns formatted label for completed', () => {
      expect(getStatusLabel('completed')).toContain('completed');
    });

    it('returns formatted label for in_progress', () => {
      expect(getStatusLabel('in_progress')).toContain('in progress');
    });

    it('returns formatted label for not_started', () => {
      expect(getStatusLabel('not_started')).toContain('not started');
    });

    it('returns formatted label for abandoned', () => {
      expect(getStatusLabel('abandoned')).toContain('abandoned');
    });

    it('returns raw status for unknown', () => {
      expect(getStatusLabel('foo')).toBe('foo');
    });
  });
});
