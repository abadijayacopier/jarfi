# 📘 JARFI NOC — Panduan Instalasi

> **JARFI NOC** adalah aplikasi Network Operation Center (NOC) untuk manajemen ISP.
> Installer ini sudah mencakup semua yang dibutuhkan — **tidak perlu install software tambahan**.

---

## 📋 Persyaratan Minimum

| Komponen | Kebutuhan |
|----------|-----------|
| **OS** | Windows 10 / 11 (64-bit) |
| **RAM** | Minimal 4 GB (8 GB direkomendasikan) |
| **Disk** | ± 600 MB ruang kosong |
| **Port** | 3000 (Web Server) dan 3306 (Database) harus tersedia |
| **Hak Akses** | Administrator (untuk install service database) |

---

## 🚀 Langkah Instalasi

### 1. Jalankan Installer

Double-click file:

```
JARFI NOC Setup 4.1.0.exe
```

> ⚠️ Jika muncul peringatan Windows SmartScreen, klik **"More info"** → **"Run anyway"**.

### 2. Pilih Lokasi Instalasi

Pilih folder tujuan atau gunakan default:

```
C:\Program Files\JARFI NOC
```

Klik **"Install"** dan tunggu proses selesai.

### 3. Setup Otomatis

Installer akan secara otomatis:

- ✅ Menginstall MariaDB Database Engine (embedded)
- ✅ Membuat database `jarfi_db`
- ✅ Mengimport semua tabel (Users, Routers, Packages, Customers, Invoices)
- ✅ Membuat akun Super Admin default

### 4. Selesai!

Klik **"Finish"** — aplikasi akan terbuka otomatis.

---

## 🖥️ Cara Menggunakan

### Pertama Kali Buka

1. Buka **JARFI NOC** dari Desktop shortcut atau Start Menu
2. Launcher window akan muncul menampilkan status **Database** dan **Server**
3. Klik tombol **⚡ START ALL SERVICES**
4. Tunggu hingga kedua status menjadi **🟢 ONLINE**
5. Klik **🚀 BUKA DASHBOARD**

### Login

Gunakan akun Super Admin default:

| Field | Nilai |
|-------|-------|
| **Email** | `admin@jarfi.com` |
| **Password** | `admin123` |

> ⚠️ **PENTING:** Segera ganti password setelah login pertama!

---

## 🌐 Akses dari Komputer Lain (Jaringan Lokal)

Jika ingin mengakses dashboard dari komputer lain dalam jaringan yang sama:

1. Cari IP address komputer server:
   ```
   ipconfig
   ```
2. Akses dari browser komputer lain:
   ```
   http://[IP-ADDRESS]:3000
   ```
   Contoh: `http://192.168.1.100:3000`

3. Pastikan **Windows Firewall** mengizinkan port **3000**.

---

## 🔧 Pengaturan Lanjutan

### Mengubah URL Dashboard

1. Buka Launcher
2. Klik ikon ⚙️ di pojok kanan atas
3. Masukkan URL baru (contoh: `http://192.168.1.100:3000`)
4. Klik **BUKA DASHBOARD**

### Lokasi File Penting

| File | Lokasi |
|------|--------|
| **Log Aplikasi** | `%APPDATA%\jarfi-noc\jarfi.log` |
| **Konfigurasi** | `%APPDATA%\jarfi-noc\config.json` |
| **Database** | `[Install Dir]\resources\mariadb\data\` |

### Koneksi Database Manual

Jika perlu akses database langsung:

| Parameter | Nilai |
|-----------|-------|
| Host | `localhost` |
| Port | `3306` |
| Username | `root` |
| Password | `admin` |
| Database | `jarfi_db` |

---

## ❓ Troubleshooting

### Database Tidak Bisa Start

**Gejala:** Status Database menunjukkan OFFLINE.

**Solusi:**
1. Pastikan port **3306** tidak digunakan aplikasi lain (XAMPP, WAMP, MySQL lain)
2. Buka **Services** (`services.msc`) → cek apakah service **MySQL** ada dan running
3. Jika ada MySQL lain, stop terlebih dahulu, lalu restart JARFI NOC

### Server Tidak Bisa Start

**Gejala:** Status Server menunjukkan OFFLINE setelah klik START.

**Solusi:**
1. Pastikan port **3000** tidak digunakan aplikasi lain
2. Cek log di: `%APPDATA%\jarfi-noc\jarfi.log`
3. Restart aplikasi

### Windows SmartScreen Memblokir

**Solusi:** Klik **"More info"** → **"Run anyway"**. Ini normal untuk aplikasi yang belum memiliki sertifikat digital.

### Lupa Password Admin

**Solusi:** Akses database langsung dan reset:

```sql
USE jarfi_db;
UPDATE Users SET password = '$2a$10$...' WHERE email = 'admin@jarfi.com';
```

Atau hubungi developer untuk reset.

---

## 🗑️ Uninstall

1. Buka **Settings** → **Apps** → cari **JARFI NOC**
2. Klik **Uninstall**
3. Proses uninstall akan otomatis:
   - Menghentikan service MariaDB
   - Menghapus service dari Windows
   - Menghapus semua file aplikasi

> ⚠️ Data database akan ikut terhapus. Backup terlebih dahulu jika diperlukan.

---

## 📞 Kontak Support

| | |
|---|---|
| **Developer** | Supriyanto |
| **Email** | cs@jarfi.net |
| **Website** | jarfi.net |

---

<div align="center">

**JARFI NOC v4.1.0** — AI-Powered Network Operation Center

*© 2026 JARFI Industrial Network. All rights reserved.*

</div>
