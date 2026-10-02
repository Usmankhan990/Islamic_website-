// One-time migration: creates the Postgres schema on Supabase and copies all rows from local MySQL.
// Usage: node scripts/migrate_to_supabase.js
// Needs DATABASE_URL (Supabase) in server/.env, plus DB_HOST/DB_USER/DB_PASSWORD/DB_NAME for the MySQL source.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Parent tables before children so foreign keys are satisfied
const TABLES = [
  'users', 'games', 'game_questions', 'game_results', 'competitions', 'competition_entries',
  'competition_votes', 'prizes', 'reviews', 'live_classes', 'class_requests', 'lessons',
  'progress', 'achievements', 'certificates', 'ai_knowledge_base', 'weekly_topics',
  'weekly_quizzes', 'weekly_quiz_questions', 'weekly_quiz_results'
];
const BOOLEAN_COLS = new Set(['is_active', 'is_approved', 'is_published', 'is_recurring']);
const JSON_COLS = new Set(['config_json', 'options_json', 'content_data']);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing in server/.env');

  const src = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'islamic_platform'
  });
  const dst = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await dst.connect();

  console.log('📐 Creating schema on Supabase...');
  const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.postgres.sql'), 'utf8');
  await dst.query(schema);

  await dst.query('BEGIN');
  try {
    // Fresh copy: clear target tables (safe to re-run)
    await dst.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);

    for (const table of TABLES) {
      const [rows] = await src.query(`SELECT * FROM \`${table}\` ORDER BY id`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const values = cols.map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return null;
          if (BOOLEAN_COLS.has(c)) return Boolean(v);
          if (JSON_COLS.has(c)) return typeof v === 'string' ? v : JSON.stringify(v);
          return v;
        });
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        await dst.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`, values);
      }
      // Move the id sequence past the copied ids
      await dst.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
      console.log(`  ✔ ${table}: ${rows.length} rows`);
    }
    await dst.query('COMMIT');
  } catch (err) {
    await dst.query('ROLLBACK');
    throw err;
  }

  // Verify counts match
  let ok = true;
  for (const table of TABLES) {
    const [[{ c }]] = await src.query(`SELECT COUNT(*) c FROM \`${table}\``);
    const { rows: [{ count }] } = await dst.query(`SELECT COUNT(*)::int count FROM ${table}`);
    if (Number(c) !== count) { ok = false; console.log(`  ✘ ${table}: mysql=${c} supabase=${count}`); }
  }
  console.log(ok ? '✅ Migration complete — all row counts match.' : '⚠️ Row count mismatch, see above.');

  await src.end();
  await dst.end();
}

main().catch((err) => { console.error('❌ Migration failed:', err.message); process.exit(1); });
