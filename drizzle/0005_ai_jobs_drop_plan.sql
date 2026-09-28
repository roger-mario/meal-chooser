DROP TABLE "plan_entries" CASCADE;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "cost_job_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "cost_job_error" text;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "nutrition_job_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "nutrition_job_error" text;