import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeamCreationForm from "@/components/social/TeamCreationForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Create Team - FootMatch" }; }

export default async function CreateTeamRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if user has signed charter
  const { data: charter } = await supabase
    .from("team_charters")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <TeamCreationForm userId={user.id} hasSignedCharter={!!charter} />
  );
}
