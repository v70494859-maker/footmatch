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

  await client.query("SET ROLE postgres;");
  console.log("SET ROLE postgres");

  const sql = fs.readFileSync("supabase/migrations/20260223_anti_noshow.sql", "utf8");

  // Execute statement by statement for better error reporting
  const statements = sql
    .split(/;(?:\s*\n)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ";";
    const preview = stmt.substring(0, 80).replace(/\n/g, " ");
    try {
      await client.query(stmt);
      console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
    } catch (e: any) {
      console.error(`[${i + 1}/${statements.length}] FAIL: ${e.message.substring(0, 150)}`);
    }
  }

  // Verify
  const { rows: cols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'player_career_stats' AND column_name IN ('no_show_count', 'late_cancel_count')
    ORDER BY column_name
  `);
  console.log(`\n=== Verification ===`);
  console.log(`player_career_stats new columns: ${cols.map(c => c.column_name).join(", ") || "MISSING"}`);

  const { rows: regCols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'match_registrations' AND column_name IN ('canceled_at', 'standby_position')
    ORDER BY column_name
  `);
  console.log(`match_registrations new columns: ${regCols.map(c => c.column_name).join(", ") || "MISSING"}`);

  const { rows: profCols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name IN ('cancel_tokens', 'cancel_tokens_reset_at')
    ORDER BY column_name
  `);
  console.log(`profiles new columns: ${profCols.map(c => c.column_name).join(", ") || "MISSING"}`);

  const { rows: enumVals } = await client.query(`
    SELECT enumlabel FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'registration_status_enum')
    ORDER BY enumsortorder
  `);
  console.log(`registration_status_enum values: ${enumVals.map(v => v.enumlabel).join(", ")}`);

  await client.end();
}

run().catch(console.error);
