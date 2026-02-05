/**
 * Spaced Repetition Algorithm
 *
 * Based on SM-2 algorithm principles, adapted for concept mastery tracking.
 * Calculates optimal review intervals based on performance history.
 */

export interface SpacedRepetitionInput {
  masteryLevel: number; // 0-100
  practiceCount: number;
  demonstrated: boolean; // Did they demonstrate the concept in this review?
  lastPracticedAt?: Date | null | undefined;
  consecutiveFailures?: number | null | undefined;
}

export interface SpacedRepetitionResult {
  newMasteryLevel: number;
  nextReviewAt: Date;
  consecutiveFailures: number;
  isStruggling: boolean; // True if 3+ consecutive failures
}

// Base intervals in days for each mastery tier
const BASE_INTERVALS = {
  novice: 1, // Review tomorrow
  familiar: 3, // Review in 3 days
  proficient: 7, // Review in a week
  mastered: 14, // Review in 2 weeks
} as const;

// Mastery level thresholds
const MASTERY_THRESHOLDS = {
  novice: 0,
  familiar: 25,
  proficient: 50,
  mastered: 75,
} as const;

// Mastery adjustments
const MASTERY_INCREASE = 10; // Points gained when concept demonstrated
const MASTERY_DECREASE = 5; // Points lost when concept not demonstrated
const MIN_MASTERY = 0;
const MAX_MASTERY = 100;

// Struggling threshold
const STRUGGLING_THRESHOLD = 3;

function getMasteryTier(level: number): keyof typeof BASE_INTERVALS {
  if (level >= MASTERY_THRESHOLDS.mastered) return 'mastered';
  if (level >= MASTERY_THRESHOLDS.proficient) return 'proficient';
  if (level >= MASTERY_THRESHOLDS.familiar) return 'familiar';
  return 'novice';
}

function calculateInterval(masteryLevel: number, demonstrated: boolean): number {
  const tier = getMasteryTier(masteryLevel);
  const baseInterval = BASE_INTERVALS[tier];

  let interval: number;

  if (demonstrated) {
    // Successful review - extend interval based on mastery
    const masteryMultiplier = 1 + masteryLevel / 100;
    interval = Math.ceil(baseInterval * masteryMultiplier);
  } else {
    // Failed review - shorten interval significantly
    interval = Math.max(1, Math.floor(baseInterval / 2));
  }

  // Cap at 30 days maximum
  return Math.min(interval, 30);
}

export function calculateSpacedRepetition(input: SpacedRepetitionInput): SpacedRepetitionResult {
  const { masteryLevel, demonstrated, consecutiveFailures } = input;

  const currentFailures = consecutiveFailures ?? 0;

  // Calculate new mastery level
  let newMasteryLevel: number;
  let newConsecutiveFailures: number;

  if (demonstrated) {
    // Concept demonstrated - increase mastery, reset failures
    newMasteryLevel = Math.min(MAX_MASTERY, masteryLevel + MASTERY_INCREASE);
    newConsecutiveFailures = 0;
  } else {
    // Concept not demonstrated - decrease mastery, increment failures
    newMasteryLevel = Math.max(MIN_MASTERY, masteryLevel - MASTERY_DECREASE);
    newConsecutiveFailures = currentFailures + 1;
  }

  // Calculate next review date
  const intervalDays = calculateInterval(newMasteryLevel, demonstrated);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  nextReviewAt.setHours(0, 0, 0, 0); // Start of day

  // Check if user is struggling
  const isStruggling = newConsecutiveFailures >= STRUGGLING_THRESHOLD;

  return {
    newMasteryLevel,
    nextReviewAt,
    consecutiveFailures: newConsecutiveFailures,
    isStruggling,
  };
}

/**
 * Get concepts that are due for review
 */
export function isDueForReview(nextReviewAt: Date | null | undefined): boolean {
  if (!nextReviewAt) return false;
  const now = new Date();
  return nextReviewAt <= now;
}

/**
 * Calculate priority score for concept review
 * Higher score = more urgent to review
 */
export function calculateReviewPriority(
  nextReviewAt: Date | null | undefined,
  masteryLevel: number
): number {
  if (!nextReviewAt) return 0;

  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - nextReviewAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysOverdue < 0) {
    // Not yet due
    return 0;
  }

  // Base priority from overdue days
  let priority = Math.min(daysOverdue + 1, 10);

  // Lower mastery = higher priority
  priority += (100 - masteryLevel) / 20;

  return priority;
}
