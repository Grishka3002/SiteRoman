"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const isOpen = index === openIndex;
        const panelId = `faq-panel-${index}`;

        return (
          <article
            key={item.question}
            className={[
              "rounded-[1.25rem] border p-5 transition duration-300 sm:p-6",
              isOpen
                ? "border-[#ffe100]/80 bg-[#ffe100] text-black shadow-[0_24px_80px_rgba(255,225,0,0.16)]"
                : "border-white/10 bg-white/[0.04] text-white hover:border-[#ffe100]/45 hover:bg-white/[0.07]",
            ].join(" ")}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-5 text-left text-[clamp(1rem,2vw,1.25rem)] font-black uppercase tracking-[-0.02em]"
            >
              <span>{item.question}</span>
              <span
                className={[
                  "grid h-10 w-10 flex-none place-items-center rounded-full text-xl transition duration-300",
                  isOpen ? "rotate-180 bg-black text-[#ffe100]" : "bg-[#ffe100] text-black",
                ].join(" ")}
              >
                {isOpen ? "-" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={[
                "grid transition-[grid-template-rows,opacity,margin] duration-300",
                isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <p className={["text-base font-medium leading-7", isOpen ? "text-black/70" : "text-white/62"].join(" ")}>
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
