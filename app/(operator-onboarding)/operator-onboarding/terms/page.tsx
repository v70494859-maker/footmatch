import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OperatorApplication } from "@/types";
import TermsForm from "@/components/operator-onboarding/TermsForm";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
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

  if (!application) {
    redirect("/operator-onboarding/personal");
  }

  return <TermsForm application={application as OperatorApplication} />;
}
