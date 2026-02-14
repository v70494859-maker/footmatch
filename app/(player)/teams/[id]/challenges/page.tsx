import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChallengesPage from "@/components/social/ChallengesPage";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Challenges - FootMatch" };
}

export default async function ChallengesRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check team exists and user is member
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, crest_url, crest_preset")
    .eq("id", id)
    .single();

  if (!team) notFound();

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  // Fetch challenges
  const { data: challenges } = await supabase
    .from("team_challenges")
    .select("*, challenger_team:teams!team_challenges_challenger_team_id_fkey(id, name, crest_url, crest_preset, member_count), challenged_team:teams!team_challenges_challenged_team_id_fkey(id, name, crest_url, crest_preset, member_count)")
    .or(`challenger_team_id.eq.${id},challenged_team_id.eq.${id}`)
    .order("created_at", { ascending: false });

  return (
    <ChallengesPage
      teamId={id}
      teamName={team.name}
      userId={user.id}
      userRole={membership.role}
      challenges={challenges ?? []}
    />
  );
}
