"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface TeamCharterModalProps {
  userId: string;
  onSigned: () => void;
  /** Render inline (no overlay) when used inside a form step */
  inline?: boolean;
  /** Show as overlay modal */
  open?: boolean;
  onClose?: () => void;
}

export default function TeamCharterModal({ userId, onSigned, inline, open, onClose }: TeamCharterModalProps) {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!agreed) return;
    setSigning(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("team_charters")
      .insert({ user_id: userId });

    if (!error) {
      onSigned();
    }
    setSigning(false);
  };

  const content = (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-surface-50">
        {t.social.teams.charter.title}
      </h2>

      <p className="text-sm text-surface-300">
        {t.social.teams.charter.intro}
      </p>

      <ul className="space-y-3">
        {t.social.teams.charter.rules.map((rule: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-pitch-400/10 text-pitch-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-surface-300">{rule}</span>
          </li>
        ))}
      </ul>

      <label className="flex items-center gap-3 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 rounded border-surface-700 bg-surface-900 text-pitch-400 focus:ring-pitch-400 focus:ring-offset-0"
        />
        <span className="text-sm text-surface-200">
          {t.social.teams.charter.agree}
        </span>
      </label>

      <button
        onClick={handleSign}
        disabled={!agreed || signing}
        className="w-full py-2.5 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {signing ? "..." : t.social.teams.charter.sign}
      </button>
    </div>
  );

  // Inline rendering for form step
  if (inline) {
    return (
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        {content}
      </div>
    );
  }

  // Modal overlay rendering
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-500 hover:text-surface-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {content}
      </div>
    </div>
  );
}
