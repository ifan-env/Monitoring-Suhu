const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/readings - menerima data sensor (Bagian 3.2 & 3.3)
app.post('/api/readings', async (req, res) => {
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
    const result = await pool.query(
      'INSERT INTO readings (device_id, suhu, kelembapan) VALUES ($1, $2, $3) RETURNING *',
      [device_id || 'GH-01', suhu, kelembapan]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal menyimpan data' });
  }
});

// GET /api/readings/latest - data terbaru untuk kartu nilai
app.get('/api/readings/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM readings ORDER BY id DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal mengambil data terbaru' });
  }
});

// GET /api/stats - rata-rata, minimum, maksimum suhu & kelembapan
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS total,
             AVG(suhu) AS suhu_rata_rata, MIN(suhu) AS suhu_min, MAX(suhu) AS suhu_maks,
             AVG(kelembapan) AS kelembapan_rata_rata, MIN(kelembapan) AS kelembapan_min, MAX(kelembapan) AS kelembapan_maks
      FROM readings
    `);
    const r = result.rows[0];
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
app.get('/api/readings', async (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (Number.isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  try {
    const result = await pool.query(
      'SELECT * FROM readings ORDER BY id DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'gagal mengambil riwayat data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
