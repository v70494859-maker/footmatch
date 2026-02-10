"use client";

import { CITIES_BY_COUNTRY } from "@/lib/cities";

interface CitySelectProps {
  label?: string;
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
}

export default function CitySelect({
  label,
  country,
  city,
  onCountryChange,
  onCityChange,
  required,
}: CitySelectProps) {
  const countries = Object.keys(CITIES_BY_COUNTRY);
  const cities = country ? CITIES_BY_COUNTRY[country] ?? [] : [];

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onCountryChange(e.target.value);
    onCityChange("");
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}

      {/* Country */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">Pays</label>
        <select
          value={country}
          onChange={handleCountryChange}
          required={required}
          className="w-full bg-surface-900 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pitch-500/50 appearance-none"
        >
          <option value="">Choisir un pays</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs text-surface-400 mb-1">Ville</label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          required={required}
          disabled={!country}
          className="w-full bg-surface-900 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pitch-500/50 appearance-none disabled:opacity-40"
        >
          <option value="">{country ? "Choisir une ville" : "Choisir un pays d'abord"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
