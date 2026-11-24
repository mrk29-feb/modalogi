/* Modalogi: template Excel, laporan Excel, dan pembacaan balik. Memerlukan ExcelJS. */
var XL = (function () {
  var SCHEMA_V = 1, MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var BRAND = 'Dibuat dengan Modalogi · © 2026 mrk29';
  var C = { band: 'FF1F5FD6', ink: 'FF14213D', cream: 'FFFAF6EF', inp: 'FFEAF1FD', inpLine: 'FF9DB8EC', calc: 'FFF1EBDD', sec: 'FFF5EFE2', line: 'FFE8E0D2', white: 'FFFFFFFF', mut: 'FF6B6A66', pos: 'FF0B6B4F', neg: 'FF7E2D1A' };
  var YN = [{ v: true, l: 'Ya' }, { v: false, l: 'Tidak' }];
  var O = {
    skema: [{ v: 'syariah', l: 'Syariah' }, { v: 'konvensional', l: 'Konvensional' }],
    status: STATUS.map(function (x) { return { v: x, l: x }; }),
    bulan: MONTHS.map(function (m, i) { return { v: i, l: m }; }),
    metode: [{ v: 'A', l: 'Dari tagihan' }, { v: 'B', l: 'Dari daya alat' }],
    tahap: [{ v: 'awal', l: 'Dibayar di awal' }, { v: 'rutin', l: 'Selama siklus' }],
    jenisBL: [{ v: 'tetap', l: 'Tetap per bulan (Rp)' }, { v: 'unit', l: 'Variabel per satuan (Rp)' }, { v: 'persen', l: 'Variabel persen penjualan (%)' }, { v: 'batch', l: 'Variabel per batch (Rp)' }],
    biaya: ['Tidak ada', 'Murabahah', 'Ijarah', 'Pinjaman anuitas', 'Pinjaman flat'].map(function (x) { return { v: x, l: x }; }),
    akad: ['Dikelola langsung', 'Mudharabah', 'Musyarakah'].map(function (x) { return { v: x, l: x }; }),
    frek: ['Bulanan', 'Triwulanan', 'Tahunan'].map(function (x) { return { v: x, l: x }; }),
    musim: [{ v: 'tanpa', l: 'Tanpa musim' }, { v: 'kb', l: 'Kalender Berkah' }, { v: 'sendiri', l: 'Pola sendiri' }],
    level: LEVELS.map(function (x) { return { v: x, l: x }; }),
    periode: KB_PERIODE.map(function (x, i) { return { v: i + 1, l: x }; }),
    kj: ['Kas masuk', 'Kas keluar'].map(function (x) { return { v: x, l: x }; })
  };

  /* ---------- skema isian (dipakai penulis dan pembaca) ---------- */
  function F(path, label, type, opts, hint) { return { k: 'field', path: path, label: label, type: type, opts: opts, hint: hint }; }
  function L(path, cols, min, extra, hint) { return { k: 'list', path: path, cols: cols, min: min || 6, extra: extra || 4, hint: hint }; }
  function Ar(path, labels, opts) { return { k: 'arr', path: path, labels: labels, opts: opts }; }
  function schemaOf(U) {
    var S = [], j = U.jenis, syr = U.skema === 'syariah';
    S.push({ sec: 'Profil usaha', items: [F('nama', 'Nama usaha', 'text'), F('skema', 'Skema', 'sel', O.skema), F('status', 'Status usaha', 'sel', O.status), F('pangan', 'Bahan baku utama berupa pangan?', 'bool', null, 'Memakai inflasi bahan pangan'), F('bulanMulai', 'Bulan mulai beroperasi', 'sel', O.bulan)] });
    U.produk.forEach(function (p, i) {
      var tp = tipeOf(U, p), pre = 'produk.' + i + '.', items;
      var head = (tp === 'omzet' ? 'Kategori dagangan ' : (tp === 'batch' ? 'Komoditas bersiklus ' : (j === 'jasa' ? 'Layanan ' : 'Produk '))) + (i + 1);
      var cn = [{ key: 'nama', label: 'Nama komponen', type: 'text' }, { key: 'nilai', label: 'Biaya per satuan (Rp)', type: 'rp' }];
      if (tp === 'omzet') items = [F(pre + 'nama', 'Nama kategori', 'text'), F(pre + 'omzet', 'Penjualan per bulan (Rp)', 'rp'), F(pre + 'margin', 'Margin kotor (%)', 'num', null, 'Laba kotor dari harga jual'), F(pre + 'hariStok', 'Perputaran stok (hari)', 'num', null, 'Menentukan stok awal sebagai modal kerja'), F(pre + 'susutPct', 'Susut atau kedaluwarsa (%)', 'num'), F(pre + 'tumbuh', 'Pertumbuhan per bulan (%)', 'num')];
      else if (tp === 'batch') items = [F(pre + 'nama', 'Nama komoditas', 'text'), F(pre + 'satuan', 'Satuan hasil', 'text'), F(pre + 'harga', 'Harga per satuan hasil (Rp)', 'rp'), F(pre + 'siklus', 'Panjang siklus (bulan)', 'num', null, 'Dari mulai sampai panen'), F(pre + 'jumlah', 'Jumlah batch bergilir', 'num', null, 'Batch dimulai bergantian agar panen merata'), F(pre + 'hasil', 'Hasil per batch (satuan hasil)', 'num'), F(pre + 'matiPct', 'Kematian, gagal panen, atau susut (%)', 'num'),
        L(pre + 'biayaBatch', [{ key: 'nama', label: 'Biaya per batch', type: 'text' }, { key: 'nilai', label: 'Jumlah (Rp)', type: 'rp' }, { key: 'tahap', label: 'Waktu pembayaran', type: 'sel', opts: O.tahap }], 6, 3)];
      else {
        items = [F(pre + 'nama', 'Nama ' + (j === 'jasa' ? 'layanan' : 'produk'), 'text'), F(pre + 'satuan', 'Satuan', 'text'), F(pre + 'harga', 'Harga jual per satuan (Rp)', 'rp'), F(pre + 'volume', 'Volume per bulan', 'num'), F(pre + 'kapasitas', 'Kapasitas per bulan (opsional)', 'num'), F(pre + 'tumbuh', 'Pertumbuhan per bulan (%)', 'num')];
        if (j === 'produksi' || j === 'campuran') items.push(F(pre + 'susutPct', 'Susut bahan (%)', 'num'));
        items.push(L(pre + 'hppA', [{ key: 'nama', label: 'A. Bahan baku dan barang dagangan (per satuan)', type: 'text' }, cn[1]], 4, 3), L(pre + 'hppB', [{ key: 'nama', label: 'B. Tenaga kerja langsung (per satuan)', type: 'text' }, cn[1]], 4, 3), L(pre + 'hppC', [{ key: 'nama', label: 'C. Kemasan dan bahan pendukung (per satuan)', type: 'text' }, cn[1]], 4, 3), L(pre + 'hppD', [{ key: 'nama', label: 'D. Biaya langsung lain (per satuan)', type: 'text' }, cn[1]], 4, 3));
      }
      S.push({ sec: head, note: tp === 'unit' ? 'Isi biaya per satuan. Baris kosong boleh dibiarkan.' : '', items: items, produk: i, tipe: tp });
    });
    var q = 'q.';
    S.push({ sec: 'Biaya tetap per bulan', note: 'Dibayar walau tidak ada penjualan.', items: [L('biayaTetap', [{ key: 'nama', label: 'Biaya tetap', type: 'text' }, { key: 'nilai', label: 'Per bulan (Rp)', type: 'rp' }], 8, 5),
      F(q + 'sewa.on', 'Membayar sewa tempat?', 'bool'), F(q + 'sewa.nilai', 'Sewa per bulan (Rp)', 'rp'), F(q + 'karyawan.on', 'Mempekerjakan karyawan dengan upah tetap?', 'bool'), F(q + 'karyawan.nilai', 'Upah tetap per bulan (Rp)', 'rp'),
      F(q + 'kendaraan.on', 'Memakai kendaraan untuk usaha?', 'bool'), F(q + 'kendaraan.nilai', 'BBM dan perawatan per bulan (Rp)', 'rp'), F(q + 'legalitas.on', 'Perlu izin, sertifikasi, atau legalitas?', 'bool'), F(q + 'legalitas.nilai', 'Total biaya izin dan sertifikasi (Rp)', 'rp'),
      F(q + 'marketplace.on', 'Berjualan lewat marketplace atau antar-jemput?', 'bool'), F(q + 'marketplace.pct', 'Komisi dan biaya platform (% penjualan)', 'num'), F(q + 'tempo.on', 'Menjual secara tempo?', 'bool'), F(q + 'tempo.porsiTunai', 'Porsi penjualan tunai (%)', 'num')] });
    S.push({ sec: 'Listrik dan mesin', note: 'Isi bila memakai mesin atau alat listrik besar.', items: [F(q + 'listrik.on', 'Memakai mesin atau alat listrik besar?', 'bool'), F(q + 'listrik.metode', 'Cara menghitung', 'sel', O.metode, 'Metode A dari tagihan, Metode B dari daya alat'), F(q + 'listrik.porsiA', 'A. Porsi tagihan untuk usaha ini (%)', 'num'), F(q + 'listrik.ramaiTagihan', 'A. Tagihan bulan ramai (Rp)', 'rp'), F(q + 'listrik.ramaiVol', 'A. Volume bulan ramai', 'num'), F(q + 'listrik.sepiTagihan', 'A. Tagihan bulan sepi (Rp)', 'rp'), F(q + 'listrik.sepiVol', 'A. Volume bulan sepi', 'num'),
      F(q + 'listrik.daya', 'B. Total daya alat produksi (watt)', 'num'), F(q + 'listrik.jam', 'B. Jam pakai per hari', 'num'), F(q + 'listrik.hari', 'B. Hari pakai per bulan', 'num'), F(q + 'listrik.tarif', 'B. Tarif listrik per kWh (Rp)', 'rp'), F(q + 'listrik.tetapLain', 'B. Listrik dan air tetap lain per bulan (Rp)', 'rp')] });
    var prodOpts = [{ v: 'semua', l: 'Semua' }].concat(U.produk.map(function (p, i) { return { v: i, l: String(i + 1) }; }));
    S.push({ sec: 'Biaya lain yang terlewat', note: 'Tambahkan sendiri biaya yang belum tercantum. Kolom "Berlaku untuk" diisi Semua atau nomor produk.', items: [L('biayaLain', [{ key: 'nama', label: 'Nama biaya', type: 'text' }, { key: 'nilai', label: 'Nilai', type: 'num' }, { key: 'jenis', label: 'Jenis biaya', type: 'sel', opts: O.jenisBL }, { key: 'produk', label: 'Berlaku untuk', type: 'sel', opts: prodOpts }], 8, 5)] });
    S.push({ sec: 'Modal dan aset', items: [L('aset', [{ key: 'nama', label: 'Aset tetap', type: 'text' }, { key: 'nilai', label: 'Nilai (Rp)', type: 'rp' }, { key: 'umur', label: 'Umur ekonomis (bulan)', type: 'num' }], 8, 4, 'calcDep'), F('pemasaranAwal', 'Pemasaran dan promosi awal (Rp)', 'rp'), F('kasAwal', 'Saldo kas awal unit usaha (Rp)', 'rp'), F('ziswaf', (syr ? 'Dana sosial (zakat, infak, sedekah, wakaf)' : 'Hibah atau dana sosial') + ' (Rp)', 'rp'), F('lainnya', 'Sumber lain: hibah program, mitra (Rp)', 'rp')] });
    S.push({ sec: 'Pembiayaan eksternal', note: 'Pilih Tidak ada bila memakai modal sendiri. Murabahah dan Ijarah untuk syariah, pinjaman untuk konvensional.', items: [F('pembiayaan.jenis', 'Jenis pembiayaan', 'sel', O.biaya), F('pembiayaan.lembaga', 'Nama lembaga (opsional)', 'text'), F('pembiayaan.hargaBeli', 'Murabahah: harga beli barang oleh lembaga (Rp)', 'rp'), F('pembiayaan.margin', 'Murabahah: total margin disepakati (Rp)', 'rp'), F('pembiayaan.sewa', 'Ijarah: sewa per bulan (Rp)', 'rp'), F('pembiayaan.pokok', 'Pinjaman: pokok (Rp)', 'rp'), F('pembiayaan.bunga', 'Pinjaman: bunga per tahun (%)', 'num'), F('pembiayaan.tenor', 'Tenor (bulan)', 'num')] });
    S.push({ sec: 'Akad dan bagi hasil (skema syariah)', note: 'Diisi bila skema Syariah.', items: [F('akad.jenis', 'Akad kerja sama pengelolaan', 'sel', O.akad), F('akad.nisbahPemilik', 'Nisbah pemilik modal atas laba (%)', 'num'), F('akad.porsiModal', 'Musyarakah: porsi modal pemilik modal (%)', 'num'), F('akad.wakaf', 'Nisbah wakaf atau dana sosial atas laba (%)', 'num'), F('akad.frek', 'Frekuensi pembayaran bagi hasil', 'sel', O.frek)] });
    S.push({ sec: 'Asumsi', note: 'Boleh dibiarkan seperti bawaan.', items: [F('musim.mode', 'Pola musim', 'sel', O.musim), F('musim.periodeAwal', 'Kalender Berkah: periode pada bulan operasi ke-1', 'sel', O.periode),
      Ar('musim.tingkatKB', KB_PERIODE, O.level), Ar('musim.tingkatSendiri', MONTHS.map(function (m, i) { return 'Bulan operasi ke-' + (i + 1); }), O.level),
      F('ref.inflasiUmum', 'Inflasi umum per tahun (%)', 'num'), F('ref.inflasiPangan', 'Inflasi bahan pangan per tahun (%)', 'num'), F('ref.pph', 'PPh final atas penjualan (%)', 'num'), F('ref.dTinggi', 'Tambahan diskonto skenario tinggi (poin %)', 'num'), F('ref.dSangatTinggi', 'Tambahan diskonto sangat tinggi (poin %)', 'num'), F('ref.kasMinBulan', 'Target kas minimum (bulan biaya tetap)', 'num'), F('ref.amortBulan', 'Masa amortisasi izin (bulan)', 'num')] });
    S.push({ sec: 'Kejadian khusus (opsional)', note: 'Pembelian besar, hibah, atau penerimaan sekali waktu.', items: [L('kejadian', [{ key: 'ket', label: 'Keterangan', type: 'text' }, { key: 'bulan', label: 'Bulan ke-', type: 'num' }, { key: 'jenis', label: 'Jenis', type: 'sel', opts: O.kj }, { key: 'jumlah', label: 'Jumlah (Rp)', type: 'rp' }], 5, 3)] });
    return S;
  }

  /* ---------- util path ---------- */
  function getP(o, path) { var a = String(path).split('.'), x = o; for (var i = 0; i < a.length; i++) { if (x === undefined || x === null) return undefined; x = x[a[i]]; } return x; }
  function setP(o, path, v) { var a = String(path).split('.'), x = o; for (var i = 0; i < a.length - 1; i++) { var k = a[i]; if (x[k] === undefined || x[k] === null) x[k] = /^\d+$/.test(a[i + 1]) ? [] : {}; x = x[k]; } x[a[a.length - 1]] = v; }
  function colL(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function optLabel(opts, v) { for (var i = 0; i < opts.length; i++) if (opts[i].v === v || String(opts[i].v) === String(v)) return opts[i].l; return v === undefined || v === null ? '' : String(v); }
  function optValue(opts, lab) { var s = String(lab === undefined || lab === null ? '' : lab).trim().toLowerCase(); for (var i = 0; i < opts.length; i++) if (String(opts[i].l).toLowerCase() === s) return opts[i].v; return undefined; }
  function thin(c) { return { style: 'thin', color: { argb: c || C.line } }; }
  function box(c) { return { top: thin(c), left: thin(c), bottom: thin(c), right: thin(c) }; }
  function fillOf(a) { return { type: 'pattern', pattern: 'solid', fgColor: { argb: a } }; }
  function numFmt(t) { return t === 'rp' ? '#,##0' : '#,##0.####'; }

  function setProps(wb, title) {
    wb.creator = 'mrk29'; wb.lastModifiedBy = 'Modalogi (mrk29)'; wb.title = title; wb.subject = 'Rencana keuangan dan kanvas model bisnis';
    wb.keywords = 'Modalogi; mrk29; rencana keuangan'; wb.category = 'Modalogi'; wb.company = 'mrk29'; wb.manager = 'mrk29';
    wb.description = BRAND + '. Alat edukasi dan simulasi, bukan nasihat keuangan.'; wb.created = new Date(); wb.modified = new Date();
    wb.calcProperties = { fullCalcOnLoad: true };
  }
  function footerOf(ws) {
    ws.headerFooter = { oddFooter: '&L&8Modalogi · © 2026 mrk29&R&8Halaman &P dari &N' };
    ws.pageSetup = Object.assign(ws.pageSetup || {}, { paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 });
  }
  function brandRow(ws, row, ncols) {
    var r = ws.getRow(row); r.getCell(1).value = BRAND + ' · Alat edukasi dan simulasi, bukan nasihat keuangan.';
    r.getCell(1).font = { size: 9, italic: true, color: { argb: C.mut } };
  }
  function lock(ws) {
    try { ws.protect('', {}); } catch (e) { }
  }

  /* ---------- lembar Input ---------- */
  function writeInput(wb, U, S, opts) {
    var ws = wb.addWorksheet('Input', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }], properties: { tabColor: { argb: C.band } } });
    ws.columns = [{ width: 52 }, { width: 24 }, { width: 24 }, { width: 24 }, { width: 22 }, { width: 18 }];
    var ADDR = { f: {}, l: {} }, META = { v: SCHEMA_V, fields: [], lists: [], arrs: [] }, r = 1, nf = 0;
    ws.mergeCells('A1:F1'); var t = ws.getCell('A1'); t.value = 'Modalogi · Isian rencana usaha'; t.font = { size: 16, bold: true, color: { argb: C.white } }; t.fill = fillOf(C.band); t.alignment = { vertical: 'middle' }; ws.getRow(1).height = 30;
    ws.mergeCells('A2:F2'); var st = ws.getCell('A2'); st.value = (opts.template ? 'Template' : 'Laporan') + ' · ' + usahaLabel(U) + ' · Isi sel berlatar biru muda. Sel lain terkunci. Unggah berkas ini ke Modalogi setelah diisi.'; st.font = { size: 10, color: { argb: C.mut } };
    ws.mergeCells('A3:F3'); var br = ws.getCell('A3'); br.value = BRAND; br.font = { size: 9, italic: true, color: { argb: C.mut } };
    ws.getRow(4).values = ['Uraian', 'Isian', 'Keterangan']; ws.getRow(4).eachCell(function (c) { c.font = { bold: true, color: { argb: C.ink } }; c.fill = fillOf(C.sec); c.border = box(); });
    r = 5;
    function inputStyle(c, type) { c.fill = fillOf(C.inp); c.border = box(C.inpLine); c.protection = { locked: false }; c.alignment = { horizontal: type === 'text' || type === 'sel' || type === 'bool' ? 'left' : 'right' }; if (type === 'rp' || type === 'num') c.numFmt = numFmt(type); }
    function validate(c, type, o) {
      if (type === 'sel' || type === 'bool') { var list = (type === 'bool' ? YN : o).map(function (x) { return x.l; }).join(','); c.dataValidation = { type: 'list', allowBlank: true, formulae: ['"' + list + '"'], showErrorMessage: true, errorTitle: 'Pilihan tidak dikenal', error: 'Pilih salah satu dari daftar.' }; }
      else if (type === 'num' || type === 'rp') c.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: 'Angka tidak valid', error: 'Isi dengan angka nol atau lebih.' };
    }
    function setVal(c, type, o, v) {
      if (type === 'bool') c.value = v ? 'Ya' : 'Tidak';
      else if (type === 'sel') c.value = optLabel(o, v);
      else if (type === 'num' || type === 'rp') c.value = (v === 0 || v === undefined || v === null || v === '') ? null : +v;
      else c.value = v === undefined || v === null ? '' : String(v);
    }
    S.forEach(function (sec) {
      ws.mergeCells('A' + r + ':F' + r); var h = ws.getCell('A' + r); h.value = sec.sec; h.font = { bold: true, size: 12, color: { argb: C.white } }; h.fill = fillOf(C.ink); ws.getRow(r).height = 22; h.alignment = { vertical: 'middle' }; r++;
      if (sec.note) { ws.mergeCells('A' + r + ':F' + r); var n = ws.getCell('A' + r); n.value = sec.note; n.font = { size: 10, italic: true, color: { argb: C.mut } }; r++; }
      sec.items.forEach(function (it) {
        if (it.k === 'field') {
          var name = 'IN_' + (++nf), cell = ws.getCell('B' + r), v = getP(U, it.path);
          ws.getCell('A' + r).value = it.label; ws.getCell('A' + r).border = box();
          setVal(cell, it.type, it.opts, v); inputStyle(cell, it.type); validate(cell, it.type, it.opts);
          if (it.hint) { ws.getCell('C' + r).value = it.hint; ws.getCell('C' + r).font = { size: 9, color: { argb: C.mut } }; }
          wb.definedNames.add("Input!$B$" + r, name); ADDR.f[it.path] = 'B' + r;
          META.fields.push({ n: name, p: it.path, t: it.type, o: it.opts ? it.opts.map(function (x) { return [x.v, x.l]; }) : null }); r++;
        } else if (it.k === 'arr') {
          var arr = getP(U, it.path) || [], r0 = r;
          it.labels.forEach(function (lab, i) { ws.getCell('A' + r).value = lab; ws.getCell('A' + r).border = box(); var c = ws.getCell('B' + r); c.value = arr[i] || it.opts[0].l; c.value = optLabel(it.opts, arr[i] === undefined ? it.opts[0].v : arr[i]); inputStyle(c, 'sel'); validate(c, 'sel', it.opts); r++; });
          var nm = 'AR_' + (META.arrs.length + 1); wb.definedNames.add('Input!$B$' + r0 + ':$B$' + (r - 1), nm);
          META.arrs.push({ n: nm, p: it.path, o: it.opts.map(function (x) { return [x.v, x.l]; }), len: it.labels.length });
        } else if (it.k === 'list') {
          var arr2 = getP(U, it.path) || [], cap = Math.max(it.min, arr2.length + it.extra), hr = r;
          it.cols.forEach(function (cl, ci) { var c = ws.getCell(colL(ci) + r); c.value = cl.label; c.font = { bold: true, size: 10 }; c.fill = fillOf(C.sec); c.border = box(); c.alignment = { wrapText: true, vertical: 'middle' }; });
          if (it.hint === 'calcDep') { var dc = ws.getCell(colL(it.cols.length) + r); dc.value = 'Penyusutan per bulan (otomatis)'; dc.font = { bold: true, size: 10 }; dc.fill = fillOf(C.calc); dc.border = box(); dc.alignment = { wrapText: true, vertical: 'middle' }; }
          ws.getRow(r).height = 30; r++;
          var r0b = r;
          for (var i = 0; i < cap; i++) {
            var row = arr2[i];
            it.cols.forEach(function (cl, ci) { var c = ws.getCell(colL(ci) + r); var v = row ? (cl.key === 'produk' ? (row.produk === 'semua' || row.produk === undefined ? 'semua' : +row.produk) : row[cl.key]) : undefined; if (cl.type === 'sel' && (v === undefined || v === '')) v = cl.opts[0].v; setVal(c, cl.type, cl.opts, row || cl.type === 'sel' ? v : undefined); if (cl.type === 'sel' && !row) c.value = null; inputStyle(c, cl.type); validate(c, cl.type, cl.opts); });
            if (it.hint === 'calcDep') { var d = ws.getCell(colL(it.cols.length) + r); d.value = { formula: 'IF(N(C' + r + ')>0,N(B' + r + ')/C' + r + ',0)' }; d.numFmt = '#,##0'; d.fill = fillOf(C.calc); d.border = box(); }
            r++;
          }
          var nm2 = 'LS_' + (META.lists.length + 1), lastc = colL(it.cols.length - 1);
          wb.definedNames.add('Input!$A$' + r0b + ':$' + lastc + '$' + (r - 1), nm2);
          ADDR.l[it.path] = { r0: r0b, r1: r - 1, cols: it.cols.map(function (c, ci) { return colL(ci); }) };
          META.lists.push({ n: nm2, p: it.path, cap: cap, cols: it.cols.map(function (c) { return { key: c.key, type: c.type, o: c.opts ? c.opts.map(function (x) { return [x.v, x.l]; }) : null }; }) });
        }
      });
      r++;
    });
    brandRow(ws, r + 1); footerOf(ws); lock(ws);
    return { ws: ws, ADDR: ADDR, META: META, nextRow: r + 3 };
  }

  /* ---------- Ringkasan cepat berumus (terkunci) ---------- */
  function writeQuick(wb, U, W) {
    var ws = wb.addWorksheet('Ringkasan', { views: [{ showGridLines: false }], properties: { tabColor: { argb: 'FF12A879' } } });
    ws.columns = [{ width: 46 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    var A = W.ADDR, r = 1;
    function f(path) { if (!A.f[path]) return '0'; return 'Input!$' + A.f[path].replace(/(\d+)/, '$$$1'); }
    function rng(path, col) { var l = A.l[path]; return 'Input!$' + l.cols[col] + '$' + l.r0 + ':$' + l.cols[col] + '$' + l.r1; }
    ws.mergeCells('A1:F1'); var t = ws.getCell('A1'); t.value = 'Ringkasan cepat (dihitung dengan rumus Excel)'; t.font = { size: 16, bold: true, color: { argb: C.white } }; t.fill = fillOf(C.band); ws.getRow(1).height = 30; t.alignment = { vertical: 'middle' };
    ws.mergeCells('A2:F2'); ws.getCell('A2').value = 'Perkiraan kasar dari isian. Tidak memuat biaya per satuan atau per batch dari "Biaya lain", musim, pajak, dan pembiayaan. Analisis lengkap 12 bulan dan kelayakan dihitung di Modalogi setelah berkas ini diunggah.'; ws.getCell('A2').font = { size: 10, italic: true, color: { argb: C.mut } }; ws.getCell('A2').alignment = { wrapText: true }; ws.getRow(2).height = 42;
    var head = ws.getRow(4); head.values = ['Produk atau kategori', 'Biaya per satuan', 'Margin per satuan', 'Penjualan per bulan', 'Kontribusi per bulan', 'Margin kontribusi']; head.eachCell(function (c) { c.font = { bold: true, size: 10 }; c.fill = fillOf(C.sec); c.border = box(); c.alignment = { wrapText: true, vertical: 'middle' }; }); head.height = 30;
    r = 5; var r0 = r;
    U.produk.forEach(function (p, i) {
      var tp = tipeOf(U, p), pre = 'produk.' + i + '.', nm = f(pre + 'nama');
      ws.getCell('A' + r).value = { formula: 'IF(' + nm + '="","(produk ' + (i + 1) + ')",' + nm + ')' };
      if (tp === 'unit') {
        var sumB = ['hppB', 'hppC', 'hppD'].map(function (k) { return 'SUM(' + rng(pre + k, 1) + ')'; }).join('+');
        ws.getCell('B' + r).value = { formula: 'SUM(' + rng(pre + 'hppA', 1) + ')*(1+N(' + f(pre + 'susutPct') + ')/100)+' + sumB };
        ws.getCell('C' + r).value = { formula: 'N(' + f(pre + 'harga') + ')-B' + r };
        ws.getCell('D' + r).value = { formula: 'N(' + f(pre + 'harga') + ')*N(' + f(pre + 'volume') + ')' };
        ws.getCell('E' + r).value = { formula: 'C' + r + '*N(' + f(pre + 'volume') + ')' };
      } else if (tp === 'omzet') {
        ws.getCell('B' + r).value = '-'; ws.getCell('C' + r).value = '-';
        ws.getCell('D' + r).value = { formula: 'N(' + f(pre + 'omzet') + ')' };
        ws.getCell('E' + r).value = { formula: 'N(' + f(pre + 'omzet') + ')*N(' + f(pre + 'margin') + ')/100' };
      } else {
        var hn = 'N(' + f(pre + 'hasil') + ')*(1-N(' + f(pre + 'matiPct') + ')/100)', pr = 'N(' + f(pre + 'harga') + ')', sk = 'MAX(1,N(' + f(pre + 'siklus') + '))', jb = 'N(' + f(pre + 'jumlah') + ')';
        ws.getCell('B' + r).value = { formula: 'SUM(' + rng(pre + 'biayaBatch', 1) + ')' };
        ws.getCell('C' + r).value = { formula: hn + '*' + pr + '-B' + r };
        ws.getCell('D' + r).value = { formula: hn + '*' + pr + '*' + jb + '/' + sk };
        ws.getCell('E' + r).value = { formula: 'C' + r + '*' + jb + '/' + sk };
      }
      ws.getCell('F' + r).value = { formula: 'IF(D' + r + '>0,E' + r + '/D' + r + ',0)' };
      ['B', 'C', 'D', 'E'].forEach(function (c) { ws.getCell(c + r).numFmt = '#,##0'; }); ws.getCell('F' + r).numFmt = '0.0%';
      for (var k = 0; k < 6; k++) ws.getCell(colL(k) + r).border = box();
      r++;
    });
    var r1 = r - 1; r++;
    function line(label, formula, fmt, bold) { ws.getCell('A' + r).value = label; var c = ws.getCell('B' + r); c.value = { formula: formula }; c.numFmt = fmt || '#,##0'; ws.getCell('A' + r).border = box(); c.border = box(); c.fill = fillOf(C.calc); if (bold) { ws.getCell('A' + r).font = { bold: true }; c.font = { bold: true }; } var rr = r; r++; return 'B' + rr; }
    var pj = line('Penjualan per bulan', 'SUM(D' + r0 + ':D' + r1 + ')');
    var kon = line('Kontribusi per bulan sebelum biaya persen', 'SUM(E' + r0 + ':E' + r1 + ')');
    var yes = function (p) { return f(p) + '="Ya"'; };
    var pctVar = line('Biaya variabel persen penjualan (%)', 'IF(' + yes('q.marketplace.on') + ',N(' + f('q.marketplace.pct') + '),0)+SUMIF(' + rng('biayaLain', 3 - 1) + ',"Variabel persen penjualan (%)",' + rng('biayaLain', 1) + ')', '0.00');
    var konN = line('Kontribusi bersih per bulan', kon + '-' + pj + '*' + pctVar + '/100');
    var tetap = line('Biaya tetap per bulan', 'SUM(' + rng('biayaTetap', 1) + ')+IF(' + yes('q.sewa.on') + ',N(' + f('q.sewa.nilai') + '),0)+IF(' + yes('q.karyawan.on') + ',N(' + f('q.karyawan.nilai') + '),0)+IF(' + yes('q.kendaraan.on') + ',N(' + f('q.kendaraan.nilai') + '),0)+SUMIF(' + rng('biayaLain', 2) + ',"Tetap per bulan (Rp)",' + rng('biayaLain', 1) + ')');
    var dl = A.l['aset'];
    var dep = line('Penyusutan aset per bulan', 'SUM(Input!$D$' + dl.r0 + ':$D$' + dl.r1 + ')');
    var laba = line('Laba usaha per bulan (perkiraan)', konN + '-' + tetap + '-' + dep, '#,##0', true);
    line('Titik impas penjualan per bulan (perkiraan)', 'IF(' + pj + '>0,IF(' + konN + '>0,(' + tetap + '+' + dep + ')/(' + konN + '/' + pj + '),0),0)', '#,##0', true);
    line('Total nilai aset tetap', 'SUM(' + rng('aset', 1) + ')');
    ws.getCell('A' + (r + 1)).value = 'Sel pada lembar ini berisi rumus dan terkunci. Ubah angka hanya di lembar Input.'; ws.getCell('A' + (r + 1)).font = { size: 9, italic: true, color: { argb: C.mut } };
    brandRow(ws, r + 3); footerOf(ws); lock(ws);
    return ws;
  }

  function writePetunjuk(wb, U, opts) {
    var ws = wb.addWorksheet('Petunjuk', { views: [{ showGridLines: false }], properties: { tabColor: { argb: 'FFF2B33D' } } });
    ws.columns = [{ width: 110 }];
    var lines = [['Modalogi · ' + (opts.template ? 'Template Excel' : 'Laporan Excel'), 't'], ['Clear plans, clearer numbers.', 's'], ['', ''],
      ['Usaha: ' + usahaLabel(U) + ' · Skema: ' + (U.skema === 'syariah' ? 'Syariah' : 'Konvensional') + ' · ' + U.produk.length + ' ' + (U.jenis === 'dagang' ? 'kategori' : (U.jenis === 'ternak' || U.jenis === 'tani' ? 'komoditas' : 'produk atau layanan')), 'b'], ['', ''],
      ['Cara memakai', 'h'], ['1. Isi hanya sel berlatar biru muda di lembar Input. Sel lain terkunci agar rumus tidak rusak (tanpa kata sandi).', ''], ['2. Baris kosong di tiap daftar disediakan untuk komponen tambahan. Biaya yang tidak ada cukup dikosongkan.', ''],
      ['3. Lembar Ringkasan menampilkan perkiraan cepat dengan rumus Excel.', ''], ['4. Unggah berkas ini di Modalogi (menu Beranda, Unggah Excel) untuk analisis lengkap: laba rugi 12 bulan, arus kas, kelayakan, sensitivitas, dan pembiayaan.', ''],
      ['5. Jangan mengubah nama lembar, menghapus lembar, atau memindahkan sel. Struktur isian dikenali oleh Modalogi.', ''], ['', ''],
      ['Penting', 'h'], ['Alat edukasi dan simulasi, bukan nasihat keuangan. Hasil bergantung pada angka yang dimasukkan.', ''], ['', ''], [BRAND + ' · Kerangka KUBAH dan Kalender Berkah © mrk29.', 'm']];
    lines.forEach(function (l, i) { var c = ws.getCell('A' + (i + 1)); c.value = l[0]; c.alignment = { wrapText: true, vertical: 'top' }; if (l[1] === 't') c.font = { size: 18, bold: true, color: { argb: C.band } }; else if (l[1] === 's') c.font = { size: 11, italic: true, color: { argb: C.mut } }; else if (l[1] === 'h') c.font = { size: 12, bold: true, color: { argb: C.ink } }; else if (l[1] === 'b') c.font = { bold: true }; else if (l[1] === 'm') c.font = { size: 9, italic: true, color: { argb: C.mut } }; });
    footerOf(ws); lock(ws);
  }

  function writeMeta(wb, U, META, opts) {
    var ws = wb.addWorksheet('_meta'); ws.state = 'veryHidden';
    var struct = { jenis: U.jenis, preset: U.preset || 'kosong', usahaLain: U.usahaLain || '', tipe: U.produk.map(function (p) { return tipeOf(U, p); }), kind: opts.template ? 'template' : 'laporan' };
    META.struct = struct;
    var json = JSON.stringify(META), parts = []; for (var i = 0; i < json.length; i += 24000) parts.push(json.slice(i, i + 24000));
    ws.getCell('A1').value = 'MODALOGI'; ws.getCell('B1').value = 'mrk29'; ws.getCell('C1').value = '© 2026 mrk29'; ws.getCell('A2').value = 'schema'; ws.getCell('B2').value = SCHEMA_V; ws.getCell('A3').value = 'parts'; ws.getCell('B3').value = parts.length;
    parts.forEach(function (p, i) { ws.getCell('A' + (4 + i)).value = p; });
  }

  /* ---------- lembar hasil (laporan) ---------- */
  function monthHeads(U) { var a = []; for (var i = 0; i < 12; i++) a.push(MONTHS[((U.bulanMulai || 0) + i) % 12].slice(0, 3) + ' ' + (i + 1)); return a; }
  function writeHasil(wb, U, R) {
    var ws = wb.addWorksheet('Hasil', { views: [{ showGridLines: false }], properties: { tabColor: { argb: 'FF12A879' } } });
    ws.columns = [{ width: 40 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    var K = R.kelayakan, vi = verdictOf(R);
    ws.mergeCells('A1:F1'); var t = ws.getCell('A1'); t.value = 'Hasil analisis · ' + (U.nama || usahaLabel(U)); t.font = { size: 16, bold: true, color: { argb: C.white } }; t.fill = fillOf(C.band); ws.getRow(1).height = 30; t.alignment = { vertical: 'middle' };
    ws.getCell('A2').value = 'Status'; ws.getCell('B2').value = vi.t; ws.getCell('B2').font = { bold: true, color: { argb: vi.c === 'ok' ? C.pos : (vi.c === 'bad' ? C.neg : C.ink) } };
    var rows = [['Titik impas per bulan (Rp)', R.bep.rupiah, '#,##0'], ['Laba bersih rata-rata per bulan (Rp)', R.total12.labaBersih / 12, '#,##0'], ['Pendapatan 12 bulan (Rp)', R.total12.pendapatan, '#,##0'], ['Laba bersih 12 bulan (Rp)', R.total12.labaBersih, '#,##0'], ['Kebutuhan modal (Rp)', R.modal.total, '#,##0'], ['Investasi aset tetap (Rp)', R.modal.investasi, '#,##0'], ['Balik modal (bulan)', K.paybackBulan > 0 && isFinite(K.paybackBulan) ? K.paybackBulan : 'Belum kembali', '0.0'], ['ROI', K.roi, '0.0%'], ['NPV diskonto dasar (Rp)', K.npv, '#,##0'], ['NPV diskonto tinggi (Rp)', K.npvTinggi, '#,##0'], ['NPV diskonto sangat tinggi (Rp)', K.npvSangatTinggi, '#,##0'], ['IRR', K.irrAda ? K.irr : 'Tidak terhitung', '0.0%'], ['Indeks profitabilitas', K.pi, '0.00'], ['Saldo kas terendah (Rp)', R.saldoMin, '#,##0'], ['Horizon kelayakan (tahun)', K.horizon, '0']];
    var r = 4; ws.getCell('A' + r).value = 'Ringkasan'; ws.getCell('A' + r).font = { bold: true }; r++;
    rows.forEach(function (x) { ws.getCell('A' + r).value = x[0]; var c = ws.getCell('B' + r); c.value = x[1]; c.numFmt = x[2]; ws.getCell('A' + r).border = box(); c.border = box(); r++; });
    r++; if (R.cek.length) { ws.getCell('A' + r).value = 'Catatan'; ws.getCell('A' + r).font = { bold: true }; r++; R.cek.forEach(function (c) { ws.mergeCells('A' + r + ':F' + r); ws.getCell('A' + r).value = '- ' + c.teks; ws.getCell('A' + r).alignment = { wrapText: true }; r++; }); }
    r++; ws.getCell('A' + r).value = 'Tiga skenario volume (bulan pertama)'; ws.getCell('A' + r).font = { bold: true }; r++;
    ['Skenario', 'Penjualan (Rp)', 'Laba bersih (Rp)', 'Kali titik impas'].forEach(function (h, i) { var c = ws.getCell(colL(i) + r); c.value = h; c.font = { bold: true }; c.fill = fillOf(C.sec); c.border = box(); }); r++;
    ['Volume turun 20%', 'Dasar', 'Volume naik 20%'].forEach(function (n, i) { var s = R.skenario[i]; ws.getCell('A' + r).value = n; ws.getCell('B' + r).value = s.pendapatan; ws.getCell('C' + r).value = s.labaBersih; ws.getCell('D' + r).value = s.kaliBep || 0; ws.getCell('B' + r).numFmt = '#,##0'; ws.getCell('C' + r).numFmt = '#,##0'; ws.getCell('D' + r).numFmt = '0.0'; for (var k = 0; k < 4; k++) ws.getCell(colL(k) + r).border = box(); r++; });
    brandRow(ws, r + 2); footerOf(ws); lock(ws);
  }
  function monthSheet(wb, name, U, tabArgb, rowsDef, title) {
    var ws = wb.addWorksheet(name, { views: [{ state: 'frozen', xSplit: 1, ySplit: 3, showGridLines: false }], properties: { tabColor: { argb: tabArgb } } });
    ws.columns = [{ width: 38 }].concat(monthHeads(U).map(function () { return { width: 13 }; })).concat([{ width: 16 }]);
    ws.mergeCells('A1:N1'); var t = ws.getCell('A1'); t.value = title; t.font = { size: 14, bold: true, color: { argb: C.white } }; t.fill = fillOf(C.band); ws.getRow(1).height = 26; t.alignment = { vertical: 'middle' };
    ws.getRow(3).values = ['Uraian'].concat(monthHeads(U)).concat(['Total']); ws.getRow(3).eachCell(function (c) { c.font = { bold: true, size: 10 }; c.fill = fillOf(C.sec); c.border = box(); c.alignment = { horizontal: 'center' }; });
    var r = 4;
    rowsDef.forEach(function (d) {
      if (d.sec) { ws.mergeCells('A' + r + ':N' + r); var s = ws.getCell('A' + r); s.value = d.sec; s.font = { bold: true }; s.fill = fillOf(C.sec); r++; return; }
      ws.getCell('A' + r).value = d.n; ws.getCell('A' + r).border = box(); if (d.tot) ws.getCell('A' + r).font = { bold: true };
      d.v.forEach(function (x, i) { var c = ws.getCell(colL(i + 1) + r); c.value = x; c.numFmt = '#,##0;[Red]-#,##0'; c.border = box(); if (d.tot) c.font = { bold: true }; });
      if (d.total !== false) { var tc = ws.getCell('N' + r); tc.value = { formula: 'SUM(B' + r + ':M' + r + ')' }; tc.numFmt = '#,##0;[Red]-#,##0'; tc.border = box(); tc.font = { bold: true }; }
      r++;
    });
    brandRow(ws, r + 1); footerOf(ws); lock(ws); return ws;
  }
  function writeLaporan(wb, U, R) {
    var L = R.laba, K = R.kas, ng = function (a) { return a.map(function (x) { return -x; }); };
    var syr = U.skema === 'syariah';
    var lr = [{ n: 'Pendapatan', v: L.pendapatan }, { n: 'Harga pokok penjualan', v: ng(L.hpp) }, { n: 'Laba kotor', v: L.labaKotor, tot: true }, { n: 'Biaya variabel (persen penjualan)', v: ng(L.pendapatan.map(function (x) { return x * L.biayaVarPct; })) }, { n: 'Biaya tetap', v: ng(L.biayaTetap) }, { n: 'Penyusutan dan amortisasi', v: ng(L.penyusutan) }, { n: 'Laba usaha (EBIT)', v: L.ebit, tot: true }, { n: syr ? 'Beban margin atau sewa pembiayaan' : 'Beban bunga', v: ng(L.bebanPembiayaan) }, { n: 'Laba sebelum pajak', v: L.lsp }, { n: 'Pajak final', v: ng(L.pajak) }, { n: 'Laba bersih', v: L.labaBersih, tot: true }];
    if (syr) lr.push({ sec: 'Pembagian laba bersih (akad)' }, { n: 'Pemilik modal', v: L.bagiPemilik }, { n: 'Pengelola', v: L.bagiPengelola }, { n: 'Wakaf atau dana sosial', v: L.bagiWakaf });
    monthSheet(wb, 'LabaRugi', U, 'FF1F5FD6', lr, 'Laba rugi 12 bulan (Rp)');
    var kas = [{ sec: 'Kas masuk' }, { n: 'Penjualan tunai', v: K.penjualanTunai }, { n: 'Penagihan piutang', v: K.piutang || K.penjualanTunai.map(function () { return 0; }) }, { n: 'Modal dan pembiayaan masuk', v: K.modalMasuk }, { n: 'Kas masuk lain', v: K.masukLain }, { n: 'Total kas masuk', v: K.totalMasuk, tot: true },
      { sec: 'Kas keluar' }, { n: 'Bahan dan barang', v: ng(K.bahan) }, { n: 'Biaya tetap tunai', v: ng(K.tetap) }, { n: 'Biaya variabel persen', v: ng(K.varPct) }, { n: 'Angsuran pembiayaan', v: ng(K.angsuran) }, { n: 'Pajak', v: ng(K.pajak) }, { n: 'Bagi hasil dan wakaf', v: ng(K.bhPemilik.map(function (x, i) { return x + K.bhPengelola[i] + K.bhWakaf[i]; })) }, { n: 'Belanja aset dan modal awal', v: ng(K.capex) }, { n: 'Kas keluar lain', v: ng(K.keluarLain) }, { n: 'Total kas keluar', v: ng(K.totalKeluar), tot: true },
      { n: 'Arus kas bersih', v: K.bersih, tot: true }, { n: 'Saldo akhir bulan', v: K.saldoAkhir, total: false }];
    monthSheet(wb, 'ArusKas', U, 'FF12A879', kas, 'Arus kas 12 bulan (Rp)');
    var ws = wb.addWorksheet('Kelayakan', { views: [{ showGridLines: false }], properties: { tabColor: { argb: 'FFF2B33D' } } });
    ws.columns = [{ width: 40 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    var Kk = R.kelayakan, T = R.tahunan;
    ws.mergeCells('A1:F1'); var t = ws.getCell('A1'); t.value = 'Kelayakan dan proyeksi tahunan'; t.font = { size: 14, bold: true, color: { argb: C.white } }; t.fill = fillOf(C.band); ws.getRow(1).height = 26; t.alignment = { vertical: 'middle' };
    var r = 3;
    [['Skenario', 'Diskonto', 'NPV (Rp)']].concat([['Dasar', Kk.diskonto, Kk.npv], ['Tinggi', Kk.dTinggi, Kk.npvTinggi], ['Sangat tinggi', Kk.dSangatTinggi, Kk.npvSangatTinggi]]).forEach(function (x, i) { for (var k = 0; k < 3; k++) { var c = ws.getCell(colL(k) + r); c.value = x[k]; c.border = box(); if (i === 0) { c.font = { bold: true }; c.fill = fillOf(C.sec); } else if (k === 1) c.numFmt = '0.0%'; else if (k === 2) c.numFmt = '#,##0;[Red]-#,##0'; } r++; });
    r++; ws.getCell('A' + r).value = 'Proyeksi tahunan (Rp)'; ws.getCell('A' + r).font = { bold: true }; r++;
    ws.getRow(r).values = ['Uraian'].concat(T.tahun.map(function (y, i) { return 'Tahun ' + y + (T.inHorizon[i] ? '' : ' (luar horizon)'); })); ws.getRow(r).eachCell(function (c) { c.font = { bold: true, size: 10 }; c.fill = fillOf(C.sec); c.border = box(); c.alignment = { wrapText: true }; }); r++;
    [['Pendapatan', 'pendapatan'], ['Laba bersih', 'labaBersih'], ['Arus kas (tanpa modal awal)', 'arusKas']].forEach(function (x) { ws.getCell('A' + r).value = x[0]; ws.getCell('A' + r).border = box(); T[x[1]].forEach(function (v, i) { var c = ws.getCell(colL(i + 1) + r); c.value = v; c.numFmt = '#,##0;[Red]-#,##0'; c.border = box(); }); r++; });
    brandRow(ws, r + 2); footerOf(ws); lock(ws);
  }

  function build(U, opts) {
    opts = opts || {};
    var wb = new ExcelJS.Workbook(); setProps(wb, (opts.template ? 'Template Modalogi · ' : 'Laporan Modalogi · ') + (U.nama || usahaLabel(U)));
    writePetunjuk(wb, U, opts);
    var S = schemaOf(U), W = writeInput(wb, U, S, opts);
    writeQuick(wb, U, W);
    if (!opts.template && opts.R) { writeHasil(wb, U, opts.R); writeLaporan(wb, U, opts.R); }
    writeMeta(wb, U, W.META, opts);
    // urutan: Petunjuk, Input, Ringkasan, hasil...
    return wb;
  }
  function toBlob(buf) { return new Blob([buf], { type: MIME }); }
  function makeTemplate(U) { return build(U, { template: true }).xlsx.writeBuffer().then(toBlob); }
  function makeReport(U, R) { return build(U, { template: false, R: R }).xlsx.writeBuffer().then(toBlob); }

  /* ---------- baca balik ---------- */
  function cv(cell) {
    var v = cell ? cell.value : null;
    if (v && typeof v === 'object') { if (v.result !== undefined) return v.result; if (v.richText) return v.richText.map(function (x) { return x.text; }).join(''); if (v.text !== undefined) return v.text; if (v instanceof Date) return v; }
    return v === undefined ? null : v;
  }
  function parseRef(ref) { var m = /^'?([^'!]+)'?!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/.exec(ref); if (!m) return null; function cn(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n; } return { sheet: m[1], c0: cn(m[2]), r0: +m[3], c1: m[4] ? cn(m[4]) : cn(m[2]), r1: m[5] ? +m[5] : +m[3] }; }
  function names(wb) { var map = {}; try { (wb.definedNames.model || []).forEach(function (d) { if (d.ranges && d.ranges.length) map[d.name] = d.ranges[0]; }); } catch (e) { } return map; }
  function convert(type, opts, raw, warn, where) {
    if (type === 'bool') { var s = String(raw === null ? '' : raw).trim().toLowerCase(); return s === 'ya' || s === 'true' || s === '1' || s === 'yes'; }
    if (type === 'sel') { var o = opts.map(function (x) { return { v: x[0], l: x[1] }; }); if (raw === null || raw === '') return undefined; var v = optValue(o, raw); if (v === undefined) { warn.push(where + ': pilihan "' + raw + '" tidak dikenal.'); return undefined; } return v; }
    if (type === 'num' || type === 'rp') { if (raw === null || raw === '') return 0; var n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/\./g, '').replace(',', '.')); if (!isFinite(n)) { warn.push(where + ': angka tidak terbaca ("' + raw + '").'); return 0; } return n; }
    return raw === null || raw === undefined ? '' : String(raw).trim();
  }
  function readWb(wb) {
    var meta = wb.getWorksheet('_meta'); if (!meta || cv(meta.getCell('A1')) !== 'MODALOGI') throw new Error('Berkas ini bukan template atau laporan Modalogi. Unduh template dari Beranda lalu isi.');
    var nparts = +cv(meta.getCell('B3')) || 0, json = ''; for (var i = 0; i < nparts; i++) json += cv(meta.getCell('A' + (4 + i))) || '';
    var M = JSON.parse(json); if (M.v > SCHEMA_V) throw new Error('Berkas dibuat dengan versi Modalogi yang lebih baru. Perbarui halaman ini.');
    var warn = [], NM = names(wb), U = baseU(), st = M.struct;
    U.jenis = st.jenis; U.preset = st.preset; U.usahaLain = st.usahaLain || '';
    U.produk = st.tipe.map(function (t) { return emptyProduk(st.jenis, t); });
    U.biayaTetap = []; U.aset = []; U.biayaLain = []; U.kejadian = [];
    function sheetOf(sh) { return wb.getWorksheet(sh); }
    M.fields.forEach(function (f) {
      var p = parseRef(NM[f.n] || ''); if (!p) { warn.push('Isian ' + f.p + ' tidak ditemukan (nama rentang hilang).'); return; }
      var ws = sheetOf(p.sheet); if (!ws) return;
      var v = convert(f.t, f.o, cv(ws.getRow(p.r0).getCell(p.c0)), warn, f.p);
      if (v !== undefined || f.t === 'text') setP(U, f.p, v === undefined ? getP(U, f.p) : v);
    });
    M.arrs.forEach(function (a) {
      var p = parseRef(NM[a.n] || ''); if (!p) return; var ws = sheetOf(p.sheet), out = [];
      for (var i = 0; i < a.len; i++) { var v = convert('sel', a.o, cv(ws.getRow(p.r0 + i).getCell(p.c0)), warn, a.p + ' ' + (i + 1)); out.push(v === undefined ? a.o[3 % a.o.length][0] : v); }
      setP(U, a.p, out);
    });
    M.lists.forEach(function (l) {
      var p = parseRef(NM[l.n] || ''); if (!p) { warn.push('Daftar ' + l.p + ' tidak ditemukan.'); return; } var ws = sheetOf(p.sheet), out = [];
      for (var r = p.r0; r <= p.r1; r++) {
        var row = {}, any = false;
        l.cols.forEach(function (c, ci) {
          var raw = cv(ws.getRow(r).getCell(p.c0 + ci)), empty = raw === null || raw === '' || raw === 0;
          if (c.key === 'produk') { var s = String(raw === null ? '' : raw).trim().toLowerCase(); row.produk = (s === '' || s === 'semua') ? 'semua' : (parseInt(s, 10) - 1); if (!(row.produk === 'semua' || row.produk >= 0)) row.produk = 'semua'; return; }
          if (c.type === 'sel' && (raw === null || raw === '')) { row[c.key] = c.o[0][0]; return; }
          if (!empty && c.type !== 'sel') any = true; if (!empty && c.type === 'sel' && c.key !== 'jenis' && c.key !== 'tahap') any = true;
          row[c.key] = convert(c.type, c.o, raw, warn, l.p + ' baris ' + (r - p.r0 + 1));
        });
        if (!any) continue;
        if (row.jenis === undefined && l.cols.some(function (c) { return c.key === 'jenis'; })) row.jenis = 'tetap';
        out.push(row);
      }
      setP(U, l.p, out);
    });
    // produk kosong (nama kosong, semua angka nol) dibuang, minimal satu tersisa
    var keepIdx = []; U.produk.forEach(function (p, i) { var any = !!(p.nama && p.nama.trim()) || p.harga > 0 || p.omzet > 0 || p.volume > 0 || p.hasil > 0; if (any) keepIdx.push(i); });
    if (!keepIdx.length) throw new Error('Belum ada produk, kategori, atau komoditas yang terisi. Isi minimal nama dan harga atau penjualan.');
    if (keepIdx.length < U.produk.length) {
      var map = {}; keepIdx.forEach(function (o, n) { map[o] = n; }); U.produk = keepIdx.map(function (i) { return U.produk[i]; });
      U.biayaLain.forEach(function (b) { if (typeof b.produk === 'number') b.produk = map[b.produk] !== undefined ? map[b.produk] : 'semua'; });
      warn.push('Produk kosong diabaikan.');
    }
    U.biayaLain.forEach(function (b) { if (typeof b.produk === 'number' && b.produk >= U.produk.length) b.produk = 'semua'; });
    return { U: U, warn: warn, kind: st.kind };
  }
  function readBuffer(buf) { var wb = new ExcelJS.Workbook(); return wb.xlsx.load(buf).then(function () { return readWb(wb); }); }

  return { build: build, makeTemplate: makeTemplate, makeReport: makeReport, readBuffer: readBuffer, readWb: readWb, schemaOf: schemaOf, BRAND: BRAND, MIME: MIME };
})();
