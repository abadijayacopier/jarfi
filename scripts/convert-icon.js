const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convert() {
    try {
        const logoPng = 'jarfi_logo_1778350215847.png';
        const pngPath = path.join(__dirname, '../public', logoPng);
        const icoPath = path.join(__dirname, '../public/icon.ico');

        console.log(`🚀 Mengkonversi ${logoPng} ke format Windows ICO yang valid...`);

        // Gunakan sharp untuk memastikan ukuran 256x256 dan format PNG
        const pngBuffer = await sharp(pngPath)
            .resize(256, 256)
            .png()
            .toBuffer();

        // Membuat header ICO manual (22 byte)
        // Format ICO: 6 byte header + 16 byte directory entry per image
        const header = Buffer.alloc(22);
        
        // --- ICO Header ---
        header.writeUInt16LE(0, 0);     // Reserved (selalu 0)
        header.writeUInt16LE(1, 2);     // Type (1 = Icon, 2 = Cursor)
        header.writeUInt16LE(1, 4);     // Count (jumlah image dalam container)

        // --- Directory Entry ---
        header.writeUInt8(0, 6);        // Width (0 berarti 256px)
        header.writeUInt8(0, 7);        // Height (0 berarti 256px)
        header.writeUInt8(0, 8);        // Color palette (0 jika tidak menggunakan palette)
        header.writeUInt8(0, 9);        // Reserved (selalu 0)
        header.writeUInt16LE(1, 10);    // Color planes (biasanya 1)
        header.writeUInt16LE(32, 12);   // Bits per pixel (32-bit untuk PNG support)
        header.writeUInt32LE(pngBuffer.length, 14); // Ukuran data image
        header.writeUInt32LE(22, 18);   // Offset data (setelah header ini)

        // Gabungkan header dan data PNG
        const icoBuffer = Buffer.concat([header, pngBuffer]);
        
        fs.writeFileSync(icoPath, icoBuffer);

        console.log('✅ Berhasil: icon.ico sekarang adalah format Windows ICO yang valid.');
    } catch (e) {
        console.error('❌ Gagal membuat icon:', e.message);
    }
}

convert();
