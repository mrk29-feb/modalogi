# Modalogi

*Clear plans, clearer numbers.*

Dashboard statis untuk menyusun **rencana keuangan** dan **kanvas model bisnis** usaha syariah maupun konvensional. Seluruh hitungan berjalan di peramban. Tidak ada akun, server, atau pengiriman data.

© 2026 mrk29. Kerangka KUBAH dan Kalender Berkah © mrk29.

## Fitur

- **Rencana keuangan** lima langkah (Profil, Produk dan biaya, Modal dan pembiayaan, Asumsi, Hasil), langkah boleh dilewati.
- **Kelompok usaha**: Jasa, Produksi, Dagang, Peternakan dan budidaya, Pertanian, dan Usaha campuran. Tiap kelompok punya beberapa usaha spesifik dengan komponen biaya contoh (angka hanya ilustrasi), atau Lainnya (mulai kosong). Semua komponen bisa dihapus, diganti, dan ditambah. Biaya lain bisa ditambah manual.
- **Hasil**: titik impas, laba rugi dan arus kas 12 bulan, kelayakan (ROI, balik modal, NPV pada tiga diskonto, indeks profitabilitas, IRR), sensitivitas dan skenario, pembiayaan (angsuran, DSCR, akad bagi hasil).
- **Skema syariah**: akad (dikelola langsung, mudharabah, musyarakah), nisbah, wakaf, murabahah, ijarah, dan **Kalender Berkah**. Tampilan memakai pola bintang geometris. Skema konvensional memakai pinjaman anuitas atau flat dan pola titik.
- **Kanvas**: BMC Syariah (KUBAH, 14 kotak), BMC konvensional, dan Lean Canvas, dengan tombol **Ambil angka** dari rencana keuangan.
- **Excel**: unduh template yang bentuknya menyesuaikan usaha dan jumlah produk (rumus terkunci tanpa kata sandi, baris cadangan), unggah kembali untuk dianalisis, dan unduh laporan Excel.
- **PDF**: laporan hasil dan kanvas.
- Semua berkas Excel dan PDF memuat atribusi **mrk29** dan **Modalogi** di metadata dan di dalam berkas.

## Cara memasang di GitHub Pages

1. Buat repositori, misalnya `modalogi`, lalu unggah **seluruh isi folder ini** (termasuk `.nojekyll`).
2. Buka **Settings, Pages**. Pada *Build and deployment*, pilih *Deploy from a branch*, cabang `main`, folder `/ (root)`.
3. Tunggu beberapa menit. Alamatnya `https://<akun>.github.io/modalogi/`.

Tidak ada langkah build. `index.html` sudah mandiri. Pustaka Excel dan PDF ada di `vendor/` dan hanya dimuat saat pengguna mengunduh atau mengunggah berkas. Satu-satunya sumber daya luar adalah huruf dari Google Fonts.

## Isi repositori

| Berkas | Fungsi |
|---|---|
| `index.html` | Aplikasi (CSS dan JavaScript tertanam) |
| `vendor/` | ExcelJS, jsPDF, jsPDF-AutoTable (lisensi MIT) |
| `assets/` | Logo, favicon, ikon |
| `manifest.webmanifest` | Metadata pemasangan sebagai aplikasi |
| `src/` | Kode sumber per modul (mesin hitung, contoh usaha, antarmuka, Excel, PDF) untuk dibaca atau dikembangkan |

## Cara kerja singkat

- **Mesin hitung** (`src/engine.js`) mengikuti template KEUANGAN.xlsx: biaya per satuan (A bahan, B tenaga kerja, C kemasan, D lain), titik impas, laba rugi 12 bulan dengan eskalasi, arus kas, akad, pembiayaan, kelayakan, dan sensitivitas. Telah dibandingkan dengan Excel pada 1.169 pemeriksaan.
- **Parameter standar** per Okt 2026: inflasi umum 3,3% dan pangan 4,2%, PPh final UMKM 0,5% atas penjualan, kas minimum dua bulan biaya tetap, amortisasi izin 24 bulan. Semua bisa diubah di langkah Asumsi.
- **Unggah Excel** membaca isian lewat nama rentang dan lembar `_meta` tersembunyi (versi skema 1). Jangan mengubah nama lembar atau menghapus lembar.

## Batasan

Alat edukasi dan simulasi, bukan nasihat keuangan. Model mengandaikan pendapatan berulang tiap bulan atau tiap siklus pendek, sehingga kurang cocok untuk usaha proyek tunggal, tanaman keras yang baru menghasilkan setelah bertahun-tahun, dan properti sewa jangka panjang. Penentuan kehalalan dan kesesuaian akad perlu diverifikasi kepada pihak yang berwenang. Atribusi di metadata berkas dapat dibuat sulit dihapus, tetapi tidak mustahil dihilangkan oleh pihak yang sengaja menyuntingnya.

## Proyek terkait

[Lampu Pindar](https://mrk29-feb.github.io/lampu-pindar/) dan [NALAR](https://mrk29-feb.github.io/nalar/).
