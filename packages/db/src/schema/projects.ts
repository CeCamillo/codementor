import { pgTable, text, timestamp, integer, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    difficulty: text('difficulty', {
      enum: ['beginner', 'intermediate', 'advanced'],
    }).notNull(),
    status: text('status', {
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
    })
      .notNull()
      .default('not_started'),
    currentTaskId: text('current_task_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('projects_user_id_idx').on(table.userId)]
);

export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    objectives: jsonb('objectives').$type<string[]>().notNull().default([]),
    hints: jsonb('hints').$type<string[]>().notNull().default([]),
    order: integer('order').notNull(),
    status: text('status', {
      enum: ['locked', 'available', 'in_progress', 'completed'],
    })
      .notNull()
      .default('locked'),
    conceptIds: jsonb('concept_ids').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('tasks_project_id_idx').on(table.projectId),
    unique('tasks_project_id_order_unique').on(table.projectId, table.order),
  ]
);

export const submissions = pgTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    filePath: text('file_path').notNull(),
    status: text('status', {
      enum: ['pending', 'reviewing', 'passed', 'needs_work'],
    })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('submissions_task_id_idx').on(table.taskId),
    index('submissions_user_id_idx').on(table.userId),
  ]
);

export const reviews = pgTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    submissionId: text('submission_id')
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    overallFeedback: text('overall_feedback').notNull(),
    passed: text('passed', { enum: ['true', 'false'] }).notNull(),
    conceptsFeedback: jsonb('concepts_feedback')
      .$type<
        Array<{
          conceptId: string;
          demonstrated: boolean;
          feedback: string;
          masteryDelta: number;
        }>
      >()
      .notNull()
      .default([]),
    codeComments: jsonb('code_comments')
      .$type<
        Array<{
          filePath: string;
          lineStart: number;
          lineEnd: number;
          severity: 'praise' | 'suggestion' | 'issue' | 'critical';
          message: string;
          conceptId?: string;
        }>
      >()
      .notNull()
      .default([]),
    suggestedResources: jsonb('suggested_resources').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('reviews_submission_id_idx').on(table.submissionId)]
);
