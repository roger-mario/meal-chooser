# Meal Chooser

Save your favourite meals with a picture, shopping list and cooking instructions, group them into categories
(e.g. "Weekly meal", "Baby dinner"), get meal plan suggestions for today, tomorrow, the next 7 days or a full
month, and see an AI estimate of calories, macros and micronutrients (vitamins, minerals, choline, omega-3 …).

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- Postgres on Neon via the Vercel Marketplace, with Drizzle ORM
- Vercel Blob for photos
- Vercel AI Gateway + AI SDK for nutrition estimates (model chosen with `AI_MODEL`)

## Deploying on Vercel

1. Import the GitHub repo in Vercel.
2. In the project's **Storage** tab, add a **Neon** Postgres database and a **Blob** store. Both inject their
   environment variables automatically.
3. Enable **AI Gateway** for the project and set `AI_MODEL` to a model id from the gateway's model list.
4. Set `APP_TIMEZONE` (and optionally `APP_PASSWORD`).
5. Deploy. The `vercel-build` script runs database migrations before building.

## Local development

```bash
npm install
vercel env pull .env.local   # or copy .env.example to .env.local and fill it in
npm run db:migrate
npm run dev
```

After changing `src/db/schema.ts`, run `npm run db:generate` to create a new migration.

## Project layout

- `src/db/schema.ts`: tables for meals, categories, meal↔category links and plan entries
- `src/lib/nutrients.ts`: the list of nutrients, units and daily values shown on each meal
- `src/lib/nutrition-ai.ts`: builds the prompt and structured schema for the AI estimate
- `src/lib/planner.ts`: rule-based plan suggestions (rotates meals, avoids repeats)
- `src/app/actions/*`: server actions for meals, categories and the plan
