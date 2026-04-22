import Link from "next/link";

import { pagePath } from "@/lib/utils";

const navItems = [
  { slug: "home", label: "Главная" },
  { slug: "wedding", label: "Свадьбы" },
  { slug: "corporate", label: "Корпоративы" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.32em] text-white">
          Roman Shumilov
        </Link>
        <nav className="flex items-center gap-4 text-sm text-white/70 sm:gap-6">
          {navItems.map((item) => (
            <Link key={item.slug} href={pagePath(item.slug)} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-full border border-white/15 px-4 py-2 text-white transition hover:border-white/40"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
