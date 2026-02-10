/**
 * Download club logos from Wikipedia REST API.
 * Usage: node scripts/download-logos.mjs
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const CLUBS = [
  // Swiss Super League
  { slug: "servette", wiki: "Servette_FC" },
  { slug: "young-boys", wiki: "BSC_Young_Boys" },
  { slug: "basel", wiki: "FC_Basel" },
  { slug: "zurich", wiki: "FC_Zürich" },
  { slug: "lausanne", wiki: "FC_Lausanne-Sport" },
  { slug: "sion", wiki: "FC_Sion" },
  { slug: "lugano", wiki: "FC_Lugano" },
  { slug: "st-gallen", wiki: "FC_St._Gallen" },
  { slug: "grasshopper", wiki: "Grasshopper_Club_Zürich" },
  { slug: "luzern", wiki: "FC_Luzern" },
  { slug: "winterthur", wiki: "FC_Winterthur" },
  { slug: "yverdon", wiki: "Yverdon-Sport_FC" },
  // Ligue 1
  { slug: "psg", wiki: "Paris_Saint-Germain_F.C." },
  { slug: "marseille", wiki: "Olympique_de_Marseille" },
  { slug: "lyon", wiki: "Olympique_Lyonnais" },
  { slug: "monaco", wiki: "AS_Monaco_FC" },
  { slug: "lille", wiki: "Lille_OSC" },
  { slug: "nice", wiki: "OGC_Nice" },
  { slug: "lens", wiki: "RC_Lens" },
  { slug: "rennes", wiki: "Stade_Rennais_F.C." },
  { slug: "strasbourg", wiki: "RC_Strasbourg_Alsace" },
  { slug: "nantes", wiki: "FC_Nantes" },
  { slug: "toulouse", wiki: "Toulouse_FC" },
  { slug: "montpellier", wiki: "Montpellier_HSC" },
  { slug: "brest", wiki: "Stade_Brestois_29" },
  { slug: "reims", wiki: "Stade_de_Reims" },
  { slug: "saint-etienne", wiki: "AS_Saint-Étienne" },
  // Premier League
  { slug: "arsenal", wiki: "Arsenal_F.C." },
  { slug: "chelsea", wiki: "Chelsea_F.C." },
  { slug: "liverpool", wiki: "Liverpool_F.C." },
  { slug: "man-city", wiki: "Manchester_City_F.C." },
  { slug: "man-united", wiki: "Manchester_United_F.C." },
  { slug: "tottenham", wiki: "Tottenham_Hotspur_F.C." },
  { slug: "newcastle", wiki: "Newcastle_United_F.C." },
  { slug: "aston-villa", wiki: "Aston_Villa_F.C." },
  { slug: "west-ham", wiki: "West_Ham_United_F.C." },
  { slug: "brighton", wiki: "Brighton_%26_Hove_Albion_F.C." },
  { slug: "crystal-palace", wiki: "Crystal_Palace_F.C." },
  { slug: "everton", wiki: "Everton_F.C." },
  { slug: "nottingham", wiki: "Nottingham_Forest_F.C." },
  { slug: "fulham", wiki: "Fulham_F.C." },
  { slug: "wolves", wiki: "Wolverhampton_Wanderers_F.C." },
  { slug: "bournemouth", wiki: "AFC_Bournemouth" },
  { slug: "brentford", wiki: "Brentford_F.C." },
  // La Liga
  { slug: "barcelona", wiki: "FC_Barcelona" },
  { slug: "real-madrid", wiki: "Real_Madrid_CF" },
  { slug: "atletico", wiki: "Atlético_Madrid" },
  { slug: "sevilla", wiki: "Sevilla_FC" },
  { slug: "real-sociedad", wiki: "Real_Sociedad" },
  { slug: "betis", wiki: "Real_Betis" },
  { slug: "valencia", wiki: "Valencia_CF" },
  { slug: "villarreal", wiki: "Villarreal_CF" },
  { slug: "bilbao", wiki: "Athletic_Bilbao" },
  // Serie A
  { slug: "juventus", wiki: "Juventus_F.C." },
  { slug: "ac-milan", wiki: "A.C._Milan" },
  { slug: "inter-milan", wiki: "Inter_Milan" },
  { slug: "roma", wiki: "A.S._Roma" },
  { slug: "napoli", wiki: "S.S.C._Napoli" },
  { slug: "lazio", wiki: "S.S._Lazio" },
  { slug: "fiorentina", wiki: "ACF_Fiorentina" },
  { slug: "atalanta", wiki: "Atalanta_BC" },
  // Bundesliga
  { slug: "bayern", wiki: "FC_Bayern_Munich" },
  { slug: "dortmund", wiki: "Borussia_Dortmund" },
  { slug: "leipzig", wiki: "RB_Leipzig" },
  { slug: "leverkusen", wiki: "Bayer_04_Leverkusen" },
  { slug: "frankfurt", wiki: "Eintracht_Frankfurt" },
  { slug: "stuttgart", wiki: "VfB_Stuttgart" },
  { slug: "wolfsburg", wiki: "VfL_Wolfsburg" },
  { slug: "gladbach", wiki: "Borussia_Mönchengladbach" },
  // Portugal
  { slug: "benfica", wiki: "S.L._Benfica" },
  { slug: "porto", wiki: "FC_Porto" },
  { slug: "sporting", wiki: "Sporting_CP" },
  { slug: "braga", wiki: "S.C._Braga" },
  // Netherlands
  { slug: "ajax", wiki: "AFC_Ajax" },
  { slug: "psv", wiki: "PSV_Eindhoven" },
  { slug: "feyenoord", wiki: "Feyenoord" },
  // Turkey
  { slug: "galatasaray", wiki: "Galatasaray_S.K._(football)" },
  { slug: "fenerbahce", wiki: "Fenerbahçe_S.K._(football)" },
  { slug: "besiktas", wiki: "Beşiktaş_J.K." },
  { slug: "trabzonspor", wiki: "Trabzonspor" },
  // Algeria
  { slug: "js-kabylie", wiki: "JS_Kabylie" },
  { slug: "mc-alger", wiki: "MC_Alger" },
  { slug: "belouizdad", wiki: "CR_Belouizdad" },
  { slug: "usm-alger", wiki: "USM_Alger" },
  { slug: "es-setif", wiki: "ES_Sétif" },
  { slug: "mc-oran", wiki: "MC_Oran" },
  // Morocco
  { slug: "raja", wiki: "Raja_CA" },
  { slug: "wydad", wiki: "Wydad_AC" },
  { slug: "far-rabat", wiki: "AS_FAR_(football)" },
  { slug: "berkane", wiki: "RS_Berkane" },
  // Tunisia
  { slug: "esperance", wiki: "Espérance_Sportive_de_Tunis" },
  { slug: "club-africain", wiki: "Club_Africain" },
  { slug: "etoile-sahel", wiki: "Étoile_Sportive_du_Sahel" },
  // Egypt
  { slug: "al-ahly", wiki: "Al_Ahly_SC" },
  { slug: "zamalek", wiki: "Zamalek_SC" },
  // Senegal
  { slug: "jaraaf", wiki: "ASC_Jaraaf" },
  // Côte d'Ivoire
  { slug: "asec-mimosas", wiki: "ASEC_Mimosas" },
  // Cameroon
  { slug: "canon-yaounde", wiki: "Canon_Yaoundé" },
  // DR Congo
  { slug: "tp-mazembe", wiki: "TP_Mazembe" },
  // South Africa
  { slug: "kaizer-chiefs", wiki: "Kaizer_Chiefs_F.C." },
  { slug: "orlando-pirates", wiki: "Orlando_Pirates" },
  { slug: "sundowns", wiki: "Mamelodi_Sundowns_F.C." },
  // Saudi Arabia
  { slug: "al-hilal", wiki: "Al_Hilal_SFC" },
  { slug: "al-nassr", wiki: "Al_Nassr_FC" },
  { slug: "al-ahli-saudi", wiki: "Al-Ahli_Saudi_FC" },
  { slug: "al-ittihad", wiki: "Ittihad_FC_(Saudi_Arabia)" },
  // USA
  { slug: "inter-miami", wiki: "Inter_Miami_CF" },
  { slug: "la-galaxy", wiki: "LA_Galaxy" },
  { slug: "nycfc", wiki: "New_York_City_FC" },
  { slug: "atlanta-united", wiki: "Atlanta_United_FC" },
  { slug: "lafc", wiki: "Los_Angeles_FC" },
  // South America
  { slug: "boca-juniors", wiki: "Boca_Juniors" },
  { slug: "river-plate", wiki: "Club_Atlético_River_Plate" },
  { slug: "flamengo", wiki: "Clube_de_Regatas_do_Flamengo" },
  { slug: "palmeiras", wiki: "Sociedade_Esportiva_Palmeiras" },
  { slug: "santos", wiki: "Santos_FC" },
  // Bosnia
  { slug: "fk-sarajevo", wiki: "FK_Sarajevo" },
  { slug: "zeljeznicar", wiki: "FK_Željezničar_Sarajevo" },
  // Serbia
  { slug: "etoile-rouge", wiki: "Red_Star_Belgrade" },
  { slug: "partizan", wiki: "FK_Partizan" },
  // Croatia
  { slug: "dinamo-zagreb", wiki: "GNK_Dinamo_Zagreb" },
  { slug: "hajduk-split", wiki: "HNK_Hajduk_Split" },
  // Kosovo
  { slug: "prishtina", wiki: "FC_Prishtina" },
  // Albania
  { slug: "fk-tirana", wiki: "KF_Tirana" },
  { slug: "partizani", wiki: "FK_Partizani" },
];

const OUT_DIR = "public/clubs";
const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadLogo(club) {
  const dest = `${OUT_DIR}/${club.slug}.png`;
  if (existsSync(dest)) {
    console.log(`  SKIP ${club.slug} (exists)`);
    return true;
  }

  try {
    const res = await fetch(`${WIKI_API}/${encodeURIComponent(club.wiki)}`, {
      headers: { "User-Agent": "FootMatch/1.0 (contact@footmatch.ch)" },
    });

    if (!res.ok) {
      console.log(`  FAIL ${club.slug} — API ${res.status}`);
      return false;
    }

    const data = await res.json();
    const thumbUrl = data.thumbnail?.source;

    if (!thumbUrl) {
      console.log(`  FAIL ${club.slug} — no thumbnail`);
      return false;
    }

    // Request a larger image (320px)
    const largeUrl = thumbUrl.replace(/\/\d+px-/, "/320px-");

    const imgRes = await fetch(largeUrl, {
      headers: { "User-Agent": "FootMatch/1.0 (contact@footmatch.ch)" },
    });
    if (!imgRes.ok) {
      console.log(`  FAIL ${club.slug} — image ${imgRes.status}`);
      return false;
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(dest, buffer);
    console.log(`  OK   ${club.slug} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (err) {
    console.log(`  FAIL ${club.slug} — ${err.message}`);
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Downloading ${CLUBS.length} club logos...\n`);

  let ok = 0;
  let fail = 0;

  // Process one at a time with 1s delay to avoid rate limits
  for (const club of CLUBS) {
    const result = await downloadLogo(club);
    result ? ok++ : fail++;
    await sleep(1000);
  }

  console.log(`\nDone: ${ok} downloaded, ${fail} failed out of ${CLUBS.length}`);
}

main();
