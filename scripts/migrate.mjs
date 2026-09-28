import { execSync } from "node:child_process";
import { findDatabaseUrl } from "./database-url.mjs";

if (!findDatabaseUrl()) {
  const candidates = Object.keys(process.env).filter((k) => /(^|_)(DATABASE|POSTGRES|PG|NEON)/i.test(k));
  console.warn(
    "\n⚠ No database connection string found, skipping migrations.\n" +
      "  Connect the Neon database to this project (Storage tab) for this environment.\n" +
      `  Database-related variables present: ${candidates.join(", ") || "none"}\n`,
  );
  process.exit(0);
}
execSync("npx drizzle-kit migrate", { stdio: "inherit" });
