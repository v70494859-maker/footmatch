#!/usr/bin/env python3
"""
Generate FootMatch V5 Seed Data
- 100 players + 2 operators + 1 admin
- 30 days of match history (1-2 matches/day)
- Full results, player stats, chat messages, notifications
- All in Geneva region with realistic multicultural names
"""

import random
import sys
from datetime import date, timedelta

random.seed(42)

# ============================================================
# CONSTANTS
# ============================================================

BCRYPT = "$2a$10$3zKnQkN4Mp8/vv0YnWYCoOCfRXi/J04mlbiubPj.R/NyGvVvA2yxq"
INST = "00000000-0000-0000-0000-000000000000"

def player_uuid(n):
    """Player UUIDs: 00000000-0000-0000-0000-000000000101 to 000...200"""
    return f"00000000-0000-0000-0000-000000000{n:03d}"

def match_uuid(n):
    return f"00000000-0000-0000-0001-000000000{n:03d}"

ADMIN_ID = "00000000-0000-0000-0000-000000000001"
OP1_ID = "00000000-0000-0000-0000-000000000002"
OP2_ID = "00000000-0000-0000-0000-000000000003"
OP1_OID = "00000000-0000-0000-0002-000000000001"
OP2_OID = "00000000-0000-0000-0002-000000000002"

# ============================================================
# PLAYER DATA (first, last, city, origin, club_or_None)
# 100 players reflecting Geneva's multicultural population
# ============================================================

PLAYERS = [
    # Swiss-French (25) — IDs 101-125
    ("Lucas",     "Müller",       "Genève",          "Suisse",  "young-boys"),
    ("Thomas",    "Favre",        "Carouge",         "Suisse",  "servette"),
    ("Yann",      "Rochat",       "Onex",            "Suisse",  None),
    ("Nicolas",   "Berger",       "Genève",          "Suisse",  "basel"),
    ("Julien",    "Morel",        "Genève",          "Suisse",  "monaco"),
    ("Alexandre", "Perret",       "Chêne-Bourg",     "Suisse",  "barcelona"),
    ("Raphaël",   "Schmid",       "Thônex",          "Suisse",  "zurich"),
    ("Maxime",    "Girard",       "Lancy",           "Suisse",  "servette"),
    ("Pierre",    "Bonnet",       "Vernier",         "Suisse",  "psg"),
    ("Cédric",    "Blanc",        "Genève",          "Suisse",  "servette"),
    ("Loïc",      "Ducret",       "Carouge",         "Suisse",  "lyon"),
    ("Jonathan",  "Bauer",        "Meyrin",          "Suisse",  None),
    ("Vincent",   "Jacquier",     "Plan-les-Ouates", "Suisse",  "servette"),
    ("Florian",   "Dubois",       "Genève",          "Suisse",  "marseille"),
    ("Adrien",    "Gaillard",     "Bernex",          "Suisse",  "young-boys"),
    ("Baptiste",  "Renaud",       "Grand-Saconnex",  "Suisse",  None),
    ("Sylvain",   "Chevalier",    "Onex",            "Suisse",  "servette"),
    ("Hugo",      "Mercier",      "Lancy",           "Suisse",  "monaco"),
    ("Romain",    "Vuilleumier",  "Genève",          "Suisse",  None),
    ("Nathan",    "Pittet",       "Carouge",         "Suisse",  "servette"),
    ("Sébastien", "Rey",          "Vernier",         "Suisse",  "sion"),
    ("Arnaud",    "Terrier",      "Genève",          "Suisse",  "servette"),
    ("Ludovic",   "Magnin",       "Bernex",          "Suisse",  "zurich"),
    ("Thierry",   "Moser",        "Meyrin",          "Suisse",  None),
    ("Philippe",  "Wenger",       "Chêne-Bougeries", "Suisse",  "young-boys"),

    # French (20) — IDs 126-145
    ("Antoine",   "Leroy",        "Genève",          "France",  "marseille"),
    ("Fabien",    "Roux",         "Lancy",           "France",  "psg"),
    ("Damien",    "Petit",        "Lancy",           "France",  "lille"),
    ("Théo",      "Laurent",      "Genève",          "France",  "psg"),
    ("Mathieu",   "Dupuis",       "Vernier",         "France",  "lyon"),
    ("Clément",   "Rousseau",     "Carouge",         "France",  "marseille"),
    ("Guillaume", "Moreau",       "Genève",          "France",  "monaco"),
    ("Rémi",      "Lefebvre",     "Meyrin",          "France",  "toulouse"),
    ("Axel",      "Simon",        "Thônex",          "France",  "nantes"),
    ("Dylan",     "Garnier",      "Onex",            "France",  "bordeaux"),
    ("Kévin",     "Martin",       "Genève",          "France",  "saint-etienne"),
    ("Jérémy",    "Bernard",      "Lancy",           "France",  "lyon"),
    ("Quentin",   "Robert",       "Carouge",         "France",  "nice"),
    ("Dorian",    "Richard",      "Genève",          "France",  "rennes"),
    ("Tanguy",    "Duval",        "Vernier",         "France",  "psg"),
    ("Corentin",  "Lemaire",      "Meyrin",          "France",  "marseille"),
    ("Bastien",   "Fournier",     "Plan-les-Ouates", "France",  "lyon"),
    ("Erwan",     "Le Goff",      "Genève",          "France",  "rennes"),
    ("Gaëtan",    "Marchand",     "Bernex",          "France",  "nantes"),
    ("Killian",   "Caron",        "Onex",            "France",  "lille"),

    # Portuguese (15) — IDs 146-160
    ("David",     "Silva",        "Vernier",         "Portugal", "benfica"),
    ("Ricardo",   "Ferreira",     "Carouge",         "Portugal", "porto"),
    ("Paulo",     "Oliveira",     "Genève",          "Portugal", "benfica"),
    ("Bruno",     "Santos",       "Meyrin",          "Portugal", "sporting"),
    ("Tiago",     "Mendes",       "Lancy",           "Portugal", "benfica"),
    ("Filipe",    "Costa",        "Vernier",         "Portugal", "porto"),
    ("André",     "Rodrigues",    "Genève",          "Portugal", "sporting"),
    ("Nuno",      "Pereira",      "Onex",            "Portugal", "benfica"),
    ("Diogo",     "Almeida",      "Carouge",         "Portugal", "porto"),
    ("Rui",       "Sousa",        "Meyrin",          "Portugal", None),
    ("Gonçalo",   "Martins",      "Lancy",           "Portugal", "benfica"),
    ("Pedro",     "Correia",      "Genève",          "Portugal", "sporting"),
    ("Carlos",    "Fernandes",    "Vernier",         "Portugal", "porto"),
    ("Fábio",     "Lopes",        "Thônex",          "Portugal", "benfica"),
    ("Hugo",      "Carvalho",     "Bernex",          "Portugal", "porto"),

    # North African (15) — IDs 161-175
    ("Mehdi",     "Hadj",         "Lancy",           "Algérie",  "real-madrid"),
    ("Samir",     "Toumi",        "Carouge",         "Tunisie",  "esperance"),
    ("Amine",     "Bouzidi",      "Meyrin",          "Maroc",    "barcelona"),
    ("Youssef",   "Amrani",       "Genève",          "Maroc",    "real-madrid"),
    ("Kamel",     "Boukhris",     "Vernier",         "Algérie",  "mc-alger"),
    ("Reda",      "El Idrissi",   "Onex",            "Maroc",    "raja-casablanca"),
    ("Bilal",     "Mansouri",     "Lancy",           "Algérie",  "psg"),
    ("Walid",     "Belhaj",       "Genève",          "Tunisie",  "esperance"),
    ("Sofiane",   "Khelifi",      "Meyrin",          "Algérie",  "js-kabylie"),
    ("Nabil",     "Chakir",       "Carouge",         "Maroc",    "wydad-casablanca"),
    ("Tarek",     "Sassi",        "Vernier",         "Tunisie",  "esperance"),
    ("Hamza",     "Zerhouni",     "Genève",          "Maroc",    "barcelona"),
    ("Ismaël",    "Benmoussa",    "Lancy",           "Algérie",  "real-madrid"),
    ("Rachid",    "Boukhatem",    "Onex",            "Algérie",  "mc-alger"),
    ("Anis",      "Trabelsi",     "Meyrin",          "Tunisie",  "esperance"),

    # Sub-Saharan African (10) — IDs 176-185
    ("Omar",      "Diallo",       "Vernier",         "Sénégal",        "psg"),
    ("Moussa",    "Camara",       "Genève",          "Guinée",         "marseille"),
    ("Ibrahima",  "Ndiaye",       "Onex",            "Sénégal",        "liverpool"),
    ("Jean-Pierre","Mbemba",      "Meyrin",          "RD Congo",       "psg"),
    ("Sékou",     "Koné",         "Lancy",           "Côte d'Ivoire", "marseille"),
    ("Patrick",   "Ndayisaba",    "Carouge",         "Burundi",        None),
    ("Emmanuel",  "Kouassi",      "Genève",          "Côte d'Ivoire", "arsenal"),
    ("Amadou",    "Touré",        "Vernier",         "Mali",           "psg"),
    ("Samuel",    "Nguegang",     "Meyrin",          "Cameroun",       "barcelona"),
    ("Abdoulaye", "Bah",          "Onex",            "Guinée",         "marseille"),

    # Balkan (8) — IDs 186-193
    ("Emir",      "Kadic",        "Meyrin",          "Bosnie-Herzégovine", None),
    ("Ivan",      "Petrovic",     "Onex",            "Serbie",             "inter-milan"),
    ("Driton",    "Berisha",      "Vernier",         "Kosovo",             "real-madrid"),
    ("Arben",     "Gashi",        "Genève",          "Albanie",            "juventus"),
    ("Luan",      "Krasniqi",     "Carouge",         "Kosovo",             "manchester-city"),
    ("Mirko",     "Jovanovic",    "Meyrin",          "Serbie",             "bayern-munich"),
    ("Blerim",    "Shala",        "Lancy",           "Kosovo",             "psg"),
    ("Stefan",    "Markovic",     "Genève",          "Serbie",             "inter-milan"),

    # Italian (3) — IDs 194-196
    ("Marco",     "Rossi",        "Genève",          "Italie",  "juventus"),
    ("Lorenzo",   "Bianchi",      "Carouge",         "Italie",  "inter-milan"),
    ("Andrea",    "Romano",       "Lancy",           "Italie",  "ac-milan"),

    # Spanish (2) — IDs 197-198
    ("Alejandro", "García",       "Genève",          "Espagne", "real-madrid"),
    ("Diego",     "Fernández",    "Vernier",         "Espagne", "atletico-madrid"),

    # Other (2) — IDs 199-200
    ("Liam",      "Nguyen",       "Genève",          "Vietnam", "arsenal"),
    ("Kevin",     "Fernandes",    "Carouge",         "Brésil",  None),
]

assert len(PLAYERS) == 100, f"Expected 100 players, got {len(PLAYERS)}"

# Player IDs: 101 to 200
PLAYER_IDS = [player_uuid(101 + i) for i in range(100)]

# ============================================================
# VENUES
# ============================================================

VENUES = [
    ("Terrain du Parc Bertrand",           "Avenue Bertrand 2",            "Genève",         46.1990, 6.1550, "outdoor"),
    ("Centre sportif de Vessy",            "Route de Vessy 43",            "Veyrier",        46.1740, 6.1640, "outdoor"),
    ("Salle de sport de Champel",          "Chemin de Beau-Soleil 20",     "Genève",         46.1920, 6.1470, "indoor"),
    ("Centre sportif du Bout-du-Monde",    "Route de Vessy 12",            "Genève",         46.1870, 6.1520, "outdoor"),
    ("Stade du Grand-Saconnex",            "Route de Ferney 160",          "Grand-Saconnex", 46.2330, 6.1240, "outdoor"),
    ("Stade de Varembé",                   "Rue de Vermont 33",            "Genève",         46.2240, 6.1380, "outdoor"),
    ("Stade de la Fontenette",             "Rue de la Fontenette 55",      "Carouge",        46.1830, 6.1370, "outdoor"),
    ("Centre sportif des Evaux",           "Chemin François-Chavaz 110",   "Onex",           46.1850, 6.1010, "outdoor"),
    ("Stade de Frontenex",                 "Plateau de Frontenex 8",       "Cologny",        46.2070, 6.1750, "outdoor"),
    ("Stade du Bois-de-la-Bâtie",         "Chemin de la Bâtie 4",         "Petit-Lancy",    46.1950, 6.1290, "outdoor"),
    ("Stade des Libellules",               "Chemin de l''Écu 24",          "Châtelaine",     46.2150, 6.1120, "covered"),
    ("Centre sportif de la Queue-d''Arve", "Rue François-Dussaud 12",     "Les Acacias",    46.1963, 6.1313, "indoor"),
    ("Stade de Vaudagne",                  "Avenue de Vaudagne 24",        "Meyrin",         46.2340, 6.0820, "outdoor"),
    ("Stade des Cherpines",                "Route des Cherpines 38",       "Plan-les-Ouates",46.1720, 6.1050, "outdoor"),
    ("Centre sportif de Balexert",         "Avenue Louis-Casaï 52",        "Vernier",        46.2180, 6.1160, "covered"),
]

MATCH_TITLES = {
    "5v5":  [10, 60],   # capacity, duration
    "6v6":  [12, 90],
    "7v7":  [14, 90],
}

MATCH_QUALITIES = ["excellent", "good", "good", "average", "excellent", "good"]

TIMES_WEEKDAY = ["19:00", "19:30", "20:00", "20:30", "21:00"]
TIMES_WEEKEND = ["10:00", "14:00", "15:00", "16:00", "17:00"]

MATCH_DESCRIPTIONS = [
    "Match afterwork sur synthétique. Venez avec des crampons moulés ou chaussures lisses.",
    "Match en soirée, tous niveaux bienvenus. On fait les équipes sur place.",
    "Petit match rapide après le boulot. Bonne ambiance garantie !",
    "Match compétitif, niveau D2-D3 minimum. Fair-play obligatoire.",
    "Grand terrain gazon naturel, parking dispo. Douches ouvertes.",
    "Match du weekend, ambiance détendue. Venez comme vous êtes !",
    "Terrain éclairé, on joue beau temps mauvais temps. Chasubles fournies.",
    "Match amical, on joue pour le plaisir. Nouveaux joueurs bienvenus !",
    "Soirée foot entre potes, niveau intermédiaire. RDV 15 min avant.",
    "Match indoor, chaussures de salle obligatoires. Vestiaires disponibles.",
    "Terrain synthétique dernière génération. Ambiance conviviale.",
    "Match du dimanche matin, parfait pour bien commencer la semaine !",
    "Session foot intense, on vient pour transpirer. Eau recommandée.",
    "Match mixte, tous les niveaux. L''important c''est de s''amuser !",
    "Terrain couvert, on joue même sous la pluie. Places limitées.",
]

RESULT_NOTES = [
    "Bon match, beau spectacle des deux côtés.",
    "Match très équilibré, belle intensité.",
    "Niveau élevé, les deux équipes ont bien joué.",
    "Grosse ambiance ! Quelques beaux buts.",
    "Match serré, résultat mérité.",
    "Super soirée foot, tout le monde a kiffé.",
    "Beau match, fair-play exemplaire.",
    "Match intense du début à la fin.",
    "Belles combinaisons, du beau jeu.",
    "Les équipes étaient bien équilibrées.",
    "Gros match ! Ambiance de folie.",
    "Beau spectacle sous les projecteurs.",
]

# ============================================================
# SQL GENERATION
# ============================================================

out = []
def w(s=""):
    out.append(s)

def sql_str(v):
    """Escape a value for SQL. None -> NULL."""
    if v is None:
        return "NULL"
    s = str(v).replace("'", "''")
    return f"'{s}'"

def generate_email(first, last):
    first_clean = first.lower().replace("é","e").replace("è","e").replace("ê","e").replace("ë","e") \
        .replace("à","a").replace("â","a").replace("ä","a") \
        .replace("ô","o").replace("ö","o").replace("î","i").replace("ï","i") \
        .replace("ù","u").replace("û","u").replace("ü","u") \
        .replace("ç","c").replace("ñ","n").replace("ã","a").replace("á","a") \
        .replace("-"," ").replace("'","")
    last_clean = last.lower().replace("é","e").replace("è","e").replace("ê","e").replace("ë","e") \
        .replace("à","a").replace("â","a").replace("ä","a") \
        .replace("ô","o").replace("ö","o").replace("î","i").replace("ï","i") \
        .replace("ù","u").replace("û","u").replace("ü","u").replace("ü","u") \
        .replace("ç","c").replace("ñ","n").replace("ã","a").replace("á","a") \
        .replace("-"," ").replace("'","")
    first_clean = first_clean.split()[0]  # Take first word for Jean-Pierre etc
    last_clean = last_clean.replace(" ","")
    return f"{first_clean}.{last_clean}@gmail.com"

# ============================================================
# HEADER
# ============================================================

w("-- =====================================================")
w("-- FootMatch V5 — Seed Data")
w("-- 100 players, 2 operators, 1 admin")
w("-- 30 days of match history (~45 completed matches)")
w("-- Real venues in Geneva & surroundings")
w("-- Run AFTER schema.sql")
w("-- =====================================================")
w()

# ============================================================
# PLATFORM CONFIG
# ============================================================

w("-- Platform config defaults (upsert)")
w("INSERT INTO platform_config (key, value) VALUES")
w("  ('subscription_price', '{\"amount\": 4.99, \"currency\": \"EUR\"}'),")
w("  ('revenue_share_rate', '{\"rate\": 0.30}'),")
w("  ('min_payout_amount', '{\"amount\": 10.00, \"currency\": \"EUR\"}'),")
w("  ('stripe_price_id', '{\"id\": \"\"}')")
w("ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;")
w()

# ============================================================
# AUTH USERS
# ============================================================

w("-- =====================================================")
w("-- AUTH USERS  (password: password123)")
w(f"-- bcrypt: {BCRYPT}")
w("-- =====================================================")
w()
w("INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token, is_sso_user) VALUES")

rows = []

# Admin
rows.append(
    f"  ('{INST}','{ADMIN_ID}','authenticated','authenticated','admin@footmatch.ch','{BCRYPT}',"
    f"now(),'{{\"provider\":\"email\",\"providers\":[\"email\"]}}','{{}}',now()-interval '90 days',now(),'','','','',false)"
)

# Operators
for i, (uid, email, days) in enumerate([
    (OP1_ID, "karim.benali@footmatch.ch", 60),
    (OP2_ID, "sophie.martin@footmatch.ch", 45),
]):
    rows.append(
        f"  ('{INST}','{uid}','authenticated','authenticated','{email}','{BCRYPT}',"
        f"now(),'{{\"provider\":\"email\",\"providers\":[\"email\"]}}','{{}}',now()-interval '{days} days',now(),'','','','',false)"
    )

# Players
for i, (first, last, city, origin, club) in enumerate(PLAYERS):
    uid = PLAYER_IDS[i]
    email = generate_email(first, last)
    days_ago = random.randint(25, 55)
    rows.append(
        f"  ('{INST}','{uid}','authenticated','authenticated','{email}','{BCRYPT}',"
        f"now(),'{{\"provider\":\"email\",\"providers\":[\"email\"]}}','{{}}',now()-interval '{days_ago} days',now(),'','','','',false)"
    )

w(",\n".join(rows))
w("ON CONFLICT (id) DO NOTHING;")
w()

# ============================================================
# AUTH IDENTITIES
# ============================================================

w("-- Auth identities")
w("INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES")

rows = []
# Admin + operators
for uid, email in [
    (ADMIN_ID, "admin@footmatch.ch"),
    (OP1_ID, "karim.benali@footmatch.ch"),
    (OP2_ID, "sophie.martin@footmatch.ch"),
]:
    rows.append(
        f"  (gen_random_uuid(),'{uid}','{uid}',"
        f"'{{\"sub\":\"{uid}\",\"email\":\"{email}\"}}','email',now(),now(),now())"
    )

# Players
for i, (first, last, city, origin, club) in enumerate(PLAYERS):
    uid = PLAYER_IDS[i]
    email = generate_email(first, last)
    rows.append(
        f"  (gen_random_uuid(),'{uid}','{uid}',"
        f"'{{\"sub\":\"{uid}\",\"email\":\"{email}\"}}','email',now(),now(),now())"
    )

w(",\n".join(rows))
w("ON CONFLICT ON CONSTRAINT identities_pkey DO NOTHING;")
w()

# ============================================================
# PROFILES
# ============================================================

w("-- =====================================================")
w("-- PROFILES  (100 players + 2 operators + 1 admin)")
w("-- =====================================================")
w()
w("INSERT INTO profiles (id, email, first_name, last_name, country, city, origin_country, favorite_club, role) VALUES")

rows = []
# Admin
rows.append(f"  ('{ADMIN_ID}','admin@footmatch.ch','Marc','Dupont','Suisse','Genève','Suisse','servette','admin')")

# Operators
rows.append(f"  ('{OP1_ID}','karim.benali@footmatch.ch','Karim','Benali','Suisse','Genève','Algérie','psg','operator')")
rows.append(f"  ('{OP2_ID}','sophie.martin@footmatch.ch','Sophie','Martin','Suisse','Carouge','France','lyon','operator')")

# Players
for i, (first, last, city, origin, club) in enumerate(PLAYERS):
    uid = PLAYER_IDS[i]
    email = generate_email(first, last)
    first_esc = first.replace("'", "''")
    last_esc = last.replace("'", "''")
    city_esc = city.replace("'", "''")
    origin_esc = origin.replace("'", "''")
    club_sql = sql_str(club) if club else "NULL"
    rows.append(
        f"  ('{uid}','{email}','{first_esc}','{last_esc}','Suisse','{city_esc}','{origin_esc}',{club_sql},'player')"
    )

w(",\n".join(rows))
w("ON CONFLICT (id) DO NOTHING;")
w()

# ============================================================
# OPERATORS
# ============================================================

w("-- =====================================================")
w("-- OPERATORS")
w("-- =====================================================")
w()
w("INSERT INTO operators (id, profile_id, bio, rating, total_matches, stripe_onboarded) VALUES")
w(f"  ('{OP1_OID}','{OP1_ID}',")
w(f"   'Organisateur de matchs à Genève depuis 5 ans. Ancien joueur du FC Servette Juniors.',4.60,0,true),")
w(f"  ('{OP2_OID}','{OP2_ID}',")
w(f"   'Passionnée de football, j''organise des matchs mixtes et amicaux dans la région de Carouge et Lancy.',4.30,0,true)")
w("ON CONFLICT (id) DO NOTHING;")
w()

# ============================================================
# OPERATOR APPLICATIONS
# ============================================================

w("-- =====================================================")
w("-- OPERATOR APPLICATIONS (approved)")
w("-- =====================================================")
w()
w("INSERT INTO operator_applications (profile_id, status, phone, city, years_experience, description, terms_accepted, reviewed_by, reviewed_at) VALUES")
w(f"  ('{OP1_ID}','approved','+41 79 123 45 67','Genève',5,")
w("   'Ancien joueur semi-pro, je souhaite organiser des matchs réguliers pour la communauté genevoise.',")
w(f"   true,'{ADMIN_ID}',now()-interval '58 days'),")
w(f"  ('{OP2_ID}','approved','+41 78 987 65 43','Carouge',3,")
w("   'Educatrice sportive diplômée, je veux rendre le football accessible à tous dans le canton.',")
w(f"   true,'{ADMIN_ID}',now()-interval '43 days')")
w("ON CONFLICT ON CONSTRAINT unique_operator_application DO NOTHING;")
w()

# ============================================================
# SUBSCRIPTIONS
# ============================================================

w("-- =====================================================")
w("-- SUBSCRIPTIONS (90 active, 10 canceled)")
w("-- =====================================================")
w()
w("INSERT INTO subscriptions (player_id, status, current_period_start, current_period_end) VALUES")

rows = []
for i in range(100):
    uid = PLAYER_IDS[i]
    if i < 90:
        start_days = random.randint(3, 25)
        rows.append(
            f"  ('{uid}','active',now()-interval '{start_days} days',now()+interval '{30-start_days} days')"
        )
    else:
        rows.append(
            f"  ('{uid}','canceled',now()-interval '35 days',now()-interval '5 days')"
        )

w(",\n".join(rows))
w("ON CONFLICT ON CONSTRAINT unique_player_subscription DO NOTHING;")
w()

# ============================================================
# GENERATE MATCHES
# ============================================================

today = date.today()
matches = []  # (match_num, days_ago, venue_idx, format, operator_oid, status)

# 30 days of history: days -30 to -1
match_num = 1
for days_ago in range(30, 0, -1):
    d = today - timedelta(days=days_ago)
    is_weekend = d.weekday() >= 5

    # 1 or 2 matches per day
    n_matches = 2 if (is_weekend or random.random() < 0.3) else 1

    for m in range(n_matches):
        venue_idx = random.randint(0, len(VENUES) - 1)
        fmt = random.choice(list(MATCH_TITLES.keys()))
        op = random.choice([OP1_OID, OP2_OID])
        time_str = random.choice(TIMES_WEEKEND if is_weekend else TIMES_WEEKDAY)
        matches.append({
            "num": match_num,
            "days_ago": days_ago,
            "venue_idx": venue_idx,
            "format": fmt,
            "operator_oid": op,
            "status": "completed",
            "time": time_str,
        })
        match_num += 1

# 1 match today (in_progress)
matches.append({
    "num": match_num,
    "days_ago": 0,
    "venue_idx": 8,  # Frontenex
    "format": "7v7",
    "operator_oid": OP1_OID,
    "status": "in_progress",
    "time": "10:00",
})
match_num += 1

# 5 upcoming matches
for i, days_ahead in enumerate([2, 4, 6, 9, 12]):
    venue_idx = random.randint(0, len(VENUES) - 1)
    fmt = random.choice(list(MATCH_TITLES.keys()))
    op = random.choice([OP1_OID, OP2_OID])
    d = today + timedelta(days=days_ahead)
    is_weekend = d.weekday() >= 5
    time_str = random.choice(TIMES_WEEKEND if is_weekend else TIMES_WEEKDAY)
    matches.append({
        "num": match_num,
        "days_ago": -days_ahead,
        "venue_idx": venue_idx,
        "format": fmt,
        "operator_oid": op,
        "status": "upcoming",
        "time": time_str,
    })
    match_num += 1

# ============================================================
# WRITE MATCHES
# ============================================================

w("-- =====================================================")
w(f"-- MATCHES ({len(matches)} total)")
w("-- =====================================================")
w()
w("INSERT INTO matches (id, operator_id, title, terrain_type, date, start_time, duration_minutes, venue_name, venue_address, city, lat, lng, capacity, status, description) VALUES")

rows = []
for m in matches:
    mid = match_uuid(m["num"])
    v = VENUES[m["venue_idx"]]
    venue_name, venue_addr, venue_city, lat, lng, terrain = v
    capacity, duration = MATCH_TITLES[m["format"]]
    desc = random.choice(MATCH_DESCRIPTIONS)

    if m["days_ago"] > 0:
        date_expr = f"CURRENT_DATE-interval '{m['days_ago']} days'"
    elif m["days_ago"] == 0:
        date_expr = "CURRENT_DATE"
    else:
        date_expr = f"CURRENT_DATE+interval '{-m['days_ago']} days'"

    title = f"{m['format']} {venue_city}"
    if terrain == "indoor":
        title += " Indoor"

    rows.append(
        f"  ('{mid}','{m['operator_oid']}',\n"
        f"   '{title}','{terrain}',{date_expr},'{m['time']}',{duration},\n"
        f"   '{venue_name}','{venue_addr}','{venue_city}',{lat},{lng},{capacity},'upcoming',\n"
        f"   '{desc}')"
    )

w(",\n".join(rows))
w("ON CONFLICT (id) DO NOTHING;")
w()

# ============================================================
# GENERATE REGISTRATIONS & STATS
# ============================================================

# For each match, pick players
# Active players (first 90) participate more, canceled (last 10) participated in old matches

# Track per-match data for stats
match_data = []

# Some "core" players who play a lot (top 30), others less frequently
core_players = list(range(30))  # indices 0-29 = IDs 101-130
regular_players = list(range(30, 60))  # indices 30-59
casual_players = list(range(60, 90))  # indices 60-89
canceled_players = list(range(90, 100))  # indices 90-99 (played early matches only)

w("-- =====================================================")
w("-- MATCH REGISTRATIONS")
w("-- =====================================================")
w()

completed_matches = [m for m in matches if m["status"] == "completed"]
in_progress_matches = [m for m in matches if m["status"] == "in_progress"]
upcoming_matches = [m for m in matches if m["status"] == "upcoming"]

all_registration_rows = []
registrations_per_match = {}

for m in matches:
    mid = match_uuid(m["num"])
    capacity = MATCH_TITLES[m["format"]][0]

    if m["status"] == "completed":
        # Fill to capacity or near-capacity
        n_players = capacity if random.random() < 0.6 else capacity - random.randint(0, 2)
        n_players = max(capacity - 2, n_players)
    elif m["status"] == "in_progress":
        n_players = capacity - random.randint(0, 2)
    else:
        # Upcoming: partial fill
        n_players = random.randint(capacity // 3, capacity - 1)

    # Select players
    pool = []
    if m["days_ago"] > 20:
        # Old matches: include canceled players
        pool = core_players + regular_players + casual_players + canceled_players
    elif m["days_ago"] > 10:
        pool = core_players + regular_players + casual_players
    else:
        pool = core_players + regular_players + casual_players

    # Weight core players higher
    weighted = []
    for idx in pool:
        if idx in core_players:
            weighted.extend([idx] * 4)
        elif idx in regular_players:
            weighted.extend([idx] * 2)
        else:
            weighted.append(idx)

    selected = set()
    attempts = 0
    while len(selected) < n_players and attempts < 500:
        pick = random.choice(weighted)
        selected.add(pick)
        attempts += 1

    selected = sorted(selected)[:n_players]
    registrations_per_match[m["num"]] = selected

    for pidx in selected:
        pid = PLAYER_IDS[pidx]
        all_registration_rows.append(f"  ('{mid}','{pid}')")

# Write registrations in batches
batch_size = 50
for i in range(0, len(all_registration_rows), batch_size):
    batch = all_registration_rows[i:i+batch_size]
    w(f"INSERT INTO match_registrations (match_id, player_id) VALUES")
    w(",\n".join(batch))
    w("ON CONFLICT ON CONSTRAINT unique_player_per_match DO NOTHING;")
    w()

# ============================================================
# UPDATE STATUS
# ============================================================

w("-- =====================================================")
w("-- UPDATE STATUS")
w("-- =====================================================")
w()

completed_ids = [match_uuid(m["num"]) for m in completed_matches]
if completed_ids:
    ids_str = ",\n  ".join(f"'{mid}'" for mid in completed_ids)
    w(f"UPDATE matches SET status = 'completed' WHERE id IN (\n  {ids_str}\n);")
    w()

for m in in_progress_matches:
    w(f"UPDATE matches SET status = 'in_progress' WHERE id = '{match_uuid(m['num'])}';")

# Check if any upcoming matches are full
for m in upcoming_matches:
    cap = MATCH_TITLES[m["format"]][0]
    regs = registrations_per_match.get(m["num"], [])
    if len(regs) >= cap:
        w(f"UPDATE matches SET status = 'full' WHERE id = '{match_uuid(m['num'])}';")

w()

# ============================================================
# MATCH RESULTS
# ============================================================

w("-- =====================================================")
w("-- MATCH RESULTS (completed matches)")
w("-- =====================================================")
w()
w("INSERT INTO match_results (match_id, operator_id, score_team_a, score_team_b, duration_minutes, match_quality, notes) VALUES")

results = []
match_scores = {}

for m in completed_matches:
    mid = match_uuid(m["num"])
    duration = MATCH_TITLES[m["format"]][1]

    # Generate a realistic score
    if duration == 60:
        max_goals = 5
    else:
        max_goals = 7

    score_a = random.randint(0, max_goals)
    score_b = random.randint(0, max_goals)
    match_scores[m["num"]] = (score_a, score_b)

    quality = random.choice(MATCH_QUALITIES)
    note = random.choice(RESULT_NOTES).replace("'", "''")

    results.append(
        f"  ('{mid}','{m['operator_oid']}',{score_a},{score_b},{duration},'{quality}','{note}')"
    )

w(",\n".join(results))
w("ON CONFLICT (match_id) DO NOTHING;")
w()

# ============================================================
# MATCH PLAYER STATS
# ============================================================

w("-- =====================================================")
w("-- MATCH PLAYER STATS (triggers auto-calculate career stats)")
w("-- =====================================================")
w()

all_stats_rows = []

for m in completed_matches:
    mid = match_uuid(m["num"])
    players = registrations_per_match.get(m["num"], [])
    score_a, score_b = match_scores[m["num"]]

    if len(players) < 2:
        continue

    # Split into teams
    random.shuffle(players)
    half = len(players) // 2
    team_a = players[:half]
    team_b = players[half:]

    def distribute_goals(team, total_goals, mid, team_letter, stats_rows):
        """Distribute goals and assists among team members."""
        goals_map = {pid: 0 for pid in team}
        assists_map = {pid: 0 for pid in team}

        for _ in range(total_goals):
            scorer = random.choice(team)
            goals_map[scorer] += 1
            # 60% chance of an assist
            if random.random() < 0.6 and len(team) > 1:
                assister = random.choice([p for p in team if p != scorer])
                assists_map[assister] += 1

        # Pick MVP from the whole match (done outside)
        for pid in team:
            player_id = PLAYER_IDS[pid]
            g = goals_map[pid]
            a = assists_map[pid]
            attended = True
            # 5% chance of no-show
            if random.random() < 0.05:
                attended = False
                g = 0
                a = 0
            yellow = random.random() < 0.08
            red = random.random() < 0.01 and not yellow
            stats_rows.append({
                "match_id": mid,
                "player_id": player_id,
                "team": team_letter,
                "goals": g,
                "assists": a,
                "attended": attended,
                "mvp": False,
                "yellow_card": yellow,
                "red_card": red,
            })

    stats_rows = []
    distribute_goals(team_a, score_a, mid, "A", stats_rows)
    distribute_goals(team_b, score_b, mid, "B", stats_rows)

    # Pick 1 MVP (highest goals+assists among attended)
    attended_stats = [s for s in stats_rows if s["attended"]]
    if attended_stats:
        best = max(attended_stats, key=lambda s: s["goals"] * 2 + s["assists"] + random.random())
        best["mvp"] = True

    all_stats_rows.extend(stats_rows)

# Write stats in batches
batch_size = 50
for i in range(0, len(all_stats_rows), batch_size):
    batch = all_stats_rows[i:i+batch_size]
    w(f"INSERT INTO match_player_stats (match_id, user_id, team, goals, assists, attended, mvp, yellow_card, red_card) VALUES")
    rows = []
    for s in batch:
        att = "true" if s["attended"] else "false"
        mvp = "true" if s["mvp"] else "false"
        yc = "true" if s["yellow_card"] else "false"
        rc = "true" if s["red_card"] else "false"
        rows.append(
            f"  ('{s['match_id']}','{s['player_id']}','{s['team']}',{s['goals']},{s['assists']},{att},{mvp},{yc},{rc})"
        )
    w(",\n".join(rows))
    w("ON CONFLICT ON CONSTRAINT unique_player_stats_per_match DO NOTHING;")
    w()

# ============================================================
# CHAT MESSAGES (for ~15 recent matches)
# ============================================================

w("-- =====================================================")
w("-- CHAT MESSAGES")
w("-- =====================================================")
w()

PRE_MATCH_MSGS = [
    "Salut ! Qui est chaud pour le match {venue} ?",
    "Présent ! Je sors du boulot à 18h, j''arrive direct.",
    "Moi aussi, c''est quoi comme surface ?",
    "Comment on y va en transports ?",
    "Je prends les chasubles, j''en ai des deux couleurs.",
    "Quelqu''un a un ballon ?",
    "J''en amène deux, pas de souci.",
    "Top ! On fait les équipes sur place ?",
    "Rdv 15 min avant pour l''échauffement.",
    "C''est mon premier match sur l''app, j''ai hâte !",
    "Bienvenue ! Tu vas voir c''est super.",
    "Attention il risque de pleuvoir ce soir.",
    "Pas grave un peu de pluie ça glisse bien !",
    "Les vestiaires sont ouverts ?",
    "Oui jusqu''à 22h, douches incluses.",
    "Je ramène de l''eau pour tout le monde.",
    "On est combien d''inscrits pour l''instant ?",
    "Crampons moulés ou lisses pour le synthétique ?",
    "Moulés ça passe bien sur ce terrain.",
    "A ce soir les gars !",
]

POST_MATCH_MSGS = [
    "GG ! Bon match tout le monde !",
    "Trop bien, on remet ça vite !",
    "Belle ambiance ce soir, merci à tous.",
    "Le niveau monte à chaque match !",
    "Bien joué tout le monde, match serré.",
    "Super soirée foot, à la prochaine !",
    "Trop content de mon premier match, je reviendrai !",
    "Beau match, les combinaisons c''étaient du régal.",
    "Merci à l''orga, terrain au top.",
    "Qui est dispo pour le prochain ?",
]

# Generate chat for the last 20 completed matches and upcoming/in-progress
chat_matches = completed_matches[-20:] + in_progress_matches + upcoming_matches

for m in chat_matches:
    mid = match_uuid(m["num"])
    players = registrations_per_match.get(m["num"], [])
    if len(players) < 3:
        continue

    venue_city = VENUES[m["venue_idx"]][2]
    days_ago = m["days_ago"]

    # Pre-match messages (day before or same day before match)
    n_pre = random.randint(3, 6)
    pre_senders = random.sample(players, min(n_pre, len(players)))

    rows = []
    for j, pidx in enumerate(pre_senders):
        pid = PLAYER_IDS[pidx]
        msg = random.choice(PRE_MATCH_MSGS).replace("{venue}", venue_city)
        if days_ago > 0:
            ts = f"(CURRENT_DATE-interval '{days_ago+1} days'+time '{14+j}:00')::timestamptz"
        elif days_ago == 0:
            ts = f"(CURRENT_DATE-interval '1 day'+time '{14+j}:00')::timestamptz"
        else:
            ts = f"(CURRENT_DATE+time '{10+j}:00')::timestamptz"
        rows.append(f"  ('{mid}','{pid}','text','{msg}',{ts})")

    # Post-match messages (only for completed matches)
    if m["status"] == "completed":
        n_post = random.randint(2, 4)
        post_senders = random.sample(players, min(n_post, len(players)))
        for j, pidx in enumerate(post_senders):
            pid = PLAYER_IDS[pidx]
            msg = random.choice(POST_MATCH_MSGS)
            if days_ago > 0:
                ts = f"(CURRENT_DATE-interval '{days_ago} days'+time '{21+j % 2}:{15+j*5}')::timestamptz"
            else:
                ts = f"(CURRENT_DATE+time '{21+j % 2}:{15+j*5}')::timestamptz"
            rows.append(f"  ('{mid}','{pid}','text','{msg}',{ts})")

    if rows:
        w(f"-- Match {m['num']}: {venue_city} ({days_ago}d ago)")
        w(f"INSERT INTO match_messages (match_id, sender_id, type, content, created_at) VALUES")
        w(",\n".join(rows))
        w(";")
        w()

# ============================================================
# NOTIFICATIONS
# ============================================================

w("-- =====================================================")
w("-- NOTIFICATIONS")
w("-- =====================================================")
w()
w("INSERT INTO notifications (user_id, type, title, body, data) VALUES")

notif_rows = []

# Subscription activated for first 20 players
for i in range(20):
    uid = PLAYER_IDS[i]
    notif_rows.append(
        f"  ('{uid}','subscription_activated','Abonnement activé !','Bienvenue sur FootMatch Premium. Rejoins des matchs illimités.','{{}}');"
    )

# MVP notifications from recent matches
mvp_notifs = []
for s in all_stats_rows:
    if s["mvp"]:
        mvp_notifs.append(s)

for s in mvp_notifs[-10:]:
    notif_rows.append(
        f"  ('{s['player_id']}','match_mvp','MVP du match !','Tu as été élu MVP du match. Bravo !','{{\"matchId\":\"{s['match_id']}\"}}')"
    )

# Registration confirmed for upcoming matches
for m in upcoming_matches[:3]:
    players = registrations_per_match.get(m["num"], [])
    for pidx in players[:3]:
        pid = PLAYER_IDS[pidx]
        notif_rows.append(
            f"  ('{pid}','registration_confirmed','Inscription confirmée','Tu es inscrit pour un match à venir.','{{\"matchId\":\"{match_uuid(m['num'])}\"}}')"
        )

# Match results available
for m in completed_matches[-5:]:
    players = registrations_per_match.get(m["num"], [])
    for pidx in players[:2]:
        pid = PLAYER_IDS[pidx]
        notif_rows.append(
            f"  ('{pid}','match_results_available','Résultats disponibles','Les résultats de ton dernier match sont disponibles.','{{\"matchId\":\"{match_uuid(m['num'])}\"}}')"
        )

# Operator application approved
notif_rows.append(f"  ('{OP1_ID}','application_approved','Candidature approuvée','Votre candidature opérateur a été approuvée. Bienvenue !','{{}}')")
notif_rows.append(f"  ('{OP2_ID}','application_approved','Candidature approuvée','Votre candidature opérateur a été approuvée. Bienvenue !','{{}}')")

# Fix: remove trailing semicolons from individual rows and join properly
clean_rows = [r.rstrip(";") for r in notif_rows]
w(",\n".join(clean_rows) + ";")
w()

# ============================================================
# UPDATE OPERATOR TOTAL MATCHES
# ============================================================

w("-- =====================================================")
w("-- UPDATE OPERATOR TOTAL MATCHES")
w("-- =====================================================")
w()

op1_count = sum(1 for m in completed_matches if m["operator_oid"] == OP1_OID)
op2_count = sum(1 for m in completed_matches if m["operator_oid"] == OP2_OID)

w(f"UPDATE operators SET total_matches = {op1_count} WHERE id = '{OP1_OID}';")
w(f"UPDATE operators SET total_matches = {op2_count} WHERE id = '{OP2_OID}';")
w()

# ============================================================
# SUMMARY COMMENT
# ============================================================

w("-- =====================================================")
w("-- SEED SUMMARY")
w(f"-- Total users: {103} (1 admin + 2 operators + 100 players)")
w(f"-- Active subscriptions: 90 | Canceled: 10")
w(f"-- Total matches: {len(matches)} ({len(completed_matches)} completed, {len(in_progress_matches)} in_progress, {len(upcoming_matches)} upcoming)")
w(f"-- Total registrations: {len(all_registration_rows)}")
w(f"-- Total player stats: {len(all_stats_rows)}")
w("-- Career stats auto-calculated by triggers")
w("-- =====================================================")

# ============================================================
# OUTPUT
# ============================================================

print("\n".join(out))
