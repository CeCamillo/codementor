import { describe, expect, it } from 'vitest';
import {
  calculateSpacedRepetition,
  isDueForReview,
  calculateReviewPriority,
  type SpacedRepetitionInput,
} from './spaced-repetition';

describe('calculateSpacedRepetition', () => {
  describe('mastery level updates', () => {
    it('increases mastery when concept is demonstrated', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 50,
        practiceCount: 5,
        demonstrated: true,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.newMasteryLevel).toBe(60);
    });

    it('decreases mastery when concept is not demonstrated', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 50,
        practiceCount: 5,
        demonstrated: false,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.newMasteryLevel).toBe(45);
    });

    it('caps mastery at 100', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 95,
        practiceCount: 10,
        demonstrated: true,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.newMasteryLevel).toBe(100);
    });

    it('floors mastery at 0', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 3,
        practiceCount: 1,
        demonstrated: false,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.newMasteryLevel).toBe(0);
    });
  });

  describe('consecutive failures tracking', () => {
    it('resets consecutive failures on success', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 30,
        practiceCount: 5,
        demonstrated: true,
        consecutiveFailures: 2,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.consecutiveFailures).toBe(0);
    });

    it('increments consecutive failures on failure', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 30,
        practiceCount: 5,
        demonstrated: false,
        consecutiveFailures: 1,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.consecutiveFailures).toBe(2);
    });

    it('marks as struggling after 3 consecutive failures', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 30,
        practiceCount: 5,
        demonstrated: false,
        consecutiveFailures: 2,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.consecutiveFailures).toBe(3);
      expect(result.isStruggling).toBe(true);
    });

    it('does not mark as struggling with fewer than 3 failures', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 30,
        practiceCount: 5,
        demonstrated: false,
        consecutiveFailures: 1,
      };

      const result = calculateSpacedRepetition(input);

      expect(result.isStruggling).toBe(false);
    });
  });

  describe('next review calculation', () => {
    it('sets next review date in the future', () => {
      const input: SpacedRepetitionInput = {
        masteryLevel: 50,
        practiceCount: 5,
        demonstrated: true,
      };

      const result = calculateSpacedRepetition(input);
      const now = new Date();

      expect(result.nextReviewAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('schedules sooner review for failed concepts', () => {
      const successInput: SpacedRepetitionInput = {
        masteryLevel: 50,
        practiceCount: 5,
        demonstrated: true,
      };
      const failInput: SpacedRepetitionInput = {
        masteryLevel: 50,
        practiceCount: 5,
        demonstrated: false,
      };

      const successResult = calculateSpacedRepetition(successInput);
      const failResult = calculateSpacedRepetition(failInput);

      expect(failResult.nextReviewAt.getTime()).toBeLessThan(successResult.nextReviewAt.getTime());
    });

    it('schedules longer intervals for higher mastery', () => {
      const lowMastery: SpacedRepetitionInput = {
        masteryLevel: 20,
        practiceCount: 5,
        demonstrated: true,
      };
      const highMastery: SpacedRepetitionInput = {
        masteryLevel: 80,
        practiceCount: 10,
        demonstrated: true,
      };

      const lowResult = calculateSpacedRepetition(lowMastery);
      const highResult = calculateSpacedRepetition(highMastery);

      expect(highResult.nextReviewAt.getTime()).toBeGreaterThan(lowResult.nextReviewAt.getTime());
    });
  });
});

describe('isDueForReview', () => {
  it('returns false for null/undefined', () => {
    expect(isDueForReview(null)).toBe(false);
    expect(isDueForReview(undefined)).toBe(false);
  });

  it('returns true for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    expect(isDueForReview(pastDate)).toBe(true);
  });

  it('returns false for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    expect(isDueForReview(futureDate)).toBe(false);
  });
});

describe('calculateReviewPriority', () => {
  it('returns 0 for null/undefined', () => {
    expect(calculateReviewPriority(null, 50)).toBe(0);
    expect(calculateReviewPriority(undefined, 50)).toBe(0);
  });

  it('returns 0 for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    expect(calculateReviewPriority(futureDate, 50)).toBe(0);
  });

  it('returns higher priority for more overdue concepts', () => {
    const slightlyOverdue = new Date();
    slightlyOverdue.setDate(slightlyOverdue.getDate() - 1);

    const veryOverdue = new Date();
    veryOverdue.setDate(veryOverdue.getDate() - 7);

    const slightPriority = calculateReviewPriority(slightlyOverdue, 50);
    const highPriority = calculateReviewPriority(veryOverdue, 50);

    expect(highPriority).toBeGreaterThan(slightPriority);
  });

  it('returns higher priority for lower mastery levels', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 1);

    const lowMasteryPriority = calculateReviewPriority(dueDate, 20);
    const highMasteryPriority = calculateReviewPriority(dueDate, 80);

    expect(lowMasteryPriority).toBeGreaterThan(highMasteryPriority);
  });
});
