"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ApplicationActionsProps {
  applicationId: string;
  profileId: string;
}

export default function ApplicationActions({
  applicationId,
  profileId,
}: ApplicationActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleApprove() {
    if (!confirm(t.admin.approveConfirm)) return;
    setLoading(true);

    const supabase = createClient();

    // Update application status
    const { error: appError } = await supabase
      .from("operator_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (appError) {
      alert(t.admin.updateFailed + ": " + appError.message);
      setLoading(false);
      return;
    }

    // Create operator record
    const { error: opError } = await supabase.from("operators").insert({
      profile_id: profileId,
    });

    if (opError) {
      alert(t.admin.updateFailed + ": " + opError.message);
      setLoading(false);
      return;
    }

    // Update profile role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "operator" })
      .eq("id", profileId);

    if (profileError) {
      alert(t.admin.updateFailed + ": " + profileError.message);
      setLoading(false);
      return;
    }

    // Fire-and-forget approval email
    fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "application_approved",
        data: { profileId },
      }),
    }).catch(() => {});

    router.refresh();
    router.push("/admin/applications");
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("operator_applications")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      alert(t.admin.updateFailed + ": " + error.message);
      setLoading(false);
      return;
    }

    // Fire-and-forget rejection email
    fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "application_rejected",
        data: { profileId, rejectionReason: rejectionReason.trim() },
      }),
    }).catch(() => {});

    router.refresh();
    router.push("/admin/applications");
  }

  return (
    <>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-pitch-500 text-surface-950 font-semibold text-sm hover:bg-pitch-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? `${t.common.loading}` : t.admin.approve}
        </button>
        <button
          type="button"
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-foreground font-semibold text-sm border border-surface-700 hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.admin.reject}
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-foreground mb-4">
              {t.admin.reject}
            </h3>
            <label className="block text-sm text-surface-400 mb-2">
              {t.admin.rejectionReason}
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder={t.admin.rejectPlaceholder}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-surface-500 focus:outline-none focus:ring-1 focus:ring-pitch-500 resize-none"
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-danger-500 text-white font-semibold text-sm hover:bg-danger-500/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? `${t.common.loading}` : t.common.confirm}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 text-foreground font-semibold text-sm border border-surface-700 hover:bg-surface-700 transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
