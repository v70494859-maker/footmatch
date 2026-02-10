"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder from "@/components/chat/VoiceRecorder";

interface ChatInputProps {
  matchId: string;
  currentUserId: string;
}

export default function ChatInput({ matchId, currentUserId }: ChatInputProps) {
  const supabase = createClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function sendTextMessage() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await supabase.from("match_messages").insert({
        match_id: matchId,
        sender_id: currentUserId,
        type: "text",
        content: trimmed,
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_W = 1200;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) {
          h = Math.round((h * MAX_W) / w);
          w = MAX_W;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => resolve(blob!),
          "image/jpeg",
          0.8
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || sending) return;

    setSending(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `${matchId}/${currentUserId}/${Date.now()}.jpg`;

      const { data: upload } = await supabase.storage
        .from("chat-images")
        .upload(fileName, compressed, { contentType: "image/jpeg" });

      if (!upload) return;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-images").getPublicUrl(upload.path);

      await supabase.from("match_messages").insert({
        match_id: matchId,
        sender_id: currentUserId,
        type: "image",
        media_url: publicUrl,
      });
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleVoiceRecorded = useCallback(
    async (blob: Blob, duration: number) => {
      setSending(true);
      try {
        const ext = blob.type.includes("webm") ? "webm" : "mp4";
        const fileName = `${matchId}/${currentUserId}/${Date.now()}.${ext}`;

        const { data: upload } = await supabase.storage
          .from("chat-voice-notes")
          .upload(fileName, blob, { contentType: blob.type });

        if (!upload) return;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("chat-voice-notes")
          .getPublicUrl(upload.path);

        await supabase.from("match_messages").insert({
          match_id: matchId,
          sender_id: currentUserId,
          type: "voice",
          media_url: publicUrl,
          media_duration: duration,
        });
      } finally {
        setSending(false);
      }
    },
    [matchId, currentUserId, supabase]
  );

  return (
    <div className="sticky bottom-0 bg-background border-t border-surface-800 px-3 py-2">
      <div className="flex items-end gap-2">
        {/* Image upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="p-2 text-surface-400 hover:text-foreground transition-colors disabled:opacity-40 shrink-0"
          title="Envoyer une image"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Voice recorder */}
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending} />

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          maxLength={2000}
          rows={1}
          className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-surface-500 resize-none focus:outline-none focus:ring-1 focus:ring-pitch-500/50 max-h-24 min-h-[36px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={sendTextMessage}
          disabled={!text.trim() || sending}
          className="p-2 text-pitch-400 hover:text-pitch-300 transition-colors disabled:opacity-30 shrink-0"
          title="Envoyer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
