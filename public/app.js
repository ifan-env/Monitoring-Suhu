// app.js - Dashboard: ambil data dari REST API dan perbarui tampilan

// created_at dari PostgreSQL dikirim server sebagai string ISO,
// jadi bisa langsung dibaca Date. Format "YYYY-MM-DD HH:MM:SS"
// (tanpa zona waktu) dibaca sebagai UTC dengan tambahan "Z".
function parseWaktu(created_at) {
  if (typeof created_at === "string" && created_at.includes(" ") && !created_at.includes("T")) {
    return new Date(created_at.replace(" ", "T") + "Z");
  }
  return new Date(created_at);
}

function formatWaktu(created_at) {
  return parseWaktu(created_at).toLocaleString("id-ID");
}

let grafik = null;

function perbaruiGrafik(readings) {
  // readings datang terbaru -> terlama; balik agar grafik kronologis
  const urut = [...readings].reverse();
  const label = urut.map((r) =>
    parseWaktu(r.created_at).toLocaleTimeString("id-ID")
  );
  const dataSuhu = urut.map((r) => r.suhu);
  const dataKelembapan = urut.map((r) => r.kelembapan);

  if (grafik === null) {
    const ctx = document.getElementById("grafik-sensor");
    grafik = new Chart(ctx, {
      type: "line",
      data: {
        labels: label,
        datasets: [
          {
            label: "Suhu (°C)",
            data: dataSuhu,
            borderColor: "#dc2626",
            backgroundColor: "rgba(220, 38, 38, 0.12)",
            tension: 0.3,
          },
          {
            label: "Kelembapan (%)",
            data: dataKelembapan,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        animation: false,
        scales: { y: { beginAtZero: false } },
      },
    });
  } else {
    grafik.data.labels = label;
    grafik.data.datasets[0].data = dataSuhu;
    grafik.data.datasets[1].data = dataKelembapan;
    grafik.update();
  }
}

async function muatData() {
  try {
    const [resLatest, resRiwayat, resStats] = await Promise.all([
      fetch("/api/readings/latest"),
      fetch("/api/readings?limit=20"),
      fetch("/api/stats"),
    ]);

    const riwayat = await resRiwayat.json();
    const stats = await resStats.json();

    // Statistik (bentuk respon /api/stats: { total_data, suhu: {...}, kelembapan: {...} })
    document.getElementById("stat-avg-suhu").textContent =
      stats.suhu.rata_rata ?? "-";
    document.getElementById("stat-minmax-suhu").textContent =
      stats.suhu.minimum === null
        ? "-"
        : `${stats.suhu.minimum} / ${stats.suhu.maksimum}`;
    document.getElementById("stat-avg-kelembapan").textContent =
      stats.kelembapan.rata_rata ?? "-";
    document.getElementById("stat-minmax-kelembapan").textContent =
      stats.kelembapan.minimum === null
        ? "-"
        : `${stats.kelembapan.minimum} / ${stats.kelembapan.maksimum}`;
    document.getElementById("stat-total").textContent = stats.total_data;

    // Grafik 20 data terakhir
    perbaruiGrafik(riwayat);

    // Tabel riwayat 10 data terakhir
    const tbody = document.getElementById("tabel-riwayat");
    tbody.innerHTML = "";
    riwayat.slice(0, 10).forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatWaktu(r.created_at)}</td>
        <td>${r.device_id}</td>
        <td>${r.suhu}</td>
        <td>${r.kelembapan}</td>`;
      tbody.appendChild(tr);
    });
    if (riwayat.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Belum ada data</td></tr>';
    }

    // Kartu nilai + status perangkat dari data terbaru
    const badge = document.getElementById("badge-status");
    const latest = await resLatest.json();
    if (latest) {
      document.getElementById("suhu-terkini").textContent = latest.suhu;
      document.getElementById("kelembapan-terkini").textContent =
        latest.kelembapan;
      document.getElementById("waktu-update").textContent =
        "Pembaruan terakhir: " + formatWaktu(latest.created_at);

      // Kartu suhu: merah + "Panas" jika > 35 °C, hijau "Normal" jika tidak
      const kartuSuhu = document.getElementById("kartu-suhu");
      const statusSuhu = document.getElementById("status-suhu");
      if (latest.suhu > 35) {
        kartuSuhu.classList.add("panas");
        kartuSuhu.classList.remove("normal");
        statusSuhu.textContent = "Panas";
      } else {
        kartuSuhu.classList.add("normal");
        kartuSuhu.classList.remove("panas");
        statusSuhu.textContent = "Normal";
      }

      // Status perangkat: Online jika data terakhir < 30 detik
      const umurData = Date.now() - parseWaktu(latest.created_at).getTime();
      if (umurData < 30000) {
        badge.textContent = "Online";
        badge.classList.add("online");
        badge.classList.remove("offline");
      } else {
        badge.textContent = "Offline";
        badge.classList.add("offline");
        badge.classList.remove("online");
      }
    } else {
      badge.textContent = "Offline";
      badge.classList.add("offline");
      badge.classList.remove("online");
    }
  } catch (error) {
    console.error("Gagal memuat data:", error);
  }
}

// Ambil data pertama kali, lalu perbarui otomatis setiap 5 detik (polling)
muatData();
setInterval(muatData, 5000);
