"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { CLUBS, getClubLogo } from "@/lib/clubs";

interface ClubPickerProps {
  label?: string;
  value: string | null;
  onChange: (slug: string | null) => void;
}

export default function ClubPicker({
  label = "Club favori",
  value,
  onChange,
}: ClubPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? CLUBS.find((c) => c.slug === value) : null;

  const filtered = useMemo(() => {
    if (!search.trim()) return CLUBS;
    const q = search.toLowerCase();
    return CLUBS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q)
    );
  }, [search]);

  // Group filtered results by country
  const grouped = useMemo(() => {
    const map: Record<string, typeof CLUBS> = {};
    for (const club of filtered) {
      if (!map[club.country]) map[club.country] = [];
      map[club.country].push(club);
    }
    return map;
  }, [filtered]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 bg-surface-900 border border-surface-700 rounded-xl px-3 py-2.5 text-left hover:border-surface-600 transition-colors"
      >
        {selected ? (
          <>
            <div className="relative w-6 h-6 shrink-0">
              <Image
                src={getClubLogo(selected.slug)}
                alt={selected.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-sm text-foreground truncate flex-1">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="text-sm text-surface-500 flex-1">Choisir un club</span>
        )}
        <svg className="w-4 h-4 text-surface-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Remove link */}
      {selected && (
        <button
          type="button"
          onClick={() => { onChange(null); setOpen(false); }}
          className="mt-1 text-xs text-surface-500 hover:text-danger-500 transition-colors"
        >
          Retirer le club
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface-900 border border-surface-700 rounded-xl shadow-xl max-h-72 flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-surface-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-pitch-500/50"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto">
            {Object.entries(grouped).map(([country, clubs]) => (
              <div key={country}>
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-surface-500 uppercase tracking-wide sticky top-0 bg-surface-900">
                  {country}
                </p>
                {clubs.map((club) => (
                  <button
                    key={club.slug}
                    type="button"
                    onClick={() => {
                      onChange(club.slug);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-800 transition-colors ${
                      value === club.slug ? "bg-pitch-500/10" : ""
                    }`}
                  >
                    <div className="relative w-5 h-5 shrink-0">
                      <Image
                        src={getClubLogo(club.slug)}
                        alt={club.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm text-foreground truncate">
                      {club.name}
                    </span>
                    <span className="text-[10px] text-surface-500 ml-auto shrink-0">
                      {club.league}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <p className="text-sm text-surface-500 text-center py-6">
                Aucun club trouvé
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
