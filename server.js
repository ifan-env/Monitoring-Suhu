const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

app.post('/api/readings', async (req, res) => {
  try {
    const { device_id, suhu, kelembapan } = req.body;
    const result = await pool.query(
      'INSERT INTO readings (device_id, suhu, kelembapan) VALUES ($1, $2, $3) RETURNING *',
      [device_id, suhu, kelembapan],
    );
    res.status(201).json('Data Tersimpan : ' + result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Gagal menyimpan data');
  }
});
app.get('/api/readings', async (req, res) => {
  try {
    const { limit } = req.body;
    const result = await pool.query(
      'SELECT * FROM readings ORDER BY created_at DESC limit $1',
      [limit],
    );
    res.status(200).json('Data Tersimpan : ' + result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json('Gagal menyimpan data');
  }
});

app.get('/api/readings/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM readings ORDER BY created_at DESC limit 1',
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Data Tidak tersedia');
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { limit } = req.query.limit;
    const result = await pool.query(
      'SELECT COUNT(*)::int AS total, AVG(suhu) AS avg_suhu, MIN(suhu) AS min_suhu, MAX(suhu) AS max_suhu,  AVG(kelembapan) AS avg_kelembapan, MIN(kelembapan) AS min_kelembapan, MAX(kelembapan) AS max_kelembapan FROM readings;',
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json('Gagal menyimpan data');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di :${PORT}`);
});
