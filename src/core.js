var NF = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
function fmt(n) { n = Math.round(+n || 0); return (n < 0 ? '-' : '') + NF.format(Math.abs(n)); }
function rp(n) { n = Math.round(+n || 0); return (n < 0 ? '-Rp ' : 'Rp ') + NF.format(Math.abs(n)); }
function dec(n, d) { return (+n || 0).toFixed(d === undefined ? 1 : d).replace('.', ','); }
function pct(n, d) { return dec((+n || 0) * 100, d === undefined ? 1 : d) + '%'; }
function cmp(n) {
  n = +n || 0; var a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e9) return s + 'Rp ' + dec(a / 1e9, 1) + ' M';
  if (a >= 1e6) return s + 'Rp ' + dec(a / 1e6, 1) + ' jt';
  if (a >= 1e3) return s + 'Rp ' + dec(a / 1e3, 0) + ' rb';
  return s + 'Rp ' + Math.round(a);
}
function cm(n) { // tanpa awalan Rp, untuk sumbu grafik
  n = +n || 0; var a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e9) return s + dec(a / 1e9, 1) + ' M';
  if (a >= 1e6) return s + dec(a / 1e6, a >= 1e7 ? 0 : 1) + ' jt';
  if (a >= 1e3) return s + dec(a / 1e3, 0) + ' rb';
  return s + Math.round(a);
}
function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function nz(x) { return (typeof x === 'number' && isFinite(x)) ? x : 0; }

/* ---------- Model formulir -> konfigurasi mesin ---------- */
function buildCfg(U) {
  var q = U.q, jenis = U.jenis;
  var c = {
    profil: { nama: U.nama, jenis: jenis, skema: U.skema, status: U.status, pangan: !!U.pangan },
    produk: [], biayaTetap: [], biayaLain: [], kejadian: [],
    kasAwal: nz(U.kasAwal)
  };
  U.produk.forEach(function (p) {
    var tp = tipeOf(U, p);
    if (tp === 'omzet') c.produk.push({ nama: p.nama || 'Kategori', mode: 'omzet', omzet: nz(p.omzet), margin: nz(p.margin) / 100, tumbuh: nz(p.tumbuh) / 100, hariStok: nz(p.hariStok), susutPct: nz(p.susutPct) / 100 });
    else if (tp === 'batch') c.produk.push({ nama: p.nama || 'Komoditas', satuan: p.satuan || 'kg', mode: 'batch', harga: nz(p.harga), tumbuh: 0, batch: { siklus: nz(p.siklus), jumlah: nz(p.jumlah), hasil: nz(p.hasil), matiPct: nz(p.matiPct) / 100, biaya: (p.biayaBatch || []).map(function (b) { return { nama: b.nama, nilai: nz(b.nilai), tahap: b.tahap }; }) } });
    else c.produk.push({ nama: p.nama || 'Produk', satuan: p.satuan || 'unit', mode: 'unit', harga: nz(p.harga), volume: nz(p.volume), kapasitas: nz(p.kapasitas), tumbuh: nz(p.tumbuh) / 100, susutPct: nz(p.susutPct) / 100, hppA: p.hppA, hppB: p.hppB, hppC: p.hppC, hppD: p.hppD });
  });
  U.biayaTetap.forEach(function (b) { c.biayaTetap.push({ nama: b.nama, nilai: nz(b.nilai) }); });
  if (q.sewa.on) c.biayaTetap.push({ nama: 'Sewa tempat', nilai: nz(q.sewa.nilai) });
  if (q.karyawan.on) c.biayaTetap.push({ nama: 'Upah tetap karyawan', nilai: nz(q.karyawan.nilai) });
  if (q.kendaraan.on) c.biayaTetap.push({ nama: 'Kendaraan (BBM dan perawatan)', nilai: nz(q.kendaraan.nilai) });
  if (q.marketplace.on) c.biayaLain.push({ nama: 'Komisi platform', nilai: nz(q.marketplace.pct) / 100, jenis: 'persen', produk: 'semua' });
  U.biayaLain.forEach(function (b) { c.biayaLain.push({ nama: b.nama, nilai: b.jenis === 'persen' ? nz(b.nilai) / 100 : nz(b.nilai), jenis: b.jenis, produk: b.produk }); });
  var L = q.listrik;
  c.listrik = L.on ? { aktif: true, metode: L.metode, porsiA: nz(L.porsiA) / 100, ramaiTagihan: nz(L.ramaiTagihan), ramaiVol: nz(L.ramaiVol), sepiTagihan: nz(L.sepiTagihan), sepiVol: nz(L.sepiVol), daya: nz(L.daya), jam: nz(L.jam), hari: nz(L.hari), tarif: nz(L.tarif), tetapLain: nz(L.tetapLain) } : { aktif: false };
  c.modal = { pemasaranAwal: nz(U.pemasaranAwal), legalitas: q.legalitas.on ? nz(q.legalitas.nilai) : 0, lainKerja: [], aset: U.aset.map(function (a) { return { nama: a.nama, nilai: nz(a.nilai), umur: nz(a.umur) }; }), ziswaf: nz(U.ziswaf), lainnya: nz(U.lainnya) };
  c.porsiTunai = q.tempo.on ? nz(q.tempo.porsiTunai) / 100 : 1;
  if (U.skema === 'syariah') c.akad = { jenis: U.akad.jenis, nisbahPemilik: U.akad.jenis === 'Dikelola langsung' ? undefined : nz(U.akad.nisbahPemilik) / 100, porsiModal: U.akad.jenis === 'Musyarakah' ? nz(U.akad.porsiModal) / 100 : undefined, nisbahWakaf: nz(U.akad.wakaf) / 100, frekuensi: U.akad.frek };
  else c.akad = { jenis: 'Tanpa distribusi' };
  var P = U.pembiayaan;
  c.pembiayaan = { jenis: P.jenis, hargaBeli: nz(P.hargaBeli), margin: nz(P.margin), sewa: nz(P.sewa), pokok: nz(P.pokok), bungaTahunan: nz(P.bunga) / 100, tenor: nz(P.tenor) };
  var m = U.musim;
  c.musim = m.mode === 'tanpa' ? { aktif: false, periodeAwal: 1, tingkat: fill12('Baseline Harian') } : { aktif: true, periodeAwal: m.mode === 'kb' ? m.periodeAwal : 1, tingkat: m.mode === 'kb' ? m.tingkatKB : m.tingkatSendiri };
  var R = U.ref;
  c.ref = { inflasiUmum: nz(R.inflasiUmum) / 100, inflasiPangan: nz(R.inflasiPangan) / 100, pph: nz(R.pph) / 100, dTinggi: nz(R.dTinggi) / 100, dSangatTinggi: nz(R.dSangatTinggi) / 100, kasMinBulan: nz(R.kasMinBulan), amortBulan: Math.max(1, nz(R.amortBulan)), hargaNaik: nz(R.inflasiUmum) / 100 };
  U.kejadian.forEach(function (k) { c.kejadian.push({ bulan: nz(k.bulan), jenis: k.jenis, jumlah: nz(k.jumlah) }); });
  return c;
}

/* ---------- Grafik SVG ---------- */
var COL = { pri: '#1F5FD6', pos: '#12A879', neg: '#C8553D', acc: '#F2B33D', ink: '#14213D', mut: '#6B6A66', line: '#E8E0D2', soft: '#EFE8DA' };
function niceTicks(min, max, n) {
  if (min === max) { max = min + 1; }
  var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = span / n / step;
  step *= err >= 5 ? 5 : err >= 2 ? 2 : 1;
  var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
  for (var v = lo; v <= hi + step / 2; v += step) t.push(Math.round(v / step) * step);
  return t;
}
function svgBars(o) {
  var vals = o.values, labels = o.labels, w = o.w || 640, h = o.h || 230, ml = 52, mr = 12, mt = 14, mb = 28;
  var extra = o.ref ? [o.ref.value] : [];
  var mn = Math.min.apply(null, vals.concat(extra, [0])), mx = Math.max.apply(null, vals.concat(extra, [0]));
  var ticks = niceTicks(mn, mx, 4); mn = ticks[0]; mx = ticks[ticks.length - 1];
  var iw = w - ml - mr, ih = h - mt - mb;
  function Y(v) { return mt + (mx - v) / (mx - mn) * ih; }
  var bw = iw / vals.length, s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.aria || 'Grafik batang') + '" style="width:100%;height:auto;display:block">';
  ticks.forEach(function (t) { s += '<line x1="' + ml + '" x2="' + (w - mr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="' + (t === 0 ? '#B9AF9B' : COL.line) + '" stroke-width="1"/><text x="' + (ml - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end" font-size="11" fill="' + COL.mut + '">' + cm(t) + '</text>'; });
  vals.forEach(function (v, i) {
    var x = ml + i * bw + bw * 0.16, bwid = bw * 0.68, y0 = Y(0), y1 = Y(v), top = Math.min(y0, y1), hh = Math.max(Math.abs(y1 - y0), v === 0 ? 0 : 1);
    var col = o.color ? o.color(v, i) : (v >= 0 ? COL.pos : COL.neg);
    s += '<rect x="' + x + '" y="' + top + '" width="' + bwid + '" height="' + hh + '" rx="3" fill="' + col + '"><title>' + esc(labels[i]) + ': ' + rp(v) + '</title></rect>';
    s += '<text x="' + (x + bwid / 2) + '" y="' + (h - 9) + '" text-anchor="middle" font-size="11" fill="' + COL.mut + '">' + esc(labels[i]) + '</text>';
  });
  if (o.ref) {
    s += '<line x1="' + ml + '" x2="' + (w - mr) + '" y1="' + Y(o.ref.value) + '" y2="' + Y(o.ref.value) + '" stroke="' + COL.acc + '" stroke-width="2" stroke-dasharray="6 4"/>';
    s += '<text x="' + (w - mr) + '" y="' + (Y(o.ref.value) - 5) + '" text-anchor="end" font-size="11" fill="' + COL.ink + '">' + esc(o.ref.label) + '</text>';
  }
  return s + '</svg>';
}
function svgBep(r) {
  var w = 640, h = 250, ml = 56, mr = 14, mt = 16, mb = 34;
  var rev0 = r.bep.revBase; if (!(rev0 > 0)) return '<p class="muted">Isi harga dan volume untuk melihat grafik titik impas.</p>';
  var cmr = 0, rb = 0; r.produk.forEach(function (x) { rb += x.revBase; cmr += x.harga > 0 ? x.revBase * x.cm / x.harga : 0; }); cmr = rb > 0 ? cmr / rb : 0;
  var F = r.bep.biayaTetap, xmax = rev0 * 1.6;
  function cost(x) { return F + x * (1 - cmr); }
  var ymax = Math.max(xmax, cost(xmax)), ticksY = niceTicks(0, ymax, 4); ymax = ticksY[ticksY.length - 1];
  var iw = w - ml - mr, ih = h - mt - mb;
  function X(v) { return ml + v / xmax * iw; } function Y(v) { return mt + (ymax - v) / ymax * ih; }
  var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Grafik titik impas: garis pendapatan dan biaya total" style="width:100%;height:auto;display:block">';
  ticksY.forEach(function (t) { s += '<line x1="' + ml + '" x2="' + (w - mr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="' + COL.line + '"/><text x="' + (ml - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end" font-size="11" fill="' + COL.mut + '">' + cm(t) + '</text>'; });
  var bx = r.bep.rupiah;
  if (cmr > 0 && bx > 0 && bx < xmax) {
    s += '<polygon points="' + X(0) + ',' + Y(0) + ' ' + X(0) + ',' + Y(cost(0)) + ' ' + X(bx) + ',' + Y(bx) + '" fill="' + COL.neg + '" opacity="0.13"/>';
    s += '<polygon points="' + X(bx) + ',' + Y(bx) + ' ' + X(xmax) + ',' + Y(xmax) + ' ' + X(xmax) + ',' + Y(cost(xmax)) + '" fill="' + COL.pos + '" opacity="0.15"/>';
  }
  s += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(xmax) + '" y2="' + Y(xmax) + '" stroke="' + COL.pri + '" stroke-width="2.5"/>';
  s += '<line x1="' + X(0) + '" y1="' + Y(cost(0)) + '" x2="' + X(xmax) + '" y2="' + Y(cost(xmax)) + '" stroke="' + COL.ink + '" stroke-width="2.5"/>';
  s += '<line x1="' + X(rev0) + '" x2="' + X(rev0) + '" y1="' + mt + '" y2="' + (h - mb) + '" stroke="' + COL.acc + '" stroke-width="2" stroke-dasharray="5 4"/>';
  s += '<text x="' + (X(rev0) + 5) + '" y="' + (mt + 11) + '" font-size="11" fill="' + COL.ink + '">Penjualan dasar</text>';
  if (cmr > 0 && bx > 0 && bx < xmax) { s += '<circle cx="' + X(bx) + '" cy="' + Y(bx) + '" r="6" fill="#fff" stroke="' + COL.ink + '" stroke-width="2.5"/><text x="' + (X(bx) + 9) + '" y="' + (Y(bx) + 18) + '" font-size="12" fill="' + COL.ink + '" font-weight="500">Titik impas ' + cm(bx) + '</text>'; }
  s += '<text x="' + (w - mr) + '" y="' + (h - 6) + '" text-anchor="end" font-size="11" fill="' + COL.mut + '">Penjualan per bulan (Rp)</text>';
  s += '<text x="' + (X(xmax) - 4) + '" y="' + (Y(xmax) + 14) + '" text-anchor="end" font-size="11" fill="' + COL.pri + '">Pendapatan</text>';
  s += '<text x="' + (X(xmax) - 4) + '" y="' + (Y(cost(xmax)) - 6) + '" text-anchor="end" font-size="11" fill="' + COL.ink + '">Biaya total</text>';
  return s + '</svg>';
}
function svgTornado(rows) {
  var w = 640, rh = 38, mt = 8, h = mt + rows.length * rh + 26, ml = 190, mr = 20;
  var mx = Math.max.apply(null, rows.map(function (x) { return Math.max(Math.abs(x.turun), Math.abs(x.naik)); }).concat([1]));
  var iw = w - ml - mr, cx = ml + iw / 2, scale = (iw / 2 - 74) / mx;
  var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Diagram tornado: dampak perubahan 10% tiap faktor terhadap laba bersih 12 bulan" style="width:100%;height:auto;display:block">';
  s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + mt + '" y2="' + (h - 22) + '" stroke="#B9AF9B"/>';
  rows.forEach(function (r, i) {
    var y = mt + i * rh + 6;
    s += '<text x="' + (ml - 10) + '" y="' + (y + 17) + '" text-anchor="end" font-size="12" fill="' + COL.ink + '">' + esc(r.nama) + '</text>';
    [{ v: r.turun, l: '-10%' }, { v: r.naik, l: '+10%' }].forEach(function (b) {
      var bw = Math.abs(b.v) * scale, x = b.v >= 0 ? cx : cx - bw, col = b.v >= 0 ? COL.pos : COL.neg;
      var half = b.l === '-10%' ? 0 : 1;
      s += '<rect x="' + x + '" y="' + (y + half * 13) + '" width="' + Math.max(bw, 1) + '" height="12" rx="2" fill="' + col + '" opacity="' + (half ? 1 : 0.55) + '"><title>' + esc(r.nama) + ' ' + b.l + ': ' + rp(b.v) + '</title></rect>';
      var tx = b.v >= 0 ? x + bw + 4 : x - 4, anc = b.v >= 0 ? 'start' : 'end';
      s += '<text x="' + tx + '" y="' + (y + half * 13 + 10) + '" text-anchor="' + anc + '" font-size="11" fill="' + COL.mut + '">' + b.l + ': ' + cm(b.v) + '</text>';
    });
  });
  s += '<text x="' + cx + '" y="' + (h - 6) + '" text-anchor="middle" font-size="11" fill="' + COL.mut + '">Perubahan laba bersih 12 bulan (Rp)</text>';
  return s + '</svg>';
}
function svgStack(parts, total) {
  if (!(total > 0)) return '';
  var w = 640, h = 34, x = 0, s = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Komposisi sumber modal" style="width:100%;height:auto;display:block">';
  parts.forEach(function (p) {
    if (!(p.v > 0)) return;
    var ww = p.v / total * w; s += '<rect x="' + x + '" y="0" width="' + ww + '" height="' + h + '" fill="' + p.c + '"><title>' + esc(p.n) + ': ' + rp(p.v) + '</title></rect>';
    if (ww > 54) s += '<text x="' + (x + ww / 2) + '" y="22" text-anchor="middle" font-size="12" fill="#fff" font-weight="500">' + dec(p.v / total * 100, 0) + '%</text>';
    x += ww;
  });
  return s + '</svg>';
}
function heatStrip(mult, names) {
  var mn = Math.min.apply(null, mult), mx = Math.max.apply(null, mult), s = '<div class="heat">';
  mult.forEach(function (v, i) {
    var a = mx === mn ? 0.4 : 0.15 + (v - mn) / (mx - mn) * 0.8;
    s += '<div class="hc"><div class="hb" style="background:' + COL.pri + ';opacity:' + dec(a, 2).replace(',', '.') + '" title="' + esc(names[i]) + ': ' + dec(v, 2) + 'x"></div><div class="hl">' + dec(v, 2) + '</div><div class="hm">' + esc(names[i]) + '</div></div>';
  });
  return s + '</div>';
}
function fill12(x) { var a = []; for (var i = 0; i < 12; i++) a.push(x); return a; }

function verdictOf(R) {
  if (!R) return { c: 'isi', t: 'Lengkapi isian', ic: 'ti-pencil' };
  var needs = R.cek.filter(function (x) { return x.tingkat === 'isi'; });
  if (needs.length || R.kelayakan.status === 'ISI') return { c: 'isi', t: 'Lengkapi isian', ic: 'ti-pencil' };
  var st = R.kelayakan.status;
  if (st === 'LAYAK') return { c: 'ok', t: 'Layak dijalankan', ic: 'ti-circle-check' };
  if (st === 'LAYAK BERSYARAT') return { c: 'mid', t: 'Layak dengan catatan', ic: 'ti-alert-circle' };
  return { c: 'bad', t: 'Perlu dikaji ulang', ic: 'ti-alert-triangle' };
}

function produkRows(R, rpf, pcf) {
  return R.produk.map(function (x) {
    var n = x.nama || '(tanpa nama)';
    if (x.mode === 'omzet') return [n, rpf(x.revBase) + ' per bulan', '-', '-', pcf(x.marginPct, 0)];
    return [n, rpf(x.harga), rpf(x.hpp), rpf(x.margin), pcf(x.marginPct, 0)];
  });
}
