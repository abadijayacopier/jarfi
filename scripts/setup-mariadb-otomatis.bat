@echo off
setlocal enabledelayedexpansion

echo =========================================
echo 🚀 JARFI NOC - DATABASE AUTO SETUP
echo =========================================

:: 1. Cek apakah MariaDB sudah terinstal
sc query MySQL > nul
if %errorlevel% equ 0 (
    echo [OK] MariaDB sudah terdeteksi.
) else (
    echo [!] MariaDB tidak ditemukan. Mencari installer lokal...
    set "MSI_FILE=%~dp0mariadb_setup.msi"
    
    if exist "!MSI_FILE!" (
        echo [!] Menginstall MariaDB dari file lokal...
        msiexec /i "!MSI_FILE!" /qn SERVICENAME=MySQL PASSWORD=admin
        echo [OK] Instalasi selesai. Menunggu service...
        timeout /t 15
    ) else (
        echo [!] Installer lokal tidak ditemukan. Mencoba download...
        set "MSI_URL=https://archive.mariadb.org/mariadb-10.11.2/winx64-packages/mariadb-10.11.2-winx64.msi"
        set "TEMP_MSI=%TEMP%\mariadb_setup.msi"
        powershell -Command "Invoke-WebRequest -Uri !MSI_URL! -OutFile !TEMP_MSI!"
        msiexec /i "!TEMP_MSI!" /qn SERVICENAME=MySQL PASSWORD=admin
        timeout /t 15
    )
)

:: 2. Pastikan service MySQL jalan
net start MySQL > nul 2>&1

:: 3. Buat Database dan Import Schema
echo [!] Menyiapkan database jarfi_db...
set "MYSQL_BIN=C:\Program Files\MariaDB 10.11\bin\mysql.exe"
if not exist "!MYSQL_BIN!" set "MYSQL_BIN=mysql"

!MYSQL_BIN! -u root -padmin -e "CREATE DATABASE IF NOT EXISTS jarfi_db;"
echo [!] Mengimport data schema.sql...
!MYSQL_BIN! -u root -padmin jarfi_db < "%~dp0..\schema.sql"

echo =========================================
echo ✅ JARFI NOC SIAP DIGUNAKAN!
echo =========================================
