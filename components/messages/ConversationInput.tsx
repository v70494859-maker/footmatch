"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ConversationInputProps {
  conversationId: string;
  currentUserId: string;
}

export default function ConversationInput({
  conversationId,
  currentUserId,
}: ConversationInputProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendTextMessage() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
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

  return (
    <div className="sticky bottom-0 bg-background border-t border-surface-800 px-3 py-2">
      <div className="flex items-end gap-2">
        {/* Image button (placeholder) */}
        <button
          type="button"
          disabled={sending}
          className="p-2 text-surface-400 hover:text-foreground transition-colors disabled:opacity-40 shrink-0"
          title={t.social.messages.image}
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

        {/* Voice button (placeholder) */}
        <button
          type="button"
          disabled={sending}
          className="p-2 text-surface-400 hover:text-foreground transition-colors disabled:opacity-40 shrink-0"
          title={t.social.messages.voice}
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
              d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
          </svg>
        </button>

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.social.messages.typeMessage}
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
