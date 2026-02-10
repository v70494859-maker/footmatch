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
        const { error: updateError } = await supabase
          .from("operator_applications")
          .update({
            phone: phone.trim(),
            city: city.trim(),
          })
          .eq("id", application.id);

        if (updateError) throw updateError;
      } else {
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

  const ob = t.operatorOnboarding;

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-pitch-500/10 via-surface-900 to-amber-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-pitch-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{ob.heroTitle}</h1>
        <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
          {ob.heroSubtitle}
        </p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.stat1Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.stat1Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-foreground">{ob.stat2Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.stat2Label}</p>
          </div>
          <div className="rounded-xl bg-surface-900/80 border border-surface-800 px-2 py-3">
            <p className="text-xl font-bold text-pitch-400">{ob.stat3Value}</p>
            <p className="text-[10px] text-surface-400 mt-0.5">{ob.stat3Label}</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-surface-300">{ob.howItWorks}</h2>
        <div className="space-y-4">
          {[
            { icon: "M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z", title: ob.step1Title, desc: ob.step1Desc, num: "1" },
            { icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", title: ob.step2Title, desc: ob.step2Desc, num: "2" },
            { icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", title: ob.step3Title, desc: ob.step3Desc, num: "3" },
          ].map((step) => (
            <div key={step.num} className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-pitch-500/15 flex items-center justify-center text-xs font-bold text-pitch-400">
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue example */}
      <div className="bg-surface-900 border border-pitch-500/20 rounded-2xl p-6 text-center space-y-2">
        <h2 className="text-sm font-semibold text-surface-300">{ob.exampleTitle}</h2>
        <p className="text-xs text-surface-400">{ob.exampleDesc}</p>
        <p className="text-xs text-surface-500">{ob.exampleCalc}</p>
        <p className="text-3xl font-bold text-pitch-400">{ob.exampleResult}</p>
      </div>

      {/* Benefits */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-surface-300">{ob.whyJoin}</h2>
        <ul className="space-y-2.5">
          {[ob.benefit1, ob.benefit2, ob.benefit3, ob.benefit4].map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-surface-200">
              <svg className="h-4 w-4 shrink-0 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-foreground">{ob.startNow}</h2>
            <p className="text-surface-400 text-sm">{ob.personalInfo}</p>
          </div>

          {error && (
            <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
              <p className="text-danger-500 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={ob.phone}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              required
            />
            <CitySelect
              label={ob.city}
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
          {ob.next}
        </Button>
      </form>
    </div>
  );
}
