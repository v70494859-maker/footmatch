import { Resend } from "resend";
import {
  welcomeEmail,
  subscriptionCreatedEmail,
  subscriptionCanceledEmail,
  matchRegistrationEmail,
  applicationSubmittedEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "../lib/email/templates";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const TO = "contact@footmatch.ch";

const templates = [
  { name: "Welcome", ...welcomeEmail({ firstName: "Marc" }) },
  {
    name: "Subscription Created",
    ...subscriptionCreatedEmail({ firstName: "Marc" }),
  },
  {
    name: "Subscription Canceled",
    ...subscriptionCanceledEmail({ firstName: "Marc" }),
  },
  {
    name: "Match Registration",
    ...matchRegistrationEmail({
      firstName: "Marc",
      matchTitle: "Foot 5v5 - Carouge",
      matchDate: "Samedi 15 février 2026",
      matchTime: "18:00",
      venueName: "Centre Sportif de Carouge",
      city: "Carouge",
      matchId: "test-123",
    }),
  },
  {
    name: "Application Submitted",
    ...applicationSubmittedEmail({ firstName: "Marc" }),
  },
  {
    name: "Application Approved",
    ...applicationApprovedEmail({ firstName: "Marc" }),
  },
  {
    name: "Application Rejected",
    ...applicationRejectedEmail({
      firstName: "Marc",
      rejectionReason:
        "Documents d'identité non lisibles. Merci de resoumettre des photos plus nettes.",
    }),
  },
];

async function main() {
  console.log(`Sending ${templates.length} test emails to ${TO}...\n`);

  for (const tpl of templates) {
    try {
      const { data, error } = await resend.emails.send({
        from: `FootMatch <${FROM}>`,
        to: TO,
        subject: `[TEST] ${tpl.subject}`,
        html: tpl.html,
      });

      if (error) {
        console.log(`  ✗ ${tpl.name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${tpl.name} (id: ${data?.id})`);
      }
    } catch (err) {
      console.log(`  ✗ ${tpl.name}: ${err}`);
    }
  }

  console.log("\nDone!");
}

main();
