"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import TeamCharterModal from "./TeamCharterModal";
import CrestPicker from "./CrestPicker";

interface TeamCreationFormProps {
  userId: string;
  hasSignedCharter: boolean;
}

type Step = "charter" | "info" | "confirm";

export default function TeamCreationForm({ userId, hasSignedCharter }: TeamCreationFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [charterSigned, setCharterSigned] = useState(hasSignedCharter);
  const [currentStep, setCurrentStep] = useState<Step>(hasSignedCharter ? "info" : "charter");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [crestUrl, setCrestUrl] = useState<string | null>(null);
  const [crestPreset, setCrestPreset] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: { key: Step; label: string }[] = [
    { key: "charter", label: t.social.teams.step.charter },
    { key: "info", label: t.social.teams.step.info },
    { key: "confirm", label: t.social.teams.step.confirm },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleCharterSigned = () => {
    setCharterSigned(true);
    setCurrentStep("info");
  };

  const handleInfoNext = () => {
    if (!name.trim()) return;
    setCurrentStep("confirm");
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    const supabase = createClient();

    // Insert team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        crest_url: crestUrl,
        crest_preset: crestPreset,
        captain_id: userId,
        member_count: 1,
      })
      .select("id")
      .single();

    if (teamError || !team) {
      setError(teamError?.message ?? "Error creating team");
      setCreating(false);
      return;
    }

    // Insert captain as team member
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: userId,
        role: "captain",
      });

    if (memberError) {
      // Rollback: delete the team since the captain couldn't be added
      await supabase.from("teams").delete().eq("id", team.id);
      setError(memberError.message);
      setCreating(false);
      return;
    }

    router.push(`/social/teams/${team.id}`);
  };

  const initials = name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-50 mb-6">{t.social.teams.createTeam}</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i <= currentStepIndex
                    ? "bg-pitch-400 text-surface-950"
                    : "bg-surface-800 text-surface-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i <= currentStepIndex ? "text-surface-200" : "text-surface-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  i < currentStepIndex ? "bg-pitch-400" : "bg-surface-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Charter */}
      {currentStep === "charter" && (
        <TeamCharterModal
          userId={userId}
          onSigned={handleCharterSigned}
          inline
        />
      )}

      {/* Step 2: Info */}
      {currentStep === "info" && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              {t.social.teams.teamName} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
              placeholder={t.social.teams.teamName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              {t.social.teams.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500 resize-none"
              placeholder={t.social.teams.description}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              {t.social.teams.city}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-800 rounded-xl text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-pitch-500"
              placeholder={t.social.teams.city}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              {t.social.teams.crest}
            </label>
            <CrestPicker
              teamName={name}
              crestUrl={crestUrl}
              crestPreset={crestPreset}
              onCrestUrlChange={setCrestUrl}
              onCrestPresetChange={setCrestPreset}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCurrentStep("charter")}
              className="px-4 py-2 text-sm text-surface-400 hover:text-surface-200 transition-colors"
              disabled={charterSigned}
            >
              {charterSigned ? "" : t.social.teams.step.charter}
            </button>
            <button
              onClick={handleInfoNext}
              disabled={!name.trim()}
              className="px-6 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.social.teams.step.confirm}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === "confirm" && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              {crestUrl ? (
                <img
                  src={crestUrl}
                  alt={name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    crestPreset
                      ? {
                          red: "bg-red-600",
                          blue: "bg-blue-600",
                          green: "bg-green-600",
                          yellow: "bg-yellow-500",
                          purple: "bg-purple-600",
                          orange: "bg-orange-500",
                          pink: "bg-pink-500",
                          cyan: "bg-cyan-500",
                        }[crestPreset] ?? "bg-pitch-900"
                      : "bg-pitch-900"
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${
                      crestPreset ? "text-white" : "text-pitch-400"
                    }`}
                  >
                    {initials || "?"}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-surface-100">{name}</h2>
                {city && (
                  <p className="text-sm text-surface-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {city}
                  </p>
                )}
              </div>
            </div>
            {description && (
              <p className="text-sm text-surface-400">{description}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep("info")}
              className="px-4 py-2 text-sm text-surface-400 hover:text-surface-200 transition-colors"
            >
              {t.social.teams.step.info}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-2 bg-pitch-400 text-surface-950 text-sm font-semibold rounded-xl hover:bg-pitch-300 transition-colors disabled:opacity-50"
            >
              {creating ? "..." : t.social.teams.createTeam}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
