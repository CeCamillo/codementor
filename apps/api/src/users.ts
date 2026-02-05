import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { userConcepts } from '@codementor/db/schema';
import { eq, desc, and, lte } from 'drizzle-orm';
import { getConceptById, isDueForReview, calculateReviewPriority } from '@codementor/ai';
import type {
  UserConceptsResponse,
  UserConceptItem,
  ConceptsDueResponse,
} from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

const STRUGGLING_THRESHOLD = 3;

function mapRecordToConceptItem(
  record: typeof userConcepts.$inferSelect,
  concept: ReturnType<typeof getConceptById>
): UserConceptItem {
  let status: 'not_started' | 'in_progress' | 'mastered';
  if (record.masteryLevel >= 80) {
    status = 'mastered';
  } else if (record.masteryLevel > 0) {
    status = 'in_progress';
  } else {
    status = 'not_started';
  }

  const dueForReview = isDueForReview(record.nextReviewAt);
  const isStruggling = record.consecutiveFailures >= STRUGGLING_THRESHOLD;

  return {
    conceptId: record.conceptId,
    name: concept?.name ?? record.conceptId,
    category: concept?.category ?? 'unknown',
    masteryLevel: record.masteryLevel,
    practiceCount: record.practiceCount,
    consecutiveFailures: record.consecutiveFailures,
    lastPracticedAt: record.lastPracticedAt?.toISOString() ?? null,
    nextReviewAt: record.nextReviewAt?.toISOString() ?? null,
    status,
    isDueForReview: dueForReview,
    isStruggling,
  };
}

export const userConceptRoutes = new Elysia({ prefix: '/api/users' })
  // GET /api/users/me/concepts - List all user concepts with mastery
  .get('/me/concepts', async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const userConceptRecords = await db
      .select()
      .from(userConcepts)
      .where(eq(userConcepts.userId, user.id))
      .orderBy(desc(userConcepts.updatedAt));

    const concepts: UserConceptItem[] = userConceptRecords.map((record) => {
      const concept = getConceptById(record.conceptId);
      return mapRecordToConceptItem(record, concept);
    });

    const mastered = concepts.filter((c) => c.status === 'mastered').length;
    const inProgress = concepts.filter((c) => c.status === 'in_progress').length;
    const notStarted = concepts.filter((c) => c.status === 'not_started').length;
    const dueForReview = concepts.filter((c) => c.isDueForReview).length;
    const struggling = concepts.filter((c) => c.isStruggling).length;

    const response: UserConceptsResponse = {
      concepts,
      summary: {
        total: concepts.length,
        mastered,
        inProgress,
        notStarted,
        dueForReview,
        struggling,
      },
    };

    return response;
  })

  // GET /api/users/me/concepts/due - Get concepts due for review
  .get('/me/concepts/due', async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;
    const now = new Date();

    // Get concepts where nextReviewAt is in the past
    const dueRecords = await db
      .select()
      .from(userConcepts)
      .where(and(eq(userConcepts.userId, user.id), lte(userConcepts.nextReviewAt, now)));

    // Map and sort by priority
    const concepts: UserConceptItem[] = dueRecords
      .map((record) => {
        const concept = getConceptById(record.conceptId);
        return mapRecordToConceptItem(record, concept);
      })
      .sort((a, b) => {
        // Sort by priority (higher priority first)
        const priorityA = calculateReviewPriority(
          a.nextReviewAt ? new Date(a.nextReviewAt) : null,
          a.masteryLevel
        );
        const priorityB = calculateReviewPriority(
          b.nextReviewAt ? new Date(b.nextReviewAt) : null,
          b.masteryLevel
        );
        return priorityB - priorityA;
      });

    const response: ConceptsDueResponse = {
      concepts,
      total: concepts.length,
    };

    return response;
  })

  // GET /api/users/me/concepts/:conceptId - Get specific concept details
  .get(
    '/me/concepts/:conceptId',
    async ({ headers, set, params }) => {
      const validation = await validateSession(headers['authorization']);
      if (isValidationError(validation)) {
        set.status = 401;
        return { error: validation.error, error_description: validation.message };
      }

      const { user } = validation;
      const { conceptId } = params;

      // Get concept definition
      const conceptDef = getConceptById(conceptId);
      if (!conceptDef) {
        set.status = 404;
        return { error: 'not_found', error_description: 'Concept not found' };
      }

      // Get user's progress for this concept
      const [record] = await db
        .select()
        .from(userConcepts)
        .where(and(eq(userConcepts.userId, user.id), eq(userConcepts.conceptId, conceptId)));

      if (!record) {
        // User hasn't practiced this concept yet
        return {
          concept: {
            id: conceptDef.id,
            name: conceptDef.name,
            description: conceptDef.description,
            category: conceptDef.category,
            tier: conceptDef.tier,
            prerequisites: conceptDef.prerequisites,
            resources: conceptDef.resources,
          },
          progress: null,
        };
      }

      const dueForReview = isDueForReview(record.nextReviewAt);
      const isStruggling = record.consecutiveFailures >= STRUGGLING_THRESHOLD;

      return {
        concept: {
          id: conceptDef.id,
          name: conceptDef.name,
          description: conceptDef.description,
          category: conceptDef.category,
          tier: conceptDef.tier,
          prerequisites: conceptDef.prerequisites,
          resources: conceptDef.resources,
        },
        progress: {
          masteryLevel: record.masteryLevel,
          practiceCount: record.practiceCount,
          consecutiveFailures: record.consecutiveFailures,
          lastPracticedAt: record.lastPracticedAt?.toISOString() ?? null,
          nextReviewAt: record.nextReviewAt?.toISOString() ?? null,
          isDueForReview: dueForReview,
          isStruggling,
        },
      };
    },
    {
      params: t.Object({
        conceptId: t.String(),
      }),
    }
  );
