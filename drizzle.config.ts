import { defineConfig } from "drizzle-kit";

// No longer need DATABASE_URL check for SQLite

export default defineConfig({
  out: "./migrations",
  schema: "./shared/sqlite-schema.ts", // Use SQLite specific schema
  dialect: "sqlite", // Change dialect to SQLite
  dbCredentials: {
    url: "file:./ascend-upsc.db", // Point to the SQLite file
  },
});
