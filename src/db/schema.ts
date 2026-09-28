import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { CostEstimate } from "@/lib/cost";
import type { NutritionEstimate } from "@/lib/nutrients";
import type { Diet, Difficulty, Ingredient, MealLink } from "@/lib/meal-fields";

/** The people using the app. There is no login: everyone picks who they are at the top right. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  servings: integer("servings").notNull().default(1),
  prepMinutes: integer("prep_minutes"),
  cookMinutes: integer("cook_minutes"),
  difficulty: text("difficulty").$type<Difficulty>(),
  diet: text("diet").$type<Diet>(),
  babyFriendly: boolean("baby_friendly").notNull().default(false),
  // Older rows stored plain strings like "200 g chicken"; see normalizeIngredients().
  ingredients: jsonb("ingredients").$type<(Ingredient | string)[]>().notNull().default([]),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  /** Optional sources: recipe pages, videos … */
  links: jsonb("links").$type<MealLink[]>().notNull().default([]),
  /** Legacy free-text instructions, replaced by `steps`. */
  instructions: text("instructions"),
  nutrition: jsonb("nutrition").$type<NutritionEstimate>(),
  nutritionEstimatedAt: timestamp("nutrition_estimated_at", { withTimezone: true }),
  cost: jsonb("cost").$type<CostEstimate>(),
  costEstimatedAt: timestamp("cost_estimated_at", { withTimezone: true }),
  /** Secret for the public read-only link /s/<token>; null when not shared. */
  shareToken: text("share_token").unique(),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  emoji: text("emoji").notNull().default("🍽️"),
  color: text("color").notNull().default("#16a34a"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mealCategories = pgTable(
  "meal_categories",
  {
    mealId: integer("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.mealId, t.categoryId] })],
);

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const planEntries = pgTable(
  "plan_entries",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    slot: text("slot").$type<MealSlot>().notNull(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plan_entries_date_slot_idx").on(t.date, t.slot)],
);

/** Chat messages on a meal. */
export const mealComments = pgTable(
  "meal_comments",
  {
    id: serial("id").primaryKey(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meal_comments_meal_id_idx").on(t.mealId)],
);

export type Meal = typeof meals.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type PlanEntry = typeof planEntries.$inferSelect;
export type User = typeof users.$inferSelect;
export type MealComment = typeof mealComments.$inferSelect;
