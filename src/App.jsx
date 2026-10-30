import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css'; // Opsional jika ada style tambahan

// Registrasi komponen Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [latest, setLatest] = useState({ suhu: 0, kelembapan: 0, created_at: null });
  const [stats, setStats] = useState({ avg_suhu: 0, min_suhu: 0, max_suhu: 0, avg_kelembapan: 0 });
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Latest
      const resLatest = await fetch('http://localhost:3000/api/readings/latest');
      const dataLatest = await resLatest.json();
      setLatest(dataLatest);

      // Cek status online (< 30 detik terakhir)
      if (dataLatest.created_at) {
        const lastTime = new Date(dataLatest.created_at);
        const diffSeconds = (new Date() - lastTime) / 1000;
        setIsOnline(diffSeconds < 30);
      }

      // 2. Fetch Stats
      const resStats = await fetch('http://localhost:3000/api/stats');
      const dataStats = await resStats.json();
      setStats(dataStats);

      // 3. Fetch History (20 data)
      const resHistory = await fetch('http://localhost:3000/api/readings?limit=20');
      const dataHistory = await resHistory.json();
      setHistory(dataHistory);

    } catch (err) {
      console.error('Gagal mengambil data:', err);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poling tiap 5 detik
    return () => clearInterval(interval);
  }, []);

  // Konfigurasi Data Grafik Chart.js
  const reversedData = [...history].reverse();
  const chartData = {
    labels: reversedData.map(d => new Date(d.created_at).toLocaleTimeString()),
    datasets: [
      {
        label: 'Suhu (°C)',
        data: reversedData.map(d => d.suhu),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Kelembapan (%)',
        data: reversedData.map(d => d.kelembapan),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const isHot = latest.suhu > 35;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h1>🌿 IoT Greenhouse Monitoring</h1>
        <span style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
          color: isOnline ? '#155724' : '#721c24'
        }}>
          Status: {isOnline ? 'Online' : 'Offline'}
        </span>
      </header>

      {/* Kartu Nilai */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: isHot ? '#ffebee' : '#e8f5e9',
          borderLeft: `5px solid ${isHot ? '#f44336' : '#4caf50'}`,
          padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ color: '#666', fontSize: '1.1rem', marginBottom: '10px' }}>🌡️ Suhu Terkini</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>{latest.suhu} °C</div>
          <div style={{ fontSize: '0.9rem', color: '#555' }}>{isHot ? '🔥 Status: Panas (>35°C)' : '✅ Status: Normal'}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#666', fontSize: '1.1rem', marginBottom: '10px' }}>💧 Kelembapan Terkini</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>{latest.kelembapan} %</div>
          <div style={{ fontSize: '0.9rem', color: '#555' }}>Status Normal</div>
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.9rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>Rata-rata Suhu: <strong>{stats.avg_suhu}</strong> °C</div>
        <div>Min / Max Suhu: <strong>{stats.min_suhu} / {stats.max_suhu}</strong> °C</div>
        <div>Rata-rata Kelembapan: <strong>{stats.avg_kelembapan}</strong> %</div>
        <div>Update Terakhir: <strong>{latest.created_at ? new Date(latest.created_at).toLocaleTimeString() : '--'}</strong></div>
      </div>

      {/* Grafik */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <Line data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Grafik Riwayat 20 Data Terakhir' } } }} />
      </div>

      {/* Tabel Riwayat */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h3>📋 Riwayat 10 Data Terakhir</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Perangkat</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Suhu (°C)</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Kelembapan (%)</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 10).map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{item.id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{item.device_id}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{item.suhu}°C</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{item.kelembapan}%</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{new Date(item.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px' }}>Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;