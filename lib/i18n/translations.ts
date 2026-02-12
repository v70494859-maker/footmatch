import commonSection from "./sections/common";
import playerSection from "./sections/player";
import operatorSection from "./sections/operator";
import adminSection from "./sections/admin";
import legalSection from "./sections/legal";
import gamificationSection from "./sections/gamification";
import faqSection from "./sections/faq";
import socialSection from "./sections/social";

export type Locale = "fr" | "en" | "es";

export interface Language {
  code: Locale;
  label: string;
}

export const languages: Language[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "US" },
  { code: "es", label: "ES" },
];

// Landing page translations (inline to keep existing structure)
const landing = {
  fr: {
    header: { login: "Connexion" },
    hero: {
      badge: "7 jours d'essai gratuit",
      headlineMain: "Du football en illimité",
      headlineAccent: "pour 11,99\u202F\u20AC/mois",
      subtitle: "Essaie gratuitement pendant 7 jours. Inscris-toi à autant de matchs que tu veux, chaque semaine, sans limite. Le football n'a jamais été aussi accessible.",
      cta: "Essayer gratuitement",
      ctaSub: "7 jours gratuits, puis 11,99\u202F\u20AC/mois. Annule à tout moment.",
    },
    stats: {
      subscribers: { value: "500+", label: "Abonnés", description: "joueurs actifs" },
      matches: { value: "200+", label: "Matchs/Mois", description: "organisés chaque mois" },
      cities: { value: "20+", label: "Villes", description: "à travers le pays" },
      operators: { value: "50+", label: "Opérateurs", description: "organisent des matchs" },
    },
    features: {
      heading: "Pourquoi FootMatch\u202F?",
      subtitle: "Tout ce qu'il te faut pour jouer au football régulièrement.",
      items: [
        { title: "Abonne-toi une fois", description: "Un seul abonnement mensuel te donne un accès illimité à tous les matchs de la plateforme." },
        { title: "Parcours les matchs", description: "Trouve des matchs de football dans ta ville. Filtre par date, heure et lieu." },
        { title: "Inscris-toi instantanément", description: "Pas besoin d'approbation. Inscris-toi à un match et viens jouer." },
        { title: "Gagne en tant qu'opérateur", description: "Organise des matchs et gagne de l'argent. Postule pour devenir opérateur et commence à gagner." },
      ],
    },
    pricing: {
      heading: "Tarif simple",
      subtitle: "Un abonnement, du football illimité.",
      player: {
        label: "Joueur", trialBadge: "7 jours gratuits", price: "11,99\u202F\u20AC", period: "/mois",
        description: "Essaie gratuitement pendant 7 jours, puis profite du football illimité.",
        features: ["Inscriptions aux matchs illimitées", "Parcours tous les matchs dans ta ville", "Inscription instantanée, sans approbation", "Annule à tout moment"],
        cta: "Essayer gratuitement", ctaSub: "Sans engagement. Annule à tout moment.",
      },
      operator: {
        label: "Opérateur", heading: "Organise des matchs, gagne de l'argent",
        description: "Deviens opérateur et organise des matchs de football dans ta ville. Gagne une part des revenus d'abonnement en fonction des matchs que tu organises et des joueurs que tu attires. Candidature gratuite.",
        features: ["Crée et gère des matchs", "Gagne grâce au partage des revenus d'abonnement", "Reçois tes paiements via Stripe Connect", "Gratuit pour devenir opérateur"],
        cta: "Postuler",
      },
    },
    howItWorks: {
      heading: "Comment ça marche",
      subtitle: "Quatre étapes du canapé au terrain.",
      steps: [
        { title: "Inscris-toi", description: "Crée ton compte gratuit en quelques secondes avec Google ou par e-mail." },
        { title: "Abonne-toi", description: "7 jours gratuits, puis 11,99\u202F\u20AC/mois pour des matchs en illimité." },
        { title: "Parcours", description: "Trouve des matchs dans ta ville et choisis ceux qui correspondent à ton emploi du temps." },
        { title: "Joue", description: "Viens et joue. C'est aussi simple que ça." },
      ],
    },
    footer: { matches: "Matchs", becomeOperator: "Devenir opérateur", login: "Connexion", copyright: "Tous droits réservés." },
  },
  en: {
    header: { login: "Log in" },
    hero: {
      badge: "7-day free trial",
      headlineMain: "Unlimited football",
      headlineAccent: "for \u20AC11.99/month",
      subtitle: "Try free for 7 days. Sign up for as many matches as you want, every week, with no limits. Football has never been this accessible.",
      cta: "Try for free",
      ctaSub: "7 days free, then \u20AC11.99/month. Cancel anytime.",
    },
    stats: {
      subscribers: { value: "500+", label: "Subscribers", description: "active players" },
      matches: { value: "200+", label: "Matches/Month", description: "organized every month" },
      cities: { value: "20+", label: "Cities", description: "across the country" },
      operators: { value: "50+", label: "Operators", description: "organize matches" },
    },
    features: {
      heading: "Why FootMatch?",
      subtitle: "Everything you need to play football regularly.",
      items: [
        { title: "Subscribe once", description: "A single monthly subscription gives you unlimited access to every match on the platform." },
        { title: "Browse matches", description: "Find football matches in your city. Filter by date, time, and location." },
        { title: "Sign up instantly", description: "No approval needed. Join a match and come play." },
        { title: "Earn as an operator", description: "Organize matches and earn money. Apply to become an operator and start earning." },
      ],
    },
    pricing: {
      heading: "Simple pricing",
      subtitle: "One subscription, unlimited football.",
      player: {
        label: "Player", trialBadge: "7 days free", price: "\u20AC11.99", period: "/month",
        description: "Try free for 7 days, then enjoy unlimited football.",
        features: ["Unlimited match registrations", "Browse all matches in your city", "Instant sign-up, no approval needed", "Cancel anytime"],
        cta: "Try for free", ctaSub: "No commitment. Cancel anytime.",
      },
      operator: {
        label: "Operator", heading: "Organize matches, earn money",
        description: "Become an operator and organize football matches in your city. Earn a share of subscription revenue based on the matches you organize and the players you attract. Free to apply.",
        features: ["Create and manage matches", "Earn through subscription revenue sharing", "Get paid via Stripe Connect", "Free to become an operator"],
        cta: "Apply",
      },
    },
    howItWorks: {
      heading: "How it works",
      subtitle: "Four steps from the couch to the pitch.",
      steps: [
        { title: "Sign up", description: "Create your free account in seconds with Google or email." },
        { title: "Subscribe", description: "7 days free, then \u20AC11.99/month for unlimited matches." },
        { title: "Browse", description: "Find matches in your city and pick the ones that fit your schedule." },
        { title: "Play", description: "Show up and play. It's that simple." },
      ],
    },
    footer: { matches: "Matches", becomeOperator: "Become an operator", login: "Log in", copyright: "All rights reserved." },
  },
  es: {
    header: { login: "Iniciar sesión" },
    hero: {
      badge: "7 días de prueba gratis",
      headlineMain: "Fútbol ilimitado",
      headlineAccent: "por 11,99\u202F\u20AC/mes",
      subtitle: "Prueba gratis durante 7 días. Inscríbete a todos los partidos que quieras, cada semana, sin límites. El fútbol nunca fue tan accesible.",
      cta: "Probar gratis",
      ctaSub: "7 días gratis, luego 11,99\u202F\u20AC/mes. Cancela cuando quieras.",
    },
    stats: {
      subscribers: { value: "500+", label: "Suscriptores", description: "jugadores activos" },
      matches: { value: "200+", label: "Partidos/Mes", description: "organizados cada mes" },
      cities: { value: "20+", label: "Ciudades", description: "en todo el país" },
      operators: { value: "50+", label: "Operadores", description: "organizan partidos" },
    },
    features: {
      heading: "\u00BFPor qué FootMatch?",
      subtitle: "Todo lo que necesitas para jugar al fútbol regularmente.",
      items: [
        { title: "Suscríbete una vez", description: "Una sola suscripción mensual te da acceso ilimitado a todos los partidos de la plataforma." },
        { title: "Explora los partidos", description: "Encuentra partidos de fútbol en tu ciudad. Filtra por fecha, hora y lugar." },
        { title: "Inscríbete al instante", description: "Sin necesidad de aprobación. Únete a un partido y ven a jugar." },
        { title: "Gana como operador", description: "Organiza partidos y gana dinero. Postúlate como operador y empieza a ganar." },
      ],
    },
    pricing: {
      heading: "Precio simple",
      subtitle: "Una suscripción, fútbol ilimitado.",
      player: {
        label: "Jugador", trialBadge: "7 días gratis", price: "11,99\u202F\u20AC", period: "/mes",
        description: "Prueba gratis durante 7 días, luego disfruta de fútbol ilimitado.",
        features: ["Inscripciones a partidos ilimitadas", "Explora todos los partidos en tu ciudad", "Inscripción instantánea, sin aprobación", "Cancela cuando quieras"],
        cta: "Probar gratis", ctaSub: "Sin compromiso. Cancela cuando quieras.",
      },
      operator: {
        label: "Operador", heading: "Organiza partidos, gana dinero",
        description: "Conviértete en operador y organiza partidos de fútbol en tu ciudad. Gana una parte de los ingresos de suscripción según los partidos que organices y los jugadores que atraigas. Postulación gratuita.",
        features: ["Crea y gestiona partidos", "Gana con el reparto de ingresos de suscripción", "Recibe tus pagos vía Stripe Connect", "Gratis para ser operador"],
        cta: "Postularse",
      },
    },
    howItWorks: {
      heading: "Cómo funciona",
      subtitle: "Cuatro pasos del sofá al campo.",
      steps: [
        { title: "Regístrate", description: "Crea tu cuenta gratis en segundos con Google o correo electrónico." },
        { title: "Suscríbete", description: "7 días gratis, luego 11,99\u202F\u20AC/mes para partidos ilimitados." },
        { title: "Explora", description: "Encuentra partidos en tu ciudad y elige los que se ajusten a tu horario." },
        { title: "Juega", description: "Ven y juega. Así de simple." },
      ],
    },
    footer: { matches: "Partidos", becomeOperator: "Ser operador", login: "Iniciar sesión", copyright: "Todos los derechos reservados." },
  },
};

// Merge all sections
const translations = {
  fr: { ...landing.fr, ...commonSection.fr, ...playerSection.fr, ...operatorSection.fr, ...adminSection.fr, ...legalSection.fr, ...gamificationSection.fr, ...faqSection.fr, ...socialSection.fr },
  en: { ...landing.en, ...commonSection.en, ...playerSection.en, ...operatorSection.en, ...adminSection.en, ...legalSection.en, ...gamificationSection.en, ...faqSection.en, ...socialSection.en },
  es: { ...landing.es, ...commonSection.es, ...playerSection.es, ...operatorSection.es, ...adminSection.es, ...legalSection.es, ...gamificationSection.es, ...faqSection.es, ...socialSection.es },
};

export type Translations = (typeof translations)["fr"];
export default translations as Record<Locale, Translations>;
