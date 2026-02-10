"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function StepProgress() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const STEPS = [
    { label: t.operatorOnboarding.personalInfo, path: "/operator-onboarding/personal" },
    { label: t.operatorOnboarding.experience, path: "/operator-onboarding/experience" },
    { label: t.operatorOnboarding.documents, path: "/operator-onboarding/documents" },
    { label: t.operatorOnboarding.termsConditions, path: "/operator-onboarding/terms" },
  ];

  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <div className="mb-8">
      {/* Step labels */}
      <div className="mb-2 flex justify-between px-1">
        {STEPS.map((step, i) => (
          <span
            key={step.path}
            className={`text-[11px] font-medium transition-colors ${
              i <= currentIndex ? "text-pitch-400" : "text-surface-500"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step.path}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? "bg-pitch-400" : "bg-surface-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
