import Image from "next/image";
import Link from "next/link";

import type { SitePages } from "@/lib/content";

type HomePageProps = {
  page: SitePages["home"];
};

export function HomePage({ page }: HomePageProps) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#0b1220]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(200,163,106,0.22),_transparent_36%),radial-gradient(circle_at_left,_rgba(71,85,105,0.5),_transparent_42%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#c8a36a]">
              {page.hero.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {page.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {page.hero.subtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={page.hero.primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-[#c8a36a] px-6 py-3 text-sm font-semibold text-[#0b1220] transition hover:bg-[#d8b981]"
              >
                {page.hero.primaryLabel}
              </Link>
              <Link
                href={page.hero.secondaryHref}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                {page.hero.secondaryLabel}
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {page.hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <Image
              src={page.hero.image}
              alt={page.hero.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f2ede4] py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9a7b4d]">
              О ведущем
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              {page.bio.title}
            </h2>
          </div>
          <div className="grid gap-5 text-lg leading-8 text-[#374151]">
            {page.bio.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9a7b4d]">
              Выберите формат
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Отдельные лендинги под разные задачи
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {page.audiences.map((audience) => (
              <Link
                key={audience.slug}
                href={audience.href}
                className="group grid gap-6 overflow-hidden rounded-[2rem] border border-black/10 bg-[#0f172a] p-6 text-white transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:grid-cols-[0.94fr_1.06fr]"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src={audience.image}
                    alt={audience.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 28vw"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
                      Направление
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold">{audience.title}</h3>
                    <p className="mt-4 text-base leading-7 text-slate-300">
                      {audience.description}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-white">
                    Перейти на страницу
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf2] py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9a7b4d]">
              Почему со мной спокойно
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Подготовка, в которой есть структура, вкус и уважение к гостям
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {page.highlights.map((item) => (
              <article key={item.title} className="rounded-[1.75rem] border border-black/10 bg-white p-6">
                <h3 className="text-xl font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#4b5563]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
