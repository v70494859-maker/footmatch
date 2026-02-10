import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Match, MatchRegistrationWithProfile } from "@/types";
import ResultsWizard from "@/components/results/ResultsWizard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Saisir les résultats - FootMatch" };

export default async function EnterResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: operator } = await supabase
    .from("operators")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!operator) redirect("/matches");

  // Fetch match with registrations
  const { data: match } = await supabase
    .from("matches")
    .select("*, match_registrations(*, profile:profiles(*))")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!match) notFound();

  const typedMatch = match as Match & {
    match_registrations: MatchRegistrationWithProfile[];
  };

  // Check results don't already exist
  const { data: existingResults } = await supabase
    .from("match_results")
    .select("id")
    .eq("match_id", id)
    .maybeSingle();

  if (existingResults) {
    redirect(`/operator/matches/${id}`);
  }

  const confirmedRegistrations = typedMatch.match_registrations.filter(
    (r) => r.status === "confirmed"
  );

  if (confirmedRegistrations.length === 0) {
    redirect(`/operator/matches/${id}`);
  }

  return (
    <div className="pb-24 lg:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <ResultsWizard
          match={typedMatch}
          operatorId={operator.id}
          players={confirmedRegistrations}
        />
      </div>
    </div>
  );
}
