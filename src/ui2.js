/* ---------- Langkah 5: Hasil ---------- */
function mLabels() { var a = []; for (var i = 0; i < 12; i++) a.push(MONTHS[((U.bulanMulai || 0) + i) % 12].slice(0, 3)); return a; }
function tabelBulan(rows, opts) {
  var L = mLabels(), h = '<div class="tw"><table><thead><tr><th>' + (opts && opts.head || 'Uraian') + '</th>' + L.map(function (m, i) { return '<th>' + m + '<br><span class="xs muted">' + (i + 1) + '</span></th>'; }).join('') + '<th>Total</th></tr></thead><tbody>';
  rows.forEach(function (r) {
    if (r.sec) { h += '<tr class="trs"><td colspan="14">' + esc(r.sec) + '</td></tr>'; return; }
    var tot = r.total === false ? '' : r.v.reduce(function (a, b) { return a + b; }, 0);
    if (r.last) tot = r.v[11];
    h += '<tr' + (r.tot ? ' class="tot"' : '') + '><td>' + esc(r.n) + '</td>' + r.v.map(function (x) { return '<td' + (x < -0.5 ? ' class="neg"' : '') + '>' + (r.pct ? pct(x, 1) : fmt(x)) + '</td>'; }).join('') + '<td' + (tot < -0.5 ? ' class="neg"' : '') + '>' + (r.total === false ? '' : (r.pct ? '' : fmt(tot))) + '</td></tr>';
  });
  return h + '</tbody></table></div>';
}
function neg(a) { return a.map(function (x) { return -x; }); }
function hasilTab(t) {
  var box = el('div');
  var f = { ringkasan: tabRingkasan, lr: tabLR, kelayakan: tabKelayakan, sens: tabSens, biaya: tabBiaya }[t];
  live.push(function () { box.innerHTML = ''; box.appendChild(f()); });
  return box;
}
function kpi(l, v, s) { return el('div', { class: 'kpi' }, [el('div', { class: 'l', text: l }), el('div', { class: 'v', text: v }), s ? el('div', { class: 's', text: s }) : null]); }
function stepHasil() {
  var wrap = el('div');
  var top = el('div'); live.push(function () {
    top.innerHTML = ''; var vi = verdictInfo(), K = R.kelayakan;
    var msg;
    if (vi.c === 'isi') msg = 'Beberapa isian penting masih kosong. Hasil di bawah belum bisa diandalkan.';
    else if (vi.c === 'ok') msg = 'Usaha menghasilkan laba, arus kas bertahan, dan nilai sekarang bersih (NPV) positif pada ketiga tingkat diskonto.';
    else if (vi.c === 'mid') msg = 'Usaha cukup menjanjikan, tetapi ada syarat atau titik rawan yang perlu dijaga. Lihat catatan di bawah.';
    else msg = 'Pada asumsi saat ini usaha belum memenuhi ukuran kelayakan. Tinjau harga, biaya, atau kebutuhan modal.';
    top.appendChild(el('div', { class: 'verdict ' + vi.c }, [el('div', { class: 'vi' }, [ico(vi.ic)]), el('div', [el('div', { style: 'font-size:20px;font-weight:500', text: (U.nama ? U.nama + ': ' : '') + vi.t }), el('p', { class: 'muted', style: 'margin-top:4px', text: msg })])]));
  });
  wrap.appendChild(top);
  var tabs = [['ringkasan', 'Ringkasan'], ['lr', 'Laba rugi dan arus kas'], ['kelayakan', 'Kelayakan'], ['sens', 'Sensitivitas dan skenario'], ['biaya', 'Pembiayaan']];
  var tb = el('div', { class: 'tabs', role: 'tablist' }), body = el('div');
  function showTab() {
    $$('button', tb).forEach(function (b) { b.classList.toggle('on', b.dataset.t === W.tab); b.setAttribute('aria-selected', b.dataset.t === W.tab ? 'true' : 'false'); });
    var keep = live.slice(0, liveBase); live = keep; body.innerHTML = ''; body.appendChild(hasilTab(W.tab)); live[live.length - 1]();
  }
  var liveBase = 0;
  tabs.forEach(function (x) { tb.appendChild(el('button', { type: 'button', role: 'tab', 'data-t': x[0], text: x[1], onclick: function () { W.tab = x[0]; showTab(); } })); });
  wrap.appendChild(tb); wrap.appendChild(body);
  liveBase = live.length; showTab();
  var dl = el('div', { class: 'card tight', style: 'margin-top:16px' }, [el('div', { class: 'row sp' }, [el('div', [el('h4', { text: 'Simpan hasil' }), el('p', { class: 'muted small', text: 'Laporan Excel dan PDF memuat atribusi Modalogi dan mrk29 di metadata dan di dalam berkas. Laporan Excel bisa diunggah kembali ke Modalogi.' })]), el('div', { class: 'row' }, [
    el('button', { class: 'btn', type: 'button', onclick: function (ev) { var u = U; busy(ev.currentTarget, 'Menyiapkan...', function () { return xlsxReady().then(function () { return XL.makeReport(u, R); }).then(function (b) { saveBlob(b, fname('laporan', u) + '.xlsx'); toast('Laporan Excel diunduh.'); }); }); } }, [ico('ti-file-spreadsheet'), 'Excel']),
    el('button', { class: 'btn', type: 'button', onclick: function (ev) { var u = U; busy(ev.currentTarget, 'Menyiapkan...', function () { return pdfReady().then(function () { return PDFX.report(u, R); }).then(function (b) { saveBlob(b, fname('laporan', u) + '.pdf'); toast('Laporan PDF diunduh.'); }); }); } }, [ico('ti-file-type-pdf'), 'PDF']),
    el('button', { class: 'btn', type: 'button', onclick: function () { go('kanvas'); } }, [ico('ti-layout-board'), 'Lanjut ke Kanvas'])])])]);
  wrap.appendChild(dl);
  return wrap;
}
function noteList(items) {
  if (!items.length) return null;
  var worst = items.some(function (x) { return x.tingkat === 'isi'; }) ? 'pri' : (items.some(function (x) { return x.tingkat === 'periksa'; }) ? 'bad' : '');
  return el('div', { class: 'note ' + worst, style: 'margin-top:14px' }, [el('b', { text: 'Catatan' }), el('ul', items.map(function (x) { return el('li', { text: x.teks }); }))]);
}
function tabRingkasan() {
  var w = el('div', { class: 'stack' }), K = R.kelayakan, L = R.laba, bep = R.bep;
  var pb = K.paybackBulan > 0 && isFinite(K.paybackBulan) ? dec(K.paybackBulan, 0) + ' bulan' : 'Belum kembali';
  w.appendChild(el('div', { class: 'grid g4' }, [
    kpi('Titik impas', bep.rupiah > 0 ? cmp(bep.rupiah) + '/bln' : '-', bep.unit > 0 && R.produk.length === 1 ? dec(bep.unit, 0) + ' ' + R.produk[0].satuan + ' per bulan' : (bep.kaliVolume ? dec(bep.kaliVolume, 1) + ' kali titik impas' : '')),
    kpi('Laba bersih rata-rata', cmp(avgLaba()) + '/bln', 'Margin ' + pct(R.total12.pendapatan > 0 ? R.total12.labaBersih / R.total12.pendapatan : 0, 1)),
    kpi('Kebutuhan modal', cmp(R.modal.total), 'Investasi ' + cmp(R.modal.investasi)),
    kpi('Balik modal', pb, 'Dari arus kas bersih')]));
  w.appendChild(el('div', { class: 'grid g4' }, [
    kpi('NPV (diskonto ' + pct(K.diskonto, 1) + ')', cmp(K.npv), 'Horizon ' + K.horizon + ' tahun'),
    kpi('IRR', K.irrAda ? pct(K.irr, 0) : '-', 'Indeks profitabilitas ' + dec(K.pi, 2)),
    kpi('Saldo kas terendah', cmp(R.saldoMin), R.saldoMin < 0 ? 'Perlu penyangga dana' : 'Tidak pernah defisit'),
    kpi('Bulan laba positif', R.bulanLabaPositif + ' dari 12', 'Berdasarkan laba bersih')]));
  var n = noteList(R.cek); if (n) w.appendChild(n);
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Laba bersih per bulan' }), el('div', { html: svgBars({ values: L.labaBersih, labels: mLabels(), aria: 'Laba bersih per bulan' }) })]));
  w.appendChild(el('div', { class: 'stack' }, [
    el('div', { class: 'card' }, [el('h4', { text: 'Titik impas' }), el('p', { class: 'muted small', text: 'Di atas titik temu garis, usaha mulai untung.' }), el('div', { html: svgBep(R) })]),
    el('div', { class: 'card' }, [el('h4', { text: 'Saldo kas akhir bulan' }), el('p', { class: 'muted small', text: 'Garis putus-putus: target kas minimum.' }), el('div', { html: svgBars({ values: R.kas.saldoAkhir, labels: mLabels(), color: function (v) { return v >= 0 ? COL.pri : COL.neg; }, ref: { value: R.kas.kasMin && R.kas.kasMin[0] !== undefined ? R.kas.kasMin[0] : (R.kas.kasMin || 0), label: 'Kas minimum' }, aria: 'Saldo kas akhir bulan' }) })])]));
  if (R.musim.aktif) w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Pola musim yang dipakai' }), el('div', { html: heatStrip(R.musim.mult, mLabels()) })]));
  var pt = R.produk.length > 1 || R.produk[0].mode !== 'unit' ? null : null;
  if (R.produk.length) w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Margin per ' + (U.jenis === 'dagang' ? 'kategori' : 'produk') }), el('div', { class: 'tw', style: 'margin-top:8px', html: '<table class="tbl2"><thead><tr><th>Nama</th><th>Harga atau penjualan</th><th>Biaya per satuan</th><th>Margin</th><th>Margin %</th></tr></thead><tbody>' + produkRows(R, rp, pct).map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td' + (r[3].charAt(0) === '-' && r[3].length > 1 ? ' class="neg"' : '') + '>' + r[3] + '</td><td>' + r[4] + '</td></tr>'; }).join('') + '</tbody></table>' })]));
  return w;
}
function tabLR() {
  var L = R.laba, K = R.kas, w = el('div', { class: 'stack' });
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Laba rugi 12 bulan' }), el('div', { style: 'margin-top:8px', html: tabelBulan([
    { n: 'Pendapatan', v: L.pendapatan }, { n: 'Harga pokok penjualan', v: neg(L.hpp) }, { n: 'Laba kotor', v: L.labaKotor, tot: true },
    { n: 'Biaya variabel (persen penjualan)', v: neg(L.pendapatan.map(function (x) { return x * L.biayaVarPct; })) }, { n: 'Biaya tetap', v: neg(L.biayaTetap) }, { n: 'Penyusutan dan amortisasi', v: neg(L.penyusutan) },
    { n: 'Laba usaha (EBIT)', v: L.ebit, tot: true }, { n: U.skema === 'syariah' ? 'Beban margin atau sewa pembiayaan' : 'Beban bunga', v: neg(L.bebanPembiayaan) }, { n: 'Laba sebelum pajak', v: L.lsp }, { n: 'Pajak final', v: neg(L.pajak) }, { n: 'Laba bersih', v: L.labaBersih, tot: true }
  ].concat(U.skema === 'syariah' && U.akad.jenis !== 'Dikelola langsung' || (U.skema === 'syariah' && U.akad.wakaf > 0) ? [{ sec: 'Pembagian laba bersih (akad)' }, { n: 'Pemilik modal', v: L.bagiPemilik }, { n: 'Pengelola', v: L.bagiPengelola }, { n: 'Wakaf atau dana sosial', v: L.bagiWakaf }] : [])) })]));
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Arus kas 12 bulan' }), el('div', { style: 'margin-top:8px', html: tabelBulan([
    { sec: 'Kas masuk' }, { n: 'Penjualan tunai dan tertagih', v: K.penjualanTunai.map(function (x, i) { return x + (K.piutang ? K.piutang[i] || 0 : 0); }) }, { n: 'Modal dan pembiayaan masuk', v: K.modalMasuk }, { n: 'Kas masuk lain', v: K.masukLain }, { n: 'Total kas masuk', v: K.totalMasuk, tot: true },
    { sec: 'Kas keluar' }, { n: 'Bahan dan barang', v: neg(K.bahan) }, { n: 'Biaya tetap tunai', v: neg(K.tetap) }, { n: 'Biaya variabel persen', v: neg(K.varPct) }, { n: 'Angsuran pembiayaan', v: neg(K.angsuran) }, { n: 'Pajak', v: neg(K.pajak) }, { n: 'Bagi hasil dan wakaf', v: neg(K.bhPemilik.map(function (x, i) { return x + K.bhPengelola[i] + K.bhWakaf[i]; })) }, { n: 'Belanja aset dan modal awal', v: neg(K.capex) }, { n: 'Kas keluar lain', v: neg(K.keluarLain) }, { n: 'Total kas keluar', v: neg(K.totalKeluar), tot: true },
    { n: 'Arus kas bersih', v: K.bersih, tot: true }, { n: 'Saldo akhir bulan', v: K.saldoAkhir, total: false }
  ]) })]));
  w.appendChild(el('p', { class: 'hint', text: 'Angka negatif berwarna terakota. Penjualan tempo dicatat sebagai kas masuk pada bulan berikutnya.' }));
  return w;
}
function tabKelayakan() {
  var K = R.kelayakan, w = el('div', { class: 'stack' });
  var rows = [['Tingkat diskonto dasar', pct(K.diskonto, 1), 'NPV', cmp(K.npv), K.npv > 0], ['Skenario tinggi (+' + dec(U.ref.dTinggi, 0) + ' poin)', pct(K.dTinggi, 1), 'NPV', cmp(K.npvTinggi), K.npvTinggi > 0], ['Skenario sangat tinggi (+' + dec(U.ref.dSangatTinggi, 0) + ' poin)', pct(K.dSangatTinggi, 1), 'NPV', cmp(K.npvSangatTinggi), K.npvSangatTinggi > 0]];
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Nilai sekarang bersih (NPV)' }), el('p', { class: 'muted small', text: 'Diskonto = suku bunga bebas risiko + premi menurut status usaha (' + pct(K.premi, 0) + ') + inflasi umum. Horizon ' + K.horizon + ' tahun, dari umur aset utama dan status usaha.' }),
    el('div', { class: 'tw', style: 'margin-top:10px', html: '<table class="tbl2"><thead><tr><th>Skenario</th><th>Diskonto</th><th>NPV</th><th></th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td' + (r[4] ? '' : ' class="neg"') + '>' + r[3] + '</td><td><span class="pill ' + (r[4] ? 'ok' : 'bad') + '">' + (r[4] ? 'Positif' : 'Negatif') + '</span></td></tr>'; }).join('') + '</tbody></table>' })]));
  w.appendChild(el('div', { class: 'grid g4' }, [kpi('ROI', pct(K.roi, 0), 'Laba bersih dibanding modal'), kpi('Balik modal', K.paybackBulan > 0 && isFinite(K.paybackBulan) ? dec(K.paybackBulan, 0) + ' bulan' : 'Belum kembali', K.paybackOk ? 'Dalam horizon' : 'Di luar horizon'), kpi('IRR', K.irrAda ? pct(K.irr, 0) : '-', 'Tingkat pengembalian internal'), kpi('Indeks profitabilitas', dec(K.pi, 2), 'Di atas 1,00 berarti layak')]));
  var T = R.tahunan, h = '<table><thead><tr><th>Uraian</th>' + T.tahun.map(function (t, i) { return '<th>Tahun ' + t + (T.inHorizon[i] ? '' : '<br><span class="xs muted">luar horizon</span>') + '</th>'; }).join('') + '</tr></thead><tbody>';
  [['Pendapatan', 'pendapatan'], ['Laba bersih', 'labaBersih'], ['Arus kas (tanpa modal awal)', 'arusKas']].forEach(function (r) { h += '<tr><td>' + r[0] + '</td>' + T[r[1]].map(function (x) { return '<td' + (x < 0 ? ' class="neg"' : '') + '>' + fmt(x) + '</td>'; }).join('') + '</tr>'; });
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Proyeksi tahunan' }), el('p', { class: 'muted small', text: 'Tahun 1 dari 12 bulan hasil rinci. Tahun berikutnya diekstrapolasi dengan inflasi harga dan biaya.' }), el('div', { class: 'tw', style: 'margin-top:10px', html: h + '</tbody></table>' })]));
  var n = noteList(R.cek); if (n) w.appendChild(n);
  return w;
}
function tabSens() {
  var w = el('div', { class: 'stack' }), names = ['Volume turun 20%', 'Dasar', 'Volume naik 20%'];
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Tiga skenario volume' }), el('p', { class: 'muted small', text: 'Gambaran bulan pertama operasi. Harga dan biaya per satuan tetap.' }),
    el('div', { class: 'grid g3', style: 'margin-top:10px' }, R.skenario.map(function (s, i) {
      var c = s.labaBersih >= 0 ? 'ok' : 'bad';
      return el('div', { class: 'scn' + (i === 1 ? ' mid' : '') }, [el('div', { class: 'small muted', text: names[i] }), el('div', { style: 'font-size:20px;font-weight:500;margin:4px 0', text: cmp(s.pendapatan) }), el('div', { class: 'small muted', text: 'penjualan per bulan' }),
        el('div', { style: 'margin-top:8px' }, [el('span', { class: 'pill ' + c, text: 'Laba bersih ' + cmp(s.labaBersih) })]), el('div', { class: 'small muted', style: 'margin-top:8px', text: (s.kaliBep ? dec(s.kaliBep, 1) + ' kali titik impas' : '') + (s.dibatasi ? ' · dibatasi kapasitas' : '') })]);
    }))]));
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Faktor yang paling berpengaruh' }), el('p', { class: 'muted small', text: 'Dampak perubahan 10% tiap faktor terhadap laba bersih 12 bulan. Batang terpanjang berarti paling peka.' }), el('div', { html: svgTornado(E.tornado(CFG, 0.1).slice().sort(function (a, b) { return Math.max(Math.abs(b.turun), Math.abs(b.naik)) - Math.max(Math.abs(a.turun), Math.abs(a.naik)); })) })]));
  return w;
}
function tabBiaya() {
  var w = el('div', { class: 'stack' }), s = R.modal.sumber, P = R.pembiayaan;
  w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Sumber dana' }), el('div', { style: 'margin-top:10px', html: svgStack([{ n: 'Modal sendiri', v: Math.max(0, s.internal), c: COL.pri }, { n: 'Pembiayaan eksternal', v: s.eksternal, c: COL.ink }, { n: 'Dana sosial', v: s.ziswaf, c: COL.pos }, { n: 'Sumber lain', v: s.lainnya, c: COL.acc }], R.modal.total) + '<div class="lg"><span><i style="background:' + COL.pri + '"></i>Modal sendiri ' + rp(s.internal) + '</span><span><i style="background:' + COL.ink + '"></i>Eksternal ' + rp(s.eksternal) + '</span><span><i style="background:' + COL.pos + '"></i>Dana sosial ' + rp(s.ziswaf) + '</span><span><i style="background:' + COL.acc + '"></i>Lain ' + rp(s.lainnya) + '</span></div>' })]));
  if (P.tenor > 0 && P.angsuranBulan1 > 0) {
    var kemampuan = R.laba.labaBersih[0] + R.laba.penyusutan[0] + R.laba.bebanPembiayaan[0], dscr = kemampuan / P.angsuranBulan1;
    var c = dscr >= 1.25 ? 'ok' : (dscr >= 1 ? 'mid' : 'bad');
    w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Kemampuan membayar angsuran (usaha)' }), el('div', { class: 'grid g3', style: 'margin-top:10px' }, [kpi('Angsuran per bulan', cmp(P.angsuranBulan1), P.jenis), kpi('Kemampuan bayar bulan 1', cmp(kemampuan), 'Laba bersih + penyusutan + beban pembiayaan'), kpi('Rasio DSCR', dec(dscr, 2) + 'x', dscr >= 1.25 ? 'Nyaman (batas umum 1,25x)' : (dscr >= 1 ? 'Tipis, masih tertutup' : 'Belum tertutup'))]), el('p', { style: 'margin-top:10px' }, [el('span', { class: 'pill ' + c, text: dscr >= 1.25 ? 'Angsuran aman' : (dscr >= 1 ? 'Angsuran tipis' : 'Angsuran berisiko') })]), el('p', { class: 'hint', style: 'margin-top:8px', text: 'Dihitung dari bulan pertama saja, dan musim bisa membuat bulan lain lebih rendah. Pantau juga saldo kas terendah di Ringkasan.' })]));
  } else w.appendChild(el('div', { class: 'note', text: 'Tidak ada pembiayaan eksternal berangsuran pada rencana ini. Pilih pembiayaan di langkah 3 untuk melihat rasio kemampuan bayar.' }));
  if (U.skema === 'syariah') {
    var A = R.akad;
    w.appendChild(el('div', { class: 'card' }, [el('h4', { text: 'Akad ' + A.jenis }), el('div', { class: 'grid g3', style: 'margin-top:10px' }, [kpi('Bagian pemilik modal', cmp(R.laba.bagiPemilik.reduce(function (a, b) { return a + b; }, 0)), '12 bulan'), kpi('Bagian pengelola', cmp(R.laba.bagiPengelola.reduce(function (a, b) { return a + b; }, 0)), '12 bulan'), kpi('Wakaf atau dana sosial', cmp(R.laba.bagiWakaf.reduce(function (a, b) { return a + b; }, 0)), '12 bulan')])]));
  }
  var cash = Math.max(0, (R.laba.labaBersih[0] || 0));
  w.appendChild(el('div', { class: 'card', style: 'border-color:#C5D6F3;background:#F3F7FE' }, [el('div', { class: 'row' }, [el('div', { class: 'path' }, [el('div', { class: 'ic' }, [ico('ti-lamp')])]), el('div', { style: 'flex:1;min-width:220px' }, [el('h4', { text: 'Bandingkan di Lampu Pindar' }), el('p', { class: 'muted small', text: 'Lampu Pindar menilai kemampuan bayar pribadi peminjam, sedangkan Modalogi menilai kemampuan bayar usaha (DSCR). Keduanya saling melengkapi sebelum mengambil pinjaman produktif.' }), el('p', { class: 'small', style: 'margin-top:6px', text: 'Angka bantu: laba bersih bulan pertama ' + cmp(cash) + ', angsuran rencana ' + cmp(P.angsuranBulan1 || 0) + ', pinjaman ' + cmp(P.dana || 0) + '.' })]), el('a', { class: 'btn pri', href: 'https://mrk29-feb.github.io/lampu-pindar/#kalkulator', target: '_blank', rel: 'noopener' }, ['Buka Lampu Pindar', ico('ti-external-link')])])]));
  return w;
}

/* ================= Kanvas ================= */
var KUBAH = [
  [1, 'Visi dan Maslahah Usaha', '', 'Apa tujuan usaha dan manfaat bagi umat?'], [2, 'Akad dan Struktur Kepemilikan', '', 'Akad apa yang dipakai, siapa pemilik dan pengelola?', 1],
  [3, 'Sumber Daya Berkah', 'Key Resources', 'Aset, SDM, dan modal yang halal dan berkah.'], [4, 'Kegiatan Utama dan Titik Kritis Halal', 'Key Activities', 'Proses inti dan titik yang menjaga kehalalan.'],
  [5, 'Nilai Tambah dan Diferensiasi Syariah', 'Value Proposition', 'Apa yang membuat usaha ini berbeda dan bernilai?'], [6, 'Promosi, Distribusi, dan Jaringan Silaturahmi', 'Channels', 'Cara menjangkau dan mengantar ke pelanggan.'],
  [7, 'Target Pasar dan Segmen Umat', 'Customer Segments', 'Siapa pelanggan utama?'], [8, 'Mitra Strategis dan Lembaga Keuangan Syariah', 'Key Partners', 'Pemasok, BMT, bank syariah, lembaga zakat.'],
  [9, 'Tata Kelola dan Akuntabilitas', '', 'Pembukuan, pengawasan, dan pelaporan.'], [10, 'Analisis Risiko dan Mitigasi Syariah', '', 'Risiko usaha dan syariah, serta penangkalnya.'],
  [11, 'Hubungan Pelanggan dan Loyalitas Umat', 'Customer Relationships', 'Cara menjaga hubungan jangka panjang.'], [12, 'Peta Skalabilitas dan Replikasi', '', 'Bagaimana usaha berkembang atau direplikasi.'],
  [13, 'Model Bagi Hasil dan Estimasi HPP', 'Cost Structure', 'Struktur biaya dan pembagian hasil.', 1], [14, 'Proyeksi Pemasukan dan Dampak', 'Revenue Streams', 'Sumber pemasukan dan dampak sosial.', 1]
];
var BMC = [
  ['kp', 'Mitra Utama', 'Key Partners', 'Siapa pemasok dan mitra penting?', 'grid-column:1/3;grid-row:1/3'], ['ka', 'Kegiatan Utama', 'Key Activities', 'Apa yang paling penting dikerjakan?', 'grid-column:3/5;grid-row:1'],
  ['kr', 'Sumber Daya Utama', 'Key Resources', 'Aset dan sumber daya apa yang diperlukan?', 'grid-column:3/5;grid-row:2'], ['vp', 'Proposisi Nilai', 'Value Propositions', 'Nilai apa yang ditawarkan?', 'grid-column:5/7;grid-row:1/3'],
  ['cr', 'Hubungan Pelanggan', 'Customer Relationships', 'Bagaimana menjaga pelanggan?', 'grid-column:7/9;grid-row:1'], ['ch', 'Saluran', 'Channels', 'Lewat mana pelanggan dijangkau?', 'grid-column:7/9;grid-row:2'],
  ['cs', 'Segmen Pelanggan', 'Customer Segments', 'Siapa yang dilayani?', 'grid-column:9/11;grid-row:1/3'], ['cost', 'Struktur Biaya', 'Cost Structure', 'Biaya terbesar apa saja?', 'grid-column:1/6;grid-row:3', 1], ['rev', 'Arus Pendapatan', 'Revenue Streams', 'Dari mana pendapatan datang?', 'grid-column:6/11;grid-row:3', 1]
];
var LEAN = [
  ['pr', 'Masalah', 'Problem', 'Tiga masalah utama pelanggan.', 'grid-column:1/3;grid-row:1/3'], ['so', 'Solusi', 'Solution', 'Tiga fitur utama solusi.', 'grid-column:3/5;grid-row:1'],
  ['km', 'Metrik Kunci', 'Key Metrics', 'Angka yang dipantau.', 'grid-column:3/5;grid-row:2', 1], ['uv', 'Proposisi Nilai Unik', 'Unique Value Proposition', 'Satu kalimat yang membedakan.', 'grid-column:5/7;grid-row:1/3'],
  ['ua', 'Keunggulan Tak Tertandingi', 'Unfair Advantage', 'Yang sulit ditiru pesaing.', 'grid-column:7/9;grid-row:1'], ['ch', 'Saluran', 'Channels', 'Jalur menuju pelanggan.', 'grid-column:7/9;grid-row:2'],
  ['cs', 'Segmen Pelanggan', 'Customer Segments', 'Pelanggan awal.', 'grid-column:9/11;grid-row:1/3'], ['cost', 'Struktur Biaya', 'Cost Structure', 'Biaya tetap dan variabel.', 'grid-column:1/6;grid-row:3', 1], ['rev', 'Arus Pendapatan', 'Revenue Streams', 'Model dan harga.', 'grid-column:6/11;grid-row:3', 1]
];
var MK1 = '[Angka Modalogi]', MK2 = '[/Angka Modalogi]';
function angkaUntuk(fw, id) {
  if (!R) return '';
  var K = R.kelayakan, x = [];
  if (id === 'cost' || id === 13) {
    var m = R.modal.modalKerja; x.push('Biaya tetap per bulan: ' + rp(R.bep.biayaTetap)); R.produk.forEach(function (p) { x.push(p.mode === 'omzet' ? p.nama + ': harga pokok ' + pct(1 - p.marginPct, 0) + ' dari penjualan' : p.nama + ': biaya per satuan ' + rp(p.hpp)); }); x.push('Kebutuhan modal awal: ' + rp(R.modal.total));
  } else if (id === 'rev' || id === 14) {
    R.produk.forEach(function (p) { x.push(p.mode === 'omzet' ? p.nama + ': penjualan ' + rp(p.revBase) + ' per bulan, margin ' + pct(p.marginPct, 0) : p.nama + ': harga ' + rp(p.harga) + ', margin ' + pct(p.marginPct, 0)); }); x.push('Pendapatan 12 bulan: ' + rp(R.total12.pendapatan)); x.push('Laba bersih rata-rata: ' + rp(avgLaba()) + ' per bulan');
  } else if (id === 'km') {
    x.push('Titik impas: ' + rp(R.bep.rupiah) + ' per bulan'); x.push('Balik modal: ' + (K.paybackBulan > 0 && isFinite(K.paybackBulan) ? dec(K.paybackBulan, 0) + ' bulan' : 'belum kembali')); x.push('Margin bersih: ' + pct(R.total12.pendapatan > 0 ? R.total12.labaBersih / R.total12.pendapatan : 0, 0));
  } else if (id === 2) {
    x.push('Akad: ' + R.akad.jenis); if (R.akad.jenis !== 'Dikelola langsung') x.push('Nisbah pemilik ' + pct(R.akad.nisbahPemilik, 0) + ', pengelola ' + pct(R.akad.nisbahPengelola, 0)); if (R.akad.nisbahWakaf > 0) x.push('Nisbah wakaf ' + pct(R.akad.nisbahWakaf, 0)); x.push('Kebutuhan modal ' + rp(R.modal.total));
  }
  return MK1 + '\n' + x.join('\n') + '\n' + MK2;
}
function applyAngka(fw, id, store) {
  var cur = store[id] || '', blk = angkaUntuk(fw, id), a = cur.indexOf(MK1), b = cur.indexOf(MK2);
  if (a >= 0 && b > a) store[id] = cur.slice(0, a) + blk + cur.slice(b + MK2.length); else store[id] = (cur ? cur + '\n\n' : '') + blk;
}
function boxEl(fw, id, no, title, eq, ph, fill, style) {
  var store = K[fw];
  var ta = el('textarea', { placeholder: ph, 'aria-label': title, rows: 4 }); ta.value = store[id] || '';
  ta.addEventListener('input', function () { store[id] = ta.value; save(); });
  var kids = [el('h4', [no ? el('span', { class: 'no', text: String(no) }) : null, title]), eq ? el('div', { class: 'eq', text: eq }) : el('div', { class: 'eq', html: '&nbsp;' }), ta];
  if (fill) kids.push(el('button', { type: 'button', class: 'btn sm ghost', style: 'margin-top:6px;align-self:flex-start', onclick: function () { if (!R) recalc(); applyAngka(fw, id, store); ta.value = store[id]; save(); toast('Angka dari rencana keuangan dimasukkan.'); } }, [ico('ti-calculator'), 'Ambil angka']));
  return el('div', { class: 'box', style: style || '' }, kids);
}
function renderKanvas() {
  var v = $('#v-kanvas'); v.innerHTML = ''; if (!R) recalc();
  var opts = [{ id: 'kubah', t: 'BMC Syariah (KUBAH)', s: '14 kotak: akad, halal, bagi hasil, dampak' }, { id: 'bmc', t: 'BMC Konvensional', s: '9 blok klasik' }, { id: 'lean', t: 'Lean Canvas', s: 'Fokus masalah dan solusi' }];
  var pick = el('div', { class: 'grid g3' }, opts.map(function (o) { return el('button', { type: 'button', class: 'opt' + (W.kj === o.id ? ' on' : ''), 'aria-pressed': W.kj === o.id ? 'true' : 'false', onclick: function () { W.kj = o.id; save(); renderKanvas(); } }, [el('span', [el('b', { style: 'font-weight:500;display:block', text: o.t }), el('span', { class: 'muted xs', text: o.s })])]); }));
  var cv;
  if (W.kj === 'kubah') cv = el('div', { class: 'cv kub' }, KUBAH.map(function (b) { return boxEl('kubah', b[0], b[0], b[1], b[2] ? 'Setara ' + b[2] : 'Khas KUBAH', b[3], !!b[4]); }));
  else { var defs = W.kj === 'bmc' ? BMC : LEAN; cv = el('div', { class: 'cv bmc' }, defs.map(function (b) { return boxEl(W.kj, b[0], 0, b[1], b[2], b[3], !!b[5], b[4]); })); }
  var fillAll = el('button', { class: 'btn', type: 'button', onclick: function () { var fw = W.kj, defs = fw === 'kubah' ? KUBAH.filter(function (b) { return b[4]; }).map(function (b) { return b[0]; }) : (fw === 'bmc' ? BMC : LEAN).filter(function (b) { return b[5]; }).map(function (b) { return b[0]; }); defs.forEach(function (id) { applyAngka(fw, id, K[fw]); }); save(); renderKanvas(); toast('Angka dari rencana keuangan dimasukkan ke kotak biaya dan pendapatan.'); } }, [ico('ti-calculator'), 'Ambil angka dari rencana keuangan']);
  v.appendChild(el('div', { class: 'wrap' }, [
    el('div', { class: 'row sp', style: 'margin-bottom:14px' }, [el('div', [el('h2', { text: 'Kanvas model bisnis' }), el('p', { class: 'muted small', text: 'Pilih kerangka yang cocok. Isi bebas, atau tarik angka dari rencana keuangan ke kotak biaya dan pendapatan.' })]), fillAll]),
    pick, el('div', { style: 'margin-top:14px' }, [cv]),
    el('div', { class: 'row sp', style: 'margin-top:12px' }, [el('p', { class: 'hint', text: 'Isian kanvas tersimpan di peramban ini.' }), el('button', { class: 'btn', type: 'button', onclick: function (ev) { var fw = W.kj; busy(ev.currentTarget, 'Menyiapkan...', function () { return pdfReady().then(function () { return PDFX.kanvas(fw, K[fw], U); }).then(function (b) { saveBlob(b, fname('kanvas-' + fw, U) + '.pdf'); toast('Kanvas PDF diunduh.'); }); }); } }, [ico('ti-file-type-pdf'), 'Unduh kanvas PDF'])])
  ]));
}

/* ================= Tentang ================= */
function renderTentang() {
  var v = $('#v-tentang'); v.innerHTML = '';
  v.appendChild(el('div', { class: 'wrap', style: 'max-width:820px' }, [
    el('h2', { text: 'Tentang Modalogi' }),
    el('p', { class: 'lead muted', style: 'margin-top:8px', text: 'Alat bantu menyusun rencana usaha: dari biaya per satuan sampai kelayakan, dengan kanvas model bisnis di sampingnya.' }),
    el('div', { class: 'card', style: 'margin-top:16px' }, [el('h3', { text: 'Cara menghitung' }), el('ul', { class: 'small', style: 'margin:8px 0 0 18px;line-height:1.7' }, [
      el('li', { text: 'Biaya per satuan = bahan, tenaga kerja langsung, kemasan, dan biaya langsung lain.' }),
      el('li', { text: 'Titik impas = biaya tetap dibagi margin kontribusi, dengan bauran pendapatan bila produk lebih dari satu.' }),
      el('li', { text: 'Proyeksi 12 bulan memuat kenaikan harga dan biaya, pola musim, dan arus kas termasuk penjualan tempo.' }),
      el('li', { text: 'Kelayakan memakai ROI, waktu balik modal, NPV pada tiga tingkat diskonto, indeks profitabilitas, dan IRR. Tahun ke-2 dan seterusnya diekstrapolasi hingga lima tahun.' }),
      el('li', { text: 'Usaha bersiklus (ternak, tani) memakai batch bergilir: biaya keluar selama siklus, hasil masuk saat panen.' })])]),
    el('div', { class: 'card', style: 'margin-top:12px' }, [el('h3', { text: 'Bekerja dengan Excel' }), el('ul', { class: 'small', style: 'margin:8px 0 0 18px;line-height:1.7' }, [
      el('li', { text: 'Unduh template di Beranda. Bentuknya menyesuaikan kelompok usaha, usaha spesifik, dan jumlah produk, serta skema (syariah atau konvensional) yang Anda pilih, lengkap dengan baris cadangan untuk komponen tambahan. Isian yang tidak berlaku untuk pilihan Anda otomatis abu-abu, dan isian wajib yang kosong dihitung di bagian atas lembar Input.' }),
      el('li', { text: 'Isi sel berlatar biru muda. Lembar lain terkunci tanpa kata sandi agar rumus tidak rusak.' }),
      el('li', { text: 'Unggah kembali di Beranda. Modalogi membaca isian lewat nama rentang dan lembar meta tersembunyi, lalu menampilkan analisis lengkap.' }),
      el('li', { text: 'Laporan Excel dari tab Hasil memuat isian yang sama, sehingga bisa diunggah ulang untuk dilanjutkan.' })])]),
    el('div', { class: 'card', style: 'margin-top:12px' }, [el('h3', { text: 'Usaha yang kurang cocok' }), el('p', { class: 'small muted', style: 'margin-top:6px', text: 'Model ini mengandaikan pendapatan yang berulang tiap bulan atau tiap siklus pendek. Usaha proyek atau kontrak tunggal (misalnya kontraktor), tanaman keras yang baru menghasilkan setelah bertahun-tahun (misalnya kebun buah), dan usaha properti sewa jangka panjang kurang pas dengan proyeksi 12 bulan. Untuk usaha yang tidak ada di daftar, pilih kelompok terdekat lalu Lainnya (mulai kosong), atau pilih Usaha campuran.' })]),
    el('div', { class: 'card', style: 'margin-top:12px' }, [el('h3', { text: 'Parameter standar' }), el('p', { class: 'small muted', style: 'margin-top:6px', text: 'Per Okt 2026: inflasi umum 3,3% dan pangan 4,2% per tahun, PPh final UMKM 0,5% atas penjualan, kas minimum dua bulan biaya tetap, amortisasi izin 24 bulan. Semuanya bisa diubah di langkah Asumsi.' })]),
    el('div', { class: 'card', style: 'margin-top:12px' }, [el('h3', { text: 'Batasan' }), el('p', { class: 'small muted', style: 'margin-top:6px', text: 'Hasil bergantung pada angka yang dimasukkan. Alat ini edukasi dan simulasi, bukan nasihat keuangan. Penentuan kehalalan dan kesesuaian akad perlu diverifikasi kepada pihak yang berwenang. Seluruh perhitungan berjalan di peramban, tanpa pengiriman data.' })]),
    el('div', { class: 'card', style: 'margin-top:12px' }, [el('h3', { text: 'Atribusi' }), el('p', { class: 'small muted', style: 'margin-top:6px', text: 'Modalogi © 2026 mrk29. Kerangka KUBAH dan Kalender Berkah © mrk29. Berkas Excel dan PDF yang dihasilkan memuat atribusi ini di metadata dan di dalam berkas.' }), el('p', { class: 'small', style: 'margin-top:8px', html: 'Proyek terkait: <a href="https://mrk29-feb.github.io/lampu-pindar/" target="_blank" rel="noopener">Lampu Pindar</a> dan <a href="https://mrk29-feb.github.io/nalar/" target="_blank" rel="noopener">NALAR</a>.' })])
  ]));
}

/* ================= Init ================= */
function setMode() {
  var syr = U.skema === 'syariah'; document.body.setAttribute('data-mode', syr ? 'syariah' : 'konvensional');
  var b = $('#modeBadge'); if (b) b.textContent = syr ? 'Mode syariah' : 'Mode konvensional';
}
var _recalc = recalc;
recalc = function () { _recalc(); setMode(); };
function init() {
  $$('nav.menu button').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.v); }); });
  $('#brandBtn').addEventListener('click', function () { go('beranda'); });
  var had = load(); recalc(); renderBeranda(); renderTentang();
  if (had && U.produk && U.produk.length) { W.done = { 1: true, 2: true, 3: true }; }
  var h = (location.hash || '').replace('#', ''); go(VIEWS.indexOf(h) >= 0 ? h : 'beranda', true);
  window.addEventListener('hashchange', function () { var x = (location.hash || '').replace('#', ''); if (VIEWS.indexOf(x) >= 0) go(x, true); });
}
