const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

// Izinkan dashboard dari origin lain (mis. Vite port 5173) membaca API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// POST /api/readings - menerima data sensor (Bagian 3.2 & 3.3)
app.post('/api/readings', (req, res) => {
  const { device_id, suhu, kelembapan } = req.body || {};

  if (typeof suhu !== 'number' || typeof kelembapan !== 'number') {
    return res.status(400).json({ error: 'suhu dan kelembapan harus berupa angka' });
  }
  if (suhu < -40 || suhu > 80) {
    return res.status(400).json({ error: 'suhu harus di antara -40 s.d. 80 derajat C' });
  }
  if (kelembapan < 0 || kelembapan > 100) {
    return res.status(400).json({ error: 'kelembapan harus di antara 0 s.d. 100 persen' });
  }

  try {
    const info = db
      .prepare('INSERT INTO readings (device_id, suhu, kelembapan) VALUES (?, ?, ?)')
      .run(device_id || 'GH-01', suhu, kelembapan);
    const row = db
      .prepare('SELECT * FROM readings WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal menyimpan data' });
  }
});

// GET /api/readings/latest - data terbaru untuk kartu nilai
app.get('/api/readings/latest', (req, res) => {
  try {
    const row = db
      .prepare('SELECT * FROM readings ORDER BY id DESC LIMIT 1')
      .get();
    res.json(row || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal mengambil data terbaru' });
  }
});

// GET /api/stats - rata-rata, minimum, maksimum suhu & kelembapan
app.get('/api/stats', (req, res) => {
  try {
    const r = db
      .prepare(
        `SELECT COUNT(*) AS total,
                AVG(suhu) AS suhu_rata_rata, MIN(suhu) AS suhu_min, MAX(suhu) AS suhu_maks,
                AVG(kelembapan) AS kelembapan_rata_rata, MIN(kelembapan) AS kelembapan_min, MAX(kelembapan) AS kelembapan_maks
         FROM readings`
      )
      .get();
    const angka = (v) => (v === null || v === undefined ? null : Math.round(Number(v) * 10) / 10);
    res.json({
      total_data: Number(r.total),
      suhu: { rata_rata: angka(r.suhu_rata_rata), minimum: angka(r.suhu_min), maksimum: angka(r.suhu_maks) },
      kelembapan: { rata_rata: angka(r.kelembapan_rata_rata), minimum: angka(r.kelembapan_min), maksimum: angka(r.kelembapan_maks) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal mengambil statistik' });
  }
});

// GET /api/readings?limit=20 - riwayat N data terakhir
app.get('/api/readings', (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  try {
    const rows = db
      .prepare('SELECT * FROM readings ORDER BY id DESC LIMIT ?')
      .all(limit);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal mengambil riwayat data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
