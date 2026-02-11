import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type { OperatorApplication, ApplicationStatus } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: application } = await supabase
    .from("operator_applications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!application) {
    redirect("/operator-onboarding/personal");
  }

  const app = application as OperatorApplication;
  const status = app.status as ApplicationStatus;

  if (status === "approved") {
    redirect("/operator");
  }

  if (status === "draft") {
    redirect("/operator-onboarding/personal");
  }

  const isRejected = status === "rejected";
  const ob = t.operatorOnboarding;

  if (isRejected) {
    return (
      <div className="space-y-6">
        {/* Rejected hero */}
        <div className="bg-gradient-to-br from-danger-500/10 via-surface-900 to-red-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{ob.waitingRejectedTitle}</h1>
          <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
            {ob.waitingRejectedSubtitle}
          </p>
        </div>

        {/* Rejection reason */}
        {app.rejection_reason && (
          <div className="bg-surface-900 border border-danger-500/20 rounded-2xl p-6 space-y-2">
            <h2 className="text-sm font-semibold text-danger-400">{ob.waitingRejectedReason}</h2>
            <p className="text-sm text-surface-300 leading-relaxed">{app.rejection_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/operator-onboarding/personal"
            className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold bg-pitch-500 text-white hover:bg-pitch-600 transition-colors duration-150"
          >
            {ob.waitingReapply}
          </Link>
          <Link
            href="/matches"
            className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold bg-surface-800 text-surface-100 hover:bg-surface-700 transition-colors duration-150"
          >
            {ob.waitingBrowseMatches}
          </Link>
        </div>
      </div>
    );
  }

  // Pending state
  const timelineSteps = [
    { title: ob.waitingStep1Title, desc: ob.waitingStep1Desc, status: "done" as const },
    { title: ob.waitingStep2Title, desc: ob.waitingStep2Desc, status: "active" as const },
    { title: ob.waitingStep3Title, desc: ob.waitingStep3Desc, status: "pending" as const },
    { title: ob.waitingStep4Title, desc: ob.waitingStep4Desc, status: "pending" as const },
  ];

  const tips = [ob.waitingTip1, ob.waitingTip2, ob.waitingTip3];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pitch-500/10 via-surface-900 to-amber-500/10 border border-surface-800 rounded-2xl p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{ob.waitingTitle}</h1>
        <p className="text-surface-300 text-sm leading-relaxed max-w-sm mx-auto">
          {ob.waitingDesc}
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-sm font-medium text-amber-500">
            {ob.waitingStatus}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-surface-300">{ob.waitingTimelineTitle}</h2>
        <div className="space-y-0">
          {timelineSteps.map((step, i) => (
            <div key={i} className="flex gap-3">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === "done"
                      ? "bg-pitch-500/15"
                      : step.status === "active"
                        ? "bg-amber-500/15"
                        : "bg-surface-800"
                  }`}
                >
                  {step.status === "done" ? (
                    <svg className="w-4 h-4 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.status === "active" ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  ) : (
                    <span className="text-xs font-bold text-surface-500">{i + 1}</span>
                  )}
                </div>
                {i < timelineSteps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      step.status === "done" ? "bg-pitch-500/30" : "bg-surface-800"
                    }`}
                  />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <p
                  className={`text-sm font-semibold ${
                    step.status === "done"
                      ? "text-pitch-400"
                      : step.status === "active"
                        ? "text-amber-400"
                        : "text-surface-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-surface-300">{ob.waitingWhatsNextTitle}</h2>
        <ul className="space-y-2.5">
          {tips.map((tip) => (
            <li key={tip} className="flex items-center gap-3 text-sm text-surface-200">
              <svg className="h-4 w-4 shrink-0 text-pitch-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div className="bg-surface-900 border border-pitch-500/20 rounded-2xl p-5 text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">{ob.waitingContactTitle}</p>
        <p className="text-xs text-surface-400">{ob.waitingContactDesc}</p>
      </div>

      {/* Browse matches button */}
      <Link
        href="/matches"
        className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold bg-surface-800 text-surface-100 hover:bg-surface-700 transition-colors duration-150"
      >
        {ob.waitingBrowseMatches}
      </Link>
    </div>
  );
}
