import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { logger } from "./logger";

// For local development, use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL as string;

// Create a PostgreSQL client
export const client = postgres(connectionString);

// Create a Drizzle ORM instance
export const db = drizzle(client);

// Export sql for use in other modules
export { sql };

// Log database connection
logger("Database connected", "postgresql");