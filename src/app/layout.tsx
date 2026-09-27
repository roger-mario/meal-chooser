import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meal Chooser",
  description: "Your favourite meals, categories, meal plans and nutrition.",
};

const nav = [
  { href: "/", label: "Meals" },
  { href: "/plan", label: "Plan" },
  { href: "/categories", label: "Categories" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-emerald-800">
              Meal Chooser
            </Link>
            <nav className="flex gap-4 text-sm">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-stone-600 hover:text-stone-900">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href="/meals/new" className="btn-primary ml-auto">
              + Add meal
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
