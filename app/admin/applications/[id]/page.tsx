import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getDateLocale } from "@/lib/i18n/server";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type OperatorApplicationWithProfile,
} from "@/types";
import ApplicationActions from "@/components/admin/ApplicationActions";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Admin - Examiner la candidature" };

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-surface-700/50 text-surface-300",
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-pitch-500/10 text-pitch-400",
  rejected: "bg-danger-500/10 text-danger-500",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations();
  const dateLocale = await getDateLocale();

  const { data: application } = await supabase
    .from("operator_applications")
    .select("*, profile:profiles(*)")
    .eq("id", id)
    .single();

  if (!application) notFound();

  const app = application as unknown as OperatorApplicationWithProfile;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <ProfileAvatar
            firstName={app.profile.first_name}
            lastName={app.profile.last_name}
            country={app.profile.origin_country}
            clubSlug={app.profile.favorite_club}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {app.profile.first_name} {app.profile.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-surface-400">
              {app.profile.city && <span>{app.profile.city}</span>}
              {app.profile.city && app.profile.origin_country && (
                <span className="text-surface-600">/</span>
              )}
              {app.profile.origin_country && <span>{app.profile.origin_country}</span>}
            </div>
            <p className="text-sm text-surface-500 mt-1">
              {t.admin.submittedOn}{" "}
              {new Date(app.created_at).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-semibold uppercase rounded-full px-3 py-1 ${STATUS_COLORS[app.status]}`}
          >
            {APPLICATION_STATUS_LABELS[app.status]}
          </span>
          {app.reviewed_at && (
            <p className="text-xs text-surface-500 mt-1">
              {t.admin.reviewedOn}{" "}
              {new Date(app.reviewed_at).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {app.reviewed_by && (
            <p className="text-[11px] text-surface-600">
              {t.admin.by} {app.reviewed_by}
            </p>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="bg-surface-900 rounded-2xl border border-surface-800 divide-y divide-surface-800">
        <DetailRow label={t.auth.email} value={app.profile.email ?? "--"} />
        <DetailRow label={t.admin.phone} value={app.phone ?? "--"} />
        <DetailRow label={t.admin.city} value={app.city ?? "--"} />
        <DetailRow
          label={t.admin.experience}
          value={app.years_experience != null ? `${app.years_experience} ${t.common.years}` : "--"}
        />
        <DetailRow label={t.admin.certifications} value={app.certifications ?? "--"} />
        <div className="px-6 py-4">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">
            {t.admin.description}
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {app.description || "--"}
          </p>
        </div>
        {app.id_document_url && (
          <DetailRow label={t.admin.idDocument}>
            <a
              href={app.id_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pitch-400 hover:text-pitch-300 text-sm underline transition-colors"
            >
              {t.admin.viewDocument}
            </a>
          </DetailRow>
        )}
        {app.cert_document_url && (
          <DetailRow label={t.admin.certifications}>
            <a
              href={app.cert_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pitch-400 hover:text-pitch-300 text-sm underline transition-colors"
            >
              {t.admin.viewCertificate}
            </a>
          </DetailRow>
        )}
        <DetailRow
          label={t.admin.termsAccepted}
          value={app.terms_accepted ? t.operatorOnboarding.yes : t.operatorOnboarding.no}
        />
        {app.rejection_reason && (
          <DetailRow label={t.admin.rejectionReason} value={app.rejection_reason} />
        )}
      </div>

      {/* Actions */}
      {app.status === "pending" && (
        <ApplicationActions
          applicationId={app.id}
          profileId={app.profile_id}
        />
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <p className="text-xs font-medium text-surface-400 uppercase tracking-wider sm:w-44 shrink-0">
        {label}
      </p>
      {children ?? <p className="text-sm text-foreground">{value}</p>}
    </div>
  );
}
