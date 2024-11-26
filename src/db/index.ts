import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// Get the user data path for the app
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'itracksy.db');

// Create/connect to SQLite database
const sqlite = new Database(dbPath);

// Create drizzle database instance
export const db = drizzle(sqlite, { schema });

// Database operations
export const dbOperations = {
  // Application operations
  async getOrCreateApplication(name: string, path: string) {
    let app = await db.select()
      .from(schema.applications)
      .where(and(
        eq(schema.applications.name, name),
        eq(schema.applications.path, path)
      ))
      .get();

    if (!app) {
      const result = await db.insert(schema.applications)
        .values({ name, path })
        .returning()
        .get();
      app = result;
    }

    return app;
  },

  // Activity operations
  async createActivity(applicationId: number, title: string) {
    return await db.insert(schema.activities)
      .values({
        applicationId,
        title,
        startTime: new Date(),
      })
      .returning()
      .get();
  },

  async updateActivity(id: number, endTime: Date) {
    const activity = await db.select()
      .from(schema.activities)
      .where(eq(schema.activities.id, id))
      .get();

    if (activity) {
      const duration = Math.floor((endTime.getTime() - activity.startTime.getTime()) / 1000);
      return await db.update(schema.activities)
        .set({ 
          endTime, 
          duration 
        })
        .where(eq(schema.activities.id, id))
        .returning()
        .get();
    }
  },

  async getActivities(startTime: Date, endTime: Date) {
    return await db.select({
      id: schema.activities.id,
      title: schema.activities.title,
      startTime: schema.activities.startTime,
      endTime: schema.activities.endTime,
      duration: schema.activities.duration,
      applicationName: schema.applications.name,
      applicationPath: schema.applications.path,
    })
    .from(schema.activities)
    .leftJoin(schema.applications, eq(schema.activities.applicationId, schema.applications.id))
    .where(and(
      gte(schema.activities.startTime, startTime),
      lte(schema.activities.startTime, endTime)
    ))
    .all();
  },

  // Daily summary operations
  async updateDailySummary(date: string, applicationId: number) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const activities = await db.select({
      totalDuration: schema.activities.duration,
    })
    .from(schema.activities)
    .where(and(
      eq(schema.activities.applicationId, applicationId),
      gte(schema.activities.startTime, startOfDay),
      lt(schema.activities.startTime, endOfDay)
    ))
    .all();

    const totalDuration = activities.reduce((sum, activity) => sum + (activity.totalDuration || 0), 0);
    const activityCount = activities.length;

    return await db.insert(schema.dailySummaries)
      .values({
        date,
        applicationId,
        totalDuration,
        activityCount,
      })
      .onConflict()
      .merge()
      .returning()
      .get();
  },

  async getDailySummary(date: string) {
    return await db.select({
      applicationName: schema.applications.name,
      totalDuration: schema.dailySummaries.totalDuration,
      activityCount: schema.dailySummaries.activityCount,
    })
    .from(schema.dailySummaries)
    .leftJoin(schema.applications, eq(schema.dailySummaries.applicationId, schema.applications.id))
    .where(eq(schema.dailySummaries.date, date))
    .all();
  }
};
