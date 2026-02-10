import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME_ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FootMatch - Créer ton profil",
  description: "Configure ton profil pour commencer à jouer au football",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile) {
    const role = profile.role as UserRole;
    redirect(ROLE_HOME_ROUTES[role] || "/matches");
  }

  const defaultName =
    user.user_metadata?.full_name || user.user_metadata?.name || "";

  return (
    <OnboardingWizard
      userId={user.id}
      userEmail={user.email || null}
      defaultName={defaultName}
    />
  );
}
