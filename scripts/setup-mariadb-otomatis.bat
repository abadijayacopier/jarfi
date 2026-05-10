@echo off
setlocal enabledelayedexpansion

echo =========================================
echo 🚀 DUNIA WIFI - DATABASE AUTO SETUP
echo =========================================

:: 1. Cek apakah MariaDB sudah terinstal (cek service)
sc query MySQL > nul
if %errorlevel% equ 0 (
    echo [OK] MariaDB/MySQL sudah terdeteksi.
) else (
    echo [!] MariaDB tidak ditemukan. Memulai download...
    :: Link download MariaDB MSI (Win x64)
    set "MSI_URL=https://archive.mariadb.org/mariadb-10.11.2/winx64-packages/mariadb-10.11.2-winx64.msi"
    set "MSI_FILE=%TEMP%\mariadb_setup.msi"
    
    powershell -Command "Invoke-WebRequest -Uri !MSI_URL! -OutFile !MSI_FILE!"
    
    echo [!] Menginstall MariaDB secara otomatis...
    :: Install diam-diam (Silent) dengan password root 'admin'
    msiexec /i "!MSI_FILE!" /qn SERVICENAME=MySQL PASSWORD=admin
    
    echo [OK] Instalasi selesai. Menunggu service berjalan...
    timeout /t 10
)

:: 2. Buat Database dan Import Schema
echo [!] Menyiapkan database jarfi_db...
set "MYSQL_BIN=C:\Program Files\MariaDB 10.11\bin\mysql.exe"
if not exist "!MYSQL_BIN!" set "MYSQL_BIN=mysql"

!MYSQL_BIN! -u root -padmin -e "CREATE DATABASE IF NOT EXISTS jarfi_db;"
if %errorlevel% neq 0 (
    echo [!] Gagal akses MySQL. Mencoba tanpa password...
    !MYSQL_BIN! -u root -e "CREATE DATABASE IF NOT EXISTS jarfi_db;"
)

echo [!] Mengimport data schema.sql...
!MYSQL_BIN! -u root -padmin jarfi_db < schema.sql
if %errorlevel% neq 0 (
    !MYSQL_BIN! -u root jarfi_db < schema.sql
)

echo =========================================
echo ✅ DATABASE SIAP DIGUNAKAN!
echo =========================================
pause
