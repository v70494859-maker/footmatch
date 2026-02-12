import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamsPage from "@/components/social/TeamsPage";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Teams - FootMatch" }; }

export default async function TeamsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user has signed charter
  const { data: charter } = await supabase
    .from("team_charters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch user's teams
  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, team:teams(*, captain:profiles!teams_captain_id_fkey(id, first_name, last_name, avatar_url))")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("*, team:teams(*), inviter:profiles!team_invitations_inviter_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  return (
    <TeamsPage
      userId={user.id}
      hasSignedCharter={!!charter}
      teams={(memberships ?? []).map((m: any) => ({ ...m.team, myRole: m.role }))}
      invitations={invitations ?? []}
    />
  );
}
