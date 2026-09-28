// Finds the Postgres connection string. Vercel storage integrations may add a
// custom prefix to their variables (e.g. MEAL_DB_DATABASE_URL), so fall back
// to any variable that ends in DATABASE_URL or POSTGRES_URL.
export function findDatabaseUrl(env = process.env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.POSTGRES_URL) return env.POSTGRES_URL;
  const keys = Object.keys(env).sort();
  for (const suffix of ["DATABASE_URL", "POSTGRES_URL"]) {
    const key = keys.find((k) => k.toUpperCase().endsWith(`_${suffix}`) && env[k]);
    if (key) return env[key];
  }
  return undefined;
}
