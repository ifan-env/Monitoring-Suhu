const Database = require('better-sqlite3');
const path = require('path');

// Database SQLite: tersimpan sebagai file data.db di folder proyek,
// dibuat otomatis saat pertama kali server dijalankan.
const db = new Database(path.join(__dirname, 'data.db'));

// Struktur tabel readings persis Bagian 3.1
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    suhu REAL NOT NULL,
    kelembapan REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('Tabel readings siap');

module.exports = db;
