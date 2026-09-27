CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#16a34a' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meal_categories" (
	"meal_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "meal_categories_meal_id_category_id_pk" PRIMARY KEY("meal_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"servings" integer DEFAULT 1 NOT NULL,
	"prep_minutes" integer,
	"ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructions" text,
	"nutrition" jsonb,
	"nutrition_estimated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"slot" text NOT NULL,
	"meal_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_categories" ADD CONSTRAINT "meal_categories_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_categories" ADD CONSTRAINT "meal_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_entries" ADD CONSTRAINT "plan_entries_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_entries_date_slot_idx" ON "plan_entries" USING btree ("date","slot");