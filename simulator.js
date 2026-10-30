// simulator.js -> jalankan: node simulator.js
const URL = 'http://localhost:3000/api/readings';

setInterval(async () => {
  const data = {
    device_id: 'GH-01',
    suhu: +(25 + Math.random() * 12).toFixed(1),
    kelembapan: +(60 + Math.random() * 25).toFixed(1)
  };

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const hasil = await res.json();
    console.log(`[${res.status}]`, 'Kirim:', data, '->', hasil);
  } catch (err) {
    console.error('Gagal kirim (server mati?):', err.message);
  }
}, 5000);