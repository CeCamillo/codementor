import { Elysia, t } from 'elysia';
import { db } from '@codementor/db';
import { projects, tasks } from '@codementor/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { generateProject, getConceptById } from '@codementor/ai';
import type {
  CreateProjectResponse,
  Concept,
  ProjectsListResponse,
  ProjectSwitchResponse,
} from '@codementor/shared';
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
  .get('/', async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));

    return {
      projects: userProjects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  })
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
  .get('/list', async ({ headers, set }) => {
    const validation = await validateSession(headers['authorization']);
    if (isValidationError(validation)) {
      set.status = 401;
      return { error: validation.error, error_description: validation.message };
    }

    const { user } = validation;

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));

    const projectsWithTasks = await Promise.all(
      userProjects.map(async (p) => {
        const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, p.id));

        const completedTasks = projectTasks.filter((t) => t.status === 'completed');

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty as 'beginner' | 'intermediate' | 'advanced',
          status: p.status as 'not_started' | 'in_progress' | 'completed' | 'abandoned',
          tasks: {
            total: projectTasks.length,
            completed: completedTasks.length,
          },
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      })
    );

    const response: ProjectsListResponse = {
      projects: projectsWithTasks,
    };

    return response;
  })
  .post('/:id/switch', async ({ params, headers, set }) => {
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

    // Reject if project is completed or abandoned
    if (project.status === 'completed' || project.status === 'abandoned') {
      set.status = 400;
      return {
        error: 'invalid_status',
        error_description: `Cannot switch to a ${project.status} project`,
      };
    }

    // Update status to in_progress if was not_started, and touch updatedAt
    const newStatus = project.status === 'not_started' ? 'in_progress' : project.status;
    await db
      .update(projects)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id));

    // Get current task
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, project.id))
      .orderBy(tasks.order);

    const currentTask = projectTasks.find(
      (t) => t.status === 'available' || t.status === 'in_progress'
    );

    const response: ProjectSwitchResponse = {
      success: true,
      project: {
        id: project.id,
        title: project.title,
        status: newStatus as 'not_started' | 'in_progress',
      },
      currentTask: currentTask
        ? {
            id: currentTask.id,
            title: currentTask.title,
            order: currentTask.order,
          }
        : null,
    };

    return response;
  })
  .delete('/:id', async ({ params, headers, set }) => {
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

    if (project.status === 'abandoned') {
      set.status = 400;
      return { error: 'already_archived', error_description: 'Project is already archived' };
    }

    await db
      .update(projects)
      .set({ status: 'abandoned', updatedAt: new Date() })
      .where(eq(projects.id, params.id));

    return { success: true };
  });
