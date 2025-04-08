import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/sqlite-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

/**
 * Get the database file path based on the environment
 */
export function getDbPath(): string {
  // If SQLite_DB_PATH is explicitly set, use it (portable mode)
  if (process.env.SQLITE_DB_PATH) {
    logger(`Using database path from environment: ${process.env.SQLITE_DB_PATH}`, 'sqlite');
    return process.env.SQLITE_DB_PATH;
  }
  
  // When running in Electron, use the user's app data folder
  if (process.env.APP_DATA_PATH) {
    const dbDir = process.env.APP_DATA_PATH;
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    return path.join(dbDir, 'ascend-upsc.db');
  }
  
  // Default path for development
  return path.join(process.cwd(), 'ascend-upsc.db');
}

// Initialize the SQLite database
export const sqlite = new Database(getDbPath());

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

/**
 * Initialize the database with tables and seed data if necessary
 */
export function initializeDatabase() {
  logger('Initializing SQLite database...', 'sqlite');
  
  // Check if we're in portable mode and if the database exists
  if (process.env.PORTABLE_MODE === 'true') {
    // In portable mode, the database should already exist
    logger('Portable mode detected, using pre-installed database', 'sqlite');
    
    try {
      // Verify the database has the expected tables
      db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='subjects'`);
      logger('Pre-installed database verified', 'sqlite');
      return;
    } catch (error) {
      // If there's an error, we need to create the tables
      logger('Error verifying pre-installed database, creating tables', 'sqlite');
    }
  }
  
  // Create tables from schema
  db.run(schema.subjects);
  db.run(schema.topics);
  db.run(schema.tests);
  db.run(schema.questions);
  db.run(schema.questionSubjects);
  db.run(schema.questionTopics);
  db.run(schema.tags);
  db.run(schema.attempts);
  db.run(schema.userAnswers);
  db.run(schema.flashcards);
  
  logger('SQLite database initialized', 'sqlite');
  
  // Seed data if needed (for first-time initialization)
  seedInitialData();
}

/**
 * Seed initial data if the database is empty
 */
function seedInitialData() {
  // Check if we have any subjects
  const subjectCount = db.select({ count: sql`count(*)` }).from(schema.subjects).all();
  
  if (subjectCount[0].count === 0) {
    logger('Seeding initial data...', 'sqlite');
    
    // Insert default subjects
    db.insert(schema.subjects).values([
      { name: 'Economics', description: 'Economic concepts and theories' },
      { name: 'History', description: 'Historical events and developments' },
      { name: 'Geography', description: 'Physical and human geography' },
      { name: 'Polity', description: 'Political systems and governance' },
      { name: 'Science & Technology', description: 'Scientific concepts and technological advancements' },
      { name: 'Environment', description: 'Environmental issues and ecology' },
      { name: 'International Relations', description: 'Global politics and diplomacy' },
    ]).run();
    
    logger('Initial data seeded', 'sqlite');
  }
}