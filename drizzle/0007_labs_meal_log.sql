CREATE TABLE "meal_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" text NOT NULL,
	"slot" text NOT NULL,
	"user_id" integer,
	"meal_id" integer,
	"label" text,
	"portions" real DEFAULT 1 NOT NULL,
	"planned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_log" ADD CONSTRAINT "meal_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_log" ADD CONSTRAINT "meal_log_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_log_day_idx" ON "meal_log" USING btree ("day");