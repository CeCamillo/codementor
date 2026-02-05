import { Elysia } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks, userConcepts, userPreferences } from '@codementor/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getConceptById } from '@codementor/ai';
import type { ProgressApiResponse } from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export const progressRoutes = new Elysia({ prefix: '/api/progress' }).get(
  '/',
  async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    // Find active project (in_progress or not_started, most recently updated)
    const [activeProject] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, user.id),
          or(eq(projects.status, 'in_progress'), eq(projects.status, 'not_started'))
        )
      )
      .orderBy(desc(projects.updatedAt))
      .limit(1);

    if (!activeProject) {
      const response: ProgressApiResponse = {
        hasActiveProject: false,
        message: 'No active project. Start one with: codementor start "<description>"',
      };
      return response;
    }

    // Get project tasks
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, activeProject.id))
      .orderBy(tasks.order);

    const completedTasks = projectTasks.filter((t) => t.status === 'completed');
    const currentTask = projectTasks.find(
      (t) => t.status === 'available' || t.status === 'in_progress'
    );

    // Calculate time invested from completed task timestamps
    let investedMinutes = 0;
    for (const task of completedTasks) {
      if (task.completedAt) {
        const duration = task.completedAt.getTime() - task.createdAt.getTime();
        investedMinutes += Math.round(duration / (1000 * 60));
      }
    }

    // Get user concepts with mastery >= 80 as mastered
    const userConceptRecords = await db
      .select()
      .from(userConcepts)
      .where(eq(userConcepts.userId, user.id))
      .orderBy(desc(userConcepts.updatedAt));

    const masteredConcepts = userConceptRecords.filter((c) => c.masteryLevel >= 80);
    const inProgressConcepts = userConceptRecords.filter(
      (c) => c.masteryLevel > 0 && c.masteryLevel < 80
    );

    // Get recent concepts (top 3 with mastery >= 80)
    const recentMastered = masteredConcepts.slice(0, 3).map((c) => {
      const concept = getConceptById(c.conceptId);
      return {
        name: concept?.name ?? c.conceptId,
        masteryLevel: c.masteryLevel,
      };
    });

    // Get streak from user preferences
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    const today = new Date();
    const activeToday = prefs?.lastActivityDate ? isSameDay(prefs.lastActivityDate, today) : false;

    const response: ProgressApiResponse = {
      project: {
        id: activeProject.id,
        title: activeProject.title,
        difficulty: activeProject.difficulty as 'beginner' | 'intermediate' | 'advanced',
        status: activeProject.status as 'not_started' | 'in_progress',
      },
      tasks: {
        total: projectTasks.length,
        completed: completedTasks.length,
      },
      currentTask: currentTask
        ? {
            id: currentTask.id,
            title: currentTask.title,
            order: currentTask.order,
          }
        : null,
      concepts: {
        mastered: masteredConcepts.length,
        inProgress: inProgressConcepts.length,
        recent: recentMastered,
      },
      time: {
        investedMinutes,
      },
      streak: {
        currentDays: prefs?.currentStreak ?? 0,
        activeToday,
      },
    };

    return response;
  }
);
