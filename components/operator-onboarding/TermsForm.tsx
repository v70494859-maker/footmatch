"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { OperatorApplication } from "@/types";
import Button from "@/components/ui/Button";

interface Props {
  application: OperatorApplication;
}

export default function TermsForm({ application }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [acceptedTerms, setAcceptedTerms] = useState(application.terms_accepted);
  const [acceptedRevenue, setAcceptedRevenue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = acceptedTerms && acceptedRevenue;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("operator_applications")
        .update({
          terms_accepted: true,
          status: "pending",
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      // Fire-and-forget application submitted email
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "application_submitted" }),
      }).catch(() => {});

      router.push("/operator-onboarding/waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const ob = t.operatorOnboarding;

  const termsList = [
    ob.termsList1,
    ob.termsList2,
    ob.termsList3,
    ob.termsList4,
    ob.termsList5,
    ob.termsList6,
    ob.termsList7,
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-pitch-500/10 via-surface-900 to-emerald-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-pitch-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-pitch-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{ob.termsHeroTitle}</h1>
        <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
          {ob.termsHeroSubtitle}
        </p>
      </div>

      {/* Partnership benefits */}
      <div className="bg-surface-900 border border-pitch-500/20 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-surface-300">{ob.termsPartnershipTitle}</h2>
        <ul className="space-y-2.5">
          {[ob.termsBenefit1, ob.termsBenefit2, ob.termsBenefit3, ob.termsBenefit4].map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-surface-200">
              <svg className="h-4 w-4 shrink-0 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Form with terms */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 rounded-2xl p-6 space-y-6">
          {error && (
            <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
              <p className="text-danger-500 text-sm">{error}</p>
            </div>
          )}

          {/* Terms content */}
          <div className="rounded-xl border border-surface-800 bg-surface-950 p-4 max-h-64 overflow-y-auto text-sm text-surface-300 space-y-3">
            <p className="font-semibold text-foreground">
              {ob.termsAgreementTitle}
            </p>
            <p>{ob.termsIntro}</p>
            <ul className="list-disc pl-5 space-y-2">
              {termsList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p>{ob.termsFullPolicy}</p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="
                  mt-0.5 h-5 w-5 rounded border-surface-700 bg-surface-900
                  text-pitch-500 focus:ring-pitch-500 focus:ring-offset-0
                  cursor-pointer accent-pitch-500
                "
              />
              <span className="text-sm text-surface-300">
                {ob.termsAcceptTermsFull}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedRevenue}
                onChange={(e) => setAcceptedRevenue(e.target.checked)}
                className="
                  mt-0.5 h-5 w-5 rounded border-surface-700 bg-surface-900
                  text-pitch-500 focus:ring-pitch-500 focus:ring-offset-0
                  cursor-pointer accent-pitch-500
                "
              />
              <span className="text-sm text-surface-300">
                {ob.termsAcceptRevenueFull}
              </span>
            </label>
          </div>
        </div>

        {/* Almost done banner */}
        <div className="bg-surface-900 border border-pitch-500/20 rounded-2xl p-4 text-center space-y-1">
          <p className="text-sm font-semibold text-pitch-400">{ob.termsAlmostDone}</p>
          <p className="text-xs text-surface-400">{ob.termsReviewTime}</p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/operator-onboarding/documents")}
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
            {ob.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
