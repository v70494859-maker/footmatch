/**
 * Flag-inspired gradient colors for each origin country.
 * Format: [color1, color2] for a CSS linear-gradient.
 */

const COUNTRY_GRADIENTS: Record<string, [string, string]> = {
  // Europe
  Suisse: ["#FF0000", "#FFFFFF"],
  France: ["#002395", "#ED2939"],
  Portugal: ["#006600", "#FF0000"],
  Espagne: ["#FF0000", "#FFC400"],
  Italie: ["#009246", "#CE2B37"],
  Allemagne: ["#000000", "#DD0000"],
  "Royaume-Uni": ["#00247D", "#CF142B"],
  Belgique: ["#000000", "#FDDA24"],
  "Pays-Bas": ["#AE1C28", "#21468B"],
  Pologne: ["#FFFFFF", "#DC143C"],
  Roumanie: ["#002B7F", "#FCD116"],
  "Bosnie-Herzégovine": ["#002395", "#FECB00"],
  Serbie: ["#C6363C", "#21357E"],
  Croatie: ["#FF0000", "#171796"],
  Kosovo: ["#244AA5", "#D0A650"],
  Albanie: ["#E41E20", "#000000"],
  "Macédoine du Nord": ["#CE2028", "#F9D616"],

  // North Africa
  Algérie: ["#006233", "#FFFFFF"],
  Maroc: ["#C1272D", "#006233"],
  Tunisie: ["#E70013", "#FFFFFF"],

  // Sub-Saharan Africa
  Sénégal: ["#00853F", "#FDEF42"],
  "Côte d'Ivoire": ["#FF8200", "#009A44"],
  Cameroun: ["#007A5E", "#CE1126"],
  "RD Congo": ["#007FFF", "#F7D618"],
  Congo: ["#009543", "#FBDE4A"],
  Mali: ["#14B53A", "#FCD116"],
  Guinée: ["#CE1126", "#FCD116"],
  Érythrée: ["#4189DD", "#EA0437"],
  Éthiopie: ["#009B3A", "#FCDD09"],
  Somalie: ["#4189DD", "#FFFFFF"],

  // Middle East
  Turquie: ["#E30A17", "#FFFFFF"],
  Syrie: ["#CE1126", "#000000"],
  Irak: ["#CE1126", "#007A3D"],
  Afghanistan: ["#000000", "#009900"],

  // South America
  Brésil: ["#009C3B", "#FFDF00"],
  Argentine: ["#74ACDF", "#FFFFFF"],
  Colombie: ["#FCD116", "#003893"],
  Equateur: ["#FFD100", "#034EA2"],
  Chili: ["#D52B1E", "#0039A6"],

  // Asia
  "Sri Lanka": ["#8D153A", "#EB7400"],
  Inde: ["#FF9933", "#138808"],
  Philippines: ["#0038A8", "#CE1126"],
};

const DEFAULT_GRADIENT: [string, string] = ["#374151", "#6B7280"];

/**
 * Get gradient colors for a country name.
 */
export function getCountryGradient(country: string | null): [string, string] {
  if (!country) return DEFAULT_GRADIENT;
  return COUNTRY_GRADIENTS[country] ?? DEFAULT_GRADIENT;
}
