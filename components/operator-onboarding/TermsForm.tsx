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
  const [accepted, setAccepted] = useState(application.terms_accepted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return;

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

      router.push("/operator-onboarding/waiting");
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
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.operatorOnboarding.termsConditions}
          </h1>
          <p className="text-surface-400 text-sm">
            {t.operatorOnboarding.acceptTerms}
          </p>
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
            <p className="text-danger-500 text-sm">{error}</p>
          </div>
        )}

        {/* Terms content */}
        <div className="rounded-xl border border-surface-800 bg-surface-950 p-4 max-h-64 overflow-y-auto text-sm text-surface-300 space-y-3">
          <p className="font-semibold text-foreground">
            Accord opérateur FootMatch
          </p>
          <p>
            En soumettant cette candidature, vous acceptez les conditions
            suivantes en tant qu'opérateur FootMatch :
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Vous êtes responsable de la précision des détails du match,
              y compris le lieu, l'heure et la capacité.
            </li>
            <li>
              Vous devez vous assurer que les lieux respectent les normes de
              sécurité et sont adaptés aux matchs de football.
            </li>
            <li>
              Vous vous engagez à être présent (ou à désigner un représentant)
              à tous les matchs que vous organisez.
            </li>
            <li>
              FootMatch retient des frais de plateforme sur les revenus
              d'abonnement comme décrit dans la politique de paiement des
              opérateurs.
            </li>
            <li>
              Vous devez maintenir à jour vos informations personnelles et
              bancaires pour les paiements.
            </li>
            <li>
              FootMatch se réserve le droit de suspendre ou de résilier les
              comptes opérateurs qui enfreignent ces conditions ou reçoivent
              des retours négatifs répétés.
            </li>
            <li>
              Vous vous engagez à respecter toutes les lois et réglementations
              locales relatives à l'organisation d'événements sportifs.
            </li>
          </ul>
          <p>
            Pour les conditions complètes, veuillez consulter la Politique
            Opérateur FootMatch disponible sur notre site web.
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="
              mt-0.5 h-5 w-5 rounded border-surface-700 bg-surface-900
              text-pitch-500 focus:ring-pitch-500 focus:ring-offset-0
              cursor-pointer accent-pitch-500
            "
          />
          <span className="text-sm text-surface-300">
            {t.operatorOnboarding.acceptTerms}
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/operator-onboarding/documents")}
          className="flex-1"
        >
          {t.operatorOnboarding.previous}
        </Button>
        <Button
          type="submit"
          disabled={!accepted}
          loading={saving}
          className="flex-1"
        >
          {t.operatorOnboarding.submit}
        </Button>
      </div>
    </form>
  );
}
