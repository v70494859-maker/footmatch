const APP_URL = "https://www.footmatch.ch";

// ─── Layout ──────────────────────────────────────────────────
function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FootMatch</title>
</head>
<body style="margin:0;padding:0;background-color:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#030712;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111827;border-radius:16px;border:1px solid #1f2937;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">Foot</span><span style="font-size:24px;font-weight:800;color:#f9fafb;letter-spacing:-0.5px;">Match</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;border-top:1px solid #1f2937;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#6b7280;">FootMatch &mdash; La plateforme des matchs de foot</p>
              <p style="margin:4px 0 0;font-size:11px;color:#4b5563;">www.footmatch.ch</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
  <tr>
    <td style="background-color:#4ade80;border-radius:12px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#030712;text-decoration:none;border-radius:12px;">${text}</a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f9fafb;text-align:center;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#d1d5db;">${text}</p>`;
}

function infoBox(content: string): string {
  return `<div style="background-color:#1f2937;border-radius:12px;padding:16px;margin:16px 0;">
  ${content}
</div>`;
}

function checkItem(text: string): string {
  return `<tr>
  <td style="padding:4px 0;font-size:14px;color:#d1d5db;">
    <span style="color:#4ade80;margin-right:8px;">&#10003;</span> ${text}
  </td>
</tr>`;
}

// ─── Templates ───────────────────────────────────────────────

export function welcomeEmail(data: { firstName: string }) {
  return {
    subject: `Bienvenue sur FootMatch, ${data.firstName}\u202F!`,
    html: layout(`
      ${heading("Bienvenue sur FootMatch\u202F!")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Ton profil a été créé avec succès. Tu peux maintenant découvrir les matchs de foot près de chez toi et rejoindre la communauté FootMatch.")}
      ${infoBox(`
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#f9fafb;">Pour jouer, abonne-toi\u202F!</p>
        <p style="margin:0;font-size:13px;color:#9ca3af;">7 jours d'essai gratuit, puis 11,99\u202F€/mois. Matchs illimités, annulation à tout moment.</p>
      `)}
      ${btn("Voir les matchs", `${APP_URL}/matches`)}
    `),
  };
}

export function subscriptionCreatedEmail(data: { firstName: string }) {
  return {
    subject: "Ton abonnement FootMatch est actif\u202F!",
    html: layout(`
      ${heading("Bienvenue dans FootMatch Premium\u202F!")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Ton essai gratuit de 7 jours a commencé. Tu peux maintenant t'inscrire à autant de matchs que tu veux\u202F!")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        ${checkItem("Matchs illimités")}
        ${checkItem("Inscription instantanée")}
        ${checkItem("Annulation à tout moment")}
      </table>
      ${paragraph('<span style="font-size:12px;color:#6b7280;">Après la période d\'essai, ton abonnement sera de 11,99\u202F€/mois.</span>')}
      ${btn("Parcourir les matchs", `${APP_URL}/matches`)}
    `),
  };
}

export function subscriptionCanceledEmail(data: { firstName: string }) {
  return {
    subject: "Ton abonnement FootMatch a été annulé",
    html: layout(`
      ${heading("Abonnement annulé")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Ton abonnement FootMatch Premium a été annulé. Tu conserves l'accès jusqu'à la fin de ta période de facturation en cours.")}
      ${paragraph("Après cela, tu ne pourras plus t'inscrire à de nouveaux matchs. Tu peux te réabonner à tout moment.")}
      ${btn("Se réabonner", `${APP_URL}/subscription`)}
      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">On espère te revoir bientôt sur les terrains\u202F!</p>
    `),
  };
}

export function matchRegistrationEmail(data: {
  firstName: string;
  matchTitle: string;
  matchDate: string;
  matchTime: string;
  venueName: string;
  city: string;
  matchId: string;
}) {
  return {
    subject: `Inscription confirmée : ${data.matchTitle}`,
    html: layout(`
      ${heading("Tu es inscrit\u202F!")}
      ${paragraph(`Bonjour ${data.firstName}, ton inscription au match a bien été enregistrée.`)}
      ${infoBox(`
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#f9fafb;">${data.matchTitle}</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr><td style="padding:3px 0;font-size:13px;color:#9ca3af;">📅 ${data.matchDate} à ${data.matchTime}</td></tr>
          <tr><td style="padding:3px 0;font-size:13px;color:#9ca3af;">📍 ${data.venueName}, ${data.city}</td></tr>
        </table>
      `)}
      ${paragraph("N'oublie pas de consulter le chat du match pour communiquer avec les autres joueurs.")}
      ${btn("Voir le match", `${APP_URL}/matches/${data.matchId}`)}
    `),
  };
}

export function applicationSubmittedEmail(data: { firstName: string }) {
  return {
    subject: "Candidature reçue\u202F!",
    html: layout(`
      ${heading("Candidature reçue\u202F!")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Merci pour ta candidature en tant qu'organisateur FootMatch. Notre équipe va l'examiner dans les prochaines 24 à 48 heures.")}
      ${infoBox(`
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#f9fafb;">Prochaines étapes</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">1. Examen de ton profil et documents</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">2. Notification par email du résultat</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#9ca3af;">3. Si approuvé, configuration de Stripe Connect</td></tr>
        </table>
      `)}
      ${btn("Suivre ma candidature", `${APP_URL}/operator-onboarding/waiting`)}
    `),
  };
}

export function applicationApprovedEmail(data: { firstName: string }) {
  return {
    subject: `Félicitations ${data.firstName}\u202F! Candidature approuvée`,
    html: layout(`
      ${heading("Candidature approuvée\u202F!")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Excellente nouvelle\u202F! Ta candidature en tant qu'organisateur FootMatch a été approuvée. Tu peux maintenant créer des matchs et commencer à gagner de l'argent.")}
      ${infoBox(`
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#f9fafb;">Rappel du modèle</p>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Tu recevras <strong style="color:#4ade80;">80%</strong> des abonnements de tes joueurs, directement sur ton compte Stripe Connect.</p>
      `)}
      ${paragraph("N'oublie pas de configurer ton compte Stripe Connect pour recevoir tes paiements.")}
      ${btn("Accéder à mon tableau de bord", `${APP_URL}/operator`)}
    `),
  };
}

export function applicationRejectedEmail(data: {
  firstName: string;
  rejectionReason: string;
}) {
  return {
    subject: "Mise à jour de ta candidature FootMatch",
    html: layout(`
      ${heading("Candidature non retenue")}
      ${paragraph(`Bonjour ${data.firstName},`)}
      ${paragraph("Après examen, nous n'avons pas pu approuver ta candidature pour le moment.")}
      <div style="background-color:#7f1d1d20;border:1px solid #dc262640;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#fca5a5;">Motif du refus</p>
        <p style="margin:0;font-size:14px;color:#d1d5db;">${data.rejectionReason}</p>
      </div>
      ${paragraph("Tu peux soumettre une nouvelle candidature en corrigeant les points mentionnés ci-dessus.")}
      ${btn("Resoumettre ma candidature", `${APP_URL}/operator-onboarding/personal`)}
    `),
  };
}
