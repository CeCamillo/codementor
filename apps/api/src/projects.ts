import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks } from '@codementor/db/schema';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { generateProject, getConceptById } from '@codementor/ai';
import type { CreateProjectResponse, Concept } from '@codementor/shared';
import { validateSession, isValidationError } from './middleware/auth';

interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  objectives: string[];
  hints: string[];
  order: number;
  status: string;
  conceptIds: string[];
  createdAt: Date;
  completedAt: Date | null;
}

function generateId(): string {
  return randomBytes(16).toString('hex');
}

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // POST /api/projects - Create new project
  .post(
    '/',
    async ({ body, headers, set }) => {
      const validation = await validateSession(headers['authorization']);
      if (isValidationError(validation)) {
        set.status = 401;
        return { error: validation.error, error_description: validation.message };
      }

      const { user } = validation;
      const { description, difficulty } = body;

      try {
        const generated = await generateProject({
          description,
          ...(difficulty && { difficulty }),
        });

        const projectId = generateId();
        const [project] = await db
          .insert(projects)
          .values({
            id: projectId,
            userId: user.id,
            title: generated.title,
            description: generated.summary,
            difficulty: generated.difficulty,
            status: 'not_started',
          })
          .returning();

        if (!project) {
          throw new Error('Failed to create project');
        }

        const taskRecords: Array<{
          record: TaskRecord;
          estimatedMinutes: number;
        }> = [];

        for (let index = 0; index < generated.tasks.length; index++) {
          const task = generated.tasks[index]!;
          const taskId = generateId();
          const [record] = await db
            .insert(tasks)
            .values({
              id: taskId,
              projectId: projectId,
              title: task.title,
              description: task.description,
              objectives: task.objectives,
              hints: task.hints,
              order: task.order,
              status: index === 0 ? 'available' : 'locked',
              conceptIds: task.conceptIds,
            })
            .returning();

          if (record) {
            taskRecords.push({ record, estimatedMinutes: task.estimatedMinutes });
          }
        }

        if (taskRecords.length === 0) {
          throw new Error('Failed to create tasks');
        }

        const firstTaskRecord = taskRecords[0]!;
        const firstTaskConcepts = firstTaskRecord.record.conceptIds
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

        // Update project with current task ID
        await db
          .update(projects)
          .set({ currentTaskId: firstTaskRecord.record.id })
          .where(eq(projects.id, projectId));

        const response: CreateProjectResponse = {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            difficulty: project.difficulty as 'beginner' | 'intermediate' | 'advanced',
            status: project.status as 'not_started' | 'in_progress' | 'completed' | 'abandoned',
            totalEstimatedMinutes: generated.totalEstimatedMinutes,
          },
          tasks: taskRecords.map(({ record }) => ({
            id: record.id,
            title: record.title,
            order: record.order,
            status: record.status as 'locked' | 'available' | 'in_progress' | 'completed',
            conceptIds: record.conceptIds,
          })),
          firstTask: {
            id: firstTaskRecord.record.id,
            title: firstTaskRecord.record.title,
            description: firstTaskRecord.record.description,
            objectives: firstTaskRecord.record.objectives,
            estimatedMinutes: firstTaskRecord.estimatedMinutes,
            concepts: firstTaskConcepts,
          },
        };

        return response;
      } catch (error) {
        console.error('Project generation failed:', error);
        set.status = 500;
        return {
          error: 'generation_failed',
          error_description: 'Failed to generate project. Please try again.',
        };
      }
    },
    {
      body: t.Object({
        description: t.String({ minLength: 10 }),
        difficulty: t.Optional(
          t.Union([t.Literal('beginner'), t.Literal('intermediate'), t.Literal('advanced')])
        ),
      }),
    }
  )
  // GET /api/projects - List all user's projects with progress
  .get('/', async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    try {
      // Get all projects for user
      const userProjects = await db
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
        .where(eq(projects.userId, user.id))
        .orderBy(desc(projects.updatedAt));

      // Calculate progress for each project
      const projectsWithProgress = await Promise.all(
        userProjects.map(async (project) => {
          const projectTasks = await db
            .select({
              id: tasks.id,
              title: tasks.title,
              status: tasks.status,
              order: tasks.order,
            })
            .from(tasks)
            .where(eq(tasks.projectId, project.id))
            .orderBy(asc(tasks.order));

          const total = projectTasks.length;
          const completed = projectTasks.filter((t) => t.status === 'completed').length;
          const inProgress = projectTasks.filter(
            (t) => t.status === 'in_progress' || t.status === 'available'
          ).length;

          // Get current task info
          let currentTask = null;
          if (project.currentTaskId) {
            const [task] = await db
              .select({
                id: tasks.id,
                title: tasks.title,
                order: tasks.order,
                status: tasks.status,
              })
              .from(tasks)
              .where(eq(tasks.id, project.currentTaskId))
              .limit(1);
            currentTask = task ?? null;
          } else if (inProgress > 0) {
            // Find first available/in_progress task
            const firstTask = projectTasks.find(
              (t) => t.status === 'available' || t.status === 'in_progress'
            );
            if (firstTask) {
              currentTask = firstTask;
            }
          }

          return {
            id: project.id,
            title: project.title,
            description: project.description,
            difficulty: project.difficulty,
            status: project.status,
            progress: {
              completed,
              total,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
            currentTask,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          };
        })
      );

      return {
        projects: projectsWithProgress,
      };
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      set.status = 500;
      return {
        error: 'fetch_failed',
        error_description: 'Failed to fetch projects. Please try again.',
      };
    }
  })
  // GET /api/projects/:id - Get single project with tasks
  .get('/:id', async ({ params, headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.userId, user.id)));

    if (!project) {
      set.status = 404;
      return { error: 'not_found', error_description: 'Project not found' };
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, project.id))
      .orderBy(tasks.order);

    return {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        difficulty: project.difficulty,
        status: project.status,
        currentTaskId: project.currentTaskId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      tasks: projectTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        objectives: t.objectives,
        hints: t.hints,
        order: t.order,
        status: t.status,
        conceptIds: t.conceptIds,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString(),
      })),
    };
  })
  // POST /api/projects/:id/switch - Switch active project
  .post(
    '/:id/switch',
    async ({ params, headers, set }) => {
      const validation = await validateSession(headers['authorization']);
      if (isValidationError(validation)) {
        set.status = 401;
        return { error: validation.error, error_description: validation.message };
      }

      const { user } = validation;
      const { id } = params;

      try {
        // Check if project exists and belongs to user
        const [project] = await db
          .select({
            id: projects.id,
            status: projects.status,
            userId: projects.userId,
          })
          .from(projects)
          .where(eq(projects.id, id))
          .limit(1);

        if (!project) {
          set.status = 404;
          return {
            error: 'project_not_found',
            error_description: 'Project not found.',
          };
        }

        if (project.userId !== user.id) {
          set.status = 403;
          return {
            error: 'forbidden',
            error_description: 'You do not have access to this project.',
          };
        }

        if (project.status === 'completed') {
          set.status = 400;
          return {
            error: 'project_completed',
            error_description: 'Cannot switch to a completed project.',
          };
        }

        if (project.status === 'abandoned') {
          set.status = 400;
          return {
            error: 'project_abandoned',
            error_description: 'Cannot switch to an abandoned project.',
          };
        }

        // If project is not_started, set it to in_progress
        if (project.status === 'not_started') {
          // Find first available task to set as current
          const [firstTask] = await db
            .select({ id: tasks.id })
            .from(tasks)
            .where(
              and(
                eq(tasks.projectId, id),
                or(eq(tasks.status, 'available'), eq(tasks.status, 'locked'))
              )
            )
            .orderBy(asc(tasks.order))
            .limit(1);

          if (firstTask) {
            // Unlock the first task if it's locked
            await db.update(tasks).set({ status: 'available' }).where(eq(tasks.id, firstTask.id));

            // Update project status and current task
            await db
              .update(projects)
              .set({
                status: 'in_progress',
                currentTaskId: firstTask.id,
                updatedAt: new Date(),
              })
              .where(eq(projects.id, id));
          } else {
            // No tasks found, just update status
            await db
              .update(projects)
              .set({
                status: 'in_progress',
                updatedAt: new Date(),
              })
              .where(eq(projects.id, id));
          }
        } else {
          // Project is already in_progress, just update timestamp
          await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, id));
        }

        return {
          success: true,
          message: 'Project switched successfully.',
          projectId: id,
        };
      } catch (error) {
        console.error('Failed to switch project:', error);
        set.status = 500;
        return {
          error: 'switch_failed',
          error_description: 'Failed to switch project. Please try again.',
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
