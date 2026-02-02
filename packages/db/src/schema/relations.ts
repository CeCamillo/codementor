import { relations } from 'drizzle-orm';
import { users, userPreferences, sessions } from './users';
import { projects, tasks, submissions, reviews } from './projects';
import { concepts, userConcepts, conceptRelationships } from './concepts';

// User relations
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  sessions: many(sessions),
  projects: many(projects),
  submissions: many(submissions),
  userConcepts: many(userConcepts),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Project relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
  currentTask: one(tasks, {
    fields: [projects.currentTaskId],
    references: [tasks.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  task: one(tasks, {
    fields: [submissions.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  review: one(reviews, {
    fields: [submissions.id],
    references: [reviews.submissionId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [reviews.submissionId],
    references: [submissions.id],
  }),
}));

// Concept relations
export const conceptsRelations = relations(concepts, ({ many }) => ({
  userConcepts: many(userConcepts),
  prerequisiteFor: many(conceptRelationships, { relationName: 'prerequisiteFor' }),
  hasPrerequisites: many(conceptRelationships, { relationName: 'hasPrerequisites' }),
}));

export const userConceptsRelations = relations(userConcepts, ({ one }) => ({
  user: one(users, {
    fields: [userConcepts.userId],
    references: [users.id],
  }),
  concept: one(concepts, {
    fields: [userConcepts.conceptId],
    references: [concepts.id],
  }),
}));

export const conceptRelationshipsRelations = relations(conceptRelationships, ({ one }) => ({
  fromConcept: one(concepts, {
    fields: [conceptRelationships.fromConceptId],
    references: [concepts.id],
    relationName: 'hasPrerequisites',
  }),
  toConcept: one(concepts, {
    fields: [conceptRelationships.toConceptId],
    references: [concepts.id],
    relationName: 'prerequisiteFor',
  }),
}));
