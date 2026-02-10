import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OperatorApplication } from "@/types";
import PersonalForm from "@/components/operator-onboarding/PersonalForm";

export const dynamic = "force-dynamic";

export default async function PersonalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch existing application if any
  const { data: application } = await supabase
    .from("operator_applications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <PersonalForm
      userId={user.id}
      application={application as OperatorApplication | null}
    />
  );
}
