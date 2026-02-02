import { pgTable, text, timestamp, integer, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const concepts = pgTable('concepts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  tier: integer('tier').notNull(), // 1, 2, or 3
  category: text('category').notNull(),
  prerequisites: jsonb('prerequisites').$type<string[]>().notNull().default([]),
  exampleTasks: jsonb('example_tasks').$type<string[]>().notNull().default([]),
  commonMisconceptions: jsonb('common_misconceptions').$type<string[]>().notNull().default([]),
  resources: jsonb('resources')
    .$type<
      Array<{
        title: string;
        url: string;
        type: 'documentation' | 'tutorial' | 'video' | 'article';
      }>
    >()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userConcepts = pgTable(
  'user_concepts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conceptId: text('concept_id')
      .notNull()
      .references(() => concepts.id, { onDelete: 'cascade' }),
    masteryLevel: integer('mastery_level').notNull().default(0), // 0-100
    practiceCount: integer('practice_count').notNull().default(0),
    lastPracticedAt: timestamp('last_practiced_at', { withTimezone: true }),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }), // Spaced repetition
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('user_concepts_user_id_concept_id_unique').on(table.userId, table.conceptId),
    index('user_concepts_user_id_idx').on(table.userId),
    index('user_concepts_concept_id_idx').on(table.conceptId),
    index('user_concepts_next_review_at_idx').on(table.nextReviewAt),
  ]
);

export const conceptRelationships = pgTable(
  'concept_relationships',
  {
    id: text('id').primaryKey(),
    fromConceptId: text('from_concept_id')
      .notNull()
      .references(() => concepts.id, { onDelete: 'cascade' }),
    toConceptId: text('to_concept_id')
      .notNull()
      .references(() => concepts.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type', {
      enum: ['prerequisite', 'related', 'builds_on'],
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('concept_relationships_from_to_unique').on(table.fromConceptId, table.toConceptId),
    index('concept_relationships_from_concept_id_idx').on(table.fromConceptId),
    index('concept_relationships_to_concept_id_idx').on(table.toConceptId),
  ]
);
