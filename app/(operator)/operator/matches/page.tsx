import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/lib/i18n/server";
import type { Match } from "@/types";
import OperatorMatchCard from "@/components/operator/OperatorMatchCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "FootMatch Opérateur - Mes matchs" };

export default async function OperatorMatchesPage() {
  const t = await getTranslations();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get operator record for current user
  const { data: operator } = await supabase
    .from("operators")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  // Fetch all matches for this operator
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("operator_id", operator.id)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  const typedMatches = (matches as Match[] | null) ?? [];

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.operator.myMatches}</h1>
            <p className="text-sm text-surface-400 mt-1">
              {typedMatches.length} {typedMatches.length === 1 ? t.common.match : t.common.matchPlural}
            </p>
          </div>
          <Link
            href="/operator/matches/create"
            className="flex items-center gap-2 bg-pitch-500 text-white hover:bg-pitch-600 active:bg-pitch-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.operator.createMatch}
          </Link>
        </div>

        {/* Match Grid */}
        {typedMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typedMatches.map((match) => (
              <OperatorMatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-900 rounded-2xl border border-surface-800 p-8 text-center">
            <svg
              className="w-10 h-10 mx-auto text-surface-700 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6l1.5 3.5L17 11l-3.5 1.5L12 16l-1.5-3.5L7 11l3.5-1.5z" />
            </svg>
            <p className="text-sm text-surface-400">{t.operator.noMatches}</p>
            <p className="text-xs text-surface-500 mt-1">
              <Link href="/operator/matches/create" className="text-pitch-400 underline">
                {t.operator.createFirst}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
