"use client";

import { ORIGIN_COUNTRIES } from "@/lib/cities";

interface OriginSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function OriginSelect({
  label = "Pays d'origine",
  value,
  onChange,
}: OriginSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-900 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pitch-500/50 appearance-none"
      >
        <option value="">Choisir un pays</option>
        {ORIGIN_COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
