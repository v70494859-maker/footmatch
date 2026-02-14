import { Client } from "pg";
import * as fs from "fs";

async function run() {
  const client = new Client({
    host: "db.glvuyedwuzwkdocrcpng.supabase.co",
    port: 5432,
    user: "cli_login_postgres",
    password: "yEspVvInygUlEfWIJVvgvApaJhuHiFnb",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  // Escalate to postgres role for full permissions
  await client.query("SET ROLE postgres;");
  console.log("SET ROLE postgres");

  const sql = fs.readFileSync("supabase/seed-teams.sql", "utf8");

  try {
    await client.query(sql);
    console.log("Seed SQL executed successfully!");
  } catch (err: any) {
    console.error("Error:", err.message);
    // Try statement by statement
    console.log("\nRetrying statement by statement...");
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ";";
      const preview = stmt.substring(0, 70).replace(/\n/g, " ");
      try {
        await client.query(stmt);
        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
      } catch (e: any) {
        console.error(`[${i + 1}/${statements.length}] FAIL: ${e.message.substring(0, 100)}`);
      }
    }
  }

  // Verify
  const { rows: teams } = await client.query("SELECT name, member_count, city FROM teams ORDER BY created_at");
  console.log(`\n=== ${teams.length} Teams ===`);
  teams.forEach((t) => console.log(`  ${t.name} (${t.member_count} members, ${t.city})`));

  const { rows: [{ count: fc }] } = await client.query("SELECT count(*) FROM friendships");
  console.log(`Friendships: ${fc}`);

  const { rows: [{ count: cc }] } = await client.query("SELECT count(*) FROM team_challenges");
  console.log(`Challenges: ${cc}`);

  const { rows: statuses } = await client.query("SELECT status, count(*) FROM team_challenges GROUP BY status ORDER BY status");
  console.log("Challenge statuses:", statuses.map((s) => `${s.status}: ${s.count}`).join(", "));

  await client.end();
}

run().catch(console.error);
