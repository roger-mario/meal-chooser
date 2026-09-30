"use client";

import { useActionState, useRef, useState } from "react";
import { createCategory, type CategoryFormState } from "@/app/actions/categories";
import { CategoryFields } from "./CategoryFields";
import { SubmitButton } from "./SubmitButton";

export function AddCategoryButton({ className = "btn" }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState(async (prev: CategoryFormState, fd: FormData) => {
    const res = await createCategory(prev, fd);
    if (res?.ok) dialog.current?.close();
    return res;
  }, null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setFormKey((k) => k + 1);
          dialog.current?.showModal();
        }}
      >
        + Category
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-stone-900/40"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <form key={formKey} action={action} className="space-y-5 p-6">
          <h2 className="text-lg font-semibold">New category</h2>
          <CategoryFields />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <SubmitButton>Create</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
