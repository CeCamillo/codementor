import { Elysia } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks, users, userConcepts, concepts } from '@codementor/db/schema';
import { eq, and, or, desc, asc, gte } from 'drizzle-orm';
import { validateSession, isValidationError } from './middleware/auth';

const MASTERY_THRESHOLD = 80; // Concepts with masteryLevel >= 80 are considered "mastered"

export const progressRoutes = new Elysia({ prefix: '/api/progress' }).get(
  '/',
  async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    try {
      // Get user stats
      const [userStats] = await db
        .select({
          totalMinutesLearned: users.totalMinutesLearned,
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak,
          lastActiveDate: users.lastActiveDate,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      // Get active project (in_progress or not_started, most recently updated)
      const [activeProject] = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          difficulty: projects.difficulty,
          status: projects.status,
          currentTaskId: projects.currentTaskId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(
          and(
            eq(projects.userId, user.id),
            or(eq(projects.status, 'in_progress'), eq(projects.status, 'not_started'))
          )
        )
        .orderBy(desc(projects.updatedAt))
        .limit(1);

      // Build active project progress if exists
      let activeProjectProgress = null;
      if (activeProject) {
        // Get all tasks for this project
        const projectTasks = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            order: tasks.order,
            completedAt: tasks.completedAt,
          })
          .from(tasks)
          .where(eq(tasks.projectId, activeProject.id))
          .orderBy(asc(tasks.order));

        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Get current task details
        let currentTask = null;
        if (activeProject.currentTaskId) {
          const [task] = await db
            .select({
              id: tasks.id,
              title: tasks.title,
              description: tasks.description,
              status: tasks.status,
              order: tasks.order,
              conceptIds: tasks.conceptIds,
            })
            .from(tasks)
            .where(eq(tasks.id, activeProject.currentTaskId))
            .limit(1);
          currentTask = task ?? null;
        }

        activeProjectProgress = {
          id: activeProject.id,
          title: activeProject.title,
          description: activeProject.description,
          difficulty: activeProject.difficulty,
          status: activeProject.status,
          progress: {
            completed: completedTasks,
            total: totalTasks,
            percentage,
          },
          currentTask,
          createdAt: activeProject.createdAt,
          updatedAt: activeProject.updatedAt,
        };
      }

      // Get mastered concepts (masteryLevel >= 80)
      const masteredConceptsList = await db
        .select({
          id: concepts.id,
          name: concepts.name,
          slug: concepts.slug,
          category: concepts.category,
          masteryLevel: userConcepts.masteryLevel,
        })
        .from(userConcepts)
        .innerJoin(concepts, eq(userConcepts.conceptId, concepts.id))
        .where(
          and(eq(userConcepts.userId, user.id), gte(userConcepts.masteryLevel, MASTERY_THRESHOLD))
        )
        .orderBy(desc(userConcepts.masteryLevel));

      // Get recent projects (last 5)
      const recentProjectsList = await db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          difficulty: projects.difficulty,
          status: projects.status,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.userId, user.id))
        .orderBy(desc(projects.updatedAt))
        .limit(5);

      // Calculate progress for each recent project
      const recentProjectsWithProgress = await Promise.all(
        recentProjectsList.map(async (project) => {
          const projectTasks = await db
            .select({ status: tasks.status })
            .from(tasks)
            .where(eq(tasks.projectId, project.id));

          const total = projectTasks.length;
          const completed = projectTasks.filter((t) => t.status === 'completed').length;

          return {
            ...project,
            progress: {
              completed,
              total,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
          };
        })
      );

      return {
        user: {
          totalMinutesLearned: userStats?.totalMinutesLearned ?? 0,
          currentStreak: userStats?.currentStreak ?? 0,
          longestStreak: userStats?.longestStreak ?? 0,
          lastActiveDate: userStats?.lastActiveDate?.toISOString() ?? null,
        },
        activeProject: activeProjectProgress,
        masteredConcepts: masteredConceptsList.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          category: c.category,
          masteryLevel: c.masteryLevel,
        })),
        recentProjects: recentProjectsWithProgress,
      };
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      set.status = 500;
      return {
        error: 'fetch_failed',
        error_description: 'Failed to fetch progress data. Please try again.',
      };
    }
  }
);
