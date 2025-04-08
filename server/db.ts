import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "./logger";

let client: ReturnType<typeof postgres> | null = null;
let db: any = null;

try {
  // For local development, use the DATABASE_URL environment variable
  const connectionString = process.env.DATABASE_URL as string;

  if (connectionString && process.env.DB_TYPE !== 'sqlite') {
    // Create a PostgreSQL client
    client = postgres(connectionString);
    
    // Create a Drizzle ORM instance
    db = drizzle(client);
    
    // Log database connection
    logger("Database connected", "postgresql");
  } else {
    logger("No PostgreSQL connection string provided or SQLite mode is active", "postgresql");
  }
} catch (error) {
  logger(`Error connecting to PostgreSQL: ${error}`, "postgresql");
}

export { client, db };