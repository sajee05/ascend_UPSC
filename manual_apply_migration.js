import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Determine DB path (simplified from server/sqlite-db.ts for this script)
let dbPath;
if (process.env.SQLITE_DB_PATH) {
  dbPath = process.env.SQLITE_DB_PATH;
} else if (process.env.APP_DATA_PATH) {
  const dbDir = process.env.APP_DATA_PATH;
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbPath = path.join(dbDir, 'ascend-upsc.db');
} else {
  dbPath = path.join(process.cwd(), 'ascend-upsc.db');
}

console.log(`Attempting to connect to database at: ${dbPath}`);

let db;
try {
  db = new Database(dbPath);
  console.log('Successfully connected to the database.');

  const createTableSql = `
CREATE TABLE IF NOT EXISTS \`application_configuration\` (
  \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  \`theme\` text DEFAULT 'light',
  \`primary_color\` text DEFAULT 'blue',
  \`animations\` integer DEFAULT 1,
  \`ai_enabled\` integer DEFAULT 1,
  \`ai_api_key\` text DEFAULT '',
  \`ai_model\` text DEFAULT 'gemini-2.0-flash',
  \`subject_tagging_ai_model\` text DEFAULT 'gemini-1.5-flash',
  \`subject_tagging_prompt\` text,
  \`analytics_prompt\` text,
  \`explanation_prompt\` text,
  \`study_plan_prompt\` text,
  \`learning_pattern_prompt\` text,
  \`parsing_prompt_title\` text,
  \`updated_at\` text NOT NULL
);`;

  db.exec(createTableSql);
  console.log('Successfully executed CREATE TABLE statement for application_configuration.');
  
  // Additionally, let's ensure the __drizzle_migrations table has the entry for this migration
  // This is a simplified approach; a proper migration tool would handle this more robustly.
  // We'll add the migration entry if the table exists.
  
  // First, check if __drizzle_migrations table exists
  const migrationTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations';").get();
  if (migrationTableCheck) {
    console.log('__drizzle_migrations table exists.');
    // Check if the specific migration entry exists
    const migrationEntry = db.prepare("SELECT id FROM __drizzle_migrations WHERE id = '0001_add_app_config_table';").get();
    if (!migrationEntry) {
      console.log("Migration entry '0001_add_app_config_table' not found in __drizzle_migrations. Inserting it.");
      // Get the current timestamp in the format Drizzle uses (e.g., YYYY-MM-DD HH:MM:SS.SSS)
      const now = new Date();
      const pad = (num) => String(num).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`;

      db.prepare("INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)")
        .run('0001_add_app_config_table', '0001_add_app_config_table_hash_placeholder', timestamp); // Using a placeholder hash
      console.log("Inserted migration entry '0001_add_app_config_table' into __drizzle_migrations.");
    } else {
      console.log("Migration entry '0001_add_app_config_table' already exists in __drizzle_migrations.");
    }
  } else {
    console.log("__drizzle_migrations table does not exist. Skipping entry insertion. Drizzle should create this table and entries on next run if needed.");
  }

} catch (err) {
  console.error('Error during manual migration script:', err.message);
} finally {
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
}