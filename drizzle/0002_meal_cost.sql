ALTER TABLE "meals" ADD COLUMN "cost" jsonb;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "cost_estimated_at" timestamp with time zone;