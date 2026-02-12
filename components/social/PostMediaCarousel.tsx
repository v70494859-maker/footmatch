"use client";

import { useState, useRef } from "react";
import type { PostMedia } from "@/types";

interface PostMediaCarouselProps {
  media: PostMedia[];
}

export default function PostMediaCarousel({ media }: PostMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order);
  const isSingle = sorted.length === 1;

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    const child = scrollRef.current.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const scrollLeft = el.scrollLeft;
    const itemWidth = el.clientWidth;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${
          isSingle ? "" : "gap-0"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sorted.map((item, idx) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-full"
          >
            {item.media_type === "image" ? (
              <img
                src={item.media_url}
                alt=""
                className="w-full max-h-[480px] object-cover bg-surface-800"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            ) : (
              <div className="relative w-full max-h-[480px] bg-black">
                <VideoPlayer src={item.media_url} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows for multiple media */}
      {!isSingle && (
        <>
          {activeIndex > 0 && (
            <button
              onClick={() => scrollTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {activeIndex < sorted.length - 1 && (
            <button
              onClick={() => scrollTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Dots indicator for multiple media */}
      {!isSingle && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {sorted.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === activeIndex
                  ? "bg-white w-3"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter badge for multiple media */}
      {!isSingle && (
        <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-medium rounded-full px-2 py-0.5">
          {activeIndex + 1}/{sorted.length}
        </div>
      )}
    </div>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="relative cursor-pointer" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[480px] object-contain"
        playsInline
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
