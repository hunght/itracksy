import type { Config } from 'drizzle-kit';
import { app } from 'electron';
import path from 'path';

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'itracksy.db');

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: dbPath
  },
} satisfies Config;
