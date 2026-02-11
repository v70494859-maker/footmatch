import { resend } from "./config";
import {
  welcomeEmail,
  subscriptionCreatedEmail,
  subscriptionCanceledEmail,
  matchRegistrationEmail,
  applicationSubmittedEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
} from "./templates";

const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

async function send(to: string, template: { subject: string; html: string }) {
  try {
    await resend().emails.send({
      from: `FootMatch <${FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  await send(email, welcomeEmail({ firstName }));
}

export async function sendSubscriptionCreatedEmail(
  email: string,
  firstName: string
) {
  await send(email, subscriptionCreatedEmail({ firstName }));
}

export async function sendSubscriptionCanceledEmail(
  email: string,
  firstName: string
) {
  await send(email, subscriptionCanceledEmail({ firstName }));
}

export async function sendMatchRegistrationEmail(
  email: string,
  data: {
    firstName: string;
    matchTitle: string;
    matchDate: string;
    matchTime: string;
    venueName: string;
    city: string;
    matchId: string;
  }
) {
  await send(email, matchRegistrationEmail(data));
}

export async function sendApplicationSubmittedEmail(
  email: string,
  firstName: string
) {
  await send(email, applicationSubmittedEmail({ firstName }));
}

export async function sendApplicationApprovedEmail(
  email: string,
  firstName: string
) {
  await send(email, applicationApprovedEmail({ firstName }));
}

export async function sendApplicationRejectedEmail(
  email: string,
  firstName: string,
  rejectionReason: string
) {
  await send(email, applicationRejectedEmail({ firstName, rejectionReason }));
}
