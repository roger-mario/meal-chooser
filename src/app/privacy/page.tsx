import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Otao" };

/** Public privacy policy, linked from the phone app and from the App Store listing. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <article className="card space-y-5 p-6 text-sm leading-relaxed text-stone-700">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Privacy</h1>
        <p>Otao is a small, invite-only recipe and meal-planning app for a household and its friends. This page explains what it stores and why.</p>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">Signing in</h2>
          <p>
            You sign in with Apple, Google or Microsoft. Otao receives an account id and, if the provider shares it, your email address and first name. They are used only to sign
            you in and to link you to your household. Otao never sees your password.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">What Otao stores</h2>
          <p>
            The recipes you add, your likes and collections, the shared meal plan, comments, and a sign-in token per device. What you type under &ldquo;What&rsquo;s at home&rdquo; and your
            food preferences stay on your phone.
          </p>
          <p>Nutrition and price estimates are calculated from a recipe&rsquo;s ingredients by an AI service. Only the recipe is sent, never who you are.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">Sharing</h2>
          <p>
            Your recipes and the plan are visible to the people in your household and the friends you invite. Sending a list to Bring! shares those ingredients with Bring!. Otao has
            no ads and doesn&rsquo;t sell or share data for tracking.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-stone-900">Deleting your account</h2>
          <p>
            In the app, go to You &rarr; Delete account. This removes your sign-ins, sessions, likes and collections at once. Recipes you added stay with your household unless you
            ask us to remove them.
          </p>
        </section>
      </article>
    </main>
  );
}
