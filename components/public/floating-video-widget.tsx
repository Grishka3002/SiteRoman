"use client";

import { useState } from "react";

type FloatingVideoWidgetProps = {
  kinescopeId?: string;
  localSrc?: string;
  posterSrc: string;
};

function getEmbedUrl(kinescopeId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    playsinline: "1",
    preload: "true",
    quality: "auto",
  });

  return `https://kinescope.io/embed/${kinescopeId}?${params.toString()}`;
}

export function FloatingVideoWidget({ kinescopeId, localSrc, posterSrc }: FloatingVideoWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) {
    return null;
  }

  return (
    <div
      className={[
        "fixed bottom-4 right-4 z-50 overflow-hidden border border-[#ffe100] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-all duration-300 sm:bottom-5 sm:right-5",
        isOpen ? "h-[315px] w-[190px] rounded-[14px] sm:h-[340px] sm:w-[205px]" : "grid h-20 w-20 place-items-center rounded-full hover:-translate-y-1 hover:scale-105",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={isOpen ? "Collapse video" : "Hide video"}
        onClick={(event) => {
          event.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            setIsHidden(true);
          }
        }}
        className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm font-black text-[#ffe100] backdrop-blur"
      >
        {isOpen ? "-" : "x"}
      </button>

      {isOpen && localSrc ? (
        <video
          src={localSrc}
          poster={posterSrc}
          title="Roman Shumilov video"
          className="h-full w-full object-cover"
          controls
          autoPlay
          playsInline
          preload="auto"
          controlsList="nodownload"
        />
      ) : isOpen && kinescopeId ? (
        <iframe
          src={getEmbedUrl(kinescopeId)}
          title="Roman Shumilov video"
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; screen-wake-lock;"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          aria-label="Open video"
          onClick={() => setIsOpen(true)}
          className="absolute inset-0 grid place-items-center bg-[#ffe100] text-black transition hover:bg-white"
        >
          <span className="tilda-video-play grid h-12 w-12 place-items-center rounded-full bg-black text-[#ffe100] shadow-xl">
            <span />
          </span>
        </button>
      )}

      {isOpen ? null : <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10" />}
    </div>
  );
}
