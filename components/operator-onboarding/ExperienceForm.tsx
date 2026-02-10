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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-pitch-500/10 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-pitch-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.operatorOnboarding.experience}
          </h1>
          <p className="text-surface-400 text-sm">
            {t.operatorOnboarding.bioPlaceholder}
          </p>
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
            <p className="text-danger-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label={t.operatorOnboarding.yearsExperience}
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
              {t.operator.description}
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre expérience dans l'organisation de matchs de football, événements ou activités sportives..."
              required
              className="
                w-full rounded-xl bg-surface-900 border border-surface-800
                px-4 py-3 text-sm text-foreground placeholder-surface-500
                outline-none transition-colors duration-150 resize-none
                focus:border-pitch-500 focus:ring-1 focus:ring-pitch-500
              "
            />
            <p className="mt-1 text-xs text-surface-500">
              Minimum 20 caractères ({description.trim().length}/20)
            </p>
          </div>

          <Input
            label="Certifications (optionnel)"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="ex. Licence d'entraîneur UEFA, premiers secours, etc."
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
          {t.operatorOnboarding.previous}
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          loading={saving}
          className="flex-1"
        >
          {t.operatorOnboarding.next}
        </Button>
      </div>
    </form>
  );
}
