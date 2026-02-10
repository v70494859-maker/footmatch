"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { TerrainType } from "@/types";
import { TERRAIN_TYPE_LABELS } from "@/types";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function MatchFilters() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const city = searchParams.get("city") ?? "";
  const date = searchParams.get("date") ?? "";
  const terrainType = searchParams.get("terrain_type") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const hasFilters = city || date || terrainType;

  function clearAll() {
    router.push("?");
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* City filter */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={city}
          onChange={(e) => updateParams("city", e.target.value)}
          placeholder={t.matchList.filterByCity}
          className="w-full rounded-xl bg-surface-900 border border-surface-800 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-surface-500 outline-none transition-colors duration-150 focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500"
        />
      </div>

      {/* Date filter */}
      <div className="relative sm:w-44">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <input
          type="date"
          value={date}
          onChange={(e) => updateParams("date", e.target.value)}
          className="w-full rounded-xl bg-surface-900 border border-surface-800 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-surface-500 outline-none transition-colors duration-150 focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 [color-scheme:dark]"
        />
      </div>

      {/* Terrain type select */}
      <div className="relative sm:w-40">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <select
          value={terrainType}
          onChange={(e) => updateParams("terrain_type", e.target.value)}
          className="w-full rounded-xl bg-surface-900 border border-surface-800 pl-9 pr-4 py-2.5 text-sm text-foreground outline-none transition-colors duration-150 focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 appearance-none cursor-pointer"
        >
          <option value="">{t.matchList.allTerrains}</option>
          {(Object.entries(TERRAIN_TYPE_LABELS) as [TerrainType, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
        {/* Chevron */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-900 border border-surface-800 px-4 py-2.5 text-sm text-surface-400 hover:text-foreground hover:border-surface-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {t.common.clear}
        </button>
      )}
    </div>
  );
}
