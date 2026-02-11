"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OnboardingFormData } from "@/types";
import StepBasicInfo from "./StepBasicInfo";

interface Props {
  userId: string;
  userEmail: string | null;
  defaultName: string;
}

export default function OnboardingWizard({ userId, userEmail, defaultName }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameParts = defaultName.split(" ");
  const [formData, setFormData] = useState<OnboardingFormData>({
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    country: "",
    city: "",
    origin_country: "",
    favorite_club: "",
  });

  function updateForm(updates: Partial<OnboardingFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: userEmail,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        country: formData.country || null,
        city: formData.city || null,
        origin_country: formData.origin_country || null,
        favorite_club: formData.favorite_club || null,
        role: "player",
      });

      if (profileError) throw profileError;

      // Fire-and-forget welcome email
      fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome" }),
      }).catch(() => {});

      router.push("/matches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-pitch-400" />
        </div>

        {error && (
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 text-center">
            <p className="text-danger-500 text-sm">{error}</p>
          </div>
        )}

        <StepBasicInfo
          data={formData}
          onChange={updateForm}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </div>
    </div>
  );
}
