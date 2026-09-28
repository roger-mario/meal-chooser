"use client";

import { useActionState, useState } from "react";
import { deleteCategory, updateCategory } from "@/app/actions/categories";
import type { Category } from "@/db/schema";
import { CategoryFields } from "./CategoryFields";
import { SubmitButton } from "./SubmitButton";

export function EditCategoryRow({ category, meals }: { category: Category; meals: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(async (prev: Parameters<typeof updateCategory>[1], fd: FormData) => {
    const res = await updateCategory(category.id, prev, fd);
    if (res?.ok) setEditing(false);
    return res;
  }, null);

  if (!editing) {
    return (
      <li className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${category.color}22` }}>
          {category.emoji}
        </span>
        <span className="flex-1 font-medium">{category.name}</span>
        <span className="text-sm text-stone-500">{meals} meal{meals === 1 ? "" : "s"}</span>
        <button className="btn" onClick={() => setEditing(true)}>
          Edit
        </button>
      </li>
    );
  }
  return (
    <li className="p-4">
      <form action={action} className="space-y-4">
        <CategoryFields initial={category} />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <SubmitButton>Save</SubmitButton>
          <button type="button" className="btn" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger ml-auto"
            onClick={async () => {
              if (confirm(`Delete "${category.name}"? Meals stay, only the tag is removed.`)) await deleteCategory(category.id);
            }}
          >
            Delete
          </button>
        </div>
      </form>
    </li>
  );
}
