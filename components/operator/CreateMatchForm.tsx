"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { CreateMatchFormData, TerrainType } from "@/types";
import { TERRAIN_TYPE_LABELS } from "@/types";
import { geocodeCity } from "@/lib/geo";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

/* ───── constants ───── */

const FORMAT_PRESETS = [
  { label: "5v5", capacity: 10 },
  { label: "6v6", capacity: 12 },
  { label: "7v7", capacity: 14 },
  { label: "8v8", capacity: 16 },
  { label: "11v11", capacity: 22 },
];

const DURATION_OPTIONS = [
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
];

const TERRAIN_OPTIONS: { value: TerrainType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: "indoor",
    label: TERRAIN_TYPE_LABELS.indoor,
    desc: "Salle couverte, sol synthétique",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 22h20M6 18V2l6 4 6-4v16" />
      </svg>
    ),
  },
  {
    value: "outdoor",
    label: TERRAIN_TYPE_LABELS.outdoor,
    desc: "Terrain extérieur, gazon ou synthétique",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    value: "covered",
    label: TERRAIN_TYPE_LABELS.covered,
    desc: "Terrain couvert, protégé des intempéries",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 22h20M3 22V8l9-6 9 6v14M9 22v-6h6v6" />
      </svg>
    ),
  },
];

/* ───── component ───── */

export default function CreateMatchForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCapacity, setCustomCapacity] = useState(false);
  const [form, setForm] = useState<CreateMatchFormData>({
    title: "",
    terrain_type: "outdoor",
    date: "",
    start_time: "",
    duration_minutes: 90,
    venue_name: "",
    venue_address: "",
    city: "",
    capacity: 10,
    description: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" || name === "duration_minutes" ? Number(value) : value,
    }));
  }

  const matchFormat = useMemo(() => {
    const half = Math.floor(form.capacity / 2);
    return `${half}v${half}`;
  }, [form.capacity]);

  const isPreset = FORMAT_PRESETS.some((p) => p.capacity === form.capacity);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Vous devez être connecté.");
        setLoading(false);
        return;
      }

      const { data: operator, error: operatorError } = await supabase
        .from("operators")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (operatorError || !operator) {
        setError("Compte opérateur introuvable.");
        setLoading(false);
        return;
      }

      const trimmedCity = form.city.trim();
      const trimmedAddress = form.venue_address.trim();
      const coords =
        (await geocodeCity(`${trimmedAddress}, ${trimmedCity}`)) ??
        (await geocodeCity(trimmedCity));

      const { error: insertError } = await supabase.from("matches").insert({
        operator_id: operator.id,
        title: form.title.trim(),
        terrain_type: form.terrain_type,
        date: form.date,
        start_time: form.start_time,
        duration_minutes: form.duration_minutes,
        venue_name: form.venue_name.trim(),
        venue_address: trimmedAddress,
        city: trimmedCity,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        capacity: form.capacity,
        description: form.description.trim() || null,
        status: "upcoming",
        registered_count: 0,
      });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push("/operator/matches");
    } catch {
      setError("Une erreur inattendue s'est produite.");
      setLoading(false);
    }
  }

  /* ── preview helpers ── */
  const previewDate = form.date
    ? new Date(form.date + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : null;

  const previewEndTime = useMemo(() => {
    if (!form.start_time) return null;
    const [h, m] = form.start_time.split(":").map(Number);
    const totalMin = h * 60 + m + form.duration_minutes;
    const eh = Math.floor(totalMin / 60) % 24;
    const em = totalMin % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }, [form.start_time, form.duration_minutes]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {/* ── Section 1: Match info ── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 10.5h-1.5A3.375 3.375 0 007.5 14.25v4.5m6-6a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.operator.matchInfo}
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">{t.operator.createMatchSubtitle}</p>
        </div>

        <Input
          label={t.operator.matchTitle}
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="ex. Foot du dimanche soir"
          required
        />

        {/* Terrain type cards */}
        <div>
          <label className="block text-sm font-medium text-surface-500 mb-2">
            {t.operator.terrainType}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TERRAIN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, terrain_type: opt.value }))}
                className={`relative rounded-xl border p-3 text-left transition-all duration-150 ${
                  form.terrain_type === opt.value
                    ? "border-pitch-500 bg-pitch-500/5 ring-1 ring-pitch-500"
                    : "border-surface-800 bg-surface-800/30 hover:border-surface-700"
                }`}
              >
                <div className={`mb-2 ${form.terrain_type === opt.value ? "text-pitch-400" : "text-surface-500"}`}>
                  {opt.icon}
                </div>
                <p className={`text-sm font-medium ${form.terrain_type === opt.value ? "text-foreground" : "text-surface-300"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-surface-500 mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format / Capacity */}
        <div>
          <label className="block text-sm font-medium text-surface-500 mb-2">
            {t.operator.format}
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_PRESETS.map((preset) => (
              <button
                key={preset.capacity}
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, capacity: preset.capacity }));
                  setCustomCapacity(false);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  form.capacity === preset.capacity && !customCapacity
                    ? "bg-pitch-500 text-white shadow-lg shadow-pitch-500/20"
                    : "bg-surface-800 text-surface-300 hover:bg-surface-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomCapacity(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                customCapacity || (!isPreset && form.capacity > 0)
                  ? "bg-pitch-500 text-white shadow-lg shadow-pitch-500/20"
                  : "bg-surface-800 text-surface-300 hover:bg-surface-700"
              }`}
            >
              {t.operator.capacity}
            </button>
          </div>
          {(customCapacity || !isPreset) && (
            <div className="mt-3">
              <Input
                label={t.common.players}
                name="capacity"
                type="number"
                min={2}
                max={30}
                value={form.capacity}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-surface-500 mt-1">
                Format : {matchFormat} ({form.capacity} joueurs)
              </p>
            </div>
          )}
          {!customCapacity && isPreset && (
            <p className="text-xs text-surface-500 mt-2">
              {form.capacity} joueurs au total
            </p>
          )}
        </div>
      </section>

      {/* ── Section 2: Date & time ── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {t.operator.dateTime}
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">{t.operator.dateTime}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t.operator.date}
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          <Input
            label={t.operator.startTime}
            name="start_time"
            type="time"
            value={form.start_time}
            onChange={handleChange}
            required
          />
        </div>

        {/* Duration pills */}
        <div>
          <label className="block text-sm font-medium text-surface-500 mb-2">
            {t.operator.durationLabel}
          </label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, duration_minutes: opt.value }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  form.duration_minutes === opt.value
                    ? "bg-pitch-500 text-white shadow-lg shadow-pitch-500/20"
                    : "bg-surface-800 text-surface-300 hover:bg-surface-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Venue ── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {t.operator.venue}
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">{t.operator.selectVenue}</p>
        </div>

        <Input
          label={t.operator.selectVenue}
          name="venue_name"
          value={form.venue_name}
          onChange={handleChange}
          placeholder="ex. Centre sportif municipal"
          required
        />

        <Input
          label={t.operator.venue}
          name="venue_address"
          value={form.venue_address}
          onChange={handleChange}
          placeholder="ex. 123 Rue Principale"
          required
        />

        <Input
          label={t.operator.selectCity}
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="ex. Paris"
          required
        />
      </section>

      {/* ── Section 4: Description ── */}
      <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {t.operator.description}
            <span className="text-xs font-normal text-surface-500">(optionnel)</span>
          </h2>
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder={t.operator.descriptionPlaceholder}
          className="w-full rounded-xl bg-surface-800/50 border border-surface-800 px-4 py-3 text-sm text-foreground placeholder-surface-500 outline-none transition-colors duration-150 focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500 resize-none"
        />
      </section>

      {/* ── Live preview ── */}
      {(form.title || form.date || form.venue_name) && (
        <section className="bg-surface-900 rounded-2xl border border-surface-800 p-5">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">
            Aperçu du match
          </p>
          <div className="bg-surface-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {form.title || "Titre du match"}
                </h3>
                {form.venue_name && (
                  <p className="text-sm text-surface-400 mt-0.5 truncate">
                    {form.venue_name}{form.city ? `, ${form.city}` : ""}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-semibold bg-pitch-500/10 text-pitch-400 px-2 py-0.5 rounded-full">
                {matchFormat}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-400">
              {previewDate && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                  </svg>
                  {previewDate}
                </span>
              )}
              {form.start_time && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {form.start_time}{previewEndTime ? ` - ${previewEndTime}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                0/{form.capacity}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                form.terrain_type === "indoor"
                  ? "bg-blue-500/10 text-blue-400"
                  : form.terrain_type === "covered"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-pitch-500/10 text-pitch-400"
              }`}>
                {TERRAIN_TYPE_LABELS[form.terrain_type]}
              </span>
            </div>

            {/* Fill bar preview */}
            <div>
              <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-pitch-500 transition-all" style={{ width: "0%" }} />
              </div>
              <p className="text-[11px] text-surface-500 mt-1">
                0 inscrit{form.capacity > 1 ? "s" : ""} — {form.capacity} places disponibles
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Submit ── */}
      <div className="pt-2">
        <Button type="submit" fullWidth loading={loading}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t.operator.publish}
        </Button>
      </div>
    </form>
  );
}
