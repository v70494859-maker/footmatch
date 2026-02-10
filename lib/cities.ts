// ─── Cities grouped by country ─────────────────────────

export interface CityEntry {
  country: string;
  city: string;
}

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Suisse: [
    "Genève",
    "Carouge",
    "Lancy",
    "Onex",
    "Vernier",
    "Meyrin",
    "Chêne-Bourg",
    "Chêne-Bougeries",
    "Thônex",
    "Plan-les-Ouates",
    "Bernex",
    "Cologny",
    "Châtelaine",
    "Petit-Lancy",
    "Grand-Lancy",
    "Les Acacias",
    "Perly-Certoux",
    "Pregny-Chambésy",
    "Grand-Saconnex",
    "Satigny",
    "Aire-la-Ville",
    "Veyrier",
    "Bellevue",
    "Nyon",
    "Lausanne",
    "Morges",
    "Renens",
    "Yverdon-les-Bains",
    "Berne",
    "Zurich",
    "Bâle",
    "Lugano",
    "Fribourg",
    "Sion",
    "Neuchâtel",
    "Bienne",
    "Montreux",
    "Vevey",
  ],
  France: [
    "Annemasse",
    "Saint-Julien-en-Genevois",
    "Ferney-Voltaire",
    "Gex",
    "Thonon-les-Bains",
    "Évian-les-Bains",
    "Annecy",
    "Bonneville",
    "Cluses",
    "Lyon",
    "Paris",
    "Marseille",
    "Grenoble",
    "Chambéry",
  ],
};

// Flat list of all cities for quick lookup
export const ALL_CITIES: CityEntry[] = Object.entries(CITIES_BY_COUNTRY).flatMap(
  ([country, cities]) => cities.map((city) => ({ country, city }))
);

// ─── Origin countries with flag emojis ─────────────────

export interface OriginCountry {
  code: string;
  name: string;
  flag: string;
}

export const ORIGIN_COUNTRIES: OriginCountry[] = [
  { code: "CH", name: "Suisse", flag: "🇨🇭" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "ES", name: "Espagne", flag: "🇪🇸" },
  { code: "IT", name: "Italie", flag: "🇮🇹" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "BE", name: "Belgique", flag: "🇧🇪" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "CD", name: "RD Congo", flag: "🇨🇩" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "TR", name: "Turquie", flag: "🇹🇷" },
  { code: "BA", name: "Bosnie-Herzégovine", flag: "🇧🇦" },
  { code: "RS", name: "Serbie", flag: "🇷🇸" },
  { code: "HR", name: "Croatie", flag: "🇭🇷" },
  { code: "XK", name: "Kosovo", flag: "🇽🇰" },
  { code: "AL", name: "Albanie", flag: "🇦🇱" },
  { code: "MK", name: "Macédoine du Nord", flag: "🇲🇰" },
  { code: "PL", name: "Pologne", flag: "🇵🇱" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴" },
  { code: "BR", name: "Brésil", flag: "🇧🇷" },
  { code: "AR", name: "Argentine", flag: "🇦🇷" },
  { code: "CO", name: "Colombie", flag: "🇨🇴" },
  { code: "EC", name: "Equateur", flag: "🇪🇨" },
  { code: "CL", name: "Chili", flag: "🇨🇱" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "IN", name: "Inde", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹" },
  { code: "SO", name: "Somalie", flag: "🇸🇴" },
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "SY", name: "Syrie", flag: "🇸🇾" },
  { code: "IQ", name: "Irak", flag: "🇮🇶" },
];

/**
 * Get the flag emoji for an origin country name.
 */
export function getFlagForCountry(name: string | null): string | null {
  if (!name) return null;
  return ORIGIN_COUNTRIES.find((c) => c.name === name)?.flag ?? null;
}
