"use client";

import { useEffect, useState } from "react";

type Testimonial = {
  name: string;
  company?: string;
  text: string;
};

type TestimonialSliderProps = {
  testimonials: Testimonial[];
};

type SlideDirection = "next" | "prev";

export function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("next");

  useEffect(() => {
    if (testimonials.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSlideDirection("next");
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, testimonials.length]);

  if (!testimonials.length) {
    return null;
  }

  const getDirectionTo = (targetIndex: number): SlideDirection => {
    if (targetIndex === activeIndex || testimonials.length < 2) {
      return slideDirection;
    }

    const forwardDistance = (targetIndex - activeIndex + testimonials.length) % testimonials.length;
    const backwardDistance = (activeIndex - targetIndex + testimonials.length) % testimonials.length;

    return forwardDistance <= backwardDistance ? "next" : "prev";
  };
  const showTestimonial = (targetIndex: number, direction = getDirectionTo(targetIndex)) => {
    const normalizedIndex = (targetIndex + testimonials.length) % testimonials.length;

    if (normalizedIndex === activeIndex) {
      return;
    }

    setSlideDirection(direction);
    setActiveIndex(normalizedIndex);
  };
  const getCircularOffset = (index: number) => {
    let offset = index - activeIndex;
    const half = testimonials.length / 2;

    if (offset > half) {
      offset -= testimonials.length;
    }

    if (offset < -half) {
      offset += testimonials.length;
    }

    return Math.max(-2, Math.min(2, offset));
  };

  return (
    <section
      id="reviews"
      className="tilda-section tilda-reveal overflow-hidden bg-black px-4 pb-12 pt-16 text-white sm:px-6 lg:pb-16 lg:pt-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Отзывы</p>
            <h2 className="mt-4 text-[clamp(2.35rem,5vw,4.65rem)] font-bold uppercase leading-[0.94] tracking-[-0.035em]">
              Мне доверяют
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Предыдущий отзыв"
              onClick={() => showTestimonial(activeIndex - 1, "prev")}
              className="testimonial-arrow testimonial-arrow-prev grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:-translate-y-0.5 hover:border-[#ffe100] hover:bg-[#ffe100] hover:text-black"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Следующий отзыв"
              onClick={() => showTestimonial(activeIndex + 1, "next")}
              className="testimonial-arrow testimonial-arrow-next grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:-translate-y-0.5 hover:border-[#ffe100] hover:bg-[#ffe100] hover:text-black"
            >
              →
            </button>
          </div>
        </div>

        <div className="testimonial-stage relative mt-10" data-direction={slideDirection}>
          {testimonials.map((testimonial, index) => {
            const offset = getCircularOffset(index);
            const isActive = offset === 0;

            return (
              <article
                key={testimonial.name}
                role="button"
                tabIndex={Math.abs(offset) <= 1 ? 0 : -1}
                data-offset={offset}
                data-active={isActive ? "true" : "false"}
                onClick={() => showTestimonial(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    showTestimonial(index);
                  }
                }}
                className={[
                  "testimonial-card cursor-pointer overflow-hidden rounded-[1.35rem] border p-6 outline-none focus-visible:ring-2 focus-visible:ring-[#ffe100] sm:p-8",
                  isActive
                    ? "border-[#ffe100] bg-[#ffe100] text-black shadow-[0_28px_90px_rgba(255,225,0,0.22)]"
                    : "border-white/10 bg-[#151515] text-white hover:border-[#ffe100]/50",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      "grid h-16 w-16 flex-none place-items-center rounded-full text-2xl font-black uppercase",
                      isActive
                        ? "bg-black text-[#ffe100]"
                        : "bg-gradient-to-br from-white via-zinc-300 to-zinc-500 text-black",
                    ].join(" ")}
                  >
                    {testimonial.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[clamp(1.35rem,2.55vw,2.2rem)] font-black uppercase leading-none tracking-[-0.04em]">
                      {testimonial.name}
                    </h3>
                    {testimonial.company ? (
                      <p className={["mt-2 text-xs font-bold uppercase tracking-[0.22em]", isActive ? "text-black/55" : "text-white/35"].join(" ")}>
                        {testimonial.company}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-7 text-[clamp(1rem,1.65vw,1.25rem)] font-medium leading-8 opacity-80">
                  {testimonial.text}
                </p>
              </article>
            );
          })}
        </div>

        <div className="flex gap-2">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.name}
              type="button"
              aria-label={`Показать отзыв ${index + 1}`}
              onClick={() => showTestimonial(index)}
              className={[
                "h-2.5 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
                index === activeIndex ? "w-10 bg-[#ffe100]" : "w-2.5 bg-white/25 hover:bg-white/45",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
