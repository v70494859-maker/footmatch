import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME_ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";
import LandingPage from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      const role = profile.role as UserRole;
      redirect(ROLE_HOME_ROUTES[role] || "/matches");
    } else {
      redirect("/onboarding");
    }
  }

  return <LandingPage />;
}
