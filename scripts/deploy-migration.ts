import { Client } from "pg";
import * as fs from "fs";

async function run() {
  const migrationFile = process.argv[2] || "supabase/migrations/20260224_messaging_improvements.sql";

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

  const sql = fs.readFileSync(migrationFile, "utf8");
  console.log(`\nRunning migration: ${migrationFile}`);

  try {
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (e: any) {
    console.error(`Migration failed: ${e.message}`);
  }

  // Verify messaging columns
  const { rows: dmCols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'direct_messages' AND column_name IN ('deleted_at', 'media_duration')
    ORDER BY column_name
  `);
  console.log(`\n=== Verification ===`);
  console.log(`direct_messages new columns: ${dmCols.map(c => c.column_name).join(", ") || "MISSING"}`);

  const { rows: fns } = await client.query(`
    SELECT routine_name FROM information_schema.routines
    WHERE routine_name IN ('get_unread_conversation_count', 'notify_new_direct_message')
    ORDER BY routine_name
  `);
  console.log(`Functions: ${fns.map(f => f.routine_name).join(", ") || "MISSING"}`);

  const { rows: trgs } = await client.query(`
    SELECT trigger_name FROM information_schema.triggers
    WHERE trigger_name = 'trg_notify_direct_message'
  `);
  console.log(`Triggers: ${trgs.map(t => t.trigger_name).join(", ") || "MISSING"}`);

  await client.end();
}

run().catch(console.error);
