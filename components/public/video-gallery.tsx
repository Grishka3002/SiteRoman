"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { WeddingPageContent } from "@/lib/site-data";

type VideoGalleryProps = {
  videos: WeddingPageContent["videos"];
};

type VideoItem = WeddingPageContent["videos"][number] & {
  localSrc?: string;
};

const videoPosters = [
  "/media/imported/photo_2025-05-06_14-_7665b5075b.jpg",
  "/media/imported/photo_2025-05-06_14-_dfae172e33.jpg",
  "/media/imported/photo_2025-05-06_14-_5ebba5efe3.jpg",
  "/media/imported/photo_2025-05-06_15-_2d0f408bb3.jpg",
  "/media/imported/image_b4a3482890.png",
  "/media/imported/photo_2025-05-06_15-_39dd90c0e1.jpg",
];

const fallbackLocalVideo = "/media/videos/360p_f5fe27dad4.mp4";

function getEmbedUrl(kinescopeId: string, autoplay = false) {
  const params = new URLSearchParams({
    playsinline: "1",
    preload: "true",
    quality: "auto",
  });

  if (autoplay) {
    params.set("autoplay", "1");
  }

  return `https://kinescope.io/embed/${kinescopeId}?${params.toString()}`;
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const activeVideo = activeIndex === null ? null : ((videos[activeIndex] ?? null) as VideoItem | null);
  const activePoster = activeIndex === null ? videoPosters[0] : videoPosters[activeIndex % videoPosters.length];
  const activeLocalSrc = activeVideo?.localSrc || fallbackLocalVideo;

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex]);

  return (
    <>
      <div className="tilda-stagger mt-10 flex gap-5 overflow-x-auto pb-6 pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((video, index) => (
          <article key={video.kinescopeId} className="min-w-[clamp(190px,17vw,240px)] max-w-[clamp(190px,17vw,240px)]">
            <button
              type="button"
              onClick={() => {
                setIsPlayerReady(false);
                setActiveIndex(index);
              }}
              className="group block w-full overflow-hidden rounded-[15px] bg-[#151515] text-left shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
              aria-label={`Открыть видео: ${video.title}`}
            >
              <div className="relative aspect-[250/480] overflow-hidden bg-[#101010]">
                <Image
                  src={videoPosters[index % videoPosters.length]}
                  alt={video.title}
                  fill
                  sizes="240px"
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="tilda-video-play absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/88 text-black shadow-2xl transition group-hover:scale-110">
                  <span className="ml-1 text-3xl leading-none">▶</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-xs font-black uppercase tracking-[0.16em] text-white/85">
                  Открыть видео
                </div>
              </div>
            </button>
            <h3 className="mt-4 text-base font-black uppercase tracking-[-0.02em] sm:text-lg">{video.title}</h3>
          </article>
        ))}
      </div>

      {activeVideo ? (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/88 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Видео: ${activeVideo.title}`}
          onClick={() => setActiveIndex(null)}
        >
          <div className="relative w-auto max-w-[min(88vw,420px)]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute -right-2 -top-12 z-10 grid h-10 w-10 place-items-center rounded-full bg-[#ffe100] text-xl font-black text-black transition hover:bg-white"
              aria-label="Закрыть видео"
            >
              ×
            </button>
            <div className="overflow-hidden rounded-[24px] border border-[#ffe100]/80 bg-black shadow-[0_30px_120px_rgba(255,225,0,0.18)]">
              <div className="relative aspect-[9/16] h-[min(82vh,720px)] bg-black">
                <Image
                  src={activePoster}
                  alt=""
                  fill
                  sizes="420px"
                  className={[
                    "object-cover opacity-70 blur-sm transition duration-500",
                    isPlayerReady ? "opacity-0" : "opacity-70",
                  ].join(" ")}
                />
                {activeLocalSrc ? (
                  <video
                    key={activeLocalSrc}
                    src={activeLocalSrc}
                    title={activeVideo.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    poster={activePoster}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    controlsList="nodownload"
                    onLoadedData={() => setIsPlayerReady(true)}
                  />
                ) : (
                  <iframe
                    key={activeVideo.kinescopeId}
                    src={getEmbedUrl(activeVideo.kinescopeId, true)}
                    title={activeVideo.title}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; screen-wake-lock;"
                    allowFullScreen
                    loading="eager"
                    onLoad={() => setIsPlayerReady(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
