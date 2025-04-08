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
      const result = db.select({
        count: sql`count(*)`
      }).from(sql`sqlite_master WHERE type='table' AND name='subjects'`).all();
      
      if (result[0].count > 0) {
        logger('Pre-installed database verified', 'sqlite');
        return;
      } else {
        // No tables, need to create them
        logger('Tables not found in pre-installed database, creating tables', 'sqlite');
      }
    } catch (error) {
      // If there's an error, we need to create the tables
      logger('Error verifying pre-installed database, creating tables', 'sqlite');
    }
  }
  
  // Create tables through SQL statements
  db.run(sql`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      difficulty TEXT,
      time_limit INTEGER,
      total_questions INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS question_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS question_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      tag_name TEXT NOT NULL,
      is_ai_generated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL,
      start_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_time TEXT,
      total_time_seconds INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      score REAL,
      correct_count INTEGER,
      incorrect_count INTEGER,
      left_count INTEGER,
      FOREIGN KEY (test_id) REFERENCES tests(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT,
      is_correct INTEGER,
      is_left INTEGER,
      answer_time INTEGER,
      knowledge_flag INTEGER DEFAULT 0,
      technique_flag INTEGER DEFAULT 0,
      guesswork_flag INTEGER DEFAULT 0,
      confidence INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES attempts(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  
  db.run(sql`
    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_reviewed_at TEXT,
      next_review_at TEXT,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 1,
      review_count INTEGER NOT NULL DEFAULT 0,
      difficulty_rating INTEGER,
      notes TEXT,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  
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