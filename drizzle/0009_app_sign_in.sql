CREATE TABLE "app_invites" (
	"code" text PRIMARY KEY NOT NULL,
	"created_by" integer,
	"for_user_id" integer,
	"used_by" integer,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "app_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "collection_meals" (
	"collection_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_meals_collection_id_meal_id_pk" PRIMARY KEY("collection_id","meal_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_identities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"subject" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sign_in_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_log" ADD COLUMN "cook_id" integer;--> statement-breakpoint
ALTER TABLE "app_invites" ADD CONSTRAINT "app_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_invites" ADD CONSTRAINT "app_invites_for_user_id_users_id_fk" FOREIGN KEY ("for_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_invites" ADD CONSTRAINT "app_invites_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_meals" ADD CONSTRAINT "collection_meals_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_meals" ADD CONSTRAINT "collection_meals_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_sessions_user_idx" ON "app_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collections_user_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identities_provider_subject_idx" ON "user_identities" USING btree ("provider","subject");--> statement-breakpoint
CREATE INDEX "user_identities_user_idx" ON "user_identities" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "meal_log" ADD CONSTRAINT "meal_log_cook_id_users_id_fk" FOREIGN KEY ("cook_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;