"use client";

import { useState } from "react";
import { youtubeEmbed, youtubeThumb, youtubeWatch } from "@/lib/youtube";

export type HomeVideoItem = { slug: string; label: string; title: string; id: string };

/**
 * The home page's demo videos: a tab per farm kind and a YouTube player that
 * loads only when the visitor presses play (until then just a thumbnail, so
 * the page stays light and YouTube sets no cookies).
 */
export function HomeVideos({ videos, playLabel, tabsLabel }: { videos: HomeVideoItem[]; playLabel: string; tabsLabel: string }) {
  const [current, setCurrent] = useState(videos[0]?.slug);
  const [playing, setPlaying] = useState<string | null>(null);
  const video = videos.find((v) => v.slug === current) ?? videos[0];
  if (!video) return null;

  return (
    <div data-testid="home-videos">
      {videos.length > 1 && (
        <div role="tablist" aria-label={tabsLabel} className="mb-5 flex flex-wrap justify-center gap-2">
          {videos.map((v) => (
            <button
              key={v.slug}
              type="button"
              role="tab"
              aria-selected={v.slug === video.slug}
              onClick={() => {
                setCurrent(v.slug);
                setPlaying(null);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                v.slug === video.slug ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-emerald-600 hover:text-emerald-800"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-lg">
        {playing === video.slug ? (
          <iframe
            src={youtubeEmbed(video.id)}
            title={video.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <a
            href={youtubeWatch(video.id)}
            onClick={(e) => {
              e.preventDefault();
              setPlaying(video.slug);
            }}
            className="group absolute inset-0 block"
            aria-label={`${playLabel}: ${video.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail, fixed 16:9 box */}
            <img src={youtubeThumb(video.id)} alt="" loading="lazy" width={480} height={360} className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110 sm:size-20">
                <svg viewBox="0 0 24 24" className="ml-1 size-8 sm:size-10" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-10 text-left text-sm font-semibold text-white sm:text-base">
              {video.title}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
