import { Elysia } from 'elysia';
import { db } from '@codementor/db';
import { userConcepts } from '@codementor/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getConceptById } from '@codementor/ai';
import type { UserConceptsResponse, UserConceptItem } from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

export const userConceptRoutes = new Elysia({ prefix: '/api/users' }).get(
  '/me/concepts',
  async ({ headers, set }) => {
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

      let status: 'not_started' | 'in_progress' | 'mastered';
      if (record.masteryLevel >= 80) {
        status = 'mastered';
      } else if (record.masteryLevel > 0) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }

      return {
        conceptId: record.conceptId,
        name: concept?.name ?? record.conceptId,
        category: concept?.category ?? 'unknown',
        masteryLevel: record.masteryLevel,
        practiceCount: record.practiceCount,
        lastPracticedAt: record.lastPracticedAt?.toISOString() ?? null,
        status,
      };
    });

    const mastered = concepts.filter((c) => c.status === 'mastered').length;
    const inProgress = concepts.filter((c) => c.status === 'in_progress').length;
    const notStarted = concepts.filter((c) => c.status === 'not_started').length;

    const response: UserConceptsResponse = {
      concepts,
      summary: {
        total: concepts.length,
        mastered,
        inProgress,
        notStarted,
      },
    };

    return response;
  }
);
