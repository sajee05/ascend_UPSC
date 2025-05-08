import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/sqlite-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

// Module-level variable to track if we are in portable mode
let isPortable = false;

/**
 * Get the database file path based on the environment
 */
export function getDbPath(): string {
  // If SQLite_DB_PATH is explicitly set, use it (portable mode)
  if (process.env.SQLITE_DB_PATH) {
    logger(`Using database path from environment: ${process.env.SQLITE_DB_PATH}`, 'sqlite');
    isPortable = true; // Set the flag if using SQLITE_DB_PATH
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
  // Check if we're in portable mode using the flag set by getDbPath
  if (isPortable) {
    // In portable mode, the database should already exist
    logger('Portable mode detected (based on initial getDbPath), verifying existing migrations.', 'sqlite');
    
    try {
      // Check if migrations have already been applied by looking at Drizzle's internal table
      const migrationTableCheck = db.select({
        count: sql`count(*)`
      }).from(sql`sqlite_master WHERE type='table' AND name='__drizzle_migrations'`).all();

      if (migrationTableCheck[0].count > 0) {
        // Check if the migration table has any entries
        const migrationEntries = db.select({ count: sql`count(*)` }).from(sql`__drizzle_migrations`).all();
        if (migrationEntries[0].count > 0) {
          // Migrations already applied, do nothing further in this path for portable mode.
          logger('Migrations already applied (found entries in __drizzle_migrations), skipping.', 'sqlite');
          // NOTE: We don't call applyMigrationsAndSeed() here
        } else {
           // __drizzle_migrations table exists but is empty, apply migrations.
           logger('__drizzle_migrations table exists but is empty, applying migrations.', 'sqlite');
           applyMigrationsAndSeed(); // Apply migrations and seed
        }
      } else {
        // __drizzle_migrations table not found, apply migrations.
        logger('__drizzle_migrations table not found, applying migrations.', 'sqlite');
        applyMigrationsAndSeed(); // Apply migrations and seed
      }
    } catch (error) {
      // If there's an error checking the migration table (e.g., table doesn't exist yet), assume migrations need to run
      logger(`Error checking migration status (${error}), proceeding with migrations.`, 'sqlite');
      applyMigrationsAndSeed(); // Apply migrations and seed
    }
  } else {
    // Not in portable mode, verify existing migrations before applying.
    logger('Not in portable mode (based on initial getDbPath), verifying existing migrations.', 'sqlite'); // Modified log message
    try {
      // Check if migrations have already been applied by looking at Drizzle's internal table
      const migrationTableCheck = db.select({
        count: sql`count(*)`
      }).from(sql`sqlite_master WHERE type='table' AND name='__drizzle_migrations'`).all();

      if (migrationTableCheck[0].count > 0) {
        // Check if the migration table has any entries
        const migrationEntries = db.select({ count: sql`count(*)` }).from(sql`__drizzle_migrations`).all();
        if (migrationEntries[0].count > 0) {
          // Migrations already applied, do nothing further.
          logger('Migrations already applied (found entries in __drizzle_migrations), skipping.', 'sqlite');
          // NOTE: We don't call applyMigrationsAndSeed() here
        } else {
           // __drizzle_migrations table exists but is empty, apply migrations.
           logger('__drizzle_migrations table exists but is empty, applying migrations.', 'sqlite');
           applyMigrationsAndSeed(); // Apply migrations and seed
        }
      } else {
        // __drizzle_migrations table not found, apply migrations.
        logger('__drizzle_migrations table not found, applying migrations.', 'sqlite');
        applyMigrationsAndSeed(); // Apply migrations and seed
      }
    } catch (error) {
      // If there's an error checking the migration table (e.g., table doesn't exist yet), assume migrations need to run
      logger(`Error checking migration status (${error}), proceeding with migrations.`, 'sqlite');
      applyMigrationsAndSeed(); // Apply migrations and seed
    }
  }
}

/**
 * Helper function to apply migrations and seed data
 */
function applyMigrationsAndSeed() {
  try {
    logger('Applying database migrations...', 'sqlite');
    migrate(db, { migrationsFolder: 'migrations' });
    logger('Database migrations applied successfully', 'sqlite');
    // Seed data only after successful migration attempt (or if migrations were skipped but seeding is needed)
    seedInitialData();
  } catch (error) {
    // Log the migration error but don't prevent startup
    logger(`Warning: Error applying migrations: ${error}`, 'sqlite');
    console.warn("Migration warning:", error);
    // Allow initialization to continue even if migrations had an issue, but still try seeding
    logger('Attempting to seed data even after migration warning.', 'sqlite');
    seedInitialData();
  }
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