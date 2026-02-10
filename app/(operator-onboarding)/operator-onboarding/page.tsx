import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function OperatorOnboardingIndexPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if an application already exists
  const { data: application } = await supabase
    .from("operator_applications")
    .select("status")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!application) {
    redirect("/operator-onboarding/personal");
  }

  const status = application.status as ApplicationStatus;

  switch (status) {
    case "draft":
      // Resume where they left off — send to personal (first step)
      redirect("/operator-onboarding/personal");
    case "pending":
      redirect("/operator-onboarding/waiting");
    case "approved":
      redirect("/operator");
    case "rejected":
      redirect("/operator-onboarding/waiting");
    default:
      redirect("/operator-onboarding/personal");
  }
}
