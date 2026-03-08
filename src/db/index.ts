import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let database: any;

export const getDb = () => {
  if (database) return database;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  const sql = neon(process.env.DATABASE_URL);
  database = drizzle(sql, { schema });
  return database;
};

// For backward compatibility with existing imports
export const db = new Proxy({} as any, {
  get(_, prop) {
    return getDb()[prop];
  }
});
