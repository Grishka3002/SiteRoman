import Image from "next/image";
import Link from "next/link";

import { FloatingVideoWidget } from "@/components/public/floating-video-widget";
import type { SitePages } from "@/lib/content";

type HomePageProps = {
  page: SitePages["home"];
};

const sectionClass = "tilda-section tilda-reveal px-4 pb-12 pt-16 sm:px-6 lg:pb-16 lg:pt-20";
const compactSectionClass = "tilda-section tilda-reveal px-4 pb-12 pt-14 sm:px-6 lg:pb-16 lg:pt-20";
const sectionTitleClass = "mt-4 text-[clamp(2.45rem,5.6vw,5.4rem)] font-bold uppercase leading-[0.9] tracking-[-0.055em]";

export function HomePage({ page }: HomePageProps) {
  return (
    <>
      <section className="relative min-h-[720px] overflow-hidden bg-[#ffe100] text-black sm:min-h-[760px] lg:min-h-[820px]">
        <div className="tilda-hero-backdrop pointer-events-none absolute inset-x-0 top-8 z-0 overflow-hidden px-4 text-right sm:top-10">
          <span className="block">Роман</span>
          <span className="block">Шумилов</span>
        </div>
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[92rem] gap-8 px-4 pb-0 pt-10 sm:min-h-[760px] sm:px-6 sm:pt-14 lg:min-h-[820px] lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:pt-16">
          <div className="relative z-20 pb-10 lg:pt-2">
            <h1 className="tilda-hero-title max-w-[760px] text-[clamp(2.85rem,6.8vw,6.6rem)] font-black uppercase leading-[0.86] tracking-[-0.075em]">
              {page.hero.title}
            </h1>
            <p className="tilda-hero-copy mt-6 max-w-2xl text-[clamp(1rem,1.55vw,1.18rem)] font-medium leading-7 text-black/70">
              {page.hero.subtitle}
            </p>
            <div className="tilda-hero-actions mt-8 flex flex-wrap gap-3">
              <Link href="/wedding" className="tilda-button tilda-button-outline-dark">
                Свадьбы
              </Link>
              <Link href="/corporate" className="tilda-button tilda-button-outline-dark">
                Корпоративы
              </Link>
            </div>
            <div className="tilda-hero-stats mt-8 grid gap-3 sm:grid-cols-3">
              {page.hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-[1rem] border border-black/10 bg-white/25 p-4 backdrop-blur">
                  <div className="text-[clamp(1.2rem,2.5vw,1.7rem)] font-black uppercase tracking-[-0.04em]">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[390px] self-end sm:min-h-[500px] lg:min-h-[640px]">
            <div className="absolute bottom-[-5%] left-1/2 aspect-square w-[min(78vw,560px)] -translate-x-1/2 lg:left-[62%] lg:w-[min(38vw,620px)]">
              <div className="tilda-hero-circle absolute inset-0 rounded-full bg-black" />
              <Image
                src={page.hero.image}
                alt={page.hero.title}
                fill
                priority
                sizes="(max-width: 768px) 78vw, 38vw"
                className="tilda-hero-portrait absolute bottom-0 object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-black text-white`} id="about">
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">О ведущем</p>
            <h2 className={sectionTitleClass}>{page.bio.title}</h2>
          </div>
          <div className="grid gap-5">
            {page.bio.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-[clamp(1rem,1.8vw,1.24rem)] font-medium leading-8 text-white/72">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className={`${compactSectionClass} bg-[#050505] text-white`}>
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Форматы</p>
          <h2 className={sectionTitleClass}>Свадьбы и корпоративы</h2>
          <div className="tilda-stagger mt-10 grid gap-5 lg:grid-cols-2">
            {page.audiences.map((audience) => (
              <Link key={audience.slug} href={audience.href} className="group grid overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#151515] transition hover:-translate-y-1 hover:border-[#ffe100]/50 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[320px] overflow-hidden bg-black">
                  <Image
                    src={audience.image}
                    alt={audience.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 32vw"
                    className="object-cover opacity-82 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                </div>
                <div className="flex flex-col justify-between p-6 sm:p-8">
                  <div>
                    <h3 className="text-[clamp(2.1rem,4vw,3.6rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">{audience.title}</h3>
                    <p className="mt-5 text-base font-medium leading-7 text-white/62">{audience.description}</p>
                  </div>
                  <span className="tilda-button tilda-button-yellow mt-8 w-fit text-sm">
                    Перейти
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-black text-white`}>
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Почему со мной спокойно</p>
          <h2 className={sectionTitleClass}>Подготовка, в которой есть структура, вкус и уважение к гостям</h2>
          <div className="tilda-stagger mt-10 grid gap-4 md:grid-cols-3">
            {page.highlights.map((item) => (
              <article key={item.title} className="rounded-[1.25rem] border border-white/10 bg-[#151515] p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.24)]">
                <h3 className="text-[clamp(1.45rem,2.8vw,2.25rem)] font-black uppercase leading-none tracking-[-0.04em] text-white">{item.title}</h3>
                <p className="mt-5 text-sm font-medium leading-6 text-white/65">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FloatingVideoWidget
        localSrc="/media/videos/360p_f5fe27dad4.mp4"
        posterSrc="/media/imported/u0xnpEbFOLk21_0f44640ec8.jpg"
      />
    </>
  );
}
