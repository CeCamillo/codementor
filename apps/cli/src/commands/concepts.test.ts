import { describe, it, expect } from 'bun:test';

// Test helper functions directly to avoid side effects

function formatMasteryBar(mastery: number, width: number = 20): string {
  const filled = Math.round((mastery / 100) * width);
  const empty = width - filled;

  // Colors removed for testing
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatMasteryLevel(mastery: number): string {
  if (mastery >= 80) return 'Mastered';
  if (mastery >= 50) return 'Proficient';
  if (mastery >= 25) return 'Familiar';
  return 'Novice';
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

interface UserConceptItem {
  conceptId: string;
  name: string;
  category: string;
  masteryLevel: number;
  practiceCount: number;
  consecutiveFailures: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  status: 'not_started' | 'in_progress' | 'mastered';
  isDueForReview: boolean;
  isStruggling: boolean;
}

function groupByCategory(concepts: UserConceptItem[]): Map<string, UserConceptItem[]> {
  const groups = new Map<string, UserConceptItem[]>();
  for (const concept of concepts) {
    const existing = groups.get(concept.category) ?? [];
    existing.push(concept);
    groups.set(concept.category, existing);
  }
  return groups;
}

describe('Concepts Command', () => {
  describe('formatMasteryBar', () => {
    it('formats empty mastery bar at 0%', () => {
      const bar = formatMasteryBar(0);
      expect(bar).toBe('░'.repeat(20));
    });

    it('formats full mastery bar at 100%', () => {
      const bar = formatMasteryBar(100);
      expect(bar).toBe('█'.repeat(20));
    });

    it('formats half mastery bar at 50%', () => {
      const bar = formatMasteryBar(50);
      expect(bar).toBe('█'.repeat(10) + '░'.repeat(10));
    });

    it('handles custom width', () => {
      const bar = formatMasteryBar(50, 10);
      expect(bar).toBe('█'.repeat(5) + '░'.repeat(5));
    });

    it('rounds correctly for non-even percentages', () => {
      const bar = formatMasteryBar(33, 12);
      expect(bar.length).toBe(12);
      // 33% of 12 = 3.96, rounds to 4
      expect(bar).toBe('█'.repeat(4) + '░'.repeat(8));
    });
  });

  describe('formatMasteryLevel', () => {
    it('returns Mastered for 80+', () => {
      expect(formatMasteryLevel(80)).toBe('Mastered');
      expect(formatMasteryLevel(100)).toBe('Mastered');
    });

    it('returns Proficient for 50-79', () => {
      expect(formatMasteryLevel(50)).toBe('Proficient');
      expect(formatMasteryLevel(79)).toBe('Proficient');
    });

    it('returns Familiar for 25-49', () => {
      expect(formatMasteryLevel(25)).toBe('Familiar');
      expect(formatMasteryLevel(49)).toBe('Familiar');
    });

    it('returns Novice for 0-24', () => {
      expect(formatMasteryLevel(0)).toBe('Novice');
      expect(formatMasteryLevel(24)).toBe('Novice');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns Never for null', () => {
      expect(formatRelativeTime(null)).toBe('Never');
    });

    it('returns Today for today', () => {
      const today = new Date().toISOString();
      expect(formatRelativeTime(today)).toBe('Today');
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

    it('returns weeks ago for older dates', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatRelativeTime(twoWeeksAgo.toISOString())).toBe('2 weeks ago');
    });
  });

  describe('groupByCategory', () => {
    it('groups concepts by category', () => {
      const concepts: UserConceptItem[] = [
        {
          conceptId: 'a',
          name: 'A',
          category: 'HTML',
          masteryLevel: 50,
          practiceCount: 3,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: false,
        },
        {
          conceptId: 'b',
          name: 'B',
          category: 'CSS',
          masteryLevel: 30,
          practiceCount: 2,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: false,
        },
        {
          conceptId: 'c',
          name: 'C',
          category: 'HTML',
          masteryLevel: 80,
          practiceCount: 5,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'mastered',
          isDueForReview: false,
          isStruggling: false,
        },
      ];

      const grouped = groupByCategory(concepts);

      expect(grouped.size).toBe(2);
      expect(grouped.get('HTML')?.length).toBe(2);
      expect(grouped.get('CSS')?.length).toBe(1);
    });

    it('returns empty map for empty array', () => {
      const grouped = groupByCategory([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('Summary calculations', () => {
    it('counts mastered concepts', () => {
      const concepts: UserConceptItem[] = [
        {
          conceptId: 'a',
          name: 'A',
          category: 'X',
          masteryLevel: 85,
          practiceCount: 5,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'mastered',
          isDueForReview: false,
          isStruggling: false,
        },
        {
          conceptId: 'b',
          name: 'B',
          category: 'X',
          masteryLevel: 90,
          practiceCount: 6,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'mastered',
          isDueForReview: false,
          isStruggling: false,
        },
        {
          conceptId: 'c',
          name: 'C',
          category: 'X',
          masteryLevel: 50,
          practiceCount: 3,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: false,
        },
      ];

      const mastered = concepts.filter((c) => c.status === 'mastered').length;
      expect(mastered).toBe(2);
    });

    it('counts due for review concepts', () => {
      const concepts: UserConceptItem[] = [
        {
          conceptId: 'a',
          name: 'A',
          category: 'X',
          masteryLevel: 50,
          practiceCount: 3,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: true,
          isStruggling: false,
        },
        {
          conceptId: 'b',
          name: 'B',
          category: 'X',
          masteryLevel: 60,
          practiceCount: 4,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: true,
          isStruggling: false,
        },
        {
          conceptId: 'c',
          name: 'C',
          category: 'X',
          masteryLevel: 70,
          practiceCount: 5,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: false,
        },
      ];

      const dueForReview = concepts.filter((c) => c.isDueForReview).length;
      expect(dueForReview).toBe(2);
    });

    it('counts struggling concepts', () => {
      const concepts: UserConceptItem[] = [
        {
          conceptId: 'a',
          name: 'A',
          category: 'X',
          masteryLevel: 20,
          practiceCount: 5,
          consecutiveFailures: 3,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: true,
        },
        {
          conceptId: 'b',
          name: 'B',
          category: 'X',
          masteryLevel: 60,
          practiceCount: 4,
          consecutiveFailures: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
          status: 'in_progress',
          isDueForReview: false,
          isStruggling: false,
        },
      ];

      const struggling = concepts.filter((c) => c.isStruggling).length;
      expect(struggling).toBe(1);
    });
  });
});
