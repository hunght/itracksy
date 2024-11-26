import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Applications table to store unique applications
export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Activities table to store window activity records
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey(),
  applicationId: integer('application_id').references(() => applications.id),
  title: text('title').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration'), // in seconds
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Daily summary table for aggregated statistics
export const dailySummaries = sqliteTable('daily_summaries', {
  id: integer('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD format
  applicationId: integer('application_id').references(() => applications.id),
  totalDuration: integer('total_duration').notNull(), // in seconds
  activityCount: integer('activity_count').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
