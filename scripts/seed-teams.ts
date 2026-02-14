import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function run() {
  console.log("Seeding teams, members, friendships, challenges...\n");

  // ── 1. Team Charters ──
  const captainIds = [101, 107, 113, 119, 125, 131, 137, 143, 149, 155];
  const charterDays = [30, 28, 26, 25, 24, 22, 20, 18, 16, 14];

  const { error: charterErr } = await supabase.from("team_charters").upsert(
    captainIds.map((id, i) => ({
      user_id: uid(id),
      signed_at: daysAgo(charterDays[i]),
    })),
    { onConflict: "user_id" }
  );
  log("Team charters", charterErr);

  // ── 2. Teams ──
  const teams = [
    { id: tid(1), name: "FC Jet d'Eau", description: "Les rois du lac — on joue avec la pression !", crest_preset: "blue", captain_id: uid(101), city: "Genève", member_count: 6, created_at: daysAgo(30) },
    { id: tid(2), name: "Carouge City FC", description: "Le foot de quartier, version premium.", crest_preset: "red", captain_id: uid(107), city: "Carouge", member_count: 6, created_at: daysAgo(28) },
    { id: tid(3), name: "Les Aigles du Salève", description: "On vise toujours plus haut.", crest_preset: "green", captain_id: uid(113), city: "Veyrier", member_count: 6, created_at: daysAgo(26) },
    { id: tid(4), name: "Onex United", description: "Unis sur et en dehors du terrain.", crest_preset: "orange", captain_id: uid(119), city: "Onex", member_count: 6, created_at: daysAgo(25) },
    { id: tid(5), name: "Lancy Flames", description: "Quand on arrive, ça brûle.", crest_preset: "red", captain_id: uid(125), city: "Lancy", member_count: 6, created_at: daysAgo(24) },
    { id: tid(6), name: "Vernier Wolves", description: "La meute ne lâche jamais.", crest_preset: "purple", captain_id: uid(131), city: "Vernier", member_count: 6, created_at: daysAgo(22) },
    { id: tid(7), name: "Thônex Thunder", description: "Le tonnerre frappe deux fois.", crest_preset: "yellow", captain_id: uid(137), city: "Thônex", member_count: 6, created_at: daysAgo(20) },
    { id: tid(8), name: "Meyrin Galaxy", description: "Le foot interstellaire, c'est nous.", crest_preset: "cyan", captain_id: uid(143), city: "Meyrin", member_count: 6, created_at: daysAgo(18) },
    { id: tid(9), name: "Plan-les-Ouates FC", description: "Le plan est simple : gagner.", crest_preset: "green", captain_id: uid(149), city: "Plan-les-Ouates", member_count: 6, created_at: daysAgo(16) },
    { id: tid(10), name: "Chêne-Bourg Titans", description: "Forts comme des chênes, rapides comme l'éclair.", crest_preset: "blue", captain_id: uid(155), city: "Chêne-Bourg", member_count: 6, created_at: daysAgo(14) },
  ];

  const { error: teamsErr } = await supabase.from("teams").upsert(teams, { onConflict: "id" });
  log("Teams", teamsErr);

  // ── 3. Team Members ──
  const members: any[] = [];
  const teamPlayers = [
    [101, 102, 103, 104, 105, 106],
    [107, 108, 109, 110, 111, 112],
    [113, 114, 115, 116, 117, 118],
    [119, 120, 121, 122, 123, 124],
    [125, 126, 127, 128, 129, 130],
    [131, 132, 133, 134, 135, 136],
    [137, 138, 139, 140, 141, 142],
    [143, 144, 145, 146, 147, 148],
    [149, 150, 151, 152, 153, 154],
    [155, 156, 157, 158, 159, 160],
  ];

  teamPlayers.forEach((players, teamIdx) => {
    const baseDays = charterDays[teamIdx];
    players.forEach((p, i) => {
      members.push({
        team_id: tid(teamIdx + 1),
        user_id: uid(p),
        role: i === 0 ? "captain" : i === 1 ? "co_captain" : "member",
        joined_at: daysAgo(baseDays - i),
      });
    });
  });

  const { error: membersErr } = await supabase.from("team_members").upsert(members, { onConflict: "team_id,user_id" });
  log("Team members", membersErr);

  // ── 4. Friendships ──
  const friendships: any[] = [];

  // Internal team friendships (captain ↔ all members)
  teamPlayers.forEach((players, teamIdx) => {
    const captain = players[0];
    const baseDays = charterDays[teamIdx];
    for (let i = 1; i < players.length; i++) {
      friendships.push({
        requester_id: uid(captain),
        addressee_id: uid(players[i]),
        status: "accepted",
        created_at: daysAgo(baseDays - i),
        updated_at: daysAgo(baseDays - i),
      });
    }
    // Some extra within-team bonds
    if (players.length >= 4) {
      friendships.push({
        requester_id: uid(players[1]),
        addressee_id: uid(players[2]),
        status: "accepted",
        created_at: daysAgo(baseDays - 3),
        updated_at: daysAgo(baseDays - 3),
      });
    }
  });

  // Cross-team captain rivalries
  const captainPairs = [
    [101, 107], [101, 113], [107, 119], [113, 125], [119, 131],
    [125, 137], [131, 143], [137, 149], [143, 155], [149, 101],
    [155, 107], [101, 119], [101, 125], [101, 137], [101, 155],
  ];
  captainPairs.forEach(([a, b], i) => {
    friendships.push({
      requester_id: uid(a),
      addressee_id: uid(b),
      status: "accepted",
      created_at: daysAgo(20 - i),
      updated_at: daysAgo(20 - i),
    });
  });

  // Pending requests for realism
  friendships.push(
    { requester_id: uid(102), addressee_id: uid(108), status: "pending", created_at: daysAgo(2), updated_at: daysAgo(2) },
    { requester_id: uid(114), addressee_id: uid(120), status: "pending", created_at: daysAgo(1), updated_at: daysAgo(1) },
    { requester_id: uid(143), addressee_id: uid(101), status: "pending", created_at: daysAgo(1), updated_at: daysAgo(1) },
  );

  // Insert friendships, skip duplicates
  for (const f of friendships) {
    const { error } = await supabase.from("friendships").upsert(f, { onConflict: "requester_id,addressee_id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) {
      console.error(`  Friendship error: ${error.message}`);
    }
  }
  console.log(`✓ Friendships: ${friendships.length} inserted`);

  // ── 5. Team Challenges ──
  const challenges = [
    // Round 1 — 3 weeks ago (completed)
    { challenger_team_id: tid(1), challenged_team_id: tid(2), status: "completed", proposed_date: daysAgo(21), proposed_venue: "Stade de la Praille", message: "Derby genevois ! On va vous écraser.", created_at: daysAgo(25), updated_at: daysAgo(21) },
    { challenger_team_id: tid(3), challenged_team_id: tid(4), status: "completed", proposed_date: daysAgo(21), proposed_venue: "Centre sportif du Bois-des-Frères", message: "Les Aigles défient Onex !", created_at: daysAgo(25), updated_at: daysAgo(21) },
    { challenger_team_id: tid(5), challenged_team_id: tid(6), status: "completed", proposed_date: daysAgo(21), proposed_venue: "Stade de Lancy", message: "Les flammes vont consumer les loups.", created_at: daysAgo(25), updated_at: daysAgo(21) },
    { challenger_team_id: tid(7), challenged_team_id: tid(8), status: "completed", proposed_date: daysAgo(20), proposed_venue: "Terrain de Thônex", message: "Tonnerre vs Galaxie, un match cosmique !", created_at: daysAgo(24), updated_at: daysAgo(20) },
    { challenger_team_id: tid(9), challenged_team_id: tid(10), status: "completed", proposed_date: daysAgo(20), proposed_venue: "Centre sportif de PLO", message: "Le plan est en marche.", created_at: daysAgo(24), updated_at: daysAgo(20) },

    // Round 2 — 2 weeks ago (completed, reversed)
    { challenger_team_id: tid(2), challenged_team_id: tid(1), status: "completed", proposed_date: daysAgo(14), proposed_venue: "Stade des Charmilles", message: "Revanche ! Carouge veut sa victoire.", created_at: daysAgo(18), updated_at: daysAgo(14) },
    { challenger_team_id: tid(4), challenged_team_id: tid(5), status: "completed", proposed_date: daysAgo(14), proposed_venue: "Terrain d'Onex", message: "Onex vs Lancy, le choc des voisins.", created_at: daysAgo(18), updated_at: daysAgo(14) },
    { challenger_team_id: tid(6), challenged_team_id: tid(3), status: "completed", proposed_date: daysAgo(13), proposed_venue: "Stade de Vernier", message: "Les Wolves chassent les Aigles.", created_at: daysAgo(17), updated_at: daysAgo(13) },
    { challenger_team_id: tid(8), challenged_team_id: tid(9), status: "completed", proposed_date: daysAgo(13), proposed_venue: "Centre sportif de Meyrin", message: "La galaxie affronte le plan.", created_at: daysAgo(17), updated_at: daysAgo(13) },
    { challenger_team_id: tid(10), challenged_team_id: tid(7), status: "completed", proposed_date: daysAgo(12), proposed_venue: "Terrain de Chêne-Bourg", message: "Les Titans défient le Tonnerre.", created_at: daysAgo(16), updated_at: daysAgo(12) },

    // Round 3 — last week (completed, cross-matchups)
    { challenger_team_id: tid(1), challenged_team_id: tid(5), status: "completed", proposed_date: daysAgo(7), proposed_venue: "Stade de Genève", message: "Jet d'Eau vs Flames, ça va chauffer !", created_at: daysAgo(10), updated_at: daysAgo(7) },
    { challenger_team_id: tid(3), challenged_team_id: tid(7), status: "completed", proposed_date: daysAgo(7), proposed_venue: "Centre sportif Sous-Moulin", message: "Aigles vs Thunder, altitude vs puissance.", created_at: daysAgo(10), updated_at: daysAgo(7) },
    { challenger_team_id: tid(2), challenged_team_id: tid(6), status: "completed", proposed_date: daysAgo(6), proposed_venue: "Stade de Carouge", message: "Carouge City reçoit les Wolves.", created_at: daysAgo(9), updated_at: daysAgo(6) },
    { challenger_team_id: tid(4), challenged_team_id: tid(8), status: "completed", proposed_date: daysAgo(6), proposed_venue: "Terrain d'Onex", message: "Onex vs Meyrin, le choc interplanétaire.", created_at: daysAgo(9), updated_at: daysAgo(6) },
    { challenger_team_id: tid(9), challenged_team_id: tid(1), status: "completed", proposed_date: daysAgo(5), proposed_venue: "Centre sportif de PLO", message: "PLO veut tester le Jet d'Eau.", created_at: daysAgo(8), updated_at: daysAgo(5) },

    // Scheduled (upcoming)
    { challenger_team_id: tid(1), challenged_team_id: tid(3), status: "scheduled", proposed_date: futureDate(3), proposed_venue: "Stade de la Praille", message: "Semi-finale du tournoi FootMatch !", created_at: daysAgo(3), updated_at: daysAgo(2) },
    { challenger_team_id: tid(2), challenged_team_id: tid(4), status: "scheduled", proposed_date: futureDate(4), proposed_venue: "Stade des Charmilles", message: "L'autre semi-finale !", created_at: daysAgo(3), updated_at: daysAgo(2) },

    // Accepted
    { challenger_team_id: tid(5), challenged_team_id: tid(7), status: "accepted", proposed_date: futureDate(7), proposed_venue: "Stade de Lancy", message: "Match amical entre voisins.", created_at: daysAgo(2), updated_at: daysAgo(1) },
    { challenger_team_id: tid(6), challenged_team_id: tid(10), status: "accepted", proposed_date: futureDate(8), proposed_venue: "Stade de Vernier", message: "Wolves vs Titans, qui survivra ?", created_at: daysAgo(2), updated_at: daysAgo(1) },

    // Proposed (pending)
    { challenger_team_id: tid(8), challenged_team_id: tid(1), status: "proposed", proposed_date: futureDate(10), proposed_venue: "Centre sportif de Meyrin", message: "Meyrin Galaxy veut sa revanche.", created_at: daysAgo(1), updated_at: daysAgo(1) },
    { challenger_team_id: tid(10), challenged_team_id: tid(3), status: "proposed", proposed_date: futureDate(11), proposed_venue: "Terrain de Chêne-Bourg", message: "Les Titans veulent affronter les Aigles.", created_at: daysAgo(1), updated_at: daysAgo(1) },
    { challenger_team_id: tid(9), challenged_team_id: tid(5), status: "proposed", proposed_date: futureDate(12), proposed_venue: "Centre sportif de PLO", message: "PLO lance un défi aux Flames !", created_at: daysAgo(0), updated_at: daysAgo(0) },

    // Declined / canceled
    { challenger_team_id: tid(7), challenged_team_id: tid(2), status: "declined", proposed_date: daysAgo(10), proposed_venue: "Terrain de Thônex", message: "Thunder veut un match !", created_at: daysAgo(15), updated_at: daysAgo(10) },
    { challenger_team_id: tid(1), challenged_team_id: tid(10), status: "canceled", proposed_date: daysAgo(8), proposed_venue: "Stade de Genève", message: "On reporte, trop de blessés.", created_at: daysAgo(12), updated_at: daysAgo(8) },
    { challenger_team_id: tid(6), challenged_team_id: tid(9), status: "declined", proposed_date: daysAgo(5), proposed_venue: "Stade de Vernier", message: "Les Wolves défient PLO.", created_at: daysAgo(8), updated_at: daysAgo(5) },
  ];

  const { error: challengesErr } = await supabase.from("team_challenges").insert(challenges);
  log("Challenges", challengesErr);

  // ── Verify ──
  console.log("\n=== Verification ===");
  const { data: t } = await supabase.from("teams").select("name, member_count, city").order("created_at");
  console.log(`Teams: ${t?.length}`);
  t?.forEach((team) => console.log(`  ${team.name} (${team.member_count} members, ${team.city})`));

  const { count: fc } = await supabase.from("friendships").select("id", { count: "exact", head: true });
  console.log(`Friendships: ${fc}`);

  const { count: cc } = await supabase.from("team_challenges").select("id", { count: "exact", head: true });
  console.log(`Challenges: ${cc}`);

  const { data: statusCounts } = await supabase.from("team_challenges").select("status");
  const counts: Record<string, number> = {};
  statusCounts?.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
  console.log("Challenge statuses:", counts);
}

function uid(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

function tid(n: number): string {
  return `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

function futureDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function log(label: string, error: any) {
  if (error) console.error(`✗ ${label}: ${error.message}`);
  else console.log(`✓ ${label}: OK`);
}

run().catch(console.error);
