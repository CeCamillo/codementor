import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

export const waitlist = pgTable(
  'waitlist',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    source: text('source', {
      enum: ['homepage', 'features', 'how_it_works'],
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('waitlist_email_idx').on(table.email)]
);
