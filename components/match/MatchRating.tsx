"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface MatchRatingProps {
  matchId: string;
  statsId: string;
  initialRating: number | null;
}

export default function MatchRating({ matchId, statsId, initialRating }: MatchRatingProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  async function handleRate(value: number) {
    if (saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("match_player_stats")
      .update({ rating: value })
      .eq("id", statsId);

    if (!error) {
      setRating(value);
    }
    setSaving(false);
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-surface-300 mb-3">
        {rating ? t.matchDetail.yourRating : t.matchDetail.rateMatch}
      </h3>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = hovered ? star <= hovered : star <= (rating ?? 0);
          return (
            <button
              key={star}
              type="button"
              disabled={saving}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className={`w-10 h-10 transition-colors ${saving ? "opacity-50" : "cursor-pointer"}`}
            >
              <svg
                viewBox="0 0 20 20"
                className={`w-full h-full ${
                  filled ? "text-amber-400" : "text-surface-700"
                }`}
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
      {rating && (
        <p className="text-center text-xs text-surface-400 mt-2">
          {rating}/5
        </p>
      )}
    </div>
  );
}
