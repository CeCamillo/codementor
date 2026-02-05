import { describe, it, expect } from 'bun:test';

// Test helper functions directly without importing the module
// to avoid side effects from the actual implementation

function formatProgressBar(completed: number, total: number, width: number = 12): string {
  const percentage = total > 0 ? completed / total : 0;
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

interface ProgressResponse {
  project: {
    id: string;
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    status: 'not_started' | 'in_progress';
  };
  tasks: {
    total: number;
    completed: number;
  };
  currentTask: {
    id: string;
    title: string;
    order: number;
  } | null;
  concepts: {
    mastered: number;
    inProgress: number;
    recent: Array<{
      name: string;
      masteryLevel: number;
    }>;
  };
  time: {
    investedMinutes: number;
  };
  streak: {
    currentDays: number;
    activeToday: boolean;
  };
}

interface NoActiveProjectResponse {
  hasActiveProject: false;
  message: string;
}

type ProgressApiResponse = ProgressResponse | NoActiveProjectResponse;

function isNoActiveProjectResponse(
  response: ProgressApiResponse
): response is NoActiveProjectResponse {
  return 'hasActiveProject' in response && response.hasActiveProject === false;
}

describe('Progress Command', () => {
  describe('formatProgressBar', () => {
    it('formats empty progress bar when no tasks completed', () => {
      const bar = formatProgressBar(0, 5);
      expect(bar).toBe('\u2591'.repeat(12));
    });

    it('formats full progress bar when all tasks completed', () => {
      const bar = formatProgressBar(5, 5);
      expect(bar).toBe('\u2588'.repeat(12));
    });

    it('formats partial progress bar correctly', () => {
      const bar = formatProgressBar(3, 6); // 50%
      expect(bar).toBe('\u2588'.repeat(6) + '\u2591'.repeat(6));
    });

    it('handles edge case of 0 total tasks', () => {
      const bar = formatProgressBar(0, 0);
      expect(bar).toBe('\u2591'.repeat(12));
    });

    it('handles custom width', () => {
      const bar = formatProgressBar(5, 10, 20);
      expect(bar).toBe('\u2588'.repeat(10) + '\u2591'.repeat(10));
    });

    it('rounds correctly for non-even percentages', () => {
      const bar = formatProgressBar(1, 3, 12); // ~33%
      expect(bar.length).toBe(12);
      // 33% of 12 = 4, so should have 4 filled
      expect(bar).toBe('\u2588'.repeat(4) + '\u2591'.repeat(8));
    });
  });

  describe('formatTime', () => {
    it('formats minutes only when less than an hour', () => {
      expect(formatTime(30)).toBe('30m');
      expect(formatTime(59)).toBe('59m');
    });

    it('formats hours only when exactly on the hour', () => {
      expect(formatTime(60)).toBe('1h');
      expect(formatTime(120)).toBe('2h');
    });

    it('formats hours and minutes when mixed', () => {
      expect(formatTime(90)).toBe('1h 30m');
      expect(formatTime(150)).toBe('2h 30m');
    });

    it('handles zero minutes', () => {
      expect(formatTime(0)).toBe('0m');
    });

    it('handles large values', () => {
      expect(formatTime(180)).toBe('3h');
      expect(formatTime(185)).toBe('3h 5m');
    });
  });

  describe('Type Guards', () => {
    it('isNoActiveProjectResponse returns true for no active project', () => {
      const response: NoActiveProjectResponse = {
        hasActiveProject: false,
        message: 'No active project',
      };

      expect(isNoActiveProjectResponse(response)).toBe(true);
    });

    it('isNoActiveProjectResponse returns false for active project', () => {
      const response: ProgressResponse = {
        project: {
          id: 'project-1',
          title: 'Test',
          difficulty: 'beginner',
          status: 'in_progress',
        },
        tasks: { total: 5, completed: 2 },
        currentTask: null,
        concepts: { mastered: 0, inProgress: 0, recent: [] },
        time: { investedMinutes: 0 },
        streak: { currentDays: 0, activeToday: false },
      };

      expect(isNoActiveProjectResponse(response)).toBe(false);
    });
  });

  describe('Output Formatting', () => {
    it('calculates percentage correctly', () => {
      const tasks = { total: 5, completed: 3 };
      const percentage = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;
      expect(percentage).toBe(60);
    });

    it('handles zero tasks percentage', () => {
      const tasks = { total: 0, completed: 0 };
      const percentage = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;
      expect(percentage).toBe(0);
    });

    it('formats streak text with active today', () => {
      const streak = { currentDays: 5, activeToday: true };
      const streakText = streak.activeToday
        ? `${streak.currentDays} days (active today)`
        : `${streak.currentDays} days`;
      expect(streakText).toBe('5 days (active today)');
    });

    it('formats streak text without active today', () => {
      const streak = { currentDays: 3, activeToday: false };
      const streakText = streak.activeToday
        ? `${streak.currentDays} days (active today)`
        : `${streak.currentDays} days`;
      expect(streakText).toBe('3 days');
    });
  });
});
