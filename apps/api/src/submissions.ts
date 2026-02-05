import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks, submissions, reviews, userPreferences } from '@codementor/db/schema';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { generateReview, getConceptById } from '@codementor/ai';
import type { SubmitResponse } from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

function generateId(): string {
  return randomBytes(16).toString('hex');
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

async function updateStreak(userId: string): Promise<void> {
  const today = new Date();

  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));

  if (!prefs) {
    // Create preferences with initial streak
    await db.insert(userPreferences).values({
      userId,
      lastActivityDate: today,
      currentStreak: 1,
    });
    return;
  }

  if (!prefs.lastActivityDate) {
    // No previous activity, start streak at 1
    await db
      .update(userPreferences)
      .set({
        lastActivityDate: today,
        currentStreak: 1,
      })
      .where(eq(userPreferences.userId, userId));
    return;
  }

  if (isSameDay(prefs.lastActivityDate, today)) {
    // Already active today, no change
    return;
  }

  if (isYesterday(prefs.lastActivityDate, today)) {
    // Consecutive day, increment streak
    await db
      .update(userPreferences)
      .set({
        lastActivityDate: today,
        currentStreak: prefs.currentStreak + 1,
      })
      .where(eq(userPreferences.userId, userId));
    return;
  }

  // More than a day gap, reset streak to 1
  await db
    .update(userPreferences)
    .set({
      lastActivityDate: today,
      currentStreak: 1,
    })
    .where(eq(userPreferences.userId, userId));
}

export const submissionRoutes = new Elysia({ prefix: '/api/submissions' }).post(
  '/',
  async ({ body, headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;
    const { files } = body;

    // Validate files provided
    if (!files || files.length === 0) {
      set.status = 400;
      return {
        error: 'no_files',
        error_description: 'No files provided for submission',
      };
    }

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
      .orderBy(asc(tasks.order));

    if (projectTasks.length === 0) {
      set.status = 500;
      return {
        error: 'invalid_state',
        error_description: 'Project is in an invalid state - no tasks found.',
      };
    }

    // Check if all tasks are already completed
    const completedTasks = projectTasks.filter((t) => t.status === 'completed');
    if (completedTasks.length === projectTasks.length) {
      set.status = 400;
      return {
        error: 'project_completed',
        error_description: 'All tasks in this project are already completed.',
      };
    }

    // Find current task
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

    try {
      // Create submission record with pending status
      const submissionId = generateId();
      const combinedCode = files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');

      await db.insert(submissions).values({
        id: submissionId,
        taskId: currentTask.id,
        userId: user.id,
        code: combinedCode,
        filePath: files.map((f) => f.path).join(', '),
        status: 'pending',
      });

      // Update submission status to 'reviewing'
      await db
        .update(submissions)
        .set({ status: 'reviewing' })
        .where(eq(submissions.id, submissionId));

      // Generate AI review
      const review = await generateReview({
        task: {
          id: currentTask.id,
          title: currentTask.title,
          description: currentTask.description,
          objectives: currentTask.objectives,
          conceptIds: currentTask.conceptIds,
        },
        files,
        difficulty: activeProject.difficulty as 'beginner' | 'intermediate' | 'advanced',
      });

      // Store review in database
      const reviewId = generateId();
      await db.insert(reviews).values({
        id: reviewId,
        submissionId: submissionId,
        overallFeedback: review.overallFeedback,
        passed: review.passed ? 'true' : 'false',
        conceptsFeedback: review.conceptsFeedback.map((cf) => ({
          conceptId: cf.conceptId,
          demonstrated: cf.demonstrated,
          feedback: cf.feedback,
          masteryDelta: cf.demonstrated ? 5 : -2,
        })),
        codeComments: review.codeComments,
        suggestedResources: review.suggestedResources,
      });

      // Update submission status based on review result
      const submissionStatus = review.passed ? 'passed' : 'needs_work';
      await db
        .update(submissions)
        .set({ status: submissionStatus })
        .where(eq(submissions.id, submissionId));

      let taskAdvanced = false;
      let nextTask: { id: string; title: string; order: number } | null = null;

      if (review.passed) {
        // Mark current task as completed
        await db
          .update(tasks)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(tasks.id, currentTask.id));

        // Find and unlock the next task
        const nextTaskRecord = projectTasks.find(
          (t) => t.order === currentTask!.order + 1 && t.status === 'locked'
        );

        if (nextTaskRecord) {
          // Unlock next task
          await db
            .update(tasks)
            .set({ status: 'available' })
            .where(eq(tasks.id, nextTaskRecord.id));

          // Update project's current task ID
          await db
            .update(projects)
            .set({
              currentTaskId: nextTaskRecord.id,
              status: 'in_progress',
            })
            .where(eq(projects.id, activeProject.id));

          taskAdvanced = true;
          nextTask = {
            id: nextTaskRecord.id,
            title: nextTaskRecord.title,
            order: nextTaskRecord.order,
          };
        } else {
          // This was the last task - check if project is complete
          const remainingTasks = projectTasks.filter(
            (t) => t.id !== currentTask!.id && t.status !== 'completed'
          );

          if (remainingTasks.length === 0) {
            // All tasks completed - mark project as completed
            await db
              .update(projects)
              .set({
                status: 'completed',
                currentTaskId: null,
              })
              .where(eq(projects.id, activeProject.id));

            taskAdvanced = true;
          }
        }
      } else {
        // Update project status to in_progress if it was not_started
        if (activeProject.status === 'not_started') {
          await db
            .update(projects)
            .set({ status: 'in_progress' })
            .where(eq(projects.id, activeProject.id));
        }
      }

      // Update streak on successful submission
      if (review.passed) {
        await updateStreak(user.id);
      }

      // Build response with concept names
      const conceptsFeedbackWithNames = review.conceptsFeedback.map((cf) => {
        const concept = getConceptById(cf.conceptId);
        return {
          conceptId: cf.conceptId,
          conceptName: concept?.name ?? cf.conceptName,
          demonstrated: cf.demonstrated,
          feedback: cf.feedback,
        };
      });

      const response: SubmitResponse = {
        submission: {
          id: submissionId,
          taskId: currentTask.id,
          status: submissionStatus,
        },
        review: {
          overallFeedback: review.overallFeedback,
          passed: review.passed,
          conceptsFeedback: conceptsFeedbackWithNames,
          codeComments: review.codeComments,
          suggestedResources: review.suggestedResources,
          reflectionQuestions: review.reflectionQuestions,
        },
        taskAdvanced,
        nextTask,
      };

      return response;
    } catch (error) {
      console.error('Submission review failed:', error);
      set.status = 500;
      return {
        error: 'review_failed',
        error_description: 'Failed to review submission. Please try again.',
      };
    }
  },
  {
    body: t.Object({
      files: t.Array(
        t.Object({
          path: t.String(),
          content: t.String(),
        }),
        { minItems: 1 }
      ),
    }),
  }
);
