import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  sendWelcomeEmail,
  sendMatchRegistrationEmail,
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
} from "@/lib/email/send";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data } = await req.json();

    switch (type) {
      case "welcome": {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", user.id)
          .single();

        if (profile?.email) {
          await sendWelcomeEmail(profile.email, profile.first_name || "");
        }
        break;
      }

      case "match_registration": {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", user.id)
          .single();

        const { data: match } = await serviceSupabase
          .from("matches")
          .select("id, title, date, start_time, venue_name, city")
          .eq("id", data?.matchId)
          .single();

        if (profile?.email && match) {
          await sendMatchRegistrationEmail(profile.email, {
            firstName: profile.first_name || "",
            matchTitle: match.title,
            matchDate: match.date,
            matchTime: match.start_time,
            venueName: match.venue_name,
            city: match.city,
            matchId: match.id,
          });
        }
        break;
      }

      case "application_submitted": {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", user.id)
          .single();

        if (profile?.email) {
          await sendApplicationSubmittedEmail(
            profile.email,
            profile.first_name || ""
          );
        }
        break;
      }

      case "application_approved": {
        // Admin-only
        const { data: adminProfile } = await serviceSupabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (adminProfile?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", data?.profileId)
          .single();

        if (profile?.email) {
          await sendApplicationApprovedEmail(
            profile.email,
            profile.first_name || ""
          );
        }
        break;
      }

      case "application_rejected": {
        // Admin-only
        const { data: adminProfile } = await serviceSupabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (adminProfile?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("email, first_name")
          .eq("id", data?.profileId)
          .single();

        if (profile?.email) {
          await sendApplicationRejectedEmail(
            profile.email,
            profile.first_name || "",
            data?.rejectionReason || ""
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown email type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/send] Error:", err);
    return NextResponse.json({ ok: true }); // Don't fail the user flow
  }
}
