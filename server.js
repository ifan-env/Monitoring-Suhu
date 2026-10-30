const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

app.post('/api/readings', async (req, res) => {
  try {
    const { device_id, sensor, value } = req.body;
    const result = await pool.query(
      'INSERT INTO monitoring_suhu (device_id, sensor, value) VALUES ($1, $2, $3) RETURNING *',
      [device_id, sensor, value],
    );
    res.status(201).json('Data Tersimpan : ' + result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Gagal menyimpan data');
  }
});

app.get('/api/readings/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM monitoring_suhu ORDER BY created_at DESC limit 1',
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Data Tidak tersedia');
  }
});

app.get('/api/stats', async (req, res) => {});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di :${PORT}`);
});
