(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ModalogiEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LEVELS = ['Puncak Terbesar', 'Puncak Besar', 'Puncak Sedang', 'Baseline Harian', 'Rawan Lesu'];
  var DEF_REF = {
    tanggalData: 'Okt 2026',
    inflasiUmum: 0.033,
    inflasiPangan: 0.042,
    hargaNaik: null,
    pph: 0.005,
    premi: { 'Rintisan baru': 0.12, 'Berjalan kurang dari 1 tahun': 0.08, 'Berjalan 1 tahun atau lebih': 0.05 },
    horizon: { 'Rintisan baru': 3, 'Berjalan kurang dari 1 tahun': 3, 'Berjalan 1 tahun atau lebih': 5 },
    dTinggi: 0.05,
    dSangatTinggi: 0.10,
    kasMinBulan: 2,
    amortBulan: 24,
    pengali: { 'Puncak Terbesar': 2, 'Puncak Besar': 1.5, 'Puncak Sedang': 1.2, 'Baseline Harian': 1, 'Rawan Lesu': 0.7 }
  };

  function num(x, d) { return (typeof x === 'number' && isFinite(x)) ? x : (d === undefined ? 0 : d); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function sumItems(a) { var s = 0; (a || []).forEach(function (i) { s += num(i && i.nilai); }); return s; }
  function arr(n, f) { var a = []; for (var i = 0; i < n; i++) a.push(f(i)); return a; }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function mergeRef(r) {
    var o = clone(DEF_REF);
    if (r) {
      Object.keys(r).forEach(function (k) {
        if (r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])) o[k] = Object.assign({}, o[k], r[k]);
        else if (r[k] !== undefined) o[k] = r[k];
      });
    }
    if (!isNum(o.hargaNaik)) o.hargaNaik = o.inflasiUmum;
    return o;
  }

  function irr(flows) {
    var hasNeg = false, hasPos = false;
    flows.forEach(function (f) { if (f < 0) hasNeg = true; if (f > 0) hasPos = true; });
    if (!hasNeg || !hasPos) return null;
    function npv(r) { var s = 0; for (var t = 0; t < flows.length; t++) s += flows[t] / Math.pow(1 + r, t); return s; }
    var lo = -0.99, hi = 10, flo = npv(lo), fhi = npv(hi);
    if (flo * fhi > 0) return null;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2, fm = npv(mid);
      if (Math.abs(fm) < 1e-9) return mid;
      if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
    }
    return (lo + hi) / 2;
  }

  function prepProduk(p, cfg, listrikVar, ref) {
    var q = { nama: p.nama || 'Produk', satuan: p.satuan || 'unit', mode: p.mode || 'unit' };
    q.tumbuh = num(p.tumbuh);
    q.kapasitas = num(p.kapasitas);
    var A = sumItems(p.hppA), B = sumItems(p.hppB), C = sumItems(p.hppC), D = sumItems(p.hppD);
    q.susutPct = num(p.susutPct);
    if (q.mode === 'omzet') {
      q.harga = 1; q.hargaAvg = 1; q.volume = num(p.omzet); q.kapasitas = 0; q.satuan = 'Rp';
      A = Math.max(0, 1 - num(p.margin)); B = 0; C = 0; D = 0;
    } else {
      var h = num(p.harga), hb = num(p.hargaBulk), pb = num(p.porsiBulk);
      q.harga = h;
      q.hargaAvg = (h > 0) ? ((hb > 0 && pb > 0) ? h * (1 - pb) + hb * pb : h) : 0;
      q.volume = num(p.volume);
    }
    A = A * (1 + q.susutPct);
    // biaya lain per unit
    (cfg.biayaLain || []).forEach(function (b) {
      if (b && b.jenis === 'unit' && num(b.nilai) > 0 && (b.produk === undefined || b.produk === 'semua' || b.produk === p._idx)) D += num(b.nilai);
    });
    if (q.mode !== 'batch' && q.mode !== 'omzet') D += listrikVar;
    q.A = A; q.B = B; q.C = C; q.D = D;
    q.hppUnit = A + B + C + D;
    q.hariStok = isNum(p.hariStok) ? p.hariStok : 30;
    if (q.mode === 'batch') {
      var b = p.batch || {};
      q.batch = {
        siklus: Math.max(1, Math.round(num(b.siklus, 1))),
        jumlah: Math.max(1, Math.round(num(b.jumlah, 1))),
        hasil: num(b.hasil),
        mati: num(b.matiPct),
        items: (b.biaya || []).map(function (i) { return { nama: i.nama, nilai: num(i.nilai), tahap: i.tahap === 'awal' ? 'awal' : 'rutin' }; })
      };
      // biaya lain per batch
      (cfg.biayaLain || []).forEach(function (bl) {
        if (bl && bl.jenis === 'batch' && num(bl.nilai) > 0 && (bl.produk === undefined || bl.produk === 'semua' || bl.produk === p._idx)) q.batch.items.push({ nama: bl.nama, nilai: num(bl.nilai), tahap: 'rutin' });
      });
      q.batch.hasilNet = q.batch.hasil * (1 - q.batch.mati);
      q.batch.biayaTotal = sumItems(q.batch.items);
      q.batch.biayaAwal = sumItems(q.batch.items.filter(function (i) { return i.tahap === 'awal'; }));
      q.batch.biayaRutin = q.batch.biayaTotal - q.batch.biayaAwal;
      q.harga = num(p.harga);
      q.hargaAvg = q.harga;
      q.volume = q.batch.hasilNet * q.batch.jumlah / q.batch.siklus;
      q.hppUnit = q.batch.hasilNet > 0 ? q.batch.biayaTotal / q.batch.hasilNet : 0;
      q.A = q.hppUnit; q.B = 0; q.C = 0; q.D = 0;
      q.kapasitas = 0;
      q.starts = [];
      for (var k = 0; k < q.batch.jumlah; k++) {
        var s0 = 1 + Math.round(k * q.batch.siklus / q.batch.jumlah);
        for (var s = s0; s <= 60; s += q.batch.siklus) q.starts.push(s);
      }
    }
    return q;
  }

  function listrikCalc(l, volDasar) {
    var o = { varUnit: 0, tetap: 0 };
    if (!l || !l.aktif) return o;
    if (l.metode === 'B') {
      var est = num(l.daya) / 1000 * num(l.jam) * num(l.hari) * num(l.tarif);
      o.varUnit = volDasar > 0 ? est / volDasar : 0;
      o.tetap = num(l.tetapLain);
      o.estimasi = est;
    } else {
      var v = (num(l.ramaiVol) > num(l.sepiVol) && num(l.ramaiTagihan) >= num(l.sepiTagihan)) ? (num(l.ramaiTagihan) - num(l.sepiTagihan)) / (num(l.ramaiVol) - num(l.sepiVol)) : 0;
      var t = Math.max(0, num(l.sepiTagihan) - v * num(l.sepiVol));
      var porsi = isNum(l.porsiA) ? l.porsiA : 1;
      o.varUnit = porsi * v; o.tetap = porsi * t;
    }
    return o;
  }

  function musimMultipliers(cfg, ref) {
    var m = cfg.musim || {};
    var out = { aktif: !!m.aktif, raw: [], norm: [], start: 1, mult: arr(12, function () { return 1; }), avg: 1 };
    var tingkat = m.tingkat || arr(12, function () { return 'Baseline Harian'; });
    out.raw = tingkat.slice(0, 12).map(function (t) { return isNum(ref.pengali[t]) ? ref.pengali[t] : 1; });
    while (out.raw.length < 12) out.raw.push(1);
    var avg = sum(out.raw) / 12;
    out.norm = out.raw.map(function (x) { return x / avg; });
    out.avg = sum(out.norm) / 12;
    out.start = Math.min(12, Math.max(1, Math.round(num(m.periodeAwal, 1))));
    if (out.aktif) out.mult = arr(12, function (i) { return out.norm[(out.start - 1 + i) % 12]; });
    return out;
  }

  function pembiayaanSchedule(p) {
    var o = { dana: 0, angsuran: arr(61, function () { return 0; }), beban: arr(61, function () { return 0; }), tenor: 0, jenis: (p && p.jenis) || 'Tidak ada' };
    if (!p || !p.jenis || p.jenis === 'Tidak ada') return o;
    var T = Math.round(num(p.tenor));
    o.tenor = T;
    if (T <= 0) return o;
    var m;
    if (p.jenis === 'Murabahah') {
      var ang = (num(p.hargaBeli) + num(p.margin)) / T, bb = num(p.margin) / T;
      o.dana = num(p.hargaBeli);
      for (m = 1; m <= Math.min(T, 60); m++) { o.angsuran[m] = ang; o.beban[m] = bb; }
    } else if (p.jenis === 'Ijarah') {
      for (m = 1; m <= Math.min(T, 60); m++) { o.angsuran[m] = num(p.sewa); o.beban[m] = num(p.sewa); }
    } else if (p.jenis === 'Pinjaman flat') {
      var P = num(p.pokok), mg = P * num(p.bungaTahunan) * T / 12;
      o.dana = P;
      for (m = 1; m <= Math.min(T, 60); m++) { o.angsuran[m] = (P + mg) / T; o.beban[m] = mg / T; }
    } else if (p.jenis === 'Pinjaman anuitas') {
      var P2 = num(p.pokok), r = num(p.bungaTahunan) / 12;
      o.dana = P2;
      var pmt = r > 0 ? P2 * r / (1 - Math.pow(1 + r, -T)) : P2 / T, os = P2;
      for (m = 1; m <= Math.min(T, 60); m++) { var bunga = os * r; o.angsuran[m] = pmt; o.beban[m] = bunga; os -= (pmt - bunga); }
    }
    return o;
  }

  function compute(cfgIn) {
    var cfg = clone(cfgIn);
    var ref = mergeRef(cfg.ref);
    var prof = cfg.profil || {};
    var status = prof.status || 'Berjalan 1 tahun atau lebih';
    var tarifPajak = isNum(cfg.tarifPajak) ? cfg.tarifPajak : ref.pph;
    var inflB = isNum(cfg.inflasiBahan) ? cfg.inflasiBahan : (prof.pangan ? ref.inflasiPangan : ref.inflasiUmum);
    var inflO = ref.inflasiUmum, hNaik = ref.hargaNaik;
    var porsiTunai = isNum(cfg.porsiTunai) ? cfg.porsiTunai : 1;
    var kasAwal = num(cfg.kasAwal);
    var cek = [];

    (cfg.produk || []).forEach(function (p, i) { p._idx = i; });
    var volUnitTotal = 0;
    (cfg.produk || []).forEach(function (p) { if ((p.mode || 'unit') === 'unit') volUnitTotal += num(p.volume); });
    var lis = listrikCalc(cfg.listrik, volUnitTotal);
    var produk = (cfg.produk || []).map(function (p) { return prepProduk(p, cfg, lis.varUnit, ref); });
    var np = produk.length;

    // biaya tetap
    var fixItems = (cfg.biayaTetap || []).map(function (b) { return { nama: b.nama, nilai: num(b.nilai) }; });
    var tetapLain = 0;
    (cfg.biayaLain || []).forEach(function (b) { if (b && b.jenis === 'tetap' && num(b.nilai) > 0) tetapLain += num(b.nilai); });
    var F0 = sum(fixItems.map(function (x) { return x.nilai; })) + lis.tetap + tetapLain;

    // modal dan investasi
    var modal = cfg.modal || {};
    var aset = (modal.aset || []).map(function (a) { var u = num(a.umur); return { nama: a.nama, nilai: num(a.nilai), umur: u, susut: (u > 0 ? num(a.nilai) / u : 0) }; });
    var invest = sum(aset.map(function (a) { return a.nilai; }));
    var depMonthly = sum(aset.map(function (a) { return a.susut; }));
    var legalitas = num(modal.legalitas), pemasaranAwal = num(modal.pemasaranAwal);
    var amort = legalitas > 0 ? legalitas / ref.amortBulan : 0;
    var lainKerja = sumItems(modal.lainKerja);
    var stokAwal = 0;
    produk.forEach(function (q) { stokAwal += q.hppUnit * q.volume * (q.hariStok === undefined ? 30 : q.hariStok) / 30; });
    var kasMin = F0 * ref.kasMinBulan;
    var modalKerja = stokAwal + F0 + pemasaranAwal + kasMin + legalitas + lainKerja;
    var kebutuhan = modalKerja + invest;
    var capex1 = invest + pemasaranAwal + legalitas + lainKerja;
    var umurUtama = 0, maxNilai = 0;
    aset.forEach(function (a) { if (a.nilai > maxNilai) { maxNilai = a.nilai; umurUtama = a.umur; } });

    var fin = pembiayaanSchedule(cfg.pembiayaan);
    var ziswaf = num(modal.ziswaf), lainnya = num(modal.lainnya);
    var internal = kebutuhan - fin.dana - ziswaf - lainnya;
    var sumberMod = { internal: internal, eksternal: fin.dana, ziswaf: ziswaf, lainnya: lainnya, total: internal + fin.dana + ziswaf + lainnya };

    var must = musimMultipliers(cfg, ref);
    var M = 12;

    // akad
    var akad = cfg.akad || {};
    var akadJenis = akad.jenis || 'Dikelola langsung';
    var wakaf = isNum(akad.nisbahWakaf) ? akad.nisbahWakaf : 0;
    var nisPemilik = (akadJenis === 'Dikelola langsung' || akadJenis === 'Tanpa distribusi') ? 1 - wakaf : (isNum(akad.nisbahPemilik) ? akad.nisbahPemilik : 1 - wakaf);
    var nisPengelola = Math.max(0, 1 - nisPemilik - wakaf);
    var porsiModal = isNum(akad.porsiModal) ? akad.porsiModal : null;
    var frek = akad.frekuensi || 'Tahunan';

    var bln = arr(M, function (i) { return i + 1; });
    var vol = produk.map(function () { return arr(M, function () { return 0; }); });
    var price = produk.map(function () { return arr(M, function () { return 0; }); });
    var revP = produk.map(function () { return arr(M, function () { return 0; }); });
    var costP = produk.map(function () { return arr(M, function () { return 0; }); });
    var cashCostP = produk.map(function () { return arr(M, function () { return 0; }); });

    produk.forEach(function (q, i) {
      for (var m = 1; m <= M; m++) {
        var esc1 = Math.pow(1 + inflB, (m - 1) / 12), esc2 = Math.pow(1 + inflO, (m - 1) / 12);
        var pr = q.hargaAvg * Math.pow(1 + hNaik, (m - 1) / 12);
        if (q.mode === 'batch') {
          var harvest = 0, cashC = 0;
          q.starts.forEach(function (s) {
            var end = s + q.batch.siklus - 1;
            if (end === m) harvest += 1;
            if (s <= m && m <= end) cashC += q.batch.biayaRutin / q.batch.siklus;
            if (s === m) cashC += q.batch.biayaAwal;
          });
          var v = harvest * q.batch.hasilNet;
          vol[i][m - 1] = v;
          price[i][m - 1] = pr * must.mult[m - 1];
          revP[i][m - 1] = v * price[i][m - 1];
          costP[i][m - 1] = harvest * q.batch.biayaTotal * esc2;
          cashCostP[i][m - 1] = cashC * esc2;
        } else {
          var v0 = q.volume * Math.pow(1 + q.tumbuh, m - 1) * must.mult[m - 1];
          var v1 = q.kapasitas > 0 ? Math.min(v0, q.kapasitas) : v0;
          vol[i][m - 1] = v1;
          price[i][m - 1] = pr;
          revP[i][m - 1] = v1 * pr;
          var hu = q.A * esc1 + (q.B + q.C + q.D) * esc2;
          costP[i][m - 1] = v1 * hu;
          cashCostP[i][m - 1] = costP[i][m - 1];
        }
      }
    });

    // biaya variabel persen omzet
    var pctItems = (cfg.biayaLain || []).filter(function (b) { return b && b.jenis === 'persen' && num(b.nilai) > 0; });
    var pctCost = arr(M, function (m) {
      var s = 0;
      pctItems.forEach(function (b) {
        if (b.produk === undefined || b.produk === 'semua') {
          var rv = 0; produk.forEach(function (_, i) { rv += revP[i][m]; }); s += rv * num(b.nilai);
        } else if (revP[b.produk]) s += revP[b.produk][m] * num(b.nilai);
      });
      return s;
    });

    var L = {};
    L.mult = must.mult.slice();
    L.volume = arr(M, function (m) { var s = 0; produk.forEach(function (_, i) { s += vol[i][m]; }); return s; });
    L.pendapatan = arr(M, function (m) { var s = 0; produk.forEach(function (_, i) { s += revP[i][m]; }); return s; });
    L.hpp = arr(M, function (m) { var s = 0; produk.forEach(function (_, i) { s += costP[i][m]; }); return s; });
    L.labaKotor = arr(M, function (m) { return L.pendapatan[m] - L.hpp[m]; });
    L.biayaVarPct = pctCost;
    L.biayaTetap = arr(M, function (m) { return F0 * Math.pow(1 + inflO, m / 12); });
    L.penyusutan = arr(M, function (m) {
      var mm = m + 1, s = 0;
      aset.forEach(function (a) { if (a.umur >= mm) s += a.susut; });
      return s + (mm <= ref.amortBulan ? amort : 0);
    });
    L.ebit = arr(M, function (m) { return L.labaKotor[m] - L.biayaVarPct[m] - L.biayaTetap[m] - L.penyusutan[m]; });
    L.bebanPembiayaan = arr(M, function (m) { return fin.tenor > 0 && m + 1 <= fin.tenor ? fin.beban[m + 1] : 0; });
    L.lsp = arr(M, function (m) { return L.ebit[m] - L.bebanPembiayaan[m]; });
    L.pajak = arr(M, function (m) { return L.pendapatan[m] * tarifPajak; });
    L.labaBersih = arr(M, function (m) { return L.lsp[m] - L.pajak[m]; });
    L.marginKotor = arr(M, function (m) { return L.pendapatan[m] === 0 ? 0 : L.labaKotor[m] / L.pendapatan[m]; });
    L.marginBersih = arr(M, function (m) { return L.pendapatan[m] === 0 ? 0 : L.labaBersih[m] / L.pendapatan[m]; });
    L.bagiPemilik = arr(M, function (m) {
      var x = L.labaBersih[m];
      if (akadJenis === 'Musyarakah') return x >= 0 ? x * nisPemilik : x * (porsiModal !== null ? porsiModal : nisPemilik);
      return x >= 0 ? x * nisPemilik : x;
    });
    L.bagiPengelola = arr(M, function (m) {
      var x = L.labaBersih[m];
      if (akadJenis === 'Musyarakah') return x >= 0 ? x * nisPengelola : x * (1 - (porsiModal !== null ? porsiModal : nisPemilik));
      return x >= 0 ? x * nisPengelola : 0;
    });
    L.bagiWakaf = arr(M, function (m) { return L.labaBersih[m] >= 0 ? L.labaBersih[m] * wakaf : 0; });
    L.cekAlokasi = arr(M, function (m) { return Math.round((L.bagiPemilik[m] + L.bagiPengelola[m] + L.bagiWakaf[m] - L.labaBersih[m]) * 100) / 100; });

    // arus kas
    function payout(row) {
      return arr(M, function (m) {
        var mm = m + 1;
        if (akadJenis === 'Tanpa distribusi') return 0;
        if (frek === 'Bulanan') return Math.max(0, row[m]);
        if (frek === 'Triwulanan') return mm % 3 === 0 ? Math.max(0, row[m] + row[m - 1] + row[m - 2]) : 0;
        return mm === 12 ? Math.max(0, sum(row)) : 0;
      });
    }
    var kejadian = cfg.kejadian || [];
    function ev(jenis, mm) { var s = 0; kejadian.forEach(function (e) { if (e && Math.round(num(e.bulan)) === mm && e.jenis === jenis) s += num(e.jumlah); }); return s; }
    var C = {};
    C.penjualanTunai = L.pendapatan.map(function (x) { return x * porsiTunai; });
    C.piutang = arr(M, function (m) { return m === 0 ? 0 : L.pendapatan[m - 1] * (1 - porsiTunai); });
    C.modalMasuk = arr(M, function (m) { return m === 0 ? sumberMod.total : 0; });
    C.masukLain = arr(M, function (m) { return ev('Kas masuk', m + 1); });
    C.totalMasuk = arr(M, function (m) { return C.penjualanTunai[m] + C.piutang[m] + C.modalMasuk[m] + C.masukLain[m]; });
    C.bahan = arr(M, function (m) { var s = 0; produk.forEach(function (_, i) { s += cashCostP[i][m]; }); return s; });
    C.tetap = L.biayaTetap.slice();
    C.varPct = pctCost.slice();
    C.angsuran = arr(M, function (m) { return fin.tenor > 0 && m + 1 <= fin.tenor ? fin.angsuran[m + 1] : 0; });
    C.pajak = L.pajak.slice();
    C.bhPemilik = payout(L.bagiPemilik);
    C.bhPengelola = payout(L.bagiPengelola);
    C.bhWakaf = payout(L.bagiWakaf);
    C.capex = arr(M, function (m) { return m === 0 ? capex1 : 0; });
    C.keluarLain = arr(M, function (m) { return ev('Kas keluar', m + 1); });
    C.totalKeluar = arr(M, function (m) { return C.bahan[m] + C.tetap[m] + C.varPct[m] + C.angsuran[m] + C.pajak[m] + C.bhPemilik[m] + C.bhPengelola[m] + C.bhWakaf[m] + C.capex[m] + C.keluarLain[m]; });
    C.bersih = arr(M, function (m) { return C.totalMasuk[m] - C.totalKeluar[m]; });
    C.saldoAwal = []; C.saldoAkhir = [];
    for (var m = 0; m < M; m++) {
      C.saldoAwal[m] = m === 0 ? kasAwal : C.saldoAkhir[m - 1];
      C.saldoAkhir[m] = C.saldoAwal[m] + C.bersih[m];
    }
    C.kasMin = kasMin;
    C.status = C.saldoAkhir.map(function (x) { return x >= kasMin ? 'OK' : 'PERIKSA'; });

    // BEP dan HPP bulan 1 (tanpa musim dan eskalasi)
    var Fbep = F0 + depMonthly + amort;
    var pctAll = 0; pctItems.forEach(function (b) { if (b.produk === undefined || b.produk === 'semua') pctAll += num(b.nilai); });
    var ppr = produk.map(function (q, i) {
      var pctP = pctAll; pctItems.forEach(function (b) { if (b.produk === i) pctP += num(b.nilai); });
      var cm = q.hargaAvg * (1 - pctP) - q.hppUnit;
      return { nama: q.nama, satuan: q.satuan, harga: q.hargaAvg, hpp: q.hppUnit, margin: q.hargaAvg - q.hppUnit, marginPct: q.hargaAvg > 0 ? (q.hargaAvg - q.hppUnit) / q.hargaAvg : 0, cm: cm, volume: q.volume, kapasitas: q.kapasitas, revBase: q.volume * q.hargaAvg, mode: q.mode, rincian: { A: q.A, B: q.B, C: q.C, D: q.D } };
    });
    var bep = { biayaTetap: Fbep };
    var revBase = sum(ppr.map(function (x) { return x.revBase; }));
    if (np === 1) {
      var p0 = ppr[0];
      bep.unit = p0.cm > 0 ? Math.ceil(Fbep / p0.cm - 1e-9) : 0;
      bep.rupiah = bep.unit * p0.harga;
      bep.kapasitasTerpakai = p0.kapasitas > 0 ? bep.unit / p0.kapasitas : 0;
      bep.kaliVolume = bep.unit > 0 ? p0.volume / bep.unit : 0;
      bep.ruangAman = (p0.volume > 0 && bep.unit > 0) ? (p0.volume - bep.unit) / p0.volume : 0;
      bep.perProduk = [{ nama: p0.nama, unit: bep.unit, satuan: p0.satuan }];
    } else {
      var cmr = revBase > 0 ? sum(ppr.map(function (x) { return x.harga > 0 ? x.revBase * x.cm / x.harga : 0; })) / revBase : 0;
      bep.cmr = cmr;
      bep.rupiah = cmr > 0 ? Fbep / cmr : 0;
      bep.perProduk = ppr.map(function (x) { return { nama: x.nama, satuan: x.satuan, unit: (bep.rupiah > 0 && revBase > 0 && x.harga > 0) ? Math.ceil(bep.rupiah * (x.revBase / revBase) / x.harga - 1e-9) : 0 }; });
      bep.unit = null;
      bep.ruangAman = (revBase > 0 && bep.rupiah > 0) ? (revBase - bep.rupiah) / revBase : 0;
      bep.kaliVolume = bep.rupiah > 0 ? revBase / bep.rupiah : 0;
    }
    bep.revBase = revBase;
    bep.cmPositif = np === 1 ? ppr[0].cm > 0 : (bep.cmr || 0) > 0;

    // tahunan
    var maxT = 5;
    var Y = { tahun: arr(maxT, function (t) { return t + 1; }), volume: [], pendapatan: [], hpp: [], tetap: [], penyusutan: [], beban: [], varPct: [], pajak: [], labaBersih: [], arusKas: [], inHorizon: [] };
    var horizonStatus = isNum(ref.horizon[status]) ? ref.horizon[status] : 3;
    var umurTahun = Math.floor(umurUtama / 12);
    var horizon = umurTahun > 0 ? Math.min(horizonStatus, umurTahun) : horizonStatus;
    var perProdY = produk.map(function (q, i) {
      var v1 = sum(vol[i]), r1 = sum(revP[i]), c1 = sum(costP[i]);
      var tot = q.A + q.B + q.C + q.D;
      var shareA = tot > 0 ? q.A / tot : 0;
      return { v: [v1], p: [v1 > 0 ? r1 / v1 : q.hargaAvg], h: [v1 > 0 ? c1 / v1 : q.hppUnit], shareA: shareA, q: q };
    });
    perProdY.forEach(function (d) {
      var q = d.q;
      if (q.mode === 'batch') {
        var steady = q.batch.hasilNet * q.batch.jumlah * 12 / q.batch.siklus;
        d.v = [d.v[0]]; d.v.push(steady);
        d.p.push(q.hargaAvg * Math.pow(1 + hNaik, 1));
        d.h.push(q.hppUnit * Math.pow(1 + inflO, 1));
        for (var t = 2; t < maxT; t++) { d.v.push(steady); d.p.push(d.p[t - 1] * (1 + hNaik)); d.h.push(d.h[t - 1] * (1 + inflO)); }
      } else {
        for (var t2 = 1; t2 < maxT; t2++) {
          var g = Math.pow(1 + q.tumbuh, 12), nv = d.v[t2 - 1] * g;
          d.v.push(q.kapasitas > 0 ? Math.min(q.kapasitas * 12, nv) : nv);
          d.p.push(d.p[t2 - 1] * (1 + hNaik));
          d.h.push(d.h[t2 - 1] * (d.shareA * (1 + inflB) + (1 - d.shareA) * (1 + inflO)));
        }
      }
    });
    for (var t = 0; t < maxT; t++) {
      var vv = 0, rr = 0, cc = 0, pcs = 0;
      perProdY.forEach(function (d, i) { vv += d.v[t]; rr += d.v[t] * d.p[t]; cc += d.v[t] * d.h[t]; });
      var pctY = 0;
      if (t === 0) pctY = sum(pctCost);
      else {
        pctItems.forEach(function (b) {
          if (b.produk === undefined || b.produk === 'semua') pctY += rr * num(b.nilai);
          else if (perProdY[b.produk]) pctY += perProdY[b.produk].v[t] * perProdY[b.produk].p[t] * num(b.nilai);
        });
      }
      Y.volume.push(vv); Y.pendapatan.push(rr); Y.hpp.push(cc); Y.varPct.push(pctY);
      Y.tetap.push(t === 0 ? sum(L.biayaTetap) : Y.tetap[t - 1] * (1 + inflO));
      var dep = 0;
      if (t === 0) dep = sum(L.penyusutan);
      else {
        aset.forEach(function (a) { var rem = a.umur - 12 * t; dep += a.susut * (rem >= 12 ? 12 : (rem > 0 ? rem : 0)); });
        dep += amort * Math.max(0, Math.min(12, ref.amortBulan - 12 * t));
      }
      Y.penyusutan.push(dep);
      var bb = 0;
      if (t === 0) bb = sum(L.bebanPembiayaan);
      else if (fin.tenor > 0) for (var mm = 12 * t + 1; mm <= 12 * t + 12 && mm <= 60; mm++) if (mm <= fin.tenor) bb += fin.beban[mm];
      Y.beban.push(bb);
      Y.pajak.push(t === 0 ? sum(L.pajak) : rr * tarifPajak);
      var lb = rr - cc - pctY - Y.tetap[t] - dep - bb - Y.pajak[t];
      Y.labaBersih.push(lb);
      var inH = (t + 1) <= horizon ? 1 : 0;
      Y.inHorizon.push(inH);
      Y.arusKas.push((lb + dep) * inH);
    }

    // kelayakan
    var premi = isNum(ref.premi[status]) ? ref.premi[status] : ref.premi['Rintisan baru'];
    var diskonto = ref.inflasiUmum + premi;
    var K = { horizon: horizon, horizonStatus: horizonStatus, diskonto: diskonto, dTinggi: diskonto + ref.dTinggi, dSangatTinggi: diskonto + ref.dSangatTinggi, premi: premi };
    function npvAt(r) { var s = 0; for (var t = 0; t < maxT; t++) s += Y.arusKas[t] / Math.pow(1 + r, t + 1); return s - kebutuhan; }
    K.roi = kebutuhan > 0 ? Y.labaBersih[0] / kebutuhan : 0;
    K.paybackBulan = (kebutuhan > 0 && Y.arusKas[0] > 0) ? kebutuhan / (Y.arusKas[0] / 12) : 0;
    K.npv = kebutuhan > 0 ? npvAt(diskonto) : 0;
    K.npvTinggi = kebutuhan > 0 ? npvAt(K.dTinggi) : 0;
    K.npvSangatTinggi = kebutuhan > 0 ? npvAt(K.dSangatTinggi) : 0;
    K.pi = kebutuhan > 0 ? (K.npv + kebutuhan) / kebutuhan : 0;
    var ir = irr([-kebutuhan].concat(Y.arusKas));
    K.irr = ir === null ? 0 : ir;
    K.irrAda = ir !== null;
    K.status = kebutuhan <= 0 ? 'ISI' : ((K.npv > 0 && K.irr > diskonto) ? 'LAYAK' : (K.npv > 0 ? 'LAYAK BERSYARAT' : 'PERLU DIKAJI ULANG'));
    K.paybackOk = K.paybackBulan > 0 && K.paybackBulan / 12 <= horizon;

    // sensitivitas skenario (satu bulan, tanpa musim dan eskalasi)
    function skenario(delta) {
      var rev = 0, hp = 0, pc = 0, vtot = 0, capped = false;
      produk.forEach(function (q, i) {
        var v0 = q.volume * (1 + delta), v = q.kapasitas > 0 ? Math.min(v0, q.kapasitas) : v0;
        if (q.kapasitas > 0 && v0 > q.kapasitas) capped = true;
        var r = v * q.hargaAvg; rev += r; hp += v * q.hppUnit; vtot += v;
        var pp = pctAll; pctItems.forEach(function (b) { if (b.produk === i) pp += num(b.nilai); });
        pc += r * pp;
      });
      var beb = fin.tenor > 0 ? fin.beban[1] : 0;
      var pj = rev * tarifPajak, lb = rev - hp - pc - Fbep - beb - pj;
      var st = vtot <= 0 ? 'ISI' : (lb > 0 ? 'LAYAK' : (Math.abs(lb) < 1e-9 ? 'IMPAS' : 'RUGI'));
      return { delta: delta, volume: vtot, dibatasi: capped, pendapatan: rev, hpp: hp, labaKotor: rev - hp, biayaTetap: Fbep, beban: beb, pajak: pj, labaBersih: lb, margin: rev === 0 ? 0 : lb / rev, kaliBep: np === 1 ? (bep.unit > 0 ? vtot / bep.unit : 0) : (bep.rupiah > 0 ? rev / bep.rupiah : 0), status: st };
    }
    var skn = [-0.2, 0, 0.2].map(skenario);

    // peringatan
    ppr.forEach(function (x) {
      if (x.harga <= 0) cek.push({ tingkat: 'isi', teks: 'Isi harga jual untuk ' + x.nama + '.' });
      else if (x.hpp <= 0) cek.push({ tingkat: 'isi', teks: 'Isi komponen biaya per unit untuk ' + x.nama + '.' });
      else if (x.margin < 0) cek.push({ tingkat: 'periksa', teks: 'Biaya per unit ' + x.nama + ' lebih besar dari harga jual. Periksa kembali angkanya.' });
    });
    if (np > 0 && !bep.cmPositif && ppr.every(function (x) { return x.harga > 0; })) cek.push({ tingkat: 'periksa', teks: 'Margin kontribusi nol atau negatif, titik impas tidak bisa dihitung.' });
    if (Fbep <= 0) cek.push({ tingkat: 'isi', teks: 'Isi biaya tetap. Usaha hampir selalu punya biaya tetap, misalnya upah atau perawatan.' });
    if (internal < 0) cek.push({ tingkat: 'periksa', teks: 'Dana dari luar melebihi kebutuhan modal. Periksa jumlah pembiayaan.' });
    if (nisPemilik + wakaf > 1 + 1e-9) cek.push({ tingkat: 'periksa', teks: 'Nisbah pemilik modal ditambah wakaf melebihi 100%.' });
    if (C.status.some(function (s) { return s === 'PERIKSA'; })) cek.push({ tingkat: 'info', teks: 'Saldo kas turun di bawah target minimum pada bulan ' + C.status.map(function (s, i) { return s === 'PERIKSA' ? i + 1 : null; }).filter(function (x) { return x; }).join(', ') + '. Siapkan penyangga.' });

    var bulanLabaPositif = null;
    for (var mb = 0; mb < M; mb++) if (L.labaBersih[mb] > 0) { bulanLabaPositif = mb + 1; break; }

    var res = {
      versi: '1.0', profil: prof, produk: ppr, produkInternal: produk, bep: bep, hppUnit: np === 1 ? ppr[0].hpp : null,
      laba: L, kas: C, tahunan: Y, kelayakan: K, skenario: skn, musim: must,
      modal: { modalKerja: { stokAwal: stokAwal, biayaOperasional: F0, pemasaranAwal: pemasaranAwal, kasCadangan: kasMin, legalitas: legalitas, lain: lainKerja, subtotal: modalKerja }, aset: aset, investasi: invest, total: kebutuhan, capex1: capex1, amortBulan: amort, penyusutanBulan: depMonthly, umurUtama: umurUtama, sumber: sumberMod },
      pembiayaan: { dana: fin.dana, tenor: fin.tenor, jenis: fin.jenis, angsuranBulan1: fin.angsuran[1], bebanBulan1: fin.beban[1] },
      akad: { jenis: akadJenis, nisbahPemilik: nisPemilik, nisbahPengelola: nisPengelola, nisbahWakaf: wakaf },
      biayaTetapTunai: F0, listrik: lis, bulanLabaPositif: bulanLabaPositif, cek: cek,
      total12: { pendapatan: sum(L.pendapatan), hpp: sum(L.hpp), labaKotor: sum(L.labaKotor), labaBersih: sum(L.labaBersih), pajak: sum(L.pajak), volume: sum(L.volume) },
      saldoMin: Math.min.apply(null, C.saldoAkhir), saldoAkhir12: C.saldoAkhir[11]
    };
    return res;
  }

  function tornado(cfg, pct) {
    pct = pct || 0.1;
    var base = compute(cfg).total12.labaBersih;
    function variant(fn) { var c = clone(cfg); fn(c); return compute(c).total12.labaBersih; }
    function scaleItems(a, f) { (a || []).forEach(function (i) { i.nilai = num(i.nilai) * f; }); }
    var defs = [
      { nama: 'Harga jual', fn: function (f) { return function (c) { c.produk.forEach(function (p) { if (p.mode === 'omzet') p.omzet = num(p.omzet) * f; else { p.harga = num(p.harga) * f; if (p.hargaBulk) p.hargaBulk = p.hargaBulk * f; } }); }; } },
      { nama: 'Volume penjualan', fn: function (f) { return function (c) { c.produk.forEach(function (p) { if (p.mode === 'omzet') p.omzet = num(p.omzet) * f; else if (p.mode === 'batch') { p.batch.hasil = num(p.batch.hasil) * f; } else p.volume = num(p.volume) * f; }); }; } },
      { nama: 'Biaya bahan dan produksi', fn: function (f) { return function (c) { c.produk.forEach(function (p) { if (p.mode === 'omzet') p.margin = 1 - (1 - num(p.margin)) * f; else if (p.mode === 'batch') scaleItems(p.batch.biaya, f); else { scaleItems(p.hppA, f); scaleItems(p.hppB, f); scaleItems(p.hppC, f); scaleItems(p.hppD, f); } }); }; } },
      { nama: 'Biaya tetap', fn: function (f) { return function (c) { scaleItems(c.biayaTetap, f); (c.biayaLain || []).forEach(function (b) { if (b.jenis === 'tetap') b.nilai = num(b.nilai) * f; }); }; } }
    ];
    return defs.map(function (d) {
      var lo = variant(d.fn(1 - pct)), hi = variant(d.fn(1 + pct));
      return { nama: d.nama, turun: lo - base, naik: hi - base, base: base, pct: pct };
    }).sort(function (a, b) { return Math.max(Math.abs(b.turun), Math.abs(b.naik)) - Math.max(Math.abs(a.turun), Math.abs(a.naik)); });
  }

  return { compute: compute, tornado: tornado, irr: irr, DEF_REF: DEF_REF, LEVELS: LEVELS, mergeRef: mergeRef };
});
