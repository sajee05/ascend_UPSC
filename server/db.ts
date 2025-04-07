import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "./logger";

// For local development, use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL as string;

// Create a PostgreSQL client
export const client = postgres(connectionString);

// Create a Drizzle ORM instance
export const db = drizzle(client);

// Log database connection
logger("Database connected", "postgresql");