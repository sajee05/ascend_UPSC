/**
 * Database switcher utility for Ascend UPSC
 * 
 * This module provides a mechanism to switch between SQLite and PostgreSQL
 * databases based on user settings or environment variables.
 */

import { logger } from './logger';
import { IStorage } from './storage';
import * as fs from 'fs';
import * as path from 'path';

let activeStorage: IStorage | null = null;
let activeDbType: 'sqlite' | 'postgresql' = 'postgresql'; // Default to PostgreSQL

/**
 * Initialize the appropriate database based on environment variables
 */
export async function initializeDatabase(): Promise<IStorage> {
  // Check for database type setting
  const dbType = process.env.DB_TYPE || 'postgresql';
  
  if (dbType === 'sqlite') {
    return initializeSqlite();
  } else {
    return initializePostgres();
  }
}

/**
 * Initialize SQLite database
 */
async function initializeSqlite(): Promise<IStorage> {
  logger('Switching to SQLite database', 'database-switcher');
  
  try {
    // Lazy load the SQLite modules
    const { SqliteAdapter } = await import('./sqlite-adapter');
    const { initializeDatabase } = await import('./sqlite-db');
    
    // Initialize SQLite database
    initializeDatabase();
    
    // Create and return the adapter
    const sqliteAdapter = new SqliteAdapter();
    activeStorage = sqliteAdapter;
    activeDbType = 'sqlite';
    
    logger('Successfully switched to SQLite database', 'database-switcher');
    return sqliteAdapter;
  } catch (error) {
    logger(`Error initializing SQLite: ${error}`, 'database-switcher');
    throw error;
  }
}

/**
 * Initialize PostgreSQL database
 */
async function initializePostgres(): Promise<IStorage> {
  logger('Switching to PostgreSQL database', 'database-switcher');
  
  try {
    // Check if we have a connection string
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Import the main storage
    const { storage } = await import('./storage');
    
    // Use the existing PostgreSQL storage instance
    const pgStorage = storage;
    activeStorage = pgStorage;
    activeDbType = 'postgresql';
    
    logger('Successfully switched to PostgreSQL database', 'database-switcher');
    return pgStorage;
  } catch (error) {
    logger(`Error initializing PostgreSQL: ${error}`, 'database-switcher');
    throw error;
  }
}

/**
 * Get the current active storage instance
 */
export function getStorage(): IStorage {
  if (!activeStorage) {
    throw new Error('Database has not been initialized');
  }
  return activeStorage;
}

/**
 * Get the current active database type
 */
export function getDatabaseType(): 'sqlite' | 'postgresql' {
  return activeDbType;
}

/**
 * Switch the database type
 */
export async function switchDatabase(type: 'sqlite' | 'postgresql', connectionString?: string): Promise<IStorage> {
  // Update environment variables
  if (type === 'postgresql' && connectionString) {
    process.env.DATABASE_URL = connectionString;
  }
  
  process.env.DB_TYPE = type;
  
  // Initialize the appropriate database
  if (type === 'sqlite') {
    return await initializeSqlite();
  } else {
    return await initializePostgres();
  }
}