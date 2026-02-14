"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface MentionSuggestion {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  text: string;
  cursorPosition: number;
  onSelect: (mention: string, userId: string) => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function MentionAutocomplete({
  text,
  cursorPosition,
  onSelect,
  onClose,
  containerRef,
}: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract the @query from the text at cursor position
  const getQuery = useCallback(() => {
    const beforeCursor = text.slice(0, cursorPosition);
    const match = beforeCursor.match(/@([A-Za-zÀ-ÿ.]*)$/);
    return match ? match[1] : null;
  }, [text, cursorPosition]);

  const query = getQuery();

  useEffect(() => {
    if (query === null || query.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();

      const searchTerm = query.replace(".", " ");
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(5);

      setSuggestions(data ?? []);
      setSelectedIndex(0);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (query === null || (suggestions.length === 0 && !loading)) {
    return null;
  }

  const handleSelect = (suggestion: MentionSuggestion) => {
    const mentionText = `@${suggestion.first_name}.${suggestion.last_name}`;
    onSelect(mentionText, suggestion.id);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full left-0 right-0 mb-1 bg-surface-900 border border-surface-700 rounded-xl shadow-xl overflow-hidden z-50"
    >
      {loading ? (
        <div className="flex items-center justify-center py-3">
          <div className="w-4 h-4 border-2 border-surface-700 border-t-pitch-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="py-1">
          {suggestions.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                idx === selectedIndex ? "bg-surface-800" : "hover:bg-surface-800/50"
              }`}
            >
              {s.avatar_url ? (
                <img src={s.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <ProfileAvatar firstName={s.first_name} lastName={s.last_name} size="xs" />
              )}
              <div>
                <span className="text-sm text-surface-100 font-medium">
                  {s.first_name} {s.last_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
