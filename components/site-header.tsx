import Link from "next/link";

import { pagePath } from "@/lib/utils";

const navItems = [
  { slug: "home", label: "Главная" },
  { slug: "wedding", label: "Свадьбы" },
  { slug: "corporate", label: "Корпоративы" },
];

export function SiteHeader() {
  return (
    <header className="tilda-nav fixed left-0 right-0 top-0 z-[100] px-3 py-3 sm:px-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/88 px-3 py-3 text-white shadow-2xl backdrop-blur-xl sm:px-4 md:gap-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#ffe100]" />
          <span className="text-sm font-black uppercase tracking-[0.22em]">Шумилов</span>
        </Link>
        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link key={item.slug} href={pagePath(item.slug)} className="text-xs font-bold uppercase tracking-[0.18em] text-white/72 transition hover:text-[#ffe100]">
              {item.label}
            </Link>
          ))}
        </div>
        <Link href="/wedding#contact" className="tilda-button tilda-button-yellow min-h-0 px-3 py-2 text-[0.68rem] sm:px-4 sm:text-xs">
          Заявка
        </Link>
      </nav>
    </header>
  );
}
