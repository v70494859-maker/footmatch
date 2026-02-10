"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { ChatMessageWithSender } from "@/types";
import { formatChatTime } from "@/lib/format";
import ImagePreview from "@/components/chat/ImagePreview";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface MessageBubbleProps {
  message: ChatMessageWithSender;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sender = message.sender;

  function handlePlayVoice() {
    if (!message.media_url) return;

    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
        return;
      }
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    const audio = new Audio(message.media_url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      audioRef.current = null;
    };

    audio.play();
    setPlaying(true);
  }

  const formatVoiceDuration = (s: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar (others only) */}
      {!isOwn && sender && (
        <div className="mt-1">
          <ProfileAvatar
            firstName={sender.first_name}
            lastName={sender.last_name}
            country={sender.origin_country}
            clubSlug={sender.favorite_club}
            size="xs"
            href={`/players/${sender.id}`}
          />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isOwn
            ? "bg-pitch-500/20 rounded-tr-md"
            : "bg-surface-800 rounded-tl-md"
        }`}
      >
        {/* Sender name (others only) */}
        {!isOwn && sender && (
          <p className="text-[10px] font-semibold text-pitch-400 mb-0.5">
            {sender.first_name} {sender.last_name}
          </p>
        )}

        {/* Text message */}
        {message.type === "text" && message.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Image message */}
        {message.type === "image" && message.media_url && (
          <>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="block rounded-lg overflow-hidden"
            >
              <Image
                src={message.media_url}
                alt="Chat image"
                width={256}
                height={256}
                className="object-cover max-w-64 rounded-lg"
                unoptimized
              />
            </button>
            {message.content && (
              <p className="text-sm text-foreground mt-1.5 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            {showPreview && (
              <ImagePreview
                src={message.media_url}
                alt="Chat image"
                onClose={() => setShowPreview(false)}
              />
            )}
          </>
        )}

        {/* Voice message */}
        {message.type === "voice" && message.media_url && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <button
              type="button"
              onClick={handlePlayVoice}
              className="w-8 h-8 rounded-full bg-pitch-500/20 flex items-center justify-center shrink-0"
            >
              {playing ? (
                <svg
                  className="w-4 h-4 text-pitch-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-pitch-400 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pitch-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-surface-500 mt-0.5">
                {formatVoiceDuration(message.media_duration)}
              </p>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 ${
            isOwn ? "text-pitch-400/60 text-right" : "text-surface-500"
          }`}
        >
          {formatChatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
