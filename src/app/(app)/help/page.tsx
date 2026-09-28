import { headers } from "next/headers";
import { ImportBackupForm } from "@/components/ImportBackupForm";
import { aiAvailable } from "@/lib/nutrients";

export const dynamic = "force-dynamic";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 space-y-3 p-6 text-sm leading-relaxed text-stone-700">
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function Status({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${on ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
      {on ? "✓ " : ""}
      {children}
    </span>
  );
}

const EXAMPLE = `{
  "name": "Shepherd's pie",
  "description": "Cozy potato-topped beef pie",
  "servings": 4,
  "prepMinutes": 20,
  "cookMinutes": 45,
  "difficulty": "medium",
  "diet": null,
  "babyFriendly": true,
  "categories": ["Weekly meal"],
  "ingredients": [
    { "name": "Potatoes", "quantity": 800, "unit": "g" },
    { "name": "Beef mince", "quantity": 500, "unit": "g" },
    { "name": "Onions", "quantity": 2, "unit": "pcs" },
    { "name": "Salt", "unit": "to taste", "staple": true }
  ],
  "steps": ["Boil and mash the potatoes.", "Fry onions and beef.", "Bake 25 min at 200 °C."],
  "links": [{ "url": "https://www.youtube.com/watch?v=…", "label": "Video" }]
}`;

export default async function HelpPage() {
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const apiOn = Boolean(process.env.API_KEY);
  const ai = aiAvailable();

  const toc = [
    ["search", "🔍 Search"],
    ["users", "👥 Users & chat"],
    ["share", "🔗 Share a meal"],
    ["backup", "💾 Backup & restore"],
    ["api", "🤖 Add meals automatically"],
    ["ai", "✨ AI estimates"],
    ["settings", "⚙️ Settings"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
        <p className="text-stone-600">How to share meals, keep a backup and connect other tools.</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {toc.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm hover:border-stone-400">
            {label}
          </a>
        ))}
      </nav>

      <Section id="search" title="🔍 Search">
        <p>
          Type in the search box on the main page, e.g. <b>chicken</b>. It looks in meal names, descriptions,
          ingredients, steps, categories and the author&apos;s name. Several words narrow it down (&quot;chicken
          rice&quot; finds meals with both). You can combine it with a category.
        </p>
      </Section>

      <Section id="users" title="👥 Users & chat">
        <p>
          Tap the round initial at the top right to choose who you are (Roger or Gabriela). The app remembers it on
          this device. Meals you add show your name, and your chat messages appear under your name.
        </p>
        <p>
          Every meal has a <b>💬 Chat</b> at the bottom. Write tips, changes you made, or who liked it. Press Enter to
          send (Shift + Enter for a new line). Your own messages are green on the right; you can delete them with the ✕
          next to them.
        </p>
        <p>The whole app is still protected by the site password.</p>
      </Section>

      <Section id="share" title="🔗 Share a meal">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open the meal.</li>
          <li>
            Tap <b>🔗 Share</b>. A private link is created and <b>Copy share link</b> appears.
          </li>
          <li>Send the link to anyone. They can view the photo, shopping list, steps, price and nutrition.</li>
        </ol>
        <p>
          People with the link <b>cannot change anything</b> and don&apos;t need a password. They only see that one
          meal. To stop sharing, tap <b>Stop</b> next to the link; the old link then stops working.
        </p>
      </Section>

      <Section id="backup" title="💾 Backup & restore">
        <p>
          A backup is one file with all your <b>meals and categories</b> (ingredients, steps, links, prices and
          nutrition). Photos and the meal plan are not included.
        </p>
        <p>
          <a href="/api/backup" className="btn-primary">
            ⬇️ Download backup
          </a>
        </p>
        <p className="text-stone-500">Tip: download one every now and then and keep it in your cloud storage.</p>
        <h3 className="pt-2 font-semibold text-stone-900">Restore from a backup</h3>
        <ImportBackupForm />
      </Section>

      <Section id="api" title="🤖 Add meals automatically">
        <p>
          Other tools, for example an AI assistant or a shortcut on your phone, can add meals for you through the
          app&apos;s API. Status: <Status on={apiOn}>{apiOn ? "API is on" : "API is off"}</Status>
        </p>
        <h3 className="pt-1 font-semibold text-stone-900">Turn it on</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            In Vercel, open your project → <b>Settings → Environment Variables</b>.
          </li>
          <li>
            Add <code className="rounded bg-stone-100 px-1">API_KEY</code> with a long random secret (like a
            password, at least 32 characters).
          </li>
          <li>Redeploy. Give the key only to tools you trust; anyone with it can add meals.</li>
        </ol>
        <h3 className="pt-1 font-semibold text-stone-900">How tools use it</h3>
        <p>
          Send a <b>POST</b> request to <code className="rounded bg-stone-100 px-1">{origin}/api/v1/meals</code> with
          the header <code className="rounded bg-stone-100 px-1">Authorization: Bearer YOUR_API_KEY</code> and a meal
          as JSON. Everything except <code>name</code> is optional; missing categories are created. To add several
          meals at once, send <code>{`{ "meals": [ … ] }`}</code>.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-stone-100">{EXAMPLE}</pre>
        <p className="text-stone-500">
          Units: g, kg, ml, l, pcs, tsp, tbsp, cup, clove, slice, can, bunch, pinch, &quot;to taste&quot;. Difficulty:
          easy, medium, hard. Diet: vegetarian, vegan. Also available:{" "}
          <code>GET /api/v1/meals</code> and <code>GET /api/v1/categories</code>.
        </p>
      </Section>

      <Section id="ai" title="✨ AI estimates">
        <p>
          Status: <Status on={ai}>{ai ? "AI is on" : "AI is off"}</Status>
        </p>
        <p>
          When AI is on, each meal gets buttons to estimate <b>nutrition</b> and <b>Migros prices</b>. When it is off,
          you can type the values in yourself on the meal page. To turn it on, add{" "}
          <code className="rounded bg-stone-100 px-1">AI_MODEL</code> and{" "}
          <code className="rounded bg-stone-100 px-1">AI_GATEWAY_API_KEY</code> in Vercel&apos;s environment
          variables and redeploy.
        </p>
      </Section>

      <Section id="settings" title="⚙️ Settings">
        <p>These are set in Vercel under Settings → Environment Variables (redeploy afterwards):</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>APP_PASSWORD</code>: a simple shared password for the whole app (shared meals stay viewable).
          </li>
          <li>
            <code>APP_TIMEZONE</code>: your time zone for &quot;today&quot; in the plan, e.g. Europe/Zurich.
          </li>
        </ul>
      </Section>
    </div>
  );
}
