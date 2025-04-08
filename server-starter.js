/**
 * Server starter script for both development and production (Electron)
 */

// Import required modules
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get directory name for current module (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in Electron
const isElectron = process.env.ELECTRON_RUN === '1';

// Set up data directory for SQLite in Electron mode
if (isElectron) {
  // For portable mode, use a local database in the app directory
  const portableMode = true; // Set to true for portable .exe

  if (portableMode) {
    // Use a database in the application directory for portable mode
    const appDir = path.join(path.dirname(process.execPath), 'resources');
    const dbDir = path.join(appDir, 'db');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Set environment variable for database path
    process.env.SQLITE_DB_PATH = path.join(dbDir, 'ascend-upsc.db');
    process.env.PORTABLE_MODE = 'true';
    
    console.log(`Portable mode: Using SQLite database at ${process.env.SQLITE_DB_PATH}`);
  } else {
    // Use user data directory for installed mode
    const userDataPath = process.env.APPDATA || 
                         (process.platform === 'darwin' 
                          ? path.join(process.env.HOME, 'Library', 'Application Support', 'ascend-upsc') 
                          : path.join(process.env.HOME, '.ascend-upsc'));
    
    // Create user data directory if it doesn't exist
    const dbDir = path.join(userDataPath, 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Set environment variable for database path
    process.env.SQLITE_DB_PATH = path.join(dbDir, 'ascend-upsc.db');
    
    console.log(`Electron mode: Using SQLite database at ${process.env.SQLITE_DB_PATH}`);
  }
} else {
  console.log('Web mode: Using PostgreSQL database');
}

// Import and initialize database
try {
  if (isElectron) {
    // In Electron mode, use SQLite
    const { initializeDatabase } = await import('./server/sqlite-db.js');
    await initializeDatabase();
    console.log('SQLite database initialized successfully');
  } else {
    // In web mode, check if PostgreSQL migration is needed
    const { migrateExistingData } = await import('./server/migrate.js');
    await migrateExistingData();
    console.log('PostgreSQL database checked/migrated successfully');
  }
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

// Start the server
try {
  await import('./server/index.js');
  console.log(`Server started successfully in ${isElectron ? 'Electron' : 'Web'} mode`);
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}