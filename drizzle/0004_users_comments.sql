CREATE TABLE "meal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"user_id" integer,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "baby_friendly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "author_id" integer;--> statement-breakpoint
ALTER TABLE "meal_comments" ADD CONSTRAINT "meal_comments_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_comments" ADD CONSTRAINT "meal_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_comments_meal_id_idx" ON "meal_comments" USING btree ("meal_id");--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "users" ("name") VALUES ('Roger'), ('Gabriela') ON CONFLICT ("name") DO NOTHING;
