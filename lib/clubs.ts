export interface Club {
  name: string;
  slug: string;
  country: string;
  league: string;
  wiki: string; // Wikipedia article name for logo download
}

export const CLUBS: Club[] = [
  // ─── Swiss Super League ───
  { name: "Servette FC", slug: "servette", country: "Suisse", league: "Super League", wiki: "Servette_FC" },
  { name: "BSC Young Boys", slug: "young-boys", country: "Suisse", league: "Super League", wiki: "BSC_Young_Boys" },
  { name: "FC Basel", slug: "basel", country: "Suisse", league: "Super League", wiki: "FC_Basel" },
  { name: "FC Zürich", slug: "zurich", country: "Suisse", league: "Super League", wiki: "FC_Zürich" },
  { name: "FC Lausanne-Sport", slug: "lausanne", country: "Suisse", league: "Super League", wiki: "FC_Lausanne-Sport" },
  { name: "FC Sion", slug: "sion", country: "Suisse", league: "Super League", wiki: "FC_Sion" },
  { name: "FC Lugano", slug: "lugano", country: "Suisse", league: "Super League", wiki: "FC_Lugano" },
  { name: "FC St. Gallen", slug: "st-gallen", country: "Suisse", league: "Super League", wiki: "FC_St._Gallen" },
  { name: "Grasshopper Club", slug: "grasshopper", country: "Suisse", league: "Super League", wiki: "Grasshopper_Club_Zürich" },
  { name: "FC Luzern", slug: "luzern", country: "Suisse", league: "Super League", wiki: "FC_Luzern" },
  { name: "FC Winterthur", slug: "winterthur", country: "Suisse", league: "Super League", wiki: "FC_Winterthur" },
  { name: "Yverdon Sport", slug: "yverdon", country: "Suisse", league: "Super League", wiki: "Yverdon-Sport_FC" },

  // ─── Ligue 1 (France) ───
  { name: "Paris Saint-Germain", slug: "psg", country: "France", league: "Ligue 1", wiki: "Paris_Saint-Germain_F.C." },
  { name: "Olympique de Marseille", slug: "marseille", country: "France", league: "Ligue 1", wiki: "Olympique_de_Marseille" },
  { name: "Olympique Lyonnais", slug: "lyon", country: "France", league: "Ligue 1", wiki: "Olympique_Lyonnais" },
  { name: "AS Monaco", slug: "monaco", country: "France", league: "Ligue 1", wiki: "AS_Monaco_FC" },
  { name: "LOSC Lille", slug: "lille", country: "France", league: "Ligue 1", wiki: "Lille_OSC" },
  { name: "OGC Nice", slug: "nice", country: "France", league: "Ligue 1", wiki: "OGC_Nice" },
  { name: "RC Lens", slug: "lens", country: "France", league: "Ligue 1", wiki: "RC_Lens" },
  { name: "Stade Rennais", slug: "rennes", country: "France", league: "Ligue 1", wiki: "Stade_Rennais_F.C." },
  { name: "RC Strasbourg", slug: "strasbourg", country: "France", league: "Ligue 1", wiki: "RC_Strasbourg_Alsace" },
  { name: "FC Nantes", slug: "nantes", country: "France", league: "Ligue 1", wiki: "FC_Nantes" },
  { name: "Toulouse FC", slug: "toulouse", country: "France", league: "Ligue 1", wiki: "Toulouse_FC" },
  { name: "Montpellier HSC", slug: "montpellier", country: "France", league: "Ligue 1", wiki: "Montpellier_HSC" },
  { name: "Stade Brestois", slug: "brest", country: "France", league: "Ligue 1", wiki: "Stade_Brestois_29" },
  { name: "Stade de Reims", slug: "reims", country: "France", league: "Ligue 1", wiki: "Stade_de_Reims" },
  { name: "AS Saint-Étienne", slug: "saint-etienne", country: "France", league: "Ligue 1", wiki: "AS_Saint-Étienne" },

  // ─── Premier League (England) ───
  { name: "Arsenal", slug: "arsenal", country: "Angleterre", league: "Premier League", wiki: "Arsenal_F.C." },
  { name: "Chelsea", slug: "chelsea", country: "Angleterre", league: "Premier League", wiki: "Chelsea_F.C." },
  { name: "Liverpool", slug: "liverpool", country: "Angleterre", league: "Premier League", wiki: "Liverpool_F.C." },
  { name: "Manchester City", slug: "man-city", country: "Angleterre", league: "Premier League", wiki: "Manchester_City_F.C." },
  { name: "Manchester United", slug: "man-united", country: "Angleterre", league: "Premier League", wiki: "Manchester_United_F.C." },
  { name: "Tottenham Hotspur", slug: "tottenham", country: "Angleterre", league: "Premier League", wiki: "Tottenham_Hotspur_F.C." },
  { name: "Newcastle United", slug: "newcastle", country: "Angleterre", league: "Premier League", wiki: "Newcastle_United_F.C." },
  { name: "Aston Villa", slug: "aston-villa", country: "Angleterre", league: "Premier League", wiki: "Aston_Villa_F.C." },
  { name: "West Ham United", slug: "west-ham", country: "Angleterre", league: "Premier League", wiki: "West_Ham_United_F.C." },
  { name: "Brighton", slug: "brighton", country: "Angleterre", league: "Premier League", wiki: "Brighton_%26_Hove_Albion_F.C." },
  { name: "Crystal Palace", slug: "crystal-palace", country: "Angleterre", league: "Premier League", wiki: "Crystal_Palace_F.C." },
  { name: "Everton", slug: "everton", country: "Angleterre", league: "Premier League", wiki: "Everton_F.C." },
  { name: "Nottingham Forest", slug: "nottingham", country: "Angleterre", league: "Premier League", wiki: "Nottingham_Forest_F.C." },
  { name: "Fulham", slug: "fulham", country: "Angleterre", league: "Premier League", wiki: "Fulham_F.C." },
  { name: "Wolverhampton", slug: "wolves", country: "Angleterre", league: "Premier League", wiki: "Wolverhampton_Wanderers_F.C." },
  { name: "Bournemouth", slug: "bournemouth", country: "Angleterre", league: "Premier League", wiki: "AFC_Bournemouth" },
  { name: "Brentford", slug: "brentford", country: "Angleterre", league: "Premier League", wiki: "Brentford_F.C." },

  // ─── La Liga (Spain) ───
  { name: "FC Barcelona", slug: "barcelona", country: "Espagne", league: "La Liga", wiki: "FC_Barcelona" },
  { name: "Real Madrid", slug: "real-madrid", country: "Espagne", league: "La Liga", wiki: "Real_Madrid_CF" },
  { name: "Atlético Madrid", slug: "atletico", country: "Espagne", league: "La Liga", wiki: "Atlético_Madrid" },
  { name: "Sevilla FC", slug: "sevilla", country: "Espagne", league: "La Liga", wiki: "Sevilla_FC" },
  { name: "Real Sociedad", slug: "real-sociedad", country: "Espagne", league: "La Liga", wiki: "Real_Sociedad" },
  { name: "Real Betis", slug: "betis", country: "Espagne", league: "La Liga", wiki: "Real_Betis" },
  { name: "Valencia CF", slug: "valencia", country: "Espagne", league: "La Liga", wiki: "Valencia_CF" },
  { name: "Villarreal CF", slug: "villarreal", country: "Espagne", league: "La Liga", wiki: "Villarreal_CF" },
  { name: "Athletic Bilbao", slug: "bilbao", country: "Espagne", league: "La Liga", wiki: "Athletic_Bilbao" },

  // ─── Serie A (Italy) ───
  { name: "Juventus", slug: "juventus", country: "Italie", league: "Serie A", wiki: "Juventus_F.C." },
  { name: "AC Milan", slug: "ac-milan", country: "Italie", league: "Serie A", wiki: "A.C._Milan" },
  { name: "Inter Milan", slug: "inter-milan", country: "Italie", league: "Serie A", wiki: "Inter_Milan" },
  { name: "AS Roma", slug: "roma", country: "Italie", league: "Serie A", wiki: "A.S._Roma" },
  { name: "SSC Napoli", slug: "napoli", country: "Italie", league: "Serie A", wiki: "S.S.C._Napoli" },
  { name: "SS Lazio", slug: "lazio", country: "Italie", league: "Serie A", wiki: "S.S._Lazio" },
  { name: "ACF Fiorentina", slug: "fiorentina", country: "Italie", league: "Serie A", wiki: "ACF_Fiorentina" },
  { name: "Atalanta", slug: "atalanta", country: "Italie", league: "Serie A", wiki: "Atalanta_BC" },

  // ─── Bundesliga (Germany) ───
  { name: "Bayern Munich", slug: "bayern", country: "Allemagne", league: "Bundesliga", wiki: "FC_Bayern_Munich" },
  { name: "Borussia Dortmund", slug: "dortmund", country: "Allemagne", league: "Bundesliga", wiki: "Borussia_Dortmund" },
  { name: "RB Leipzig", slug: "leipzig", country: "Allemagne", league: "Bundesliga", wiki: "RB_Leipzig" },
  { name: "Bayer Leverkusen", slug: "leverkusen", country: "Allemagne", league: "Bundesliga", wiki: "Bayer_04_Leverkusen" },
  { name: "Eintracht Frankfurt", slug: "frankfurt", country: "Allemagne", league: "Bundesliga", wiki: "Eintracht_Frankfurt" },
  { name: "VfB Stuttgart", slug: "stuttgart", country: "Allemagne", league: "Bundesliga", wiki: "VfB_Stuttgart" },
  { name: "VfL Wolfsburg", slug: "wolfsburg", country: "Allemagne", league: "Bundesliga", wiki: "VfL_Wolfsburg" },
  { name: "Borussia M'gladbach", slug: "gladbach", country: "Allemagne", league: "Bundesliga", wiki: "Borussia_Mönchengladbach" },

  // ─── Portugal ───
  { name: "SL Benfica", slug: "benfica", country: "Portugal", league: "Primeira Liga", wiki: "S.L._Benfica" },
  { name: "FC Porto", slug: "porto", country: "Portugal", league: "Primeira Liga", wiki: "FC_Porto" },
  { name: "Sporting CP", slug: "sporting", country: "Portugal", league: "Primeira Liga", wiki: "Sporting_CP" },
  { name: "SC Braga", slug: "braga", country: "Portugal", league: "Primeira Liga", wiki: "S.C._Braga" },

  // ─── Netherlands ───
  { name: "Ajax Amsterdam", slug: "ajax", country: "Pays-Bas", league: "Eredivisie", wiki: "AFC_Ajax" },
  { name: "PSV Eindhoven", slug: "psv", country: "Pays-Bas", league: "Eredivisie", wiki: "PSV_Eindhoven" },
  { name: "Feyenoord", slug: "feyenoord", country: "Pays-Bas", league: "Eredivisie", wiki: "Feyenoord" },

  // ─── Turkey ───
  { name: "Galatasaray", slug: "galatasaray", country: "Turquie", league: "Süper Lig", wiki: "Galatasaray_S.K._(football)" },
  { name: "Fenerbahçe", slug: "fenerbahce", country: "Turquie", league: "Süper Lig", wiki: "Fenerbahçe_S.K._(football)" },
  { name: "Beşiktaş", slug: "besiktas", country: "Turquie", league: "Süper Lig", wiki: "Beşiktaş_J.K." },
  { name: "Trabzonspor", slug: "trabzonspor", country: "Turquie", league: "Süper Lig", wiki: "Trabzonspor" },

  // ─── Algeria ───
  { name: "JS Kabylie", slug: "js-kabylie", country: "Algérie", league: "Ligue 1", wiki: "JS_Kabylie" },
  { name: "MC Alger", slug: "mc-alger", country: "Algérie", league: "Ligue 1", wiki: "MC_Alger" },
  { name: "CR Belouizdad", slug: "belouizdad", country: "Algérie", league: "Ligue 1", wiki: "CR_Belouizdad" },
  { name: "USM Alger", slug: "usm-alger", country: "Algérie", league: "Ligue 1", wiki: "USM_Alger" },
  { name: "ES Sétif", slug: "es-setif", country: "Algérie", league: "Ligue 1", wiki: "ES_Sétif" },
  { name: "Mouloudia Oran", slug: "mc-oran", country: "Algérie", league: "Ligue 1", wiki: "MC_Oran" },

  // ─── Morocco ───
  { name: "Raja CA", slug: "raja", country: "Maroc", league: "Botola Pro", wiki: "Raja_CA" },
  { name: "Wydad AC", slug: "wydad", country: "Maroc", league: "Botola Pro", wiki: "Wydad_AC" },
  { name: "FAR Rabat", slug: "far-rabat", country: "Maroc", league: "Botola Pro", wiki: "AS_FAR_(football)" },
  { name: "RS Berkane", slug: "berkane", country: "Maroc", league: "Botola Pro", wiki: "RS_Berkane" },

  // ─── Tunisia ───
  { name: "Espérance de Tunis", slug: "esperance", country: "Tunisie", league: "Ligue 1", wiki: "Espérance_Sportive_de_Tunis" },
  { name: "Club Africain", slug: "club-africain", country: "Tunisie", league: "Ligue 1", wiki: "Club_Africain" },
  { name: "Étoile du Sahel", slug: "etoile-sahel", country: "Tunisie", league: "Ligue 1", wiki: "Étoile_Sportive_du_Sahel" },

  // ─── Egypt ───
  { name: "Al Ahly", slug: "al-ahly", country: "Égypte", league: "Premier League", wiki: "Al_Ahly_SC" },
  { name: "Zamalek SC", slug: "zamalek", country: "Égypte", league: "Premier League", wiki: "Zamalek_SC" },

  // ─── Senegal ───
  { name: "ASC Jaraaf", slug: "jaraaf", country: "Sénégal", league: "Ligue 1", wiki: "ASC_Jaraaf" },

  // ─── Côte d'Ivoire ───
  { name: "ASEC Mimosas", slug: "asec-mimosas", country: "Côte d'Ivoire", league: "Ligue 1", wiki: "ASEC_Mimosas" },

  // ─── Cameroon ───
  { name: "Canon Yaoundé", slug: "canon-yaounde", country: "Cameroun", league: "Elite One", wiki: "Canon_Yaoundé" },

  // ─── DR Congo ───
  { name: "TP Mazembe", slug: "tp-mazembe", country: "RD Congo", league: "Linafoot", wiki: "TP_Mazembe" },

  // ─── South Africa ───
  { name: "Kaizer Chiefs", slug: "kaizer-chiefs", country: "Afrique du Sud", league: "PSL", wiki: "Kaizer_Chiefs_F.C." },
  { name: "Orlando Pirates", slug: "orlando-pirates", country: "Afrique du Sud", league: "PSL", wiki: "Orlando_Pirates" },
  { name: "Mamelodi Sundowns", slug: "sundowns", country: "Afrique du Sud", league: "PSL", wiki: "Mamelodi_Sundowns_F.C." },

  // ─── Saudi Arabia ───
  { name: "Al-Hilal", slug: "al-hilal", country: "Arabie Saoudite", league: "Saudi Pro League", wiki: "Al_Hilal_SFC" },
  { name: "Al-Nassr", slug: "al-nassr", country: "Arabie Saoudite", league: "Saudi Pro League", wiki: "Al_Nassr_FC" },
  { name: "Al-Ahli", slug: "al-ahli-saudi", country: "Arabie Saoudite", league: "Saudi Pro League", wiki: "Al-Ahli_Saudi_FC" },
  { name: "Al-Ittihad", slug: "al-ittihad", country: "Arabie Saoudite", league: "Saudi Pro League", wiki: "Ittihad_FC_(Saudi_Arabia)" },

  // ─── USA (MLS) ───
  { name: "Inter Miami", slug: "inter-miami", country: "USA", league: "MLS", wiki: "Inter_Miami_CF" },
  { name: "LA Galaxy", slug: "la-galaxy", country: "USA", league: "MLS", wiki: "LA_Galaxy" },
  { name: "New York City FC", slug: "nycfc", country: "USA", league: "MLS", wiki: "New_York_City_FC" },
  { name: "Atlanta United", slug: "atlanta-united", country: "USA", league: "MLS", wiki: "Atlanta_United_FC" },
  { name: "LAFC", slug: "lafc", country: "USA", league: "MLS", wiki: "Los_Angeles_FC" },

  // ─── South America ───
  { name: "Boca Juniors", slug: "boca-juniors", country: "Argentine", league: "Primera División", wiki: "Boca_Juniors" },
  { name: "River Plate", slug: "river-plate", country: "Argentine", league: "Primera División", wiki: "Club_Atlético_River_Plate" },
  { name: "Flamengo", slug: "flamengo", country: "Brésil", league: "Série A", wiki: "Clube_de_Regatas_do_Flamengo" },
  { name: "Palmeiras", slug: "palmeiras", country: "Brésil", league: "Série A", wiki: "Sociedade_Esportiva_Palmeiras" },
  { name: "Santos FC", slug: "santos", country: "Brésil", league: "Série A", wiki: "Santos_FC" },

  // ─── Bosnia ───
  { name: "FK Sarajevo", slug: "fk-sarajevo", country: "Bosnie-Herzégovine", league: "Premier Liga", wiki: "FK_Sarajevo" },
  { name: "FK Željezničar", slug: "zeljeznicar", country: "Bosnie-Herzégovine", league: "Premier Liga", wiki: "FK_Željezničar_Sarajevo" },

  // ─── Serbia ───
  { name: "Étoile Rouge Belgrade", slug: "etoile-rouge", country: "Serbie", league: "SuperLiga", wiki: "Red_Star_Belgrade" },
  { name: "Partizan Belgrade", slug: "partizan", country: "Serbie", league: "SuperLiga", wiki: "FK_Partizan" },

  // ─── Croatia ───
  { name: "Dinamo Zagreb", slug: "dinamo-zagreb", country: "Croatie", league: "HNL", wiki: "GNK_Dinamo_Zagreb" },
  { name: "Hajduk Split", slug: "hajduk-split", country: "Croatie", league: "HNL", wiki: "HNK_Hajduk_Split" },

  // ─── Kosovo ───
  { name: "FC Prishtina", slug: "prishtina", country: "Kosovo", league: "Superliga", wiki: "FC_Prishtina" },

  // ─── Albania ───
  { name: "FK Tirana", slug: "fk-tirana", country: "Albanie", league: "Superliga", wiki: "KF_Tirana" },
  { name: "Partizani Tirana", slug: "partizani", country: "Albanie", league: "Superliga", wiki: "FK_Partizani" },
];

/** Group clubs by country */
export function getClubsByCountry(): Record<string, Club[]> {
  const grouped: Record<string, Club[]> = {};
  for (const club of CLUBS) {
    if (!grouped[club.country]) grouped[club.country] = [];
    grouped[club.country].push(club);
  }
  return grouped;
}

/** Find a club by its slug */
export function getClubBySlug(slug: string): Club | undefined {
  return CLUBS.find((c) => c.slug === slug);
}

/** Get logo path for a club slug */
export function getClubLogo(slug: string): string {
  return `/clubs/${slug}.png`;
}
