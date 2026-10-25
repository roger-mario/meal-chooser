CREATE TABLE "meal_favourites" (
	"user_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_favourites_user_id_meal_id_pk" PRIMARY KEY("user_id","meal_id")
);
--> statement-breakpoint
CREATE TABLE "meal_views" (
	"user_id" integer NOT NULL,
	"meal_id" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_views_user_id_meal_id_pk" PRIMARY KEY("user_id","meal_id")
);
--> statement-breakpoint
ALTER TABLE "meals" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_favourites" ADD CONSTRAINT "meal_favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_favourites" ADD CONSTRAINT "meal_favourites_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_views" ADD CONSTRAINT "meal_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_views" ADD CONSTRAINT "meal_views_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;