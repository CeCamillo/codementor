import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks, userTaskHints, reviews, submissions } from '@codementor/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getConceptById, generateReflectionFollowup } from '@codementor/ai';
import type {
  CurrentTaskResponse,
  AllTasksCompletedResponse,
  Concept,
  TaskDetailResponse,
  TaskHintResponse,
  ReflectionRespondResponse,
} from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

export const taskRoutes = new Elysia({ prefix: '/api/tasks' })
  .get('/current', async ({ headers, set }) => {
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
  })
  .get('/:id', async ({ params, headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, params.id));

    if (!task) {
      set.status = 404;
      return { error: 'not_found', error_description: 'Task not found' };
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, task.projectId), eq(projects.userId, user.id)));

    if (!project) {
      set.status = 404;
      return { error: 'not_found', error_description: 'Task not found' };
    }

    const concepts = task.conceptIds
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

    const response: TaskDetailResponse = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        objectives: task.objectives,
        hints: task.hints,
        order: task.order,
        status: task.status as 'locked' | 'available' | 'in_progress' | 'completed',
        concepts,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString() ?? null,
      },
      project: {
        id: project.id,
        title: project.title,
        difficulty: project.difficulty as 'beginner' | 'intermediate' | 'advanced',
      },
    };

    return response;
  })
  .get('/:id/hint', async ({ params, headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, params.id));

    if (!task) {
      set.status = 404;
      return { error: 'not_found', error_description: 'Task not found' };
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, task.projectId), eq(projects.userId, user.id)));

    if (!project) {
      set.status = 404;
      return { error: 'not_found', error_description: 'Task not found' };
    }

    const totalHints = task.hints.length;

    if (totalHints === 0) {
      const response: TaskHintResponse = {
        hint: null,
        hintIndex: 0,
        totalHints: 0,
        hasMoreHints: false,
      };
      return response;
    }

    const [existingHintRecord] = await db
      .select()
      .from(userTaskHints)
      .where(and(eq(userTaskHints.userId, user.id), eq(userTaskHints.taskId, task.id)));

    let currentIndex: number;
    if (existingHintRecord) {
      currentIndex = Math.min(existingHintRecord.hintIndex + 1, totalHints - 1);
      if (existingHintRecord.hintIndex < totalHints - 1) {
        await db
          .update(userTaskHints)
          .set({ hintIndex: currentIndex, updatedAt: new Date() })
          .where(and(eq(userTaskHints.userId, user.id), eq(userTaskHints.taskId, task.id)));
      }
    } else {
      currentIndex = 0;
      await db.insert(userTaskHints).values({
        userId: user.id,
        taskId: task.id,
        hintIndex: 0,
      });
    }

    const response: TaskHintResponse = {
      hint: task.hints[currentIndex] ?? null,
      hintIndex: currentIndex,
      totalHints,
      hasMoreHints: currentIndex < totalHints - 1,
    };

    return response;
  })
  .post(
    '/:id/respond',
    async ({ params, body, headers, set }) => {
      const validation = await validateSession(headers['authorization']);
      if (isValidationError(validation)) {
        set.status = 401;
        return { error: validation.error, error_description: validation.message };
      }

      const { user } = validation;
      const { submissionId, responses } = body;

      const [task] = await db.select().from(tasks).where(eq(tasks.id, params.id));

      if (!task) {
        set.status = 404;
        return { error: 'not_found', error_description: 'Task not found' };
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, task.projectId), eq(projects.userId, user.id)));

      if (!project) {
        set.status = 404;
        return { error: 'not_found', error_description: 'Task not found' };
      }

      const [submission] = await db
        .select()
        .from(submissions)
        .where(and(eq(submissions.id, submissionId), eq(submissions.userId, user.id)));

      if (!submission || submission.taskId !== task.id) {
        set.status = 404;
        return { error: 'not_found', error_description: 'Submission not found' };
      }

      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.submissionId, submissionId));

      if (!review) {
        set.status = 404;
        return { error: 'not_found', error_description: 'Review not found for this submission' };
      }

      const reflectionQuestions = review.reflectionQuestions ?? [];

      const followup = await generateReflectionFollowup({
        task: {
          title: task.title,
          description: task.description,
          objectives: task.objectives,
        },
        questions: reflectionQuestions,
        responses: responses.map((r) => ({
          question: reflectionQuestions[r.questionIndex] ?? '',
          answer: r.answer,
        })),
        difficulty: project.difficulty as 'beginner' | 'intermediate' | 'advanced',
      });

      const now = new Date().toISOString();
      const existingResponses = review.reflectionResponses ?? [];
      const newResponses = responses.map((r) => ({
        questionIndex: r.questionIndex,
        answer: r.answer,
        followupFeedback: followup.feedback,
        respondedAt: now,
      }));

      await db
        .update(reviews)
        .set({
          reflectionResponses: [...existingResponses, ...newResponses],
        })
        .where(eq(reviews.id, review.id));

      const response: ReflectionRespondResponse = {
        success: true,
        followupFeedback: followup.feedback,
        encouragement: followup.encouragement,
      };

      return response;
    },
    {
      body: t.Object({
        submissionId: t.String(),
        responses: t.Array(
          t.Object({
            questionIndex: t.Number(),
            answer: t.String(),
          })
        ),
      }),
    }
  );
