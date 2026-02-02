import type { Concept } from '@codementor/shared';
import webFundamentals from './web-fundamentals.json';

export function getWebFundamentalsConcepts(): Concept[] {
  return webFundamentals.concepts as Concept[];
}

export function getConceptById(id: string): Concept | undefined {
  return getWebFundamentalsConcepts().find((c) => c.id === id);
}

export function getConceptsByTier(tier: 1 | 2 | 3): Concept[] {
  return getWebFundamentalsConcepts().filter((c) => c.tier === tier);
}

export function getConceptPrerequisites(conceptId: string): Concept[] {
  const concept = getConceptById(conceptId);
  if (!concept) return [];

  return concept.prerequisites
    .map((prereqId) => getConceptById(prereqId))
    .filter((c): c is Concept => c !== undefined);
}

export function getAvailableConcepts(masteredConceptIds: string[]): Concept[] {
  const mastered = new Set(masteredConceptIds);
  return getWebFundamentalsConcepts().filter((concept) =>
    concept.prerequisites.every((prereqId) => mastered.has(prereqId))
  );
}
