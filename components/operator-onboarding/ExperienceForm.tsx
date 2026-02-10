"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { OperatorApplication } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  application: OperatorApplication;
}

export default function ExperienceForm({ application }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [yearsExperience, setYearsExperience] = useState(
    application.years_experience?.toString() || ""
  );
  const [description, setDescription] = useState(
    application.description || ""
  );
  const [certifications, setCertifications] = useState(
    application.certifications || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    yearsExperience.trim().length > 0 &&
    Number(yearsExperience) >= 0 &&
    description.trim().length >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("operator_applications")
        .update({
          years_experience: Number(yearsExperience),
          description: description.trim(),
          certifications: certifications.trim() || null,
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      router.push("/operator-onboarding/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const ob = t.operatorOnboarding;

  const profiles = [
    {
      icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
      title: ob.expProfile1Title,
      desc: ob.expProfile1Desc,
    },
    {
      icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
      title: ob.expProfile2Title,
      desc: ob.expProfile2Desc,
    },
    {
      icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21",
      title: ob.expProfile3Title,
      desc: ob.expProfile3Desc,
    },
    {
      icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
      title: ob.expProfile4Title,
      desc: ob.expProfile4Desc,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-amber-500/10 via-surface-900 to-pitch-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-pitch-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{ob.expHeroTitle}</h1>
        <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
          {ob.expHeroSubtitle}
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.expStat1Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.expStat1Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-foreground">{ob.expStat2Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.expStat2Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.expStat3Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.expStat3Label}</p>
          </div>
        </div>
      </div>

      {/* Who can join */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-surface-300">{ob.expWhoCanJoin}</h2>
        <div className="grid grid-cols-2 gap-3">
          {profiles.map((profile) => (
            <div key={profile.title} className="rounded-xl border border-surface-800 bg-surface-950 p-4 space-y-2">
              <div className="w-9 h-9 rounded-full bg-pitch-500/10 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={profile.icon} />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground">{profile.title}</p>
              <p className="text-xs text-surface-400 leading-relaxed">{profile.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-surface-900 border border-pitch-500/20 rounded-2xl p-6 text-center space-y-3">
        <svg className="w-8 h-8 mx-auto text-pitch-500/30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
        </svg>
        <p className="text-sm text-surface-200 italic leading-relaxed">{ob.expQuote}</p>
        <p className="text-xs text-pitch-400 font-medium">{ob.expQuoteAuthor}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">{ob.expFormTitle}</h2>
            <p className="text-surface-400 text-sm">{ob.expFormSubtitle}</p>
          </div>

          {error && (
            <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
              <p className="text-danger-500 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={ob.yearsExperience}
              type="number"
              min={0}
              max={50}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="3"
              required
            />

            <div className="w-full">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-surface-500 mb-1.5"
              >
                {ob.descriptionLabel}
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={ob.descriptionPlaceholderText}
                required
                className="
                  w-full rounded-xl bg-surface-900 border border-surface-800
                  px-4 py-3 text-sm text-foreground placeholder-surface-500
                  outline-none transition-colors duration-150 resize-none
                  focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500
                "
              />
              <p className="mt-1 text-xs text-surface-500">
                {ob.descriptionMinChars} ({description.trim().length}/20)
              </p>
            </div>

            <Input
              label={ob.certificationsLabel}
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder={ob.certificationsPlaceholderText}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/operator-onboarding/personal")}
            className="flex-1"
          >
            {ob.previous}
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            loading={saving}
            className="flex-1"
          >
            {ob.next}
          </Button>
        </div>
      </form>
    </div>
  );
}
