import Image from "next/image";

import { submitInquiry } from "@/app/actions";
import { LeadForm } from "@/components/lead-form";
import type { SitePages } from "@/lib/content";
import { cn } from "@/lib/utils";

type EventPageProps = {
  page: SitePages["wedding"] | SitePages["corporate"];
};

export function EventPage({ page }: EventPageProps) {
  const isCorporate = page.theme === "corporate";

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden border-b",
          isCorporate ? "border-white/10 bg-[#0b1220]" : "border-[#d9cfbf] bg-[#f5efe6]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0",
            isCorporate
              ? "bg-[radial-gradient(circle_at_top_right,_rgba(200,163,106,0.18),_transparent_32%),radial-gradient(circle_at_left,_rgba(71,85,105,0.5),_transparent_42%)]"
              : "bg-[radial-gradient(circle_at_top_right,_rgba(173,103,108,0.18),_transparent_30%),radial-gradient(circle_at_left,_rgba(229,215,196,0.8),_transparent_42%)]",
          )}
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.4em]",
                isCorporate ? "text-[#c8a36a]" : "text-[#9a5863]",
              )}
            >
              {page.hero.eyebrow}
            </p>
            <h1
              className={cn(
                "mt-5 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl",
                isCorporate ? "text-white" : "text-[#1f2937]",
              )}
            >
              {page.hero.title}
            </h1>
            <p
              className={cn(
                "mt-6 max-w-2xl text-lg leading-8",
                isCorporate ? "text-slate-300" : "text-[#4b5563]",
              )}
            >
              {page.hero.subtitle}
            </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {page.hero.stats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-[1.5rem] border px-5 py-4",
                    isCorporate ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70",
                  )}
                >
                  <div
                    className={cn("text-2xl font-semibold", isCorporate ? "text-white" : "text-[#111827]")}
                  >
                    {stat.value}
                  </div>
                  <div className={cn("mt-1 text-sm", isCorporate ? "text-slate-400" : "text-[#6b7280]")}>
                    {stat.label}
                  </div>
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

      <section className={cn("py-20", isCorporate ? "bg-[#0f172a]" : "bg-white")}>
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.32em]",
                isCorporate ? "text-[#c8a36a]" : "text-[#9a5863]",
              )}
            >
              Позиционирование
            </p>
            <h2
              className={cn(
                "mt-4 text-4xl font-semibold tracking-tight",
                isCorporate ? "text-white" : "text-[#111827]",
              )}
            >
              {page.intro.title}
            </h2>
          </div>
          <div className={cn("grid gap-5 text-lg leading-8", isCorporate ? "text-slate-300" : "text-[#4b5563]")}>
            {page.intro.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className={cn("py-20", isCorporate ? "bg-[#f2ede4]" : "bg-[#fbf7f1]")} id="contact">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
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

      <section className={cn("py-20", isCorporate ? "bg-white" : "bg-[#fffdf9]")}>
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.32em]",
                isCorporate ? "text-[#9a7b4d]" : "text-[#9a5863]",
              )}
            >
              Преимущества
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Я вам гарантирую
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {page.advantages.map((advantage) => (
              <article key={advantage.title} className="rounded-[1.75rem] border border-black/10 bg-[#f7f4ee] p-6">
                <h3 className="text-xl font-semibold text-[#111827]">{advantage.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#4b5563]">{advantage.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={cn("py-20", isCorporate ? "bg-[#0b1220]" : "bg-[#1f2937]")}>
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
              Пакеты
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Уровни реализации
            </h2>
          </div>
          <div className="mt-10 grid gap-6 xl:grid-cols-3">
            {page.packages.map((pkg) => (
              <article key={pkg.name} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white">
                <h3 className="text-3xl font-semibold">{pkg.name}</h3>
                {pkg.tag ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c8a36a]">
                    {pkg.tag}
                  </p>
                ) : null}
                <p className="mt-4 text-base leading-7 text-slate-300">{pkg.description}</p>
                <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-200">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#c8a36a]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20" id="gallery">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.32em]",
                isCorporate ? "text-[#9a7b4d]" : "text-[#9a5863]",
              )}
            >
              Галерея
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Фото с мероприятий
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.gallery.map((image, index) => (
              <div key={`${image}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]">
                <Image
                  src={image}
                  alt={`${page.hero.title} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn("py-20", isCorporate ? "bg-[#f2ede4]" : "bg-[#fbf7f1]")}>
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.32em]",
                isCorporate ? "text-[#9a7b4d]" : "text-[#9a5863]",
              )}
            >
              Отзывы
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Слова людей, с которыми мы уже работали
            </h2>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {page.testimonials.map((testimonial) => (
              <article key={`${testimonial.name}-${testimonial.company}`} className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_60px_rgba(11,18,32,0.08)]">
                <p className="text-base leading-7 text-[#374151]">{testimonial.text}</p>
                <div className="mt-6">
                  <div className="text-lg font-semibold text-[#111827]">{testimonial.name}</div>
                  {testimonial.company ? <div className="text-sm text-[#6b7280]">{testimonial.company}</div> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.32em]",
                isCorporate ? "text-[#9a7b4d]" : "text-[#9a5863]",
              )}
            >
              FAQ
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827]">
              Часто задаваемые вопросы
            </h2>
          </div>
          <div className="mt-10 grid gap-4">
            {page.faq.map((item) => (
              <details key={item.question} className="rounded-[1.5rem] border border-black/10 bg-[#faf7f2] p-6">
                <summary className="cursor-pointer list-none text-lg font-semibold text-[#111827]">
                  {item.question}
                </summary>
                <p className="mt-4 max-w-4xl text-base leading-7 text-[#4b5563]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
