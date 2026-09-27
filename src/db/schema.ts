import {
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { NutritionEstimate } from "@/lib/nutrients";

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  servings: integer("servings").notNull().default(1),
  prepMinutes: integer("prep_minutes"),
  // Shopping list: one ingredient per entry, e.g. "200 g chicken breast".
  ingredients: jsonb("ingredients").$type<string[]>().notNull().default([]),
  instructions: text("instructions"),
  nutrition: jsonb("nutrition").$type<NutritionEstimate>(),
  nutritionEstimatedAt: timestamp("nutrition_estimated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
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

export type Meal = typeof meals.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type PlanEntry = typeof planEntries.$inferSelect;
