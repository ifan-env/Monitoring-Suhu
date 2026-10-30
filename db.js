// cat > ~/Monitoring-Suhu/db.js <<'EnpOF'
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'Achmadifan',
  database: 'monitoring_suhu',
});

pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    suhu REAL NOT NULL,
    kelembapan REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`,
  )
  .then(() => console.log('Tabel readings siap'))
  .catch((err) => console.error('Gagal membuat tabel:', err.message));

module.exports = pool;
// EOF;
