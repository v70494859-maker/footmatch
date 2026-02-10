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

  // If approved, redirect to operator dashboard
  if (status === "approved") {
    redirect("/operator");
  }

  // If still a draft, redirect to first step
  if (status === "draft") {
    redirect("/operator-onboarding/personal");
  }

  const isRejected = status === "rejected";

  return (
    <div className="space-y-6">
      <div className="bg-surface-900 rounded-2xl p-8 space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
          {isRejected ? (
            <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-danger-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isRejected ? t.common.canceled : t.operatorOnboarding.waitingTitle}
          </h1>
          <p className="text-surface-400 text-sm max-w-sm mx-auto">
            {isRejected
              ? t.common.error
              : t.operatorOnboarding.waitingDesc}
          </p>
        </div>

        {/* Rejection reason */}
        {isRejected && app.rejection_reason && (
          <div className="bg-danger-500/5 border border-danger-500/20 rounded-xl p-4 text-left">
            <p className="text-sm font-medium text-danger-500 mb-1">
              Motif du refus :
            </p>
            <p className="text-sm text-surface-300">{app.rejection_reason}</p>
          </div>
        )}

        {/* Status badge */}
        {!isRejected && (
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-amber-500">
              {t.operatorOnboarding.waitingStatus}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isRejected && (
          <Link
            href="/operator-onboarding/personal"
            className="
              w-full flex items-center justify-center gap-2
              rounded-xl px-5 py-3 text-sm font-semibold
              bg-pitch-500 text-white hover:bg-pitch-600
              transition-colors duration-150
            "
          >
            {t.operatorOnboarding.submit}
          </Link>
        )}
        <Link
          href="/matches"
          className="
            w-full flex items-center justify-center gap-2
            rounded-xl px-5 py-3 text-sm font-semibold
            bg-surface-800 text-surface-100 hover:bg-surface-700
            transition-colors duration-150
          "
        >
          {t.common.back}
        </Link>
      </div>
    </div>
  );
}
