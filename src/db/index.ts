import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { findDatabaseUrl } from "../../scripts/database-url.mjs";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | undefined;

// Created lazily so builds work without a database connection.
export function db() {
  if (!_db) {
    const url = findDatabaseUrl();
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

export * from "./schema";
