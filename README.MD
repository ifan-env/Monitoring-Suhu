# Monitoring Suhu — Web Monitoring IoT Full Stack

Sistem monitoring suhu dan kelembapan greenhouse secara real-time. Data sensor (dari simulator atau ESP32 + DHT22 di Wokwi) dikirim lewat HTTP POST ke backend Express, disimpan di database SQLite, lalu ditampilkan di dashboard web: kartu nilai terkini, statistik, grafik garis 20 data terakhir, dan tabel riwayat 10 data terakhir. Dashboard memperbarui data otomatis tiap 5 detik dan menampilkan status perangkat **Online** bila data terakhir masuk kurang dari 30 detik yang lalu.

Tugas Praktikum WS Sistem Tertanam — Membangun Web Monitoring IoT Full Stack Dev.
Program Studi Teknik Informatika, Jurusan Teknologi Informasi, Politeknik Negeri Jember.
Dosen pengampu: Mochammad Rifki Uli Albaab.

## Anggota Kelompok

| Nama | NIM |
|---|---|
| Achmad Ifan Dwi Septian | E41241494 |
| Sheva Carvey Adi Reswara | E41241610 |
| M. Alhafidzul Fikri | E41241554 |
| Heti Nur Riskiyaningsih | E41241615 |

## Teknologi

| Bagian | Teknologi |
|---|---|
| Backend | Node.js + Express 5 |
| Database | SQLite (better-sqlite3), file `data.db` dibuat otomatis |
| Frontend | HTML + CSS + JavaScript vanilla, Chart.js 4.4.1 (CDN) |
| Simulator | Node.js (`fetch`), kirim data acak tiap 5 detik |
| Perangkat (opsional) | ESP32 + DHT22 di Wokwi, POST lewat tunnel ngrok |

## Struktur Proyek

```
Monitoring-Suhu/
├── server.js        REST API (4 endpoint) + menyajikan dashboard dari public/
├── db.js            Koneksi SQLite + membuat tabel readings otomatis
├── simulator.js     Pengirim data sensor simulasi tiap 5 detik
├── package.json     Dependensi: express, better-sqlite3
├── public/
│   ├── index.html   Dashboard monitoring
│   ├── style.css
│   └── app.js       Polling 5 detik, grafik Chart.js, tabel riwayat
├── src/             Dashboard React (pekerjaan anggota kelompok, versi alternatif)
└── screenshots/     Tangkapan layar dashboard dan uji POST
```

## Database

Tidak ada instalasi server database. Saat `server.js` pertama kali dijalankan, `db.js` membuat file `data.db` dan tabel `readings` secara otomatis:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Nomor urut otomatis |
| `device_id` | TEXT | Identitas perangkat, contoh `GH-01` |
| `suhu` | REAL | Suhu dalam °C |
| `kelembapan` | REAL | Kelembapan relatif dalam % |
| `created_at` | TEXT DEFAULT CURRENT_TIMESTAMP | Waktu data masuk (UTC) |

File `data.db` tidak ikut disimpan di repo (`*.db` di `.gitignore`); untuk mengulang dari kosong, hapus `data.db` lalu jalankan server lagi.

## Cara Menjalankan

Syarat: Node.js 20 (atau lebih baru) dan npm.

1. Clone repo ini, lalu masuk ke foldernya:

```
git clone https://github.com/ifan-env/Monitoring-Suhu.git
cd Monitoring-Suhu
```

2. Install dependensi (satu kali saja):

```
npm install
```

3. Jalankan server (terminal 1, biarkan menyala):

```
node server.js
```

Muncul `Tabel readings siap` dan `Server berjalan di http://localhost:3000`.

4. Jalankan simulator (terminal 2):

```
node simulator.js
```

Simulator mengirim data suhu/kelembapan acak perangkat `GH-01` tiap 5 detik. Pastikan alamat di `simulator.js` menunjuk ke server yang sedang berjalan (`http://localhost:3000/api/readings` untuk server lokal).

5. Buka dashboard di browser:

```
http://localhost:3000
```

## Endpoint API

Base URL: `http://localhost:3000`

| Method | Endpoint | Keterangan | Respons sukses |
|---|---|---|---|
| POST | `/api/readings` | Menyimpan satu data sensor | `201` + data yang tersimpan |
| GET | `/api/readings/latest` | Data sensor paling baru | `200` + satu data (atau `null` bila kosong) |
| GET | `/api/readings?limit=20` | Riwayat data terakhir (bawaan 20, maks 100) | `200` + array data |
| GET | `/api/stats` | Total data + rata-rata/min/maks suhu dan kelembapan | `200` + objek statistik |

### Contoh POST

Request:

```json
{
  "device_id": "GH-01",
  "suhu": 29.4,
  "kelembapan": 71.2
}
```

Respons `201`:

```json
{
  "id": 1,
  "device_id": "GH-01",
  "suhu": 29.4,
  "kelembapan": 71.2,
  "created_at": "2026-10-30 08:00:00"
}
```

### Validasi

Data yang tidak lolos validasi ditolak dengan `400` dan pesan error JSON:

| Aturan | Pesan error |
|---|---|
| `suhu` / `kelembapan` bukan angka | `suhu dan kelembapan harus berupa angka` |
| `suhu` di luar −40 s.d. 80 °C | `suhu harus di antara -40 s.d. 80 derajat C` |
| `kelembapan` di luar 0 s.d. 100 % | `kelembapan harus di antara 0 s.d. 100 persen` |

### Contoh respons GET /api/stats

```json
{
  "total_data": 12,
  "suhu": { "rata_rata": 28.5, "minimum": 25.1, "maksimum": 33.0 },
  "kelembapan": { "rata_rata": 66.4, "minimum": 60.0, "maksimum": 78.9 }
}
```

## Dashboard

Dashboard di folder `public/` disajikan langsung oleh server di alamat `/`:

- Kartu suhu dan kelembapan terkini; kartu suhu berubah merah bertuliskan **Panas** bila suhu > 35 °C
- Kartu statistik (rata-rata dan min/maks dari semua data)
- Grafik garis 20 data terakhir (Chart.js)
- Tabel riwayat 10 data terakhir
- Status perangkat: **Online** bila data terakhir berumur < 30 detik, selain itu **Offline**
- Data diperbarui otomatis tiap 5 detik (polling)

## Pengirim Data dari ESP32 (Wokwi) — Opsional

Selain simulator, data juga bisa dikirim dari simulasi ESP32 + DHT22 (pin data GPIO 15) di Wokwi:

1. Jalankan server lokal dan buka tunnel: `ngrok http 3000`
2. Di sketch Wokwi, isi `SERVER_URL` dengan URL ngrok + `/api/readings`
3. Tambahkan header `ngrok-skip-browser-warning: true` agar POST tidak berhenti di halaman peringatan ngrok
4. Sketch membaca DHT22 dan POST JSON `{device_id, suhu, kelembapan}` tiap 5 detik; respons yang benar adalah `201` dan data muncul di dashboard

## Screenshot

| Dashboard | Uji POST |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Uji POST](screenshots/uji-post.png) |
