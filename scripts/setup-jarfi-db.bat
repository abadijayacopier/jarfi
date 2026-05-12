@echo off
setlocal enabledelayedexpansion

echo =============================================
echo   JARFI NOC - DATABASE AUTO SETUP
echo   Embedded MariaDB Portable Edition
echo =============================================
echo.

set "INSTALL_DIR=%~dp0.."
set "MARIADB_DIR=%INSTALL_DIR%\mariadb"
set "MYSQL_BIN=%MARIADB_DIR%\bin\mysql.exe"
set "MYSQLD_BIN=%MARIADB_DIR%\bin\mysqld.exe"
set "DATA_DIR=%MARIADB_DIR%\data"
set "SCHEMA_FILE=%INSTALL_DIR%\schema.sql"

:: 1. Cek apakah MariaDB portable ada
if not exist "%MYSQLD_BIN%" (
    echo [ERROR] MariaDB portable tidak ditemukan di: %MARIADB_DIR%
    echo         Pastikan installer berjalan dengan benar.
    pause
    exit /b 1
)

echo [1/5] MariaDB ditemukan: %MYSQLD_BIN%

:: 2. Inisialisasi data directory jika belum ada
if not exist "%DATA_DIR%\mysql" (
    echo [2/5] Inisialisasi data directory...
    "%MYSQLD_BIN%" --initialize-insecure --datadir="%DATA_DIR%"
    if %errorlevel% neq 0 (
        echo [WARN] initialize-insecure gagal, mencoba mysql_install_db...
        "%MARIADB_DIR%\bin\mysql_install_db.exe" --datadir="%DATA_DIR%" --password=admin 2>nul
    )
    timeout /t 3 /nobreak >nul
) else (
    echo [2/5] Data directory sudah ada, skip init.
)

:: 3. Cek apakah service MySQL sudah ada (dari instalasi lain)
sc query MySQL >nul 2>&1
if %errorlevel% equ 0 (
    echo [3/5] Service MySQL sudah terdeteksi, menggunakan yang ada...
    net start MySQL >nul 2>&1
    goto :setup_db
)

:: Install sebagai service
echo [3/5] Mendaftarkan MariaDB sebagai Windows service...
"%MYSQLD_BIN%" --install MySQL --datadir="%DATA_DIR%" >nul 2>&1

:: Start service
echo [4/5] Menjalankan MariaDB service...
net start MySQL >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Service gagal start, mencoba mode langsung...
    start "" /B "%MYSQLD_BIN%" --datadir="%DATA_DIR%" --port=3306
    timeout /t 5 /nobreak >nul
)

:setup_db
echo [5/5] Menyiapkan database jarfi_db...

:: Set root password
"%MYSQL_BIN%" -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin';" 2>nul

:: Buat database dan import schema
"%MYSQL_BIN%" -u root -padmin -e "CREATE DATABASE IF NOT EXISTS jarfi_db;"
if exist "%SCHEMA_FILE%" (
    echo        Mengimport schema.sql...
    "%MYSQL_BIN%" -u root -padmin jarfi_db < "%SCHEMA_FILE%"
)

:: Seed admin user via Node.js jika tersedia
if exist "%INSTALL_DIR%\resources\app.asar" (
    echo        Admin seed akan dijalankan saat aplikasi pertama kali dibuka.
)

echo.
echo =============================================
echo   JARFI NOC DATABASE SIAP!
echo   User: root / Password: admin
echo   Database: jarfi_db
echo =============================================
