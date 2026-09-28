import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AddCategoryButton } from "@/components/AddCategoryButton";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meal Chooser",
  description: "Your favourite meals, categories, meal plans and nutrition.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍲</text></svg>",
  },
};

const nav = [
  { href: "/plan", label: "📅 Plan" },
  { href: "/cook", label: "🧺 What can I cook?" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
              <span className="text-2xl">🍲</span> Meal Chooser
            </Link>
            <nav className="order-last flex w-full gap-1 text-sm sm:order-none sm:w-auto">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex gap-2">
              <AddCategoryButton />
              <Link href="/meals/new" className="btn-primary">
                + Meal
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
