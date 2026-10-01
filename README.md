# Otao

Save your favourite meals with a picture, shopping list and cooking instructions, group them into categories
(e.g. "Weekly meal", "Baby dinner"), chat about them, and see AI estimates of Migros prices and of calories,
macros and micronutrients (vitamins, minerals, choline, omega-3 …).

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Postgres on Neon via the Vercel Marketplace, with Drizzle ORM
- Vercel Blob for photos
- Vercel AI Gateway + AI SDK for nutrition estimates (model chosen with `AI_MODEL`)

## Deploying on Vercel

1. Import the GitHub repo in Vercel.
2. In the project's **Storage** tab, add a **Neon** Postgres database and a **Blob** store. Both inject their
   environment variables automatically.
3. In **Settings → Environment Variables**, add:
   - `APP_TIMEZONE`, e.g. `Europe/Zurich` (used for dates and chat times)
   - `APP_PASSWORD` (optional) to protect the site; it is asked once on a sign-in page and each device remembers it
   - `AI_MODEL` and `AI_GATEWAY_API_KEY` (optional) to turn on AI nutrition estimates. Without them,
     nutrition values are entered manually on each meal.
   - `API_KEY` (optional) to turn on the `/api/v1` endpoints for adding meals
4. Redeploy so the new variables take effect.
The `vercel-build` script runs database migrations on every deploy. It finds the connection string in `DATABASE_URL`, `POSTGRES_URL`, or a prefixed variant such as `MEAL_DB_DATABASE_URL`.

## Local development

```bash
npm install
vercel env pull .env.local   # or copy .env.example to .env.local and fill it in
npm run db:migrate
npm run dev
```

After changing `src/db/schema.ts`, run `npm run db:generate` to create a new migration.

The app icon lives in `public/icon.svg`. After changing it, run `node scripts/make-icons.mjs` to update the PNG icons
used by phones' home screens.

## Project layout

- `src/db/schema.ts`: tables for meals, categories, meal↔category links, users and chat messages
- `src/lib/nutrients.ts`: the list of nutrients, units and daily values shown on each meal
- `src/lib/nutrition-ai.ts`: builds the prompt and structured schema for the AI estimate
- `src/app/actions/*`: server actions for meals, categories, chat, users and backup
