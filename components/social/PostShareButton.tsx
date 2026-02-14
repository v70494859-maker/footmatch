"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface PostShareButtonProps {
  postId: string;
}

export default function PostShareButton({ postId }: PostShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/social/post/${postId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  };

  const handleSendInDM = () => {
    setOpen(false);
    window.location.href = `/social/messages?share_post=${postId}`;
  };

  return (
    <div ref={menuRef} className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 rounded-xl transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
        <span>{t.social.feed.share}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[180px]">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-200 hover:bg-surface-700 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-pitch-400">{t.social.feed.linkCopied}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.813a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
                </svg>
                <span>{t.social.feed.copyLink}</span>
              </>
            )}
          </button>
          <button
            onClick={handleSendInDM}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-200 hover:bg-surface-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            <span>{t.social.feed.sendInDM}</span>
          </button>
        </div>
      )}
    </div>
  );
}
