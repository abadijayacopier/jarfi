# JARFI - ISP Management System 🚀

**JARFI** adalah sistem manajemen ISP (Internet Service Provider) modern yang dirancang untuk memudahkan administrasi pelanggan PPPoE, pemantauan jaringan real-time, dan otomatisasi billing yang terintegrasi langsung dengan RouterOS Mikrotik.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue?style=for-the-badge&logo=tailwind-css)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=for-the-badge&logo=mysql)
![Mikrotik](https://img.shields.io/badge/Mikrotik-RouterOS-red?style=for-the-badge&logo=mikrotik)

---

## ✨ Fitur Unggulan

### 📊 1. Dashboard Monitoring Real-Time
*   Pantau penggunaan CPU, Uptime, dan jumlah sesi aktif dari seluruh router Anda secara live.
*   Statistik pendapatan dan jumlah pelanggan dalam tampilan visual yang elegan.

### 👥 2. Manajemen Pelanggan (PPPoE)
*   Sinkronisasi otomatis data *Secret* dari Mikrotik ke database lokal.
*   Registrasi pelanggan baru dengan geolokasi (Latitude/Longitude).
*   Monitor trafik (Upload/Download) pelanggan secara real-time.
*   Fitur **Isolir** satu klik untuk memutus koneksi pelanggan yang menunggak.

### 🤖 3. Automation Hub (Auto-Isolir & WA)
*   **Auto-Billing:** Membuat tagihan otomatis setiap bulan sesuai tanggal jatuh tempo.
*   **Auto-Isolir:** Otomatis memutus koneksi pelanggan yang belum bayar lewat dari jatuh tempo.
*   **WhatsApp Notification:** Mengirim pesan pengingat tagihan dan isolir otomatis via WA API.

### 🗺️ 4. Network Map (ODP)
*   Visualisasi sebaran titik ODP (Optical Distribution Point) di peta.
*   Pemetaan lokasi rumah pelanggan berbasis koordinat geografis.
*   Manajemen port ODP (memantau port yang terpakai vs kapasitas total).

### 🛠️ 5. Maintenance & Tools
*   **Backup & Restore:** Amankan seluruh data database ke file `.json` dengan satu klik.
*   **Export Data:** Unduh daftar pelanggan ke format CSV/Excel untuk kebutuhan pelaporan.

---

## 🛠️ Teknologi yang Digunakan

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Glassmorphism Design)
- **Database:** MySQL
- **Icons:** Lucide React
- **Maps:** Leaflet & React Leaflet
- **Alerts:** SweetAlert2
- **Mikrotik API:** RouterOS Client for Node.js

---

## 🚀 Cara Instalasi

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/abadijayacopier/jarfi.git
    cd jarfi
    ```

2.  **Instal Dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Database:**
    *   Buat database MySQL baru bernama `jarfi_db`.
    *   Update kredensial database di `src/lib/db.ts`.

4.  **Jalankan Aplikasi:**
    ```bash
    npm run dev
    ```

5.  **Akses Dashboard:**
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📸 Tampilan Aplikasi

> *Segera hadir: Cuplikan layar dashboard JARFI.*

---

## 📝 Lisensi

Proyek ini dikembangkan untuk kebutuhan internal manajemen ISP. Seluruh hak cipta dilindungi.

---

**Developed with ❤️ by JARFI Dev Team**
