/* Modalogi: ekspor PDF (laporan hasil dan kanvas). Memerlukan jsPDF dan jspdf-autotable. */
var PDFX = (function () {
  var BRAND = 'Modalogi · © 2026 mrk29';
  var CL = { band: [31, 95, 214], ink: [20, 33, 61], mut: [107, 106, 102], line: [232, 224, 210], cream: [250, 246, 239], pos: [18, 168, 121], neg: [200, 85, 61], sec: [245, 239, 226], acc: [242, 179, 61] };
  function JS() { return (window.jspdf && window.jspdf.jsPDF) || window.jsPDF; }
  function newDoc(orient, title) {
    var d = new (JS())({ orientation: orient || 'portrait', unit: 'pt', format: 'a4', compress: true });
    d.setProperties({ title: title, subject: 'Modalogi: rencana keuangan dan kanvas model bisnis', author: 'mrk29', keywords: 'Modalogi, mrk29, rencana keuangan', creator: 'Modalogi (c) 2026 mrk29' });
    return d;
  }
  function fx(n) { n = Math.round(+n || 0); return (n < 0 ? '-' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function rpx(n) { return (n < 0 ? '-Rp ' : 'Rp ') + fx(Math.abs(n)); }
  function pc(n, d) { return (+n * 100).toFixed(d === undefined ? 1 : d).replace('.', ',') + '%'; }
  function ascii(s) { return String(s === undefined || s === null ? '' : s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, ''); }

  function svgPng(svg, wpx) {
    return new Promise(function (res) {
      try {
        var s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s); if (!m) return res(null);
        var w = wpx || 1500, h = Math.round(w * (+m[2]) / (+m[1])), img = new Image();
        img.onload = function () { try { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h); res({ url: cv.toDataURL('image/png'), r: h / w }); } catch (e) { res(null); } };
        img.onerror = function () { res(null); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      } catch (e) { res(null); }
    });
  }

  function chrome(d, titleLine, subLine) {
    var w = d.internal.pageSize.getWidth();
    d.setFillColor.apply(d, CL.band); d.rect(0, 0, w, 62, 'F');
    d.setFillColor(250, 246, 239); d.roundedRect(34, 14, 44, 34, 6, 6, 'F');
    try { if (typeof LOGO_B64 !== 'undefined') d.addImage(LOGO_B64, 'PNG', 38, 18, 36, 26); } catch (e) { }
    d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(18); d.text('MODALOGI', 90, 33, { charSpace: 1.5 });
    d.setFont('helvetica', 'italic'); d.setFontSize(9); d.text('Clear plans, clearer numbers.', 90, 48);
    if (titleLine) { d.setFont('helvetica', 'normal'); d.setFontSize(9); d.text(ascii(titleLine), w - 34, 33, { align: 'right' }); }
    if (subLine) { d.setFontSize(8); d.text(ascii(subLine), w - 34, 48, { align: 'right' }); }
    d.setTextColor.apply(d, CL.ink);
  }
  function footers(d) {
    var n = d.internal.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      d.setPage(i); var w = d.internal.pageSize.getWidth(), h = d.internal.pageSize.getHeight();
      d.setDrawColor.apply(d, CL.line); d.line(34, h - 34, w - 34, h - 34);
      d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor.apply(d, CL.mut);
      d.text(BRAND + ' · Alat edukasi dan simulasi, bukan nasihat keuangan.', 34, h - 22);
      d.text('Halaman ' + i + ' dari ' + n, w - 34, h - 22, { align: 'right' });
    }
  }
  function H(d, y, text) { d.setFont('helvetica', 'bold'); d.setFontSize(12); d.setTextColor.apply(d, CL.ink); d.text(ascii(text), 34, y); d.setDrawColor.apply(d, CL.acc); d.setLineWidth(1.5); d.line(34, y + 4, 64, y + 4); d.setLineWidth(0.5); return y + 20; }
  function para(d, y, text, opt) { opt = opt || {}; d.setFont('helvetica', opt.bold ? 'bold' : 'normal'); d.setFontSize(opt.size || 9); d.setTextColor.apply(d, opt.color || CL.ink); var w = d.internal.pageSize.getWidth() - 68, lines = d.splitTextToSize(ascii(text), w); d.text(lines, 34, y); return y + lines.length * (opt.lh || 12) + 4; }
  function tbl(d, y, head, body, o) {
    o = o || {};
    d.autoTable({ startY: y, head: [head], body: body, theme: 'grid', margin: { left: 34, right: 34, bottom: 44 },
      styles: { font: 'helvetica', fontSize: o.fs || 8.5, cellPadding: o.pad || 3.5, lineColor: CL.line, lineWidth: 0.4, textColor: CL.ink, overflow: 'linebreak' },
      headStyles: { fillColor: CL.band, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [253, 251, 246] }, columnStyles: o.cols || {},
      didParseCell: function (data) {
        var row = body[data.row.index];
        if (data.section === 'body') { if (row && row._tot) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = CL.sec; } if (row && row._sec) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = CL.sec; } if (data.column.index > 0 && o.num !== false) { data.cell.styles.halign = 'right'; var t = String(data.cell.raw); if (t.charAt(0) === '-') data.cell.styles.textColor = CL.neg; } }
      } });
    return d.lastAutoTable.finalY + 12;
  }
  function mhead(U) { var a = ['Uraian']; for (var i = 0; i < 12; i++) a.push(MONTHS[((U.bulanMulai || 0) + i) % 12].slice(0, 3)); a.push('Total'); return a; }
  function mrow(n, arr, o) { var r = [n]; arr.forEach(function (x) { r.push(fx(x)); }); r.push(o && o.noTotal ? '' : fx(arr.reduce(function (a, b) { return a + b; }, 0))); if (o && o.tot) r._tot = true; return r; }

  function kpiBox(d, x, y, w, h, label, val, sub) {
    d.setFillColor(255, 253, 248); d.setDrawColor.apply(d, CL.line); d.roundedRect(x, y, w, h, 6, 6, 'FD');
    d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor.apply(d, CL.mut); d.text(ascii(label), x + 8, y + 14);
    d.setFont('helvetica', 'bold'); d.setFontSize(12); d.setTextColor.apply(d, CL.ink); d.text(ascii(val), x + 8, y + 31);
    if (sub) { d.setFont('helvetica', 'normal'); d.setFontSize(7); d.setTextColor.apply(d, CL.mut); d.text(ascii(sub), x + 8, y + 43); }
  }
  function cmpx(n) { var a = Math.abs(n), s = n < 0 ? '-' : ''; if (a >= 1e9) return s + 'Rp ' + (a / 1e9).toFixed(1).replace('.', ',') + ' mi'; if (a >= 1e6) return s + 'Rp ' + (a / 1e6).toFixed(1).replace('.', ',') + ' jt'; if (a >= 1e3) return s + 'Rp ' + Math.round(a / 1e3) + ' rb'; return s + 'Rp ' + Math.round(a); }

  function report(U, R) {
    var K = R.kelayakan, vi = verdictOf(R), nm = U.nama || usahaLabel(U);
    var d = newDoc('portrait', 'Laporan Modalogi · ' + nm);
    var W = d.internal.pageSize.getWidth();
    chrome(d, nm, usahaLabel(U) + ' · ' + (U.skema === 'syariah' ? 'Syariah' : 'Konvensional'));
    var y = 86;
    var vc = { ok: [223, 244, 236], mid: [252, 240, 214], bad: [247, 227, 221], isi: [231, 238, 251] }[vi.c];
    d.setFillColor.apply(d, vc); d.setDrawColor.apply(d, CL.line); d.roundedRect(34, y, W - 68, 52, 8, 8, 'FD');
    d.setFont('helvetica', 'bold'); d.setFontSize(15); d.setTextColor.apply(d, CL.ink); d.text(ascii(vi.t), 48, y + 24);
    var msg = vi.c === 'ok' ? 'Laba positif, arus kas bertahan, dan NPV positif pada tiga tingkat diskonto.' : (vi.c === 'mid' ? 'Menjanjikan, tetapi ada syarat atau titik rawan yang perlu dijaga.' : (vi.c === 'bad' ? 'Pada asumsi saat ini belum memenuhi ukuran kelayakan.' : 'Beberapa isian penting masih kosong.'));
    d.setFont('helvetica', 'normal'); d.setFontSize(9); d.text(ascii(msg), 48, y + 40);
    y += 66;
    var pb = K.paybackBulan > 0 && isFinite(K.paybackBulan) ? Math.round(K.paybackBulan) + ' bulan' : 'Belum kembali';
    var kp = [['Titik impas', cmpx(R.bep.rupiah) + '/bln', 'Penjualan per bulan'], ['Laba bersih rata-rata', cmpx(R.total12.labaBersih / 12) + '/bln', 'Margin ' + pc(R.total12.pendapatan > 0 ? R.total12.labaBersih / R.total12.pendapatan : 0, 1)], ['Kebutuhan modal', cmpx(R.modal.total), 'Investasi ' + cmpx(R.modal.investasi)], ['Balik modal', pb, 'Dari arus kas bersih'],
      ['NPV (diskonto ' + pc(K.diskonto, 1) + ')', cmpx(K.npv), 'Horizon ' + K.horizon + ' tahun'], ['IRR', K.irrAda ? pc(K.irr, 0) : '-', 'Indeks profitabilitas ' + (+K.pi).toFixed(2).replace('.', ',')], ['Saldo kas terendah', cmpx(R.saldoMin), R.saldoMin < 0 ? 'Perlu penyangga dana' : 'Tidak pernah defisit'], ['Bulan laba positif', R.bulanLabaPositif + ' dari 12', 'Laba bersih']];
    var bw = (W - 68 - 3 * 8) / 4;
    kp.forEach(function (k, i) { kpiBox(d, 34 + (i % 4) * (bw + 8), y + Math.floor(i / 4) * 54, bw, 46, k[0], k[1], k[2]); });
    y += 118;
    if (R.cek.length) { y = H(d, y, 'Catatan'); R.cek.forEach(function (c) { y = para(d, y, '- ' + c.teks, { size: 9 }); }); y += 4; }
    return Promise.all([svgPng(svgBars({ values: R.laba.labaBersih, labels: mhead(U).slice(1, 13), aria: 'Laba bersih per bulan' }), 1500), svgPng(svgBep(R), 1500), svgPng(svgTornado(ModalogiEngine.tornado(buildCfg(U), 0.1).slice().sort(function (a, b) { return Math.max(Math.abs(b.turun), Math.abs(b.naik)) - Math.max(Math.abs(a.turun), Math.abs(a.naik)); })), 1500)]).then(function (im) {
      function pic(img, y0, wd) { if (!img) return y0; var w = wd || (W - 68), h = w * img.r; if (y0 + h > d.internal.pageSize.getHeight() - 50) { d.addPage('a4', 'portrait'); chrome(d, nm, ''); y0 = 86; } d.addImage(img.url, 'PNG', 34, y0, w, h); return y0 + h + 10; }
      y = H(d, y, 'Laba bersih per bulan'); y = pic(im[0], y, W - 68 > 480 ? 480 : W - 68);
      y = H(d, y, 'Titik impas'); y = pic(im[1], y, 440);
      // Produk
      d.addPage('a4', 'portrait'); chrome(d, nm, 'Produk dan asumsi'); y = 86;
      y = H(d, y, 'Margin per ' + (U.jenis === 'dagang' ? 'kategori' : 'produk'));
      y = tbl(d, y, ['Nama', 'Harga atau penjualan', 'Biaya per satuan', 'Margin', 'Margin %'], produkRows(R, rpx, pc).map(function (r) { r[0] = ascii(r[0]); return r; }));
      y = H(d, y + 6, 'Biaya tetap dan modal');
      var bt = [['Biaya tetap per bulan', rpx(R.bep.biayaTetap)], ['Penyusutan dan amortisasi per bulan', rpx(R.modal.penyusutanBulan + R.modal.amortBulan)], ['Stok awal bahan atau barang', rpx(R.modal.modalKerja.stokAwal)], ['Kas cadangan', rpx(R.modal.modalKerja.kasCadangan)], ['Investasi aset tetap', rpx(R.modal.investasi)], ['Total kebutuhan modal', rpx(R.modal.total)]];
      bt[5]._tot = true; y = tbl(d, y, ['Komponen', 'Nilai'], bt, { cols: { 0: { cellWidth: 320 } } });
      var s = R.modal.sumber;
      y = H(d, y + 6, 'Sumber dana'); y = tbl(d, y, ['Sumber', 'Jumlah'], [['Modal sendiri', rpx(s.internal)], ['Pembiayaan eksternal', rpx(s.eksternal)], [U.skema === 'syariah' ? 'Dana sosial' : 'Hibah atau dana sosial', rpx(s.ziswaf)], ['Sumber lain', rpx(s.lainnya)]], { cols: { 0: { cellWidth: 320 } } });
      var P = R.pembiayaan;
      if (P.tenor > 0 && P.angsuranBulan1 > 0) { var kem = R.laba.labaBersih[0] + R.laba.penyusutan[0] + R.laba.bebanPembiayaan[0], ds = kem / P.angsuranBulan1; y = para(d, y, P.jenis + ': angsuran ' + rpx(P.angsuranBulan1) + ' per bulan, kemampuan bayar usaha bulan pertama ' + rpx(kem) + ', DSCR ' + ds.toFixed(2).replace('.', ',') + 'x (batas umum 1,25x).', { size: 9 }); }
      // Laba rugi (lanskap)
      d.addPage('a4', 'landscape'); chrome(d, nm, 'Laba rugi 12 bulan (Rp)'); var L = R.laba, ng = function (a) { return a.map(function (x) { return -x; }); }, syr = U.skema === 'syariah';
      y = 80; y = H(d, y, 'Laba rugi 12 bulan');
      var cols = { 0: { cellWidth: 140 } }; for (var c = 1; c <= 13; c++) cols[c] = { cellWidth: 'auto' };
      var lr = [mrow('Pendapatan', L.pendapatan), mrow('Harga pokok penjualan', ng(L.hpp)), mrow('Laba kotor', L.labaKotor, { tot: true }), mrow('Biaya variabel (persen)', ng(L.pendapatan.map(function (x) { return x * L.biayaVarPct; }))), mrow('Biaya tetap', ng(L.biayaTetap)), mrow('Penyusutan dan amortisasi', ng(L.penyusutan)), mrow('Laba usaha (EBIT)', L.ebit, { tot: true }), mrow(syr ? 'Beban margin atau sewa' : 'Beban bunga', ng(L.bebanPembiayaan)), mrow('Laba sebelum pajak', L.lsp), mrow('Pajak final', ng(L.pajak)), mrow('Laba bersih', L.labaBersih, { tot: true })];
      if (syr) { var sc = ['Pembagian laba bersih (akad)']; for (var q = 0; q < 13; q++) sc.push(''); sc._sec = true; lr.push(sc, mrow('Pemilik modal', L.bagiPemilik), mrow('Pengelola', L.bagiPengelola), mrow('Wakaf atau dana sosial', L.bagiWakaf)); }
      y = tbl(d, y, mhead(U), lr, { fs: 7, pad: 3, cols: cols });
      d.addPage('a4', 'landscape'); chrome(d, nm, 'Arus kas 12 bulan (Rp)'); y = 80; y = H(d, y, 'Arus kas 12 bulan');
      var Kc = R.kas, sec1 = ['Kas masuk']; for (q = 0; q < 13; q++) sec1.push(''); sec1._sec = true; var sec2 = ['Kas keluar']; for (q = 0; q < 13; q++) sec2.push(''); sec2._sec = true;
      var kas = [sec1, mrow('Penjualan tunai', Kc.penjualanTunai), mrow('Penagihan piutang', Kc.piutang || Kc.penjualanTunai.map(function () { return 0; })), mrow('Modal dan pembiayaan masuk', Kc.modalMasuk), mrow('Kas masuk lain', Kc.masukLain), mrow('Total kas masuk', Kc.totalMasuk, { tot: true }), sec2, mrow('Bahan dan barang', ng(Kc.bahan)), mrow('Biaya tetap tunai', ng(Kc.tetap)), mrow('Biaya variabel persen', ng(Kc.varPct)), mrow('Angsuran pembiayaan', ng(Kc.angsuran)), mrow('Pajak', ng(Kc.pajak)), mrow('Bagi hasil dan wakaf', ng(Kc.bhPemilik.map(function (x, i) { return x + Kc.bhPengelola[i] + Kc.bhWakaf[i]; }))), mrow('Belanja aset dan modal awal', ng(Kc.capex)), mrow('Kas keluar lain', ng(Kc.keluarLain)), mrow('Total kas keluar', ng(Kc.totalKeluar), { tot: true }), mrow('Arus kas bersih', Kc.bersih, { tot: true }), mrow('Saldo akhir bulan', Kc.saldoAkhir, { noTotal: true, tot: true })];
      y = tbl(d, y, mhead(U), kas, { fs: 7, pad: 3, cols: cols });
      // Kelayakan, skenario, sensitivitas
      d.addPage('a4', 'portrait'); chrome(d, nm, 'Kelayakan dan sensitivitas'); y = 86;
      y = H(d, y, 'Nilai sekarang bersih (NPV)');
      y = tbl(d, y, ['Skenario', 'Diskonto', 'NPV'], [['Dasar', pc(K.diskonto, 1), rpx(K.npv)], ['Tinggi', pc(K.dTinggi, 1), rpx(K.npvTinggi)], ['Sangat tinggi', pc(K.dSangatTinggi, 1), rpx(K.npvSangatTinggi)]], { cols: { 0: { cellWidth: 200 } } });
      y = para(d, y, 'Horizon ' + K.horizon + ' tahun. ROI ' + pc(K.roi, 0) + ', indeks profitabilitas ' + (+K.pi).toFixed(2).replace('.', ',') + ', balik modal ' + pb + (K.irrAda ? ', IRR ' + pc(K.irr, 0) : '') + '.', { size: 9 });
      var T = R.tahunan; y = H(d, y + 4, 'Proyeksi tahunan');
      y = tbl(d, y, ['Uraian'].concat(T.tahun.map(function (t, i) { return 'Tahun ' + t + (T.inHorizon[i] ? '' : '*'); })), [['Pendapatan'].concat(T.pendapatan.map(fx)), ['Laba bersih'].concat(T.labaBersih.map(fx)), ['Arus kas (tanpa modal awal)'].concat(T.arusKas.map(fx))], { fs: 8, cols: { 0: { cellWidth: 150 } } });
      y = para(d, y - 6, '* di luar horizon kelayakan. Tahun ke-2 dan seterusnya diekstrapolasi dari hasil 12 bulan pertama.', { size: 8, color: CL.mut });
      y = H(d, y + 6, 'Tiga skenario volume (bulan pertama)');
      y = tbl(d, y, ['Skenario', 'Penjualan', 'Laba bersih', 'Kali titik impas'], ['Volume turun 20%', 'Dasar', 'Volume naik 20%'].map(function (n, i) { var sk = R.skenario[i]; return [n, rpx(sk.pendapatan), rpx(sk.labaBersih), sk.kaliBep ? (+sk.kaliBep).toFixed(1).replace('.', ',') : '-']; }), { cols: { 0: { cellWidth: 170 } } });
      y = H(d, y + 2, 'Faktor yang paling berpengaruh'); y = pic(im[2], y, 440);
      y = H(d, y + 4, 'Catatan dan batasan');
      y = para(d, y, 'Hasil bergantung pada angka yang dimasukkan. Parameter standar per Okt 2026: inflasi umum ' + (+U.ref.inflasiUmum).toFixed(1).replace('.', ',') + '% dan pangan ' + (+U.ref.inflasiPangan).toFixed(1).replace('.', ',') + '% per tahun, PPh final ' + (+U.ref.pph).toFixed(1).replace('.', ',') + '% atas penjualan. Alat ini edukasi dan simulasi, bukan nasihat keuangan. Penentuan kehalalan dan kesesuaian akad perlu diverifikasi kepada pihak yang berwenang.', { size: 8.5 });
      y = para(d, y, 'Modalogi © 2026 mrk29. Kerangka KUBAH dan Kalender Berkah © mrk29.', { size: 8, color: CL.mut });
      footers(d);
      return d.output('blob');
    });
  }

  /* ---------- Kanvas ---------- */
  function cleanText(t) { return ascii(String(t || '').split(MK1).join('Angka dari rencana keuangan:').split(MK2).join('')).replace(/\n{3,}/g, '\n\n').trim(); }
  function drawBox(d, x, y, w, h, no, title, eq, text) {
    d.setFillColor(255, 253, 248); d.setDrawColor.apply(d, CL.line); d.setLineWidth(0.6); d.roundedRect(x, y, w, h, 4, 4, 'FD');
    var tx = x + 6, ty = y + 11;
    if (no) { d.setFillColor.apply(d, CL.band); d.roundedRect(x + 5, y + 4.5, 13, 9.5, 2, 2, 'F'); d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(6.5); d.text(String(no), x + 11.5, y + 11.3, { align: 'center' }); tx = x + 22; }
    d.setTextColor.apply(d, CL.ink); d.setFont('helvetica', 'bold'); d.setFontSize(7.2);
    var tl = d.splitTextToSize(ascii(title), w - (tx - x) - 5); d.text(tl, tx, ty); ty += tl.length * 8.2;
    if (eq) { d.setFont('helvetica', 'italic'); d.setFontSize(6); d.setTextColor.apply(d, CL.mut); d.text(ascii(eq), x + 6, ty); ty += 7; }
    var avail = y + h - ty - 5, txt = cleanText(text), bw = w - 12;
    if (!txt) { d.setFont('helvetica', 'italic'); d.setFontSize(6.5); d.setTextColor(170, 165, 155); d.text('(belum diisi)', x + 6, ty + 8); return; }
    d.setTextColor.apply(d, CL.ink); d.setFont('helvetica', 'normal');
    var fs = 8.5, lines;
    for (; fs >= 5; fs -= 0.5) { d.setFontSize(fs); lines = d.splitTextToSize(txt, bw); if (lines.length * fs * 1.18 <= avail) break; }
    var maxL = Math.max(1, Math.floor(avail / (fs * 1.18))); if (lines.length > maxL) { lines = lines.slice(0, maxL); lines[maxL - 1] = lines[maxL - 1].replace(/.{0,3}$/, '...'); }
    d.setFontSize(fs); d.text(lines, x + 6, ty + fs);
  }
  function kanvas(kj, store, U) {
    var names = { kubah: 'BMC Syariah (KUBAH)', bmc: 'Business Model Canvas', lean: 'Lean Canvas' }, nm = U.nama || usahaLabel(U);
    var d = newDoc('landscape', 'Kanvas Modalogi · ' + names[kj] + ' · ' + nm);
    var W = d.internal.pageSize.getWidth(), Hh = d.internal.pageSize.getHeight();
    chrome(d, names[kj], nm); var x0 = 34, y0 = 74, gw = W - 68, gh = Hh - y0 - 44, gap = 5;
    if (kj === 'kubah') {
      var cols = 4, rows = 4, bw = (gw - gap * (cols - 1)) / cols, bh = (gh - gap * (rows - 1)) / rows;
      KUBAH.forEach(function (b, i) { var c = i % cols, r = Math.floor(i / cols); drawBox(d, x0 + c * (bw + gap), y0 + r * (bh + gap), bw, bh, b[0], b[1], b[2] ? 'Setara ' + b[2] : 'Khas KUBAH', store[b[0]]); });
      d.setFont('helvetica', 'italic'); d.setFontSize(7); d.setTextColor.apply(d, CL.mut);
    } else {
      var defs = kj === 'bmc' ? BMC : LEAN, cw = (gw - gap * 9) / 10, rh = [(gh - gap * 2) * 0.36, (gh - gap * 2) * 0.36, (gh - gap * 2) * 0.28];
      defs.forEach(function (b) {
        var m = /grid-column:(\d+)\/(\d+);grid-row:(\d+)(?:\/(\d+))?/.exec(b[4]), c0 = +m[1] - 1, c1 = +m[2] - 1, r0 = +m[3] - 1, r1 = m[4] ? +m[4] - 1 : r0 + 1;
        var x = x0 + c0 * (cw + gap), w = (c1 - c0) * cw + (c1 - c0 - 1) * gap, y = y0, hh = 0, rr;
        for (rr = 0; rr < r0; rr++) y += rh[rr] + gap; for (rr = r0; rr < r1; rr++) hh += rh[rr] + (rr > r0 ? gap : 0);
        drawBox(d, x, y, w, hh, 0, b[1], b[2], store[b[0]]);
      });
    }
    footers(d); return Promise.resolve(d.output('blob'));
  }
  return { report: report, kanvas: kanvas, svgPng: svgPng };
})();
