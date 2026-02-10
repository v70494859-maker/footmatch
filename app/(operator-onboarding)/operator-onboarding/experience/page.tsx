import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OperatorApplication } from "@/types";
import ExperienceForm from "@/components/operator-onboarding/ExperienceForm";

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
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

  // Must have started an application first
  if (!application) {
    redirect("/operator-onboarding/personal");
  }

  return (
    <ExperienceForm application={application as OperatorApplication} />
  );
}
