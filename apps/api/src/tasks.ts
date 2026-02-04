import { Elysia } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks } from '@codementor/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getConceptById } from '@codementor/ai';
import type { CurrentTaskResponse, AllTasksCompletedResponse, Concept } from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

export const taskRoutes = new Elysia({ prefix: '/api/tasks' }).get(
  '/current',
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
      set.status = 404;
      return {
        error: 'no_active_project',
        error_description: 'No active project found. Start a new project first.',
      };
    }

    // Get all tasks for this project
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, activeProject.id))
      .orderBy(tasks.order);

    if (projectTasks.length === 0) {
      set.status = 500;
      return {
        error: 'invalid_state',
        error_description: 'Project is in an invalid state - no tasks found.',
      };
    }

    // Calculate progress
    const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
    const totalTasks = projectTasks.length;

    // Check if all tasks are completed
    if (completedTasks === totalTasks) {
      const response: AllTasksCompletedResponse = {
        project: {
          id: activeProject.id,
          title: activeProject.title,
        },
        completed: true,
        progress: {
          totalTasks,
          completedTasks,
        },
      };
      return response;
    }

    // Find current task:
    // 1. Use currentTaskId if set and task is not completed
    // 2. Otherwise find first available or in_progress task
    let currentTask = activeProject.currentTaskId
      ? projectTasks.find(
          (t) =>
            t.id === activeProject.currentTaskId &&
            (t.status === 'available' || t.status === 'in_progress')
        )
      : null;

    if (!currentTask) {
      currentTask = projectTasks.find(
        (t) => t.status === 'available' || t.status === 'in_progress'
      );
    }

    if (!currentTask) {
      set.status = 500;
      return {
        error: 'invalid_state',
        error_description: 'Project is in an invalid state - no current task found.',
      };
    }

    // Enrich task with concept details
    const concepts = currentTask.conceptIds
      .map((id: string) => {
        const concept = getConceptById(id);
        return concept
          ? {
              id: concept.id,
              name: concept.name,
              resources: concept.resources,
            }
          : null;
      })
      .filter(
        (
          c: { id: string; name: string; resources: Concept['resources'] } | null
        ): c is { id: string; name: string; resources: Concept['resources'] } => c !== null
      );

    const response: CurrentTaskResponse = {
      project: {
        id: activeProject.id,
        title: activeProject.title,
        difficulty: activeProject.difficulty as 'beginner' | 'intermediate' | 'advanced',
      },
      task: {
        id: currentTask.id,
        title: currentTask.title,
        description: currentTask.description,
        objectives: currentTask.objectives,
        hints: currentTask.hints,
        order: currentTask.order,
        status: currentTask.status as 'available' | 'in_progress',
        concepts,
      },
      progress: {
        currentTask: currentTask.order,
        totalTasks,
        completedTasks,
      },
    };

    return response;
  }
);
