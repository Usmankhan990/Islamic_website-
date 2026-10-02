const { Pool, types } = require('pg');
require('dotenv').config();

// Return COUNT/SUM (bigint) and DECIMAL as JS numbers instead of strings
types.setTypeParser(20, (v) => parseInt(v, 10));   // INT8
types.setTypeParser(1700, (v) => parseFloat(v));   // NUMERIC

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10
});

// Convert MySQL-style `?` placeholders to Postgres `$1, $2, ...` (skips quoted strings)
function toPgPlaceholders(sql) {
  let out = '';
  let n = 0;
  let inQuote = false;
  for (const ch of sql) {
    if (ch === "'") inQuote = !inQuote;
    out += (ch === '?' && !inQuote) ? `$${++n}` : ch;
  }
  return out;
}

// mysql2-compatible query(): resolves to [rows] for SELECT,
// and [{ insertId, affectedRows }] for INSERT/UPDATE/DELETE
async function query(sql, params = []) {
  let text = toPgPlaceholders(sql);
  const isInsert = /^\s*INSERT\b/i.test(text);
  if (isInsert && !/\bRETURNING\b/i.test(text)) text += ' RETURNING id';

  const result = await pool.query(text, params);

  if (result.command === 'SELECT') return [result.rows];
  return [{
    insertId: isInsert && result.rows[0] ? result.rows[0].id : undefined,
    affectedRows: result.rowCount,
    rows: result.rows
  }];
}

// Test connection
pool.query('SELECT 1')
  .then(() => console.log('✅ PostgreSQL (Supabase) Connected Successfully'))
  .catch((err) => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
    console.log('💡 Check DATABASE_URL in server/.env');
  });

module.exports = { query, execute: query, pool };
