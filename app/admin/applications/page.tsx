import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getDateLocale } from "@/lib/i18n/server";
import { formatDate } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type OperatorApplicationWithProfile,
} from "@/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Admin - Candidatures" };

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-surface-700/50 text-surface-300",
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-pitch-500/10 text-pitch-400",
  rejected: "bg-danger-500/10 text-danger-500",
};

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const t = await getTranslations();
  const dateLocale = await getDateLocale();

  const { data: applications } = await supabase
    .from("operator_applications")
    .select("*, profile:profiles(*)")
    .order("created_at", { ascending: false });

  const rows = (applications ?? []) as unknown as OperatorApplicationWithProfile[];

  const total = rows.length;
  const pending = rows.filter((a) => a.status === "pending").length;
  const approved = rows.filter((a) => a.status === "approved").length;
  const rejected = rows.filter((a) => a.status === "rejected").length;

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t.admin.applications}
        </h1>
        {total > 0 && (
          <p className="text-sm text-surface-400">
            <span className="text-foreground font-medium">{total} {t.admin.applications}</span>
            {" "}
            <span className="text-surface-500">
              ({pending > 0 && <><span className="text-amber-500">{pending}</span> {t.admin.pending}</>}
              {pending > 0 && approved > 0 && ", "}
              {approved > 0 && <><span className="text-pitch-400">{approved}</span> {t.admin.approved}</>}
              {(pending > 0 || approved > 0) && rejected > 0 && ", "}
              {rejected > 0 && <><span className="text-danger-500">{rejected}</span> {t.admin.rejected}</>})
            </span>
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
          <p className="text-sm text-surface-500">{t.common.none}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-800">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-900 border-b border-surface-800">
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.applicantInfo}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.phone}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.city}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.experience}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.documents}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.status}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.admin.submittedOn}
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">
                  {t.common.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {rows.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-surface-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="text-foreground font-medium block">
                      {app.profile.first_name} {app.profile.last_name}
                    </span>
                    <span className="text-xs text-surface-500 block mt-0.5">
                      {app.profile.email ?? "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300">
                    {app.phone ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300">
                    {app.city ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300">
                    {app.years_experience != null
                      ? `${app.years_experience} ${t.common.years}`
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span title="ID">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            app.id_document_url
                              ? "bg-pitch-400"
                              : "bg-surface-600"
                          }`}
                        />
                      </span>
                      <span title="Cert">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            app.cert_document_url
                              ? "bg-pitch-400"
                              : "bg-surface-600"
                          }`}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 ${STATUS_COLORS[app.status]}`}
                    >
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300">
                    {new Date(app.created_at).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-pitch-400 hover:text-pitch-300 text-xs font-medium transition-colors"
                    >
                      {t.admin.reviewApplications}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
