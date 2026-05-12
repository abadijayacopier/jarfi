/**
 * Download MariaDB Portable untuk di-embed ke dalam installer
 * Jalankan: node scripts/download-mariadb.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MARIADB_VERSION = '10.11.11';
const MARIADB_URL = `https://archive.mariadb.org/mariadb-${MARIADB_VERSION}/winx64-packages/mariadb-${MARIADB_VERSION}-winx64.zip`;
const DEST_DIR = path.join(__dirname, '..', 'extraResources');
const ZIP_PATH = path.join(DEST_DIR, 'mariadb-portable.zip');
const EXTRACT_DIR = path.join(DEST_DIR, 'mariadb');

function followRedirects(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'JARFI-Installer/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`  ↳ Redirect ke: ${res.headers.location}`);
        return followRedirects(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      const file = fs.createWriteStream(destPath);

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        file.write(chunk);
        if (totalBytes > 0) {
          const pct = ((downloaded / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r  ⬇️  ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
        }
      });

      res.on('end', () => {
        file.end();
        console.log('\n  ✅ Download selesai.');
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  JARFI NOC — Download MariaDB Portable');
  console.log('═══════════════════════════════════════════════');

  // Cek apakah sudah ada
  if (fs.existsSync(EXTRACT_DIR) && fs.existsSync(path.join(EXTRACT_DIR, 'bin', 'mysqld.exe'))) {
    console.log('✅ MariaDB portable sudah tersedia, skip download.');
    return;
  }

  // Buat folder
  fs.mkdirSync(DEST_DIR, { recursive: true });

  // Cek apakah user sudah mendownload manual
  const localZipPath = path.join(DEST_DIR, `mariadb-${MARIADB_VERSION}-winx64.zip`);
  let zipToExtract = ZIP_PATH;

  if (fs.existsSync(localZipPath)) {
    console.log(`📦 Menemukan file ZIP lokal: ${localZipPath}`);
    zipToExtract = localZipPath;
  } else {
    // Download
    console.log(`📥 Downloading MariaDB ${MARIADB_VERSION} portable...`);
    console.log(`   URL: ${MARIADB_URL}`);
    await followRedirects(MARIADB_URL, ZIP_PATH);
  }

  // Extract menggunakan PowerShell
  console.log('📦 Extracting...');
  if (fs.existsSync(EXTRACT_DIR)) {
    fs.rmSync(EXTRACT_DIR, { recursive: true });
  }

  execSync(
    `powershell -Command "Expand-Archive -Path '${zipToExtract}' -DestinationPath '${DEST_DIR}' -Force"`,
    { stdio: 'inherit' }
  );

  // Rename extracted folder ke 'mariadb'
  const entries = fs.readdirSync(DEST_DIR).filter(
    e => e.startsWith('mariadb-') && fs.statSync(path.join(DEST_DIR, e)).isDirectory()
  );
  if (entries.length > 0) {
    fs.renameSync(path.join(DEST_DIR, entries[0]), EXTRACT_DIR);
    console.log(`  ✅ Renamed ${entries[0]} → mariadb`);
  }

  // Hapus ZIP
  if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
    console.log('  🗑️ ZIP file dihapus.');
  }

  console.log('');
  console.log('✅ MariaDB portable siap di: extraResources/mariadb/');
}

main().catch((err) => {
  console.error('❌ Gagal:', err.message);
  process.exit(1);
});
