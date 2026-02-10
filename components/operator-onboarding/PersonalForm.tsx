"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { OperatorApplication } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CitySelect from "@/components/ui/CitySelect";

interface Props {
  userId: string;
  application: OperatorApplication | null;
}

export default function PersonalForm({ userId, application }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [phone, setPhone] = useState(application?.phone || "");
  const [country, setCountry] = useState("Suisse");
  const [city, setCity] = useState(application?.city || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.trim().length >= 6 && city.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      if (application) {
        // Update existing application
        const { error: updateError } = await supabase
          .from("operator_applications")
          .update({
            phone: phone.trim(),
            city: city.trim(),
          })
          .eq("id", application.id);

        if (updateError) throw updateError;
      } else {
        // Create new application
        const { error: insertError } = await supabase
          .from("operator_applications")
          .insert({
            profile_id: userId,
            status: "draft",
            phone: phone.trim(),
            city: city.trim(),
            terms_accepted: false,
          });

        if (insertError) throw insertError;
      }

      router.push("/operator-onboarding/experience");
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
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.operatorOnboarding.personalInfo}
          </h1>
          <p className="text-surface-400 text-sm">
            {t.operatorOnboarding.subtitle}
          </p>
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
            <p className="text-danger-500 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label={t.operatorOnboarding.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            required
          />
          <CitySelect
            label={t.operatorOnboarding.city}
            country={country}
            city={city}
            onCountryChange={setCountry}
            onCityChange={setCity}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid}
        loading={saving}
        fullWidth
      >
        {t.operatorOnboarding.next}
      </Button>
    </form>
  );
}
