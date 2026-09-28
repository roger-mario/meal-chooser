import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { findDatabaseUrl } from "./scripts/database-url.mjs";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: findDatabaseUrl()! },
});
