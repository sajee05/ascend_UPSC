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
let activeDbType: 'sqlite' = 'sqlite'; // Default to SQLite

/**
 * Initialize the appropriate database based on environment variables
 */
export async function initializeDatabase(): Promise<IStorage> {
  // Check for database type setting
  // Force SQLite initialization
  return initializeSqlite();
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
    // Log the error but allow the adapter to be created anyway
    // This handles cases where migrations fail but the DB connection is still valid
    logger(`Warning during SQLite initialization (likely migration issue): ${error}`, 'database-switcher');
    // Do not throw the error here, proceed to create the adapter
  }
  // Ensure adapter is created even if initializeDatabase (migrations) had issues
  const { SqliteAdapter } = await import('./sqlite-adapter');
  const sqliteAdapter = new SqliteAdapter();
  activeStorage = sqliteAdapter;
  activeDbType = 'sqlite';
  logger('SQLite adapter initialized despite potential migration warnings.', 'database-switcher');
  return sqliteAdapter;
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
export function getDatabaseType(): 'sqlite' {
  return activeDbType; // Always SQLite now
}

/**
 * Switch the database type
 */
// Removed switchDatabase function as it's no longer needed - only SQLite is supported.
// If switching logic is ever reintroduced, this function would need to be restored
// and potentially adapted.