ALTER TABLE "meals" ADD COLUMN "links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_share_token_unique" UNIQUE("share_token");