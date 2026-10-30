const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());
app.post('/api/readings', async (req, res) => {
  try {
    const { sensor, value } = req.body;
    const result = await pool.query(
      'INSERT INTO sensor_readings (sensor,value) VALUES ($1, $2) RETURNING *',
      [sensor, value],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Gagal menyimpan data');
  }
});

app.get('/api/readings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sensor_readings ORDER BY created_at DESC',
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json('gagal mangambil data data');
  }
});

// (C) DELETE /api/readings/:id — hapus data berdasarkan id
app.delete('/api/readings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sensor_readings WHERE id = $1 RETURNING *',
      [id],
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('gagal menghapus data');
  }
});

app.put('/api/readings/:id', async (req, res) => {
  try {
    const { sensor, value } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE sensor_readings SET sensor = $1, value = $2 WHERE id = $3 RETURNING *',
      [sensor, value, id],
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('gagagl update');
  }
});
app.get('/api/readings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sensor_readings WHERE id = $1 ',
      [id],
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json('data tidak ditemukan');
  }
});

const PORT = 5005;
app.listen(PORT, () => {
  console.log(`Server berjalan di :${PORT}`);
});

