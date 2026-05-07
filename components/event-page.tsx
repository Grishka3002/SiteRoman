import Image from "next/image";
import Link from "next/link";

import { submitInquiry } from "@/app/actions";
import { LeadForm } from "@/components/lead-form";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { FloatingVideoWidget } from "@/components/public/floating-video-widget";
import { TestimonialSlider } from "@/components/public/testimonial-slider";
import type { SitePages } from "@/lib/content";

type EventPageProps = {
  page: SitePages["wedding"] | SitePages["corporate"];
};

const sectionClass = "tilda-section tilda-reveal px-4 pb-12 pt-16 sm:px-6 lg:pb-16 lg:pt-20";
const sectionTitleClass = "mt-4 text-[clamp(2.35rem,5vw,4.65rem)] font-bold uppercase leading-[0.94] tracking-[-0.035em]";

export function EventPage({ page }: EventPageProps) {
  return (
    <>
      <section className="relative min-h-[720px] overflow-hidden bg-[#ffe100] text-black sm:min-h-[760px] lg:min-h-[820px]">
        <FloatingNav page={page} />
        <div className="hidden">
          <span className="block">Роман</span>
          <span className="block">Шумилов</span>
        </div>
        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[92rem] gap-8 px-4 pb-0 pt-24 sm:min-h-[760px] sm:px-6 sm:pt-28 lg:min-h-[820px] lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:pt-32">
          <div className="relative z-20 pb-10">
            <p className="tilda-hero-kicker text-xs font-black uppercase tracking-[0.45em]">{page.hero.eyebrow}</p>
            <h1 className="tilda-hero-title mt-5 max-w-[680px] text-[clamp(2.35rem,4.65vw,4.15rem)] font-black uppercase leading-[0.88] tracking-[-0.075em]">
              {page.hero.subtitle}
            </h1>
            <p className="tilda-hero-copy mt-6 max-w-2xl text-[clamp(1rem,1.55vw,1.18rem)] font-medium leading-7 text-black/70">
              {page.intro.title}
            </p>
            <div className="tilda-hero-stats mt-8 grid gap-3 sm:grid-cols-3">
              {page.hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-[1rem] border border-black/10 bg-white/25 p-4 backdrop-blur">
                  <div className="text-[clamp(1.2rem,2.5vw,1.7rem)] font-black uppercase tracking-[-0.04em]">{stat.value}</div>
                  <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-black/55">{stat.label}</div>
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
                className="tilda-hero-portrait object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-black text-white`} id="about">
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">О проекте</p>
            <h2 className={sectionTitleClass}>{page.intro.title}</h2>
          </div>
          <div className="grid gap-5">
            {page.intro.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-[clamp(1rem,1.8vw,1.24rem)] font-medium leading-8 text-white/72">
                {paragraph}
              </p>
            ))}
            <div className="tilda-stagger mt-3 grid gap-4 sm:grid-cols-2">
              {page.advantages.map((advantage) => (
                <article key={advantage.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                  <h3 className="text-[clamp(1.25rem,2.4vw,1.7rem)] font-black uppercase tracking-[-0.04em] text-[#ffe100]">{advantage.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/62">{advantage.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-[#050505] text-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Пакеты</p>
              <h2 className={sectionTitleClass}>Форматы</h2>
            </div>
            <p className="max-w-md text-[clamp(0.98rem,1.5vw,1.12rem)] font-medium leading-7 text-white/60">
              Точная стоимость зависит от даты, города, тайминга и состава команды. Пакеты помогают быстро выбрать направление.
            </p>
          </div>

          <div className="tilda-stagger mt-10 grid gap-5 lg:grid-cols-3">
            {page.packages.map((pkg) => (
              <article key={pkg.name} className="rounded-[1.5rem] border border-white/10 bg-[#151515] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[clamp(2rem,4vw,2.7rem)] font-black uppercase tracking-[-0.06em]">{pkg.name}</h3>
                  {pkg.tag ? <span className="rounded-full bg-[#ffe100] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-black">{pkg.tag}</span> : null}
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-white/62">{pkg.description}</p>
                <ul className="mt-6 grid gap-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-white/78">
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#ffe100]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionClass} bg-black text-white`} id="gallery">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Фотографии</p>
          <h2 className={sectionTitleClass}>Атмосфера</h2>
          <div className="tilda-stagger mt-10 grid auto-rows-[clamp(220px,52vw,320px)] gap-4 md:grid-cols-3 md:auto-rows-[clamp(240px,22vw,330px)]">
            {page.gallery.map((image, index) => (
              <div key={`${image}-${index}`} className={["relative overflow-hidden rounded-[15px] bg-[#151515]", index === 0 || index === 3 ? "md:row-span-2" : ""].join(" ")}>
                <Image
                  src={image}
                  alt={`${page.hero.title} ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialSlider testimonials={page.testimonials} />

      <section className={`${sectionClass} bg-[#050505] text-white`}>
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">FAQ</p>
            <h2 className={sectionTitleClass}>Вопросы</h2>
          </div>
          <FaqAccordion items={page.faq} />
        </div>
      </section>

      <section id="contact" className="tilda-section bg-[#ffe100] px-4 pb-12 pt-16 text-black sm:px-6 lg:pb-16 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <LeadForm
            pageSlug={page.slug}
            pageKind={page.kind}
            title={page.leadForm.title}
            subtitle={page.leadForm.subtitle}
            gifts={page.leadForm.gifts}
            action={submitInquiry}
          />
        </div>
      </section>
      <FloatingVideoWidget
        localSrc="/media/videos/360p_f5fe27dad4.mp4"
        posterSrc="/media/imported/u0xnpEbFOLk21_0f44640ec8.jpg"
      />
    </>
  );
}

function FloatingNav({ page }: { page: SitePages["wedding"] | SitePages["corporate"] }) {
  const navItems = "nav" in page ? page.nav : [
    { label: "Обо мне", href: "#about" },
    { label: "Пакеты", href: "#contact" },
    { label: "Отзывы", href: "#reviews" },
    { label: "Стоимость", href: "#contact" },
  ];

  return (
    <header className="tilda-nav fixed left-0 right-0 top-0 z-[100] px-3 py-3 sm:px-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/88 px-3 py-3 text-white shadow-2xl backdrop-blur-xl sm:px-4 md:gap-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#ffe100]" />
          <span className="text-sm font-black uppercase tracking-[0.22em]">Шумилов</span>
        </Link>
        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-xs font-bold uppercase tracking-[0.18em] text-white/72 transition hover:text-[#ffe100]">
              {item.label}
            </a>
          ))}
        </div>
        <a href="#contact" className="tilda-button tilda-button-yellow min-h-0 px-3 py-2 text-[0.68rem] sm:px-4 sm:text-xs">
          Заявка
        </a>
      </nav>
    </header>
  );
}
