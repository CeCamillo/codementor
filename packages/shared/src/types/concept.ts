export interface Concept {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: 1 | 2 | 3;
  category: string;
  prerequisites: string[];
  exampleTasks: string[];
  commonMisconceptions: string[];
  resources: ConceptResource[];
}

export interface ConceptResource {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'video' | 'article';
}

export interface UserConcept {
  userId: string;
  conceptId: string;
  masteryLevel: number; // 0-100
  practiceCount: number;
  consecutiveFailures: number; // For struggling detection
  lastPracticedAt?: Date;
  nextReviewAt?: Date; // Spaced repetition
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConceptWithDetails extends UserConcept {
  concept?: Concept;
  isDueForReview: boolean;
  isStruggling: boolean;
}

export type MasteryLevel = 'novice' | 'familiar' | 'proficient' | 'mastered';

export function getMasteryLabel(level: number): MasteryLevel {
  if (level < 25) return 'novice';
  if (level < 50) return 'familiar';
  if (level < 75) return 'proficient';
  return 'mastered';
}
