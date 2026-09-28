ALTER TABLE "categories" ADD COLUMN "emoji" text DEFAULT '🍽️' NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "cook_minutes" integer;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "diet" text;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "steps" jsonb DEFAULT '[]'::jsonb NOT NULL;