// Run one SQL migration file against Supabase.
// Usage: node scripts/run_migration.js ../database/migrations/002_coins_and_mini_games.sql
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Pass the migration .sql file path');
  const sql = fs.readFileSync(path.resolve(file), 'utf8');

  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Applied ${path.basename(file)}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => { console.error('❌ Migration failed:', err.message); process.exit(1); });
