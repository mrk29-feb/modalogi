var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
var JENIS = [
  { id: 'jasa', label: 'Jasa', ikon: 'ti-tools', ket: 'Laundry, bengkel, salon, percetakan', satuanContoh: 'per layanan' },
  { id: 'produksi', label: 'Produksi', ikon: 'ti-building-factory-2', ket: 'Roti, konveksi, olahan pangan, kerajinan', satuanContoh: 'per buah' },
  { id: 'dagang', label: 'Dagang', ikon: 'ti-shopping-cart', ket: 'Kelontong, kedai, toko pakaian', satuanContoh: '' },
  { id: 'kuliner', label: 'Kuliner dan waralaba', ikon: 'ti-coffee', ket: 'Coffeeshop, minuman kekinian, ayam geprek, katering, waralaba', satuanContoh: 'per porsi' },
  { id: 'ternak', label: 'Peternakan dan budidaya', ikon: 'ti-fish', ket: 'Lele, ayam, kambing', satuanContoh: 'kg' },
  { id: 'tani', label: 'Pertanian', ikon: 'ti-plant-2', ket: 'Hidroponik, padi, sayuran', satuanContoh: 'kg' },
  { id: 'campuran', label: 'Usaha campuran', ikon: 'ti-layers', ket: 'Gabungan barang, jasa, dagang, siklus', satuanContoh: '' }
];
function tipeOf(U, p) { if (p && p.tipe) return p.tipe; var j = U.jenis; return j === 'dagang' ? 'omzet' : (j === 'ternak' || j === 'tani' ? 'batch' : 'unit'); }
var KB_PERIODE = ['1. Awal tahun ajaran', '2. Captive rutin', '3. Muharram', '4. Captive rutin', '5. Maulid Nabi', '6. Captive rutin', '7. Pra Ramadhan', '8. Ramadhan', '9. Idul Fitri', '10. Pasca lebaran', '11. Idul Adha', '12. Libur dan persiapan'];
var KB_DEF = ['Puncak Sedang', 'Puncak Terbesar', 'Puncak Besar', 'Puncak Terbesar', 'Puncak Besar', 'Puncak Terbesar', 'Puncak Besar', 'Puncak Sedang', 'Rawan Lesu', 'Puncak Sedang', 'Puncak Besar', 'Rawan Lesu'];
var LEVELS = ['Puncak Terbesar', 'Puncak Besar', 'Puncak Sedang', 'Baseline Harian', 'Rawan Lesu'];
var STATUS = ['Rintisan baru', 'Berjalan kurang dari 1 tahun', 'Berjalan 1 tahun atau lebih'];

function it(n, v, t) { var o = { nama: n, nilai: v }; if (t) o.tahap = t; return o; }
function fill12(x) { var a = []; for (var i = 0; i < 12; i++) a.push(x); return a; }

function baseU() {
  return {
    nama: '', jenis: 'jasa', preset: '', skema: 'konvensional', status: 'Berjalan 1 tahun atau lebih', pangan: false, bulanMulai: 0,
    produk: [],
    q: {
      sewa: { on: false, nilai: 0 }, karyawan: { on: false, nilai: 0 },
      listrik: { on: false, metode: 'A', porsiA: 100, ramaiTagihan: 0, ramaiVol: 0, sepiTagihan: 0, sepiVol: 0, daya: 0, jam: 8, hari: 26, tarif: 1445, tetapLain: 0 },
      marketplace: { on: false, pct: 0 }, kendaraan: { on: false, nilai: 0 }, legalitas: { on: false, nilai: 0 }, tempo: { on: false, porsiTunai: 100 }
    },
    biayaTetap: [], biayaLain: [], aset: [], pemasaranAwal: 0, ziswaf: 0, lainnya: 0,
    pembiayaan: { jenis: 'Tidak ada', lembaga: '', hargaBeli: 0, margin: 0, sewa: 0, pokok: 0, bunga: 12, tenor: 12 },
    akad: { jenis: 'Dikelola langsung', nisbahPemilik: 60, porsiModal: 70, wakaf: 0, frek: 'Tahunan' },
    musim: { mode: 'tanpa', periodeAwal: 1, tingkatKB: KB_DEF.slice(), tingkatSendiri: fill12('Baseline Harian') },
    ref: { inflasiUmum: 3.3, inflasiPangan: 4.2, pph: 0.5, dTinggi: 5, dSangatTinggi: 10, kasMinBulan: 2, amortBulan: 24 },
    kasAwal: 0, kejadian: []
  };
}
function unitProduk(o) {
  return Object.assign({ nama: '', satuan: 'unit', harga: 0, volume: 0, kapasitas: 0, tumbuh: 1, susutPct: 0, hppA: [it('', 0)], hppB: [it('', 0)], hppC: [it('', 0)], hppD: [] }, o);
}
function omzetProduk(o) { return Object.assign({ nama: '', omzet: 0, margin: 15, tumbuh: 0, hariStok: 14, susutPct: 0 }, o); }
function batchProduk(o) { return Object.assign({ nama: '', satuan: 'kg', harga: 0, siklus: 3, jumlah: 1, hasil: 0, matiPct: 5, biayaBatch: [] }, o); }

function mk(o) {
  var u = baseU();
  u.nama = o.nama; u.jenis = o.jenis; u.preset = o.id; u.skema = o.skema || 'konvensional'; u.pangan = !!o.pangan; u.status = o.status || 'Berjalan 1 tahun atau lebih';
  u.produk = o.produk; u.biayaTetap = o.tetap || []; u.aset = o.aset || []; u.pemasaranAwal = o.pemasaran || 0;
  if (o.sewa) u.q.sewa = { on: true, nilai: o.sewa };
  if (o.karyawan) u.q.karyawan = { on: true, nilai: o.karyawan };
  if (o.kendaraan) u.q.kendaraan = { on: true, nilai: o.kendaraan };
  if (o.legal) u.q.legalitas = { on: true, nilai: o.legal };
  if (o.market) u.q.marketplace = { on: true, pct: o.market };
  if (o.listrik) u.q.listrik = Object.assign(u.q.listrik, { on: true }, o.listrik);
  if (o.lain) u.biayaLain = o.lain;
  if (o.biaya) u.pembiayaan = Object.assign(u.pembiayaan, o.biaya);
  if (o.akad) u.akad = Object.assign(u.akad, o.akad);
  u.musim = { mode: o.musim || (u.skema === 'syariah' ? 'kb' : 'tanpa'), periodeAwal: o.periodeAwal || 1, tingkatKB: KB_DEF.slice(), tingkatSendiri: o.tingkat || fill12('Baseline Harian') };
  return u;
}
function ob(nama, nilai, tahap) { return it(nama, nilai, tahap); }

var PRESETS = [
  /* ---------------- JASA ---------------- */
  { id: 'laundry', jenis: 'jasa', label: 'Laundry kiloan', build: function () {
    return mk({ id: 'laundry', jenis: 'jasa', nama: 'Laundry Contoh', skema: 'syariah', periodeAwal: 2,
      produk: [unitProduk({ nama: 'Cuci dan setrika', satuan: 'kg', harga: 7000, volume: 3000, kapasitas: 6000, tumbuh: 1,
        hppA: [it('Deterjen', 900), it('Parfum', 400), it('Pemutih', 400)], hppB: [it('Ongkos cuci dan setrika', 1200), it('Ongkos mengemas', 400)], hppC: [it('Plastik pembungkus', 400)], hppD: [] })],
      tetap: [it('Upah tetap pengelola', 2500000), it('Perawatan mesin', 300000), it('Internet dan perlengkapan', 150000)],
      sewa: 1500000, listrik: { metode: 'B', daya: 4000, jam: 8, hari: 26, tarif: 1445, tetapLain: 100000 }, legal: 1500000,
      aset: [{ nama: 'Mesin cuci dan pengering', nilai: 24000000, umur: 60 }, { nama: 'Setrika uap', nilai: 4000000, umur: 60 }, { nama: 'Rak', nilai: 1500000, umur: 60 }, { nama: 'Keranjang dan hanger', nilai: 800000, umur: 12 }, { nama: 'Timbangan', nilai: 400000, umur: 12 }],
      pemasaran: 500000 });
  } },
  { id: 'bengkel', jenis: 'jasa', label: 'Bengkel motor', build: function () {
    return mk({ id: 'bengkel', jenis: 'jasa', nama: 'Bengkel Motor Contoh', status: 'Berjalan kurang dari 1 tahun',
      produk: [
        unitProduk({ nama: 'Servis ringan', satuan: 'motor', harga: 120000, volume: 95, kapasitas: 200, tumbuh: 1,
          hppA: [it('Suku cadang kecil (busi, filter, kampas)', 38000)], hppB: [it('Upah mekanik', 25000)], hppC: [it('Bahan habis pakai (lap, pembersih)', 4000)], hppD: [] }),
        unitProduk({ nama: 'Ganti oli', satuan: 'motor', harga: 65000, volume: 210, kapasitas: 400, tumbuh: 1,
          hppA: [it('Oli mesin', 42000)], hppB: [it('Upah mekanik', 5000)], hppC: [it('Bahan habis pakai', 1500)], hppD: [] })],
      tetap: [it('Upah tetap mekanik pembantu', 1800000), it('Perawatan alat', 200000), it('Internet dan perlengkapan', 150000)],
      sewa: 2000000, listrik: { metode: 'B', daya: 2500, jam: 8, hari: 26, tarif: 1445, tetapLain: 50000 }, legal: 800000,
      aset: [{ nama: 'Kompresor', nilai: 4500000, umur: 60 }, { nama: 'Set kunci dan dongkrak', nilai: 6000000, umur: 48 }, { nama: 'Rak dan meja kerja', nilai: 3000000, umur: 60 }, { nama: 'Papan nama dan etalase oli', nilai: 1500000, umur: 36 }],
      pemasaran: 600000, lain: [{ nama: 'Retribusi kebersihan', nilai: 50000, jenis: 'tetap', produk: 'semua' }] });
  } },
  { id: 'salon', jenis: 'jasa', label: 'Salon dan barbershop', build: function () {
    return mk({ id: 'salon', jenis: 'jasa', nama: 'Salon Contoh', skema: 'syariah', status: 'Berjalan kurang dari 1 tahun', periodeAwal: 1,
      produk: [
        unitProduk({ nama: 'Potong rambut', satuan: 'pelanggan', harga: 35000, volume: 300, kapasitas: 600, tumbuh: 1,
          hppA: [it('Bahan (pomade, pelembap, kapas)', 2500)], hppB: [it('Bagi hasil kapster', 14000)], hppC: [it('Perlengkapan sekali pakai', 1000)], hppD: [] }),
        unitProduk({ nama: 'Perawatan rambut dan creambath', satuan: 'pelanggan', harga: 90000, volume: 60, kapasitas: 140, tumbuh: 1,
          hppA: [it('Produk perawatan', 24000)], hppB: [it('Bagi hasil terapis', 22000)], hppC: [it('Handuk dan perlengkapan', 3000)], hppD: [] })],
      tetap: [it('Perawatan alat', 250000), it('Internet dan musik', 150000), it('Laundry handuk', 300000)],
      sewa: 2500000, listrik: { metode: 'A', porsiA: 100, ramaiTagihan: 1200000, ramaiVol: 560, sepiTagihan: 900000, sepiVol: 400 },
      aset: [{ nama: 'Kursi dan cermin', nilai: 9000000, umur: 60 }, { nama: 'Alat cukur dan catok', nilai: 3500000, umur: 36 }, { nama: 'Sterilizer dan perlengkapan', nilai: 2000000, umur: 36 }],
      pemasaran: 1000000, market: 0, musim: 'kb' });
  } },
  { id: 'percetakan', jenis: 'jasa', label: 'Percetakan dan fotokopi', build: function () {
    return mk({ id: 'percetakan', jenis: 'jasa', nama: 'Percetakan Contoh',
      produk: [
        unitProduk({ nama: 'Fotokopi dan cetak dokumen', satuan: 'lembar', harga: 500, volume: 24000, kapasitas: 40000, tumbuh: 0.5,
          hppA: [it('Kertas', 130)], hppB: [], hppC: [it('Toner dan tinta', 85)], hppD: [it('Perawatan mesin per lembar', 25)] }),
        unitProduk({ nama: 'Cetak spanduk dan stiker', satuan: 'meter persegi', harga: 38000, volume: 130, kapasitas: 300, tumbuh: 1,
          hppA: [it('Bahan spanduk atau stiker', 14000)], hppB: [it('Upah pasang dan finishing', 3500)], hppC: [it('Tinta', 5500)], hppD: [] })],
      tetap: [it('Upah tetap operator', 2000000), it('Perawatan mesin', 350000), it('Internet', 200000)],
      sewa: 1800000, listrik: { metode: 'B', daya: 2200, jam: 8, hari: 26, tarif: 1445, tetapLain: 80000 },
      aset: [{ nama: 'Mesin fotokopi', nilai: 14000000, umur: 60 }, { nama: 'Printer cetak besar', nilai: 18000000, umur: 48 }, { nama: 'Mesin jilid dan potong', nilai: 3500000, umur: 60 }],
      pemasaran: 500000 });
  } },
  /* ---------------- PRODUKSI ---------------- */
  { id: 'roti', jenis: 'produksi', label: 'Roti dan kue rumahan', build: function () {
    return mk({ id: 'roti', jenis: 'produksi', nama: 'Roti Rumahan Contoh', pangan: true, status: 'Berjalan kurang dari 1 tahun', musim: 'sendiri',
      tingkat: ['Baseline Harian', 'Baseline Harian', 'Puncak Sedang', 'Puncak Besar', 'Baseline Harian', 'Baseline Harian', 'Rawan Lesu', 'Baseline Harian', 'Baseline Harian', 'Baseline Harian', 'Puncak Sedang', 'Puncak Besar'],
      produk: [
        unitProduk({ nama: 'Roti manis', satuan: 'buah', harga: 5000, volume: 3000, kapasitas: 4500, tumbuh: 1, susutPct: 3,
          hppA: [it('Tepung', 1100), it('Gula dan mentega', 800), it('Isian', 600)], hppB: [it('Upah produksi', 700)], hppC: [it('Kemasan', 300)], hppD: [it('Gas', 250)] }),
        unitProduk({ nama: 'Kue ulang tahun', satuan: 'buah', harga: 85000, volume: 60, kapasitas: 100, tumbuh: 1, susutPct: 2,
          hppA: [it('Bahan kue dan hiasan', 38000)], hppB: [it('Upah dekorasi', 8000)], hppC: [it('Kotak dan tali', 4000)], hppD: [it('Gas', 1500)] })],
      tetap: [it('Upah tetap pengelola', 2000000), it('Pemasaran rutin', 400000), it('Internet dan perlengkapan', 150000)],
      sewa: 1200000, market: 2, legal: 1200000,
      aset: [{ nama: 'Oven', nilai: 12000000, umur: 60 }, { nama: 'Mixer', nilai: 6500000, umur: 60 }, { nama: 'Etalase', nilai: 3000000, umur: 48 }],
      pemasaran: 800000, biaya: { jenis: 'Pinjaman anuitas', pokok: 20000000, bunga: 12, tenor: 12 },
      lain: [{ nama: 'Retribusi kebersihan', nilai: 50000, jenis: 'tetap', produk: 'semua' }] });
  } },
  { id: 'konveksi', jenis: 'produksi', label: 'Konveksi dan sablon', build: function () {
    return mk({ id: 'konveksi', jenis: 'produksi', nama: 'Konveksi Contoh', skema: 'syariah', status: 'Rintisan baru', periodeAwal: 1,
      produk: [
        unitProduk({ nama: 'Kaos sablon', satuan: 'pcs', harga: 68000, volume: 320, kapasitas: 600, tumbuh: 1.5, susutPct: 2,
          hppA: [it('Kain', 27000)], hppB: [it('Upah jahit dan potong', 11000)], hppC: [it('Plastik dan label', 1200)], hppD: [it('Tinta dan sablon', 6500)] }),
        unitProduk({ nama: 'Seragam pesanan', satuan: 'stel', harga: 160000, volume: 70, kapasitas: 140, tumbuh: 1, susutPct: 2,
          hppA: [it('Kain dan furing', 62000)], hppB: [it('Upah jahit', 26000)], hppC: [it('Kemasan', 2500)], hppD: [it('Kancing, bordir, aksesoris', 9000)] })],
      tetap: [it('Upah tetap penjahit', 2800000), it('Perawatan mesin', 250000), it('Internet dan perlengkapan', 150000)],
      sewa: 1500000, listrik: { metode: 'B', daya: 3000, jam: 7, hari: 26, tarif: 1445, tetapLain: 60000 }, market: 3,
      aset: [{ nama: 'Mesin jahit (4 unit)', nilai: 14000000, umur: 60 }, { nama: 'Mesin obras', nilai: 4500000, umur: 60 }, { nama: 'Meja potong dan setrika', nilai: 3000000, umur: 60 }, { nama: 'Peralatan sablon', nilai: 4000000, umur: 36 }],
      pemasaran: 1200000, musim: 'kb' });
  } },
  { id: 'olahan', jenis: 'produksi', label: 'Keripik dan sambal olahan', build: function () {
    return mk({ id: 'olahan', jenis: 'produksi', nama: 'Olahan Pangan Contoh', skema: 'syariah', pangan: true, status: 'Berjalan kurang dari 1 tahun', periodeAwal: 1,
      produk: [
        unitProduk({ nama: 'Keripik pisang 250 g', satuan: 'bungkus', harga: 18000, volume: 900, kapasitas: 1500, tumbuh: 1.5, susutPct: 3,
          hppA: [it('Pisang', 5200), it('Minyak goreng', 2000), it('Bumbu dan gula', 900)], hppB: [it('Upah produksi', 2200)], hppC: [it('Kemasan dan label', 1500)], hppD: [it('Gas', 600)] }),
        unitProduk({ nama: 'Sambal botol', satuan: 'botol', harga: 26000, volume: 350, kapasitas: 700, tumbuh: 1.5, susutPct: 2,
          hppA: [it('Cabai dan bumbu', 7500), it('Minyak goreng', 1500)], hppB: [it('Upah produksi', 3000)], hppC: [it('Botol dan label', 3500)], hppD: [it('Gas', 600)] })],
      tetap: [it('Upah tetap pengelola', 1500000), it('Pemasaran rutin', 400000), it('Internet dan perlengkapan', 150000)],
      sewa: 900000, market: 3, legal: 2500000,
      aset: [{ nama: 'Penggorengan dan kompor', nilai: 5000000, umur: 48 }, { nama: 'Mesin pengiris', nilai: 3500000, umur: 60 }, { nama: 'Mesin pres kemasan', nilai: 2500000, umur: 48 }],
      pemasaran: 1000000, musim: 'kb' });
  } },
  { id: 'kerajinan', jenis: 'produksi', label: 'Mebel dan kerajinan kayu', build: function () {
    return mk({ id: 'kerajinan', jenis: 'produksi', nama: 'Mebel Contoh', status: 'Berjalan 1 tahun atau lebih',
      produk: [
        unitProduk({ nama: 'Kursi kayu', satuan: 'unit', harga: 520000, volume: 22, kapasitas: 40, tumbuh: 1, susutPct: 4,
          hppA: [it('Kayu', 210000)], hppB: [it('Upah tukang', 85000)], hppC: [it('Amplas, lem, paku', 15000)], hppD: [it('Finishing (plitur, cat)', 30000)] }),
        unitProduk({ nama: 'Meja makan', satuan: 'unit', harga: 1350000, volume: 8, kapasitas: 14, tumbuh: 1, susutPct: 4,
          hppA: [it('Kayu', 560000)], hppB: [it('Upah tukang', 220000)], hppC: [it('Amplas, lem, paku', 35000)], hppD: [it('Finishing (plitur, cat)', 80000)] })],
      tetap: [it('Upah tetap pembantu tukang', 1800000), it('Perawatan alat', 200000)],
      sewa: 1500000, listrik: { metode: 'B', daya: 3500, jam: 6, hari: 24, tarif: 1445, tetapLain: 50000 }, kendaraan: 600000,
      aset: [{ nama: 'Mesin serut dan gergaji', nilai: 9000000, umur: 60 }, { nama: 'Kompresor dan alat semprot', nilai: 4000000, umur: 48 }, { nama: 'Meja kerja dan perkakas', nilai: 3500000, umur: 60 }],
      pemasaran: 800000 });
  } },
  /* ---------------- DAGANG ---------------- */
  { id: 'kelontong', jenis: 'dagang', label: 'Toko kelontong', build: function () {
    return mk({ id: 'kelontong', jenis: 'dagang', nama: 'Toko Kelontong Contoh', skema: 'syariah', pangan: true, periodeAwal: 1,
      produk: [omzetProduk({ nama: 'Sembako', omzet: 45000000, margin: 10, hariStok: 14, tumbuh: 0.5 }), omzetProduk({ nama: 'Minuman dan camilan', omzet: 30000000, margin: 18, hariStok: 10, tumbuh: 0.5, susutPct: 1 }), omzetProduk({ nama: 'Kebutuhan rumah tangga', omzet: 15000000, margin: 22, hariStok: 21, tumbuh: 0.5 })],
      tetap: [it('Listrik dan air', 700000), it('Perlengkapan dan kantong', 400000), it('Internet', 200000)],
      sewa: 3000000, karyawan: 3500000, market: 0.7,
      aset: [{ nama: 'Rak dan gondola', nilai: 15000000, umur: 60 }, { nama: 'Lemari pendingin', nilai: 6000000, umur: 60 }, { nama: 'Mesin kasir', nilai: 5000000, umur: 36 }],
      pemasaran: 1000000, biaya: { jenis: 'Murabahah', hargaBeli: 40000000, margin: 4800000, tenor: 12 }, akad: { jenis: 'Mudharabah', nisbahPemilik: 60, porsiModal: 70, wakaf: 0, frek: 'Triwulanan' } });
  } },
  { id: 'kedai', jenis: 'dagang', label: 'Kedai minuman dan camilan', build: function () {
    return mk({ id: 'kedai', jenis: 'dagang', nama: 'Kedai Contoh', pangan: true, status: 'Rintisan baru',
      produk: [omzetProduk({ nama: 'Minuman', omzet: 14000000, margin: 62, hariStok: 7, tumbuh: 1.5, susutPct: 2 }), omzetProduk({ nama: 'Camilan dan makanan ringan', omzet: 6000000, margin: 45, hariStok: 5, tumbuh: 1, susutPct: 3 })],
      tetap: [it('Listrik dan air', 600000), it('Gas dan perlengkapan', 400000), it('Internet', 200000)],
      sewa: 2200000, karyawan: 2500000, market: 5,
      aset: [{ nama: 'Mesin kopi dan blender', nilai: 12000000, umur: 48 }, { nama: 'Kulkas dan freezer', nilai: 6000000, umur: 60 }, { nama: 'Meja, kursi, etalase', nilai: 8000000, umur: 48 }],
      pemasaran: 1500000, legal: 800000 });
  } },
  { id: 'butik', jenis: 'dagang', label: 'Toko pakaian atau daring', build: function () {
    return mk({ id: 'butik', jenis: 'dagang', nama: 'Toko Pakaian Contoh', skema: 'syariah', status: 'Berjalan kurang dari 1 tahun', periodeAwal: 1,
      produk: [omzetProduk({ nama: 'Pakaian wanita', omzet: 24000000, margin: 38, hariStok: 35, tumbuh: 1 }), omzetProduk({ nama: 'Pakaian pria dan anak', omzet: 10000000, margin: 32, hariStok: 40, tumbuh: 1 }), omzetProduk({ nama: 'Aksesori', omzet: 5000000, margin: 50, hariStok: 45, tumbuh: 1 })],
      tetap: [it('Internet dan perlengkapan', 250000), it('Pemasaran dan konten rutin', 600000)],
      sewa: 2000000, karyawan: 2200000, market: 6,
      aset: [{ nama: 'Rak dan manekin', nilai: 6000000, umur: 48 }, { nama: 'Kamera dan lampu foto', nilai: 5000000, umur: 36 }],
      pemasaran: 1500000, lain: [{ nama: 'Kemasan dan pengiriman', nilai: 3, jenis: 'persen', produk: 'semua' }], musim: 'kb' });
  } },
  /* ---------------- KULINER DAN WARALABA ---------------- */
  { id: 'coffeeshop', jenis: 'kuliner', label: 'Coffeeshop', build: function () {
    return mk({ id: 'coffeeshop', jenis: 'kuliner', nama: 'Coffeeshop Contoh', pangan: true, status: 'Berjalan kurang dari 1 tahun',
      produk: [
        unitProduk({ nama: 'Kopi susu dan kopi kekinian', satuan: 'cup', harga: 22000, volume: 1700, kapasitas: 3000, tumbuh: 1, susutPct: 3,
          hppA: [it('Biji kopi', 2400), it('Susu segar dan creamer', 4300), it('Gula aren dan sirup', 1600), it('Es batu dan air', 300)], hppB: [], hppC: [it('Cup, tutup, dan sedotan', 1900), it('Stiker dan kantong bawa', 350)], hppD: [] }),
        unitProduk({ nama: 'Kopi klasik (espresso, americano, latte, V60)', satuan: 'cup', harga: 26000, volume: 650, kapasitas: 1200, tumbuh: 1, susutPct: 3,
          hppA: [it('Biji kopi pilihan', 4200), it('Susu', 2500), it('Gula dan sirup', 700), it('Air dan es', 250)], hppB: [], hppC: [it('Gelas atau cup dan tutup', 1700)], hppD: [it('Filter kertas dan bahan seduh lain', 300)] }),
        unitProduk({ nama: 'Non-kopi (matcha, cokelat, teh)', satuan: 'cup', harga: 25000, volume: 500, kapasitas: 1000, tumbuh: 1, susutPct: 3,
          hppA: [it('Bubuk matcha, cokelat, atau teh', 4800), it('Susu', 3300), it('Sirup dan gula', 1300), it('Es batu', 300)], hppB: [], hppC: [it('Cup, tutup, dan sedotan', 1900)], hppD: [] }),
        unitProduk({ nama: 'Makanan pendamping (roti, pastry, camilan)', satuan: 'porsi', harga: 20000, volume: 450, kapasitas: 800, tumbuh: 1, susutPct: 5,
          hppA: [it('Bahan atau barang titipan', 9800)], hppB: [], hppC: [it('Kemasan dan serbet', 800)], hppD: [] })],
      tetap: [it('Pemeliharaan dan servis mesin', 350000), it('Pemasaran dan konten', 800000), it('Internet, musik, dan perlengkapan', 400000), it('Air galon, kebersihan, dan keamanan', 350000)],
      sewa: 8000000, karyawan: 8500000, market: 6, legal: 3500000, listrik: { metode: 'B', daya: 6500, jam: 12, hari: 30, tarif: 1445, tetapLain: 0 },
      aset: [{ nama: 'Mesin espresso', nilai: 38000000, umur: 60 }, { nama: 'Grinder', nilai: 9000000, umur: 48 }, { nama: 'Blender dan peralatan bar', nilai: 6000000, umur: 36 }, { nama: 'Kulkas, chiller, dan ice maker', nilai: 14000000, umur: 60 }, { nama: 'Furnitur dan dekorasi', nilai: 28000000, umur: 48 }, { nama: 'Renovasi dan interior', nilai: 35000000, umur: 60 }, { nama: 'Sistem kasir (POS) dan perangkat', nilai: 5000000, umur: 36 }],
      pemasaran: 6000000, lain: [{ nama: 'Biaya pembayaran digital (QRIS)', nilai: 0.7, jenis: 'persen', produk: 'semua' }] });
  } },
  { id: 'kekinian', jenis: 'kuliner', label: 'Minuman kekinian (boba, teh buah)', build: function () {
    return mk({ id: 'kekinian', jenis: 'kuliner', nama: 'Minuman Kekinian Contoh', pangan: true, status: 'Rintisan baru',
      produk: [
        unitProduk({ nama: 'Milk tea dan boba', satuan: 'cup', harga: 15000, volume: 2200, kapasitas: 3500, tumbuh: 1.5, susutPct: 3,
          hppA: [it('Teh, susu, dan creamer', 2600), it('Boba dan topping', 2200), it('Sirup dan gula', 900), it('Es batu', 250)], hppB: [], hppC: [it('Cup, seal, dan sedotan', 1700)], hppD: [] }),
        unitProduk({ nama: 'Teh buah dan minuman segar', satuan: 'cup', harga: 13000, volume: 1200, kapasitas: 2000, tumbuh: 1.5, susutPct: 4,
          hppA: [it('Teh', 700), it('Buah dan sirup buah', 2300), it('Gula', 500), it('Es batu', 250)], hppB: [], hppC: [it('Cup, seal, dan sedotan', 1600)], hppD: [] })],
      tetap: [it('Internet dan perlengkapan', 250000), it('Pemasaran rutin', 600000), it('Air dan kebersihan', 200000)],
      sewa: 2500000, karyawan: 5500000, market: 5, legal: 1500000, listrik: { metode: 'B', daya: 1500, jam: 12, hari: 30, tarif: 1445, tetapLain: 0 },
      aset: [{ nama: 'Booth atau gerobak', nilai: 12000000, umur: 36 }, { nama: 'Sealer, blender, dan dispenser', nilai: 6000000, umur: 36 }, { nama: 'Kulkas dan freezer', nilai: 6000000, umur: 48 }, { nama: 'Sistem kasir (POS)', nilai: 3000000, umur: 36 }],
      pemasaran: 3000000 });
  } },
  { id: 'geprek', jenis: 'kuliner', label: 'Ayam geprek dan makanan cepat saji', build: function () {
    return mk({ id: 'geprek', jenis: 'kuliner', nama: 'Ayam Geprek Contoh', pangan: true, status: 'Rintisan baru',
      produk: [
        unitProduk({ nama: 'Paket ayam geprek dan nasi', satuan: 'porsi', harga: 18000, volume: 2800, kapasitas: 4000, tumbuh: 1, susutPct: 4,
          hppA: [it('Ayam potong', 6800), it('Tepung dan bumbu crispy', 1300), it('Cabai dan bawang untuk sambal', 1900), it('Beras untuk nasi', 1800), it('Minyak goreng', 1300)], hppB: [], hppC: [it('Boks, sendok, dan plastik', 1400)], hppD: [it('Gas', 450)] }),
        unitProduk({ nama: 'Menu tambahan (mie, tahu-tempe, camilan)', satuan: 'porsi', harga: 9000, volume: 1200, kapasitas: 2000, tumbuh: 1, susutPct: 4,
          hppA: [it('Bahan baku', 4400)], hppB: [], hppC: [it('Kemasan', 700)], hppD: [it('Gas', 200)] }),
        unitProduk({ nama: 'Minuman (es teh, es jeruk)', satuan: 'cup', harga: 5000, volume: 2400, kapasitas: 3600, tumbuh: 1, susutPct: 2,
          hppA: [it('Teh, jeruk, gula, dan es', 1200)], hppB: [], hppC: [it('Cup dan sedotan', 700)], hppD: [] })],
      tetap: [it('Pemasaran rutin', 500000), it('Internet dan perlengkapan', 300000), it('Air dan kebersihan', 300000)],
      sewa: 3000000, karyawan: 5500000, market: 6, legal: 1500000, listrik: { metode: 'B', daya: 2000, jam: 10, hari: 26, tarif: 1445, tetapLain: 100000 },
      aset: [{ nama: 'Kompor gas dan wajan', nilai: 5000000, umur: 36 }, { nama: 'Freezer dan chiller', nilai: 8000000, umur: 60 }, { nama: 'Etalase, meja, dan kursi', nilai: 9000000, umur: 48 }, { nama: 'Peralatan dapur', nilai: 3500000, umur: 24 }, { nama: 'Sistem kasir (POS)', nilai: 3000000, umur: 36 }],
      pemasaran: 3000000, lain: [{ nama: 'Biaya pembayaran digital (QRIS)', nilai: 0.7, jenis: 'persen', produk: 'semua' }] });
  } },
  { id: 'katering', jenis: 'kuliner', label: 'Katering dan dapur rumahan', build: function () {
    return mk({ id: 'katering', jenis: 'kuliner', nama: 'Katering Contoh', skema: 'syariah', pangan: true, status: 'Berjalan kurang dari 1 tahun', periodeAwal: 1,
      produk: [
        unitProduk({ nama: 'Nasi kotak', satuan: 'kotak', harga: 32000, volume: 1000, kapasitas: 1600, tumbuh: 1, susutPct: 3,
          hppA: [it('Lauk utama (ayam, ikan, daging)', 11000), it('Sayur dan lauk pendamping', 4200), it('Beras', 1800), it('Bumbu dan minyak', 1500)], hppB: [it('Upah masak dan pengemasan', 2500)], hppC: [it('Kotak, sendok, dan plastik', 2300)], hppD: [it('Gas dan transportasi', 1200)] }),
        unitProduk({ nama: 'Snack box', satuan: 'kotak', harga: 18000, volume: 600, kapasitas: 1200, tumbuh: 1, susutPct: 3,
          hppA: [it('Kue dan camilan', 7200)], hppB: [it('Upah produksi', 1400)], hppC: [it('Kotak dan kertas', 1900)], hppD: [it('Gas dan transportasi', 600)] }),
        unitProduk({ nama: 'Prasmanan acara (per porsi)', satuan: 'porsi', harga: 50000, volume: 350, kapasitas: 600, tumbuh: 1, susutPct: 3,
          hppA: [it('Bahan makanan', 20000)], hppB: [it('Upah juru masak dan pelayan', 5000)], hppC: [it('Peralatan sekali pakai', 3500)], hppD: [it('Sewa tenda dan peralatan saji', 3500)] })],
      tetap: [it('Pemasaran dan konten', 500000), it('Internet dan perlengkapan', 250000), it('Air dan kebersihan', 300000)],
      sewa: 2500000, karyawan: 4000000, kendaraan: 1000000, legal: 3000000, listrik: { metode: 'B', daya: 2500, jam: 8, hari: 26, tarif: 1445, tetapLain: 100000 },
      aset: [{ nama: 'Kompor industri', nilai: 6000000, umur: 48 }, { nama: 'Peralatan masak', nilai: 9000000, umur: 36 }, { nama: 'Freezer', nilai: 8000000, umur: 60 }, { nama: 'Motor box atau kendaraan antar', nilai: 18000000, umur: 60 }, { nama: 'Wadah saji dan perlengkapan acara', nilai: 7000000, umur: 36 }],
      pemasaran: 2500000, musim: 'kb' });
  } },
  { id: 'frozen', jenis: 'kuliner', label: 'Frozen food', build: function () {
    return mk({ id: 'frozen', jenis: 'kuliner', nama: 'Frozen Food Contoh', pangan: true, status: 'Rintisan baru',
      produk: [
        unitProduk({ nama: 'Nugget dan sosis', satuan: 'pak', harga: 32000, volume: 700, kapasitas: 1400, tumbuh: 1.5, susutPct: 4,
          hppA: [it('Daging ayam atau ikan', 15000), it('Tepung, bumbu, dan pelapis', 3000)], hppB: [it('Upah produksi', 3000)], hppC: [it('Kemasan pouch dan label', 1800)], hppD: [it('Gas dan es', 800)] }),
        unitProduk({ nama: 'Dimsum', satuan: 'pak', harga: 28000, volume: 500, kapasitas: 1000, tumbuh: 1.5, susutPct: 4,
          hppA: [it('Daging dan bahan isian', 12000)], hppB: [it('Upah produksi', 3500)], hppC: [it('Kemasan dan label', 1600)], hppD: [it('Gas dan es', 800)] }),
        unitProduk({ nama: 'Risoles dan lumpia beku', satuan: 'pak', harga: 26000, volume: 400, kapasitas: 800, tumbuh: 1.5, susutPct: 4,
          hppA: [it('Bahan isian dan kulit', 9500)], hppB: [it('Upah produksi', 4000)], hppC: [it('Kemasan dan label', 1500)], hppD: [it('Gas dan es', 700)] })],
      tetap: [it('Pemasaran dan konten', 600000), it('Internet dan perlengkapan', 250000)],
      sewa: 1500000, karyawan: 3500000, kendaraan: 600000, market: 7, legal: 3500000, listrik: { metode: 'B', daya: 1200, jam: 24, hari: 30, tarif: 1445, tetapLain: 0 },
      aset: [{ nama: 'Freezer box besar (2 unit)', nilai: 9000000, umur: 60 }, { nama: 'Mesin sealer dan vacuum', nilai: 4500000, umur: 48 }, { nama: 'Mixer dan alat giling', nilai: 6000000, umur: 60 }, { nama: 'Kukusan dan peralatan produksi', nilai: 3000000, umur: 36 }, { nama: 'Cool box dan wadah pengiriman', nilai: 1500000, umur: 24 }],
      pemasaran: 3000000 });
  } },
  { id: 'waralaba', jenis: 'kuliner', label: 'Gerai waralaba (booth minuman dan camilan)', build: function () {
    return mk({ id: 'waralaba', jenis: 'kuliner', nama: 'Gerai Waralaba Contoh', pangan: true, status: 'Rintisan baru',
      produk: [
        unitProduk({ nama: 'Minuman utama', satuan: 'cup', harga: 18000, volume: 2000, kapasitas: 3000, tumbuh: 1, susutPct: 3,
          hppA: [it('Bahan paket dari pusat', 5800)], hppB: [], hppC: [it('Cup, seal, dan sedotan', 1900)], hppD: [] }),
        unitProduk({ nama: 'Camilan pendamping', satuan: 'porsi', harga: 12000, volume: 700, kapasitas: 1200, tumbuh: 1, susutPct: 4,
          hppA: [it('Bahan paket dari pusat', 5400)], hppB: [], hppC: [it('Kemasan', 700)], hppD: [] })],
      tetap: [it('Internet dan perlengkapan', 250000), it('Pemasaran lokal', 500000), it('Air dan kebersihan', 200000)],
      sewa: 2500000, karyawan: 4500000, market: 5, legal: 1500000, listrik: { metode: 'B', daya: 1500, jam: 12, hari: 30, tarif: 1445, tetapLain: 0 },
      aset: [{ nama: 'Biaya waralaba (hak usaha dan pelatihan)', nilai: 25000000, umur: 60 }, { nama: 'Paket booth dan peralatan dari pusat', nilai: 22000000, umur: 48 }, { nama: 'Sistem kasir (POS) dan perangkat', nilai: 3000000, umur: 36 }],
      pemasaran: 2000000, lain: [{ nama: 'Royalti waralaba', nilai: 5, jenis: 'persen', produk: 'semua' }, { nama: 'Dana pemasaran bersama', nilai: 2, jenis: 'persen', produk: 'semua' }] });
  } },
  /* ---------------- PETERNAKAN ---------------- */
  { id: 'lele', jenis: 'ternak', label: 'Budidaya lele', build: function () {
    return mk({ id: 'lele', jenis: 'ternak', nama: 'Budidaya Lele Contoh', pangan: true, status: 'Rintisan baru',
      produk: [batchProduk({ nama: 'Lele konsumsi', satuan: 'kg', harga: 24000, siklus: 3, jumlah: 3, hasil: 1000, matiPct: 8,
        biayaBatch: [ob('Bibit', 4500000, 'awal'), ob('Pakan', 9000000, 'rutin'), ob('Obat dan probiotik', 600000, 'rutin'), ob('Tenaga panen dan perawatan', 1200000, 'rutin')] })],
      tetap: [it('Upah tetap pengelola', 1500000), it('Listrik pompa', 400000)], sewa: 1000000,
      aset: [{ nama: 'Kolam terpal (3 unit)', nilai: 9000000, umur: 36 }, { nama: 'Pompa dan aerator', nilai: 3000000, umur: 36 }], pemasaran: 300000 });
  } },
  { id: 'ayam', jenis: 'ternak', label: 'Ayam pedaging', build: function () {
    return mk({ id: 'ayam', jenis: 'ternak', nama: 'Ayam Pedaging Contoh', pangan: true, status: 'Rintisan baru',
      produk: [batchProduk({ nama: 'Ayam broiler', satuan: 'kg', harga: 22000, siklus: 1, jumlah: 1, hasil: 1800, matiPct: 5,
        biayaBatch: [ob('Bibit ayam (DOC)', 7000000, 'awal'), ob('Pakan', 22500000, 'rutin'), ob('Vaksin dan obat', 1500000, 'rutin'), ob('Sekam, listrik, pemanas', 1200000, 'rutin')] })],
      tetap: [it('Upah tetap penjaga kandang', 1500000), it('Perawatan kandang', 250000)], sewa: 1000000,
      aset: [{ nama: 'Kandang dan peralatan', nilai: 22000000, umur: 60 }, { nama: 'Pemanas dan tempat pakan', nilai: 5000000, umur: 36 }], pemasaran: 300000 });
  } },
  { id: 'kambing', jenis: 'ternak', label: 'Penggemukan kambing', build: function () {
    return mk({ id: 'kambing', jenis: 'ternak', nama: 'Penggemukan Kambing Contoh', skema: 'syariah', pangan: false, status: 'Rintisan baru', periodeAwal: 1,
      produk: [batchProduk({ nama: 'Kambing potong', satuan: 'kg bobot hidup', harga: 65000, siklus: 6, jumlah: 3, hasil: 350, matiPct: 3,
        biayaBatch: [ob('Bakalan', 10000000, 'awal'), ob('Pakan dan hijauan', 5400000, 'rutin'), ob('Obat dan vitamin', 600000, 'rutin'), ob('Tenaga perawatan', 1800000, 'rutin')] })],
      tetap: [it('Perawatan kandang', 300000)], sewa: 500000,
      aset: [{ nama: 'Kandang panggung', nilai: 18000000, umur: 60 }, { nama: 'Peralatan pakan dan air', nilai: 2500000, umur: 36 }], pemasaran: 300000, musim: 'kb' });
  } },
  /* ---------------- PERTANIAN ---------------- */
  { id: 'hidroponik', jenis: 'tani', label: 'Sayur hidroponik', build: function () {
    return mk({ id: 'hidroponik', jenis: 'tani', nama: 'Hidroponik Contoh', skema: 'syariah', pangan: true, status: 'Rintisan baru', periodeAwal: 1, musim: 'tanpa',
      produk: [batchProduk({ nama: 'Selada', satuan: 'kg', harga: 28000, siklus: 2, jumlah: 2, hasil: 400, matiPct: 10,
        biayaBatch: [ob('Benih', 600000, 'awal'), ob('Media tanam', 800000, 'awal'), ob('Nutrisi', 1400000, 'rutin'), ob('Tenaga perawatan', 1800000, 'rutin'), ob('Listrik dan air', 300000, 'rutin')] })],
      tetap: [it('Pemasaran rutin', 300000)], sewa: 800000,
      aset: [{ nama: 'Rumah tanam (greenhouse)', nilai: 25000000, umur: 60 }, { nama: 'Instalasi NFT', nilai: 10000000, umur: 48 }, { nama: 'Pompa dan timer', nilai: 2000000, umur: 36 }], pemasaran: 500000 });
  } },
  { id: 'padi', jenis: 'tani', label: 'Padi dan jagung', build: function () {
    return mk({ id: 'padi', jenis: 'tani', nama: 'Tani Padi Contoh', pangan: true, status: 'Berjalan 1 tahun atau lebih',
      produk: [
        batchProduk({ nama: 'Padi (gabah), 1 hektare', satuan: 'kg', harga: 6500, siklus: 4, jumlah: 1, hasil: 5200, matiPct: 8,
          biayaBatch: [ob('Benih', 450000, 'awal'), ob('Pengolahan lahan', 1800000, 'awal'), ob('Pupuk', 4200000, 'rutin'), ob('Pestisida', 1300000, 'rutin'), ob('Tenaga tanam dan panen', 5500000, 'rutin'), ob('Air dan BBM pompa', 1200000, 'rutin')] }),
        batchProduk({ nama: 'Jagung pipil, 0,5 hektare', satuan: 'kg', harga: 5200, siklus: 3, jumlah: 1, hasil: 3200, matiPct: 8,
          biayaBatch: [ob('Benih', 600000, 'awal'), ob('Pengolahan lahan', 900000, 'awal'), ob('Pupuk', 1800000, 'rutin'), ob('Pestisida', 500000, 'rutin'), ob('Tenaga tanam dan panen', 2000000, 'rutin')] })],
      tetap: [it('Perawatan alat dan saluran', 250000)], sewa: 0,
      aset: [{ nama: 'Pompa air', nilai: 4500000, umur: 60 }, { nama: 'Alat semprot dan perkakas', nilai: 2500000, umur: 36 }], pemasaran: 0, kendaraan: 400000 });
  } },
  { id: 'sayuran', jenis: 'tani', label: 'Sayuran daun lahan terbuka', build: function () {
    return mk({ id: 'sayuran', jenis: 'tani', nama: 'Kebun Sayur Contoh', skema: 'syariah', pangan: true, status: 'Rintisan baru', periodeAwal: 1,
      produk: [
        batchProduk({ nama: 'Kangkung dan bayam', satuan: 'kg', harga: 9000, siklus: 1, jumlah: 4, hasil: 380, matiPct: 10,
          biayaBatch: [ob('Benih', 220000, 'awal'), ob('Pupuk kompos dan NPK', 450000, 'rutin'), ob('Tenaga tanam dan panen', 700000, 'rutin'), ob('Air dan perlengkapan', 120000, 'rutin')] })],
      tetap: [it('Perawatan alat dan saluran', 150000)], sewa: 600000,
      aset: [{ nama: 'Pompa dan selang', nilai: 3000000, umur: 48 }, { nama: 'Cangkul dan perkakas', nilai: 1500000, umur: 36 }, { nama: 'Naungan paranet', nilai: 3500000, umur: 36 }], pemasaran: 200000, musim: 'kb' });
  } },
  /* ---------------- CAMPURAN ---------------- */
  { id: 'warunglaundry', jenis: 'campuran', label: 'Warung sekaligus laundry', build: function () {
    return mk({ id: 'warunglaundry', jenis: 'campuran', nama: 'Warung dan Laundry Contoh', skema: 'syariah', pangan: true, status: 'Berjalan kurang dari 1 tahun', periodeAwal: 1,
      produk: [
        Object.assign(omzetProduk({ nama: 'Dagangan warung', omzet: 18000000, margin: 14, hariStok: 10, tumbuh: 0.5 }), { tipe: 'omzet' }),
        Object.assign(unitProduk({ nama: 'Laundry kiloan', satuan: 'kg', harga: 7000, volume: 1500, kapasitas: 2500, tumbuh: 1,
          hppA: [it('Deterjen dan parfum', 1100)], hppB: [it('Ongkos cuci dan setrika', 1500)], hppC: [it('Plastik pembungkus', 350)], hppD: [] }), { tipe: 'unit' })],
      tetap: [it('Listrik dan air', 600000), it('Internet dan perlengkapan', 200000)], sewa: 1500000, karyawan: 1800000,
      aset: [{ nama: 'Rak dan etalase warung', nilai: 5000000, umur: 48 }, { nama: 'Mesin cuci', nilai: 9000000, umur: 60 }, { nama: 'Setrika dan timbangan', nilai: 1800000, umur: 36 }], pemasaran: 500000 });
  } }
];

function zeroed(u) {
  var c = JSON.parse(JSON.stringify(u));
  function zeroNums(o, keep) {
    if (Array.isArray(o)) { o.forEach(function (x) { zeroNums(x, keep); }); return; }
    if (o && typeof o === 'object') Object.keys(o).forEach(function (k) {
      if (typeof o[k] === 'number' && keep.indexOf(k) < 0) o[k] = 0; else zeroNums(o[k], keep);
    });
  }
  var keep = ['siklus', 'jumlah', 'hariStok', 'umur', 'tumbuh', 'margin'];
  zeroNums(c.produk, keep); zeroNums(c.biayaTetap, []); zeroNums(c.aset, ['umur']);
  c.produk.forEach(function (p) { if (p.margin !== undefined) p.margin = 15; });
  c.pemasaranAwal = 0; c.kasAwal = 0;
  Object.keys(c.q).forEach(function (k) { var o = c.q[k]; o.on = false; if (o.nilai !== undefined) o.nilai = 0; });
  c.q.listrik.daya = 0; c.q.listrik.tetapLain = 0; c.q.listrik.ramaiTagihan = 0; c.q.listrik.ramaiVol = 0; c.q.listrik.sepiTagihan = 0; c.q.listrik.sepiVol = 0; c.q.marketplace.pct = 0;
  c.biayaLain = []; c.kejadian = [];
  c.pembiayaan = { jenis: 'Tidak ada', lembaga: '', hargaBeli: 0, margin: 0, sewa: 0, pokok: 0, bunga: 12, tenor: 12 };
  c.akad = { jenis: 'Dikelola langsung', nisbahPemilik: 60, porsiModal: 70, wakaf: 0, frek: 'Tahunan' };
  c.nama = ''; c.preset = 'kosong';
  return c;
}
function emptyProduk(jenis, tipe) {
  if (tipe === 'omzet') return Object.assign(omzetProduk({ nama: '' }), jenis === 'campuran' ? { tipe: 'omzet' } : {});
  if (tipe === 'batch') return Object.assign(batchProduk({ nama: '', biayaBatch: [it('', 0, 'awal'), it('', 0, 'rutin')] }), jenis === 'campuran' ? { tipe: 'batch' } : {});
  return Object.assign(unitProduk({ nama: '' }), jenis === 'campuran' ? { tipe: 'unit' } : {});
}
/* Kosong murni untuk satu kelompok: tanpa nama komponen contoh */
function blankFor(jenis, n) {
  var u = baseU(); u.jenis = jenis; u.preset = 'kosong'; u.skema = 'konvensional';
  var tipe = jenis === 'dagang' ? 'omzet' : (jenis === 'ternak' || jenis === 'tani' ? 'batch' : 'unit');
  u.produk = []; for (var i = 0; i < (n || 1); i++) u.produk.push(emptyProduk(jenis, tipe));
  u.biayaTetap = [it('', 0)]; u.aset = [{ nama: '', nilai: 0, umur: 60 }];
  return u;
}
/* Struktur dari usaha spesifik, nilai dikosongkan (untuk template) */
function templateFor(id, jenis, n, skema) {
  var p = PRESETS.filter(function (x) { return x.id === id; })[0];
  var u = p ? zeroed(p.build()) : blankFor(jenis, n);
  if (!p) u = blankFor(jenis, n);
  var tipe = jenis === 'dagang' ? 'omzet' : (jenis === 'ternak' || jenis === 'tani' ? 'batch' : 'unit');
  n = Math.max(1, Math.min(10, n || u.produk.length));
  while (u.produk.length > n) u.produk.pop();
  while (u.produk.length < n) u.produk.push(emptyProduk(jenis, jenis === 'campuran' ? 'unit' : tipe));
  u.jenis = jenis; u.skema = skema || 'konvensional'; u.preset = id || 'kosong';
  u.musim.mode = u.skema === 'syariah' ? 'kb' : 'tanpa';
  return u;
}

function usahaLabel(u) {
  var p = PRESETS.filter(function (x) { return x.id === u.preset; })[0];
  if (p) return p.label; if (u.usahaLain) return u.usahaLain;
  var j = JENIS.filter(function (x) { return x.id === u.jenis; })[0]; return j ? j.label : '';
}
