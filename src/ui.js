/* ================= Utilitas DOM ================= */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function el(tag, props, kids) {
  if (Array.isArray(props)) { kids = props; props = null; }
  var e = document.createElement(tag);
  if (props) Object.keys(props).forEach(function (k) {
    var v = props[k];
    if (v === undefined || v === null || v === false) return;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.setAttribute('style', v);
    else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  });
  (kids || []).forEach(function (c) { if (c === null || c === undefined || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}

/* ================= State ================= */
var E = ModalogiEngine;
var STORE = 'modalogi:v1';
var U = blankFor('jasa'); U.nama = '';
var W = { step: 1, tab: 'ringkasan', kj: 'kubah', done: {} };
var K = { kubah: {}, bmc: {}, lean: {} };
var R = null, CFG = null, live = [], pending = false;

function save() { try { localStorage.setItem(STORE, JSON.stringify({ U: U, K: K, kj: W.kj })); } catch (e) { } }
function load() {
  try { var s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && s.U) { U = s.U; K = s.K || K; W.kj = s.kj || W.kj; return true; } } catch (e) { }
  return false;
}
function recalc() {
  CFG = buildCfg(U); R = E.compute(CFG);
  updateSide(); live.forEach(function (f) { try { f(); } catch (e) { } });
}
function change(extra) {
  if (extra) { try { extra(); } catch (e) { } }
  if (pending) return; pending = true;
  requestAnimationFrame(function () { pending = false; recalc(); save(); });
}
var toastT;
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 3600); }

/* ================= Komponen formulir ================= */
function parseIn(s, isRp) {
  s = String(s).trim(); if (s === '') return 0;
  s = isRp ? s.replace(/\./g, '').replace(',', '.') : s.replace(',', '.');
  var n = parseFloat(s); return isFinite(n) ? n : 0;
}
function fmtIn(n, isRp) {
  if (!n) return '';
  if (isRp) { var p = String(Math.round(n * 100) / 100).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : ''); }
  return String(Math.round(n * 10000) / 10000).replace('.', ',');
}
function numField(obj, key, o) {
  o = o || {};
  var isRp = o.rp !== false && !o.suf;
  var inp = el('input', { type: 'text', inputmode: 'decimal', value: fmtIn(obj[key], isRp), placeholder: o.ph || '0', 'aria-label': o.aria || o.label || key });
  inp.addEventListener('input', function () { obj[key] = parseIn(inp.value, isRp); change(o.onchange); });
  inp.addEventListener('blur', function () { inp.value = fmtIn(obj[key], isRp); });
  var box = el('div', { class: 'inp' + (o.pre ? ' hp' : '') + (o.suf ? ' hs' : '') }, [o.pre ? el('span', { class: 'pre', text: o.pre }) : null, inp, o.suf ? el('span', { class: 'suf', text: o.suf }) : null]);
  if (!o.label) return box;
  return el('label', { class: 'f' }, [el('span', { class: 't', text: o.label }), box, o.hint ? el('div', { class: 'hint', text: o.hint }) : null]);
}
function rpField(obj, key, o) { o = o || {}; o.pre = 'Rp'; return numField(obj, key, o); }
function textField(obj, key, o) {
  o = o || {};
  var inp = el('input', { type: 'text', value: obj[key] || '', placeholder: o.ph || '', 'aria-label': o.aria || o.label || key });
  inp.addEventListener('input', function () { obj[key] = inp.value; change(o.onchange); });
  if (!o.label) return inp;
  return el('label', { class: 'f' }, [el('span', { class: 't', text: o.label }), inp, o.hint ? el('div', { class: 'hint', text: o.hint }) : null]);
}
function selField(obj, key, opts, o) {
  o = o || {};
  var s = el('select', { 'aria-label': o.aria || o.label || key }, opts.map(function (x) { var v = typeof x === 'object' ? x.v : x, l = typeof x === 'object' ? x.l : x; var op = el('option', { value: String(v), text: l }); if (String(obj[key]) === String(v)) op.selected = true; return op; }));
  s.addEventListener('change', function () { var v = s.value; obj[key] = (o.num && v !== '') ? +v : v; change(o.onchange); if (o.rerender) o.rerender(); });
  if (!o.label) return s;
  return el('label', { class: 'f' }, [el('span', { class: 't', text: o.label }), s, o.hint ? el('div', { class: 'hint', text: o.hint }) : null]);
}
function segField(obj, key, opts, o) {
  o = o || {};
  var d = el('div', { class: 'seg', role: 'group', 'aria-label': o.aria || '' });
  opts.forEach(function (x) {
    var b = el('button', { type: 'button', class: obj[key] === x.v ? 'on' : '', text: x.l, 'aria-pressed': obj[key] === x.v ? 'true' : 'false' });
    b.addEventListener('click', function () { obj[key] = x.v; $$('button', d).forEach(function (bb) { bb.classList.remove('on'); bb.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); change(o.onchange); if (o.rerender) o.rerender(); });
    d.appendChild(b);
  });
  return d;
}
function toggle(obj, key, onchange) {
  var i = el('input', { type: 'checkbox' }); i.checked = !!obj[key];
  i.addEventListener('change', function () { obj[key] = i.checked; change(onchange); });
  return el('span', { class: 'sw' }, [i, el('i')]);
}
function itemList(arr, o) {
  o = o || {};
  var box = el('div');
  function draw() {
    box.innerHTML = '';
    arr.forEach(function (it, i) {
      var kids = [textField(it, 'nama', { ph: o.namePh || 'Nama komponen', aria: 'Nama' }), o.unit ? numField(it, 'nilai', { suf: o.unit, aria: 'Nilai' }) : rpField(it, 'nilai', { aria: 'Nilai' })];
      if (o.umur) kids.splice(2, 0, numField(it, 'umur', { suf: 'bln', aria: 'Umur ekonomis (bulan)', rp: false }));
      if (o.tahap) kids.splice(2, 0, selField(it, 'tahap', [{ v: 'awal', l: 'Dibayar di awal' }, { v: 'rutin', l: 'Selama siklus' }], { aria: 'Tahap pembayaran' }));
      kids.push(el('button', { type: 'button', class: 'x', 'aria-label': 'Hapus baris', onclick: function () { arr.splice(i, 1); draw(); change(); } }, [ico('ti-x')]));
      box.appendChild(el('div', { class: 'itemrow' + (o.umur || o.tahap ? ' w4' : '') }, kids));
    });
    if (!o.max || arr.length < o.max) box.appendChild(el('button', { type: 'button', class: 'btn sm', onclick: function () { var n = { nama: '', nilai: 0 }; if (o.umur) n.umur = 60; if (o.tahap) n.tahap = 'rutin'; arr.push(n); draw(); change(); } }, [ico('ti-plus'), o.addLabel || 'Tambah baris']));
  }
  draw(); return box;
}
function section(title, sub, kids) { return el('div', { class: 'sec' }, [el('h3', { text: title }), sub ? el('div', { class: 'sub', text: sub }) : null].concat(kids || [])); }
function grid(cls, kids) { return el('div', { class: 'grid ' + cls }, kids); }
function liveText(tag, fn, cls) { var n = el(tag, { class: cls || '' }); function u() { n.innerHTML = fn(); } live.push(u); u(); return n; }

/* ================= Navigasi ================= */
var VIEWS = ['beranda', 'rencana', 'kanvas', 'tentang'];
function go(v, noHash) {
  if (VIEWS.indexOf(v) < 0) v = 'beranda';
  VIEWS.forEach(function (x) { $('#v-' + x).classList.toggle('on', x === v); });
  $$('nav.menu button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
  if (!noHash) { try { history.replaceState(null, '', '#' + v); } catch (e) { try { location.hash = v; } catch (e2) { } } }
  if (v === 'rencana') renderWizard();
  if (v === 'kanvas') renderKanvas();
  window.scrollTo(0, 0);
}
function loadPreset(id) {
  var p = PRESETS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
  U = p.build(); W.done = { 1: true, 2: true, 3: true, 4: true }; W.step = 5; W.tab = 'ringkasan'; recalc(); save();
}

/* ================= Berkas: unduh dan unggah ================= */
var _libs = {};
function loadLib(src) {
  if (_libs[src]) return _libs[src];
  _libs[src] = new Promise(function (res, rej) { var t = document.createElement('script'); t.src = src; t.onload = function () { res(); }; t.onerror = function () { delete _libs[src]; rej(new Error('Pustaka ' + src + ' gagal dimuat. Periksa koneksi lalu coba lagi.')); }; document.head.appendChild(t); });
  return _libs[src];
}
function xlsxReady() { return loadLib('vendor/exceljs.min.js'); }
function pdfReady() { return loadLib('vendor/jspdf.umd.min.js').then(function () { return loadLib('vendor/jspdf.plugin.autotable.min.js'); }); }
function saveBlob(blob, name) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
function fname(prefix, u) {
  var n = String((u && u.nama) || usahaLabel(u || U) || 'usaha').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return 'modalogi-' + prefix + '-' + (n || 'usaha');
}
function busy(btn, label, job) {
  var old = btn.innerHTML; btn.setAttribute('aria-disabled', 'true'); btn.disabled = true; btn.textContent = label;
  return job().then(function () { }, function (e) { toast('Gagal: ' + (e && e.message ? e.message : e)); }).then(function () { btn.disabled = false; btn.removeAttribute('aria-disabled'); btn.innerHTML = old; });
}
function loadFromU(u) { U = u; W.done = { 1: true, 2: true, 3: true, 4: true }; W.step = 5; W.tab = 'ringkasan'; recalc(); save(); }
function handleUpload(file) {
  if (!file) return;
  var ok = /\.xlsx$/i.test(file.name); if (!ok) { toast('Pilih berkas .xlsx dari template atau laporan Modalogi.'); return; }
  var rd = new FileReader();
  rd.onload = function () {
    xlsxReady().then(function () { return XL.readBuffer(rd.result); }).then(function (res) {
      loadFromU(res.U); go('rencana');
      toast('Berkas dibaca: ' + usahaLabel(res.U) + '.' + (res.warn.length ? ' Ada ' + res.warn.length + ' catatan: ' + res.warn[0] : ''));
    }, function (e) { toast(e && e.message ? e.message : 'Berkas tidak dapat dibaca.'); });
  };
  rd.onerror = function () { toast('Berkas tidak dapat dibuka.'); };
  rd.readAsArrayBuffer(file);
}

/* ================= Beranda ================= */
var TPL = { jenis: 'jasa', preset: 'laundry', n: 2, skema: 'konvensional' };
function templateCard() {
  var box = el('div', { class: 'tplform' });
  function draw() {
    box.innerHTML = '';
    var ps = PRESETS.filter(function (p) { return p.jenis === TPL.jenis; });
    if (!ps.some(function (p) { return p.id === TPL.preset; }) && TPL.preset !== 'kosong') TPL.preset = ps.length ? ps[0].id : 'kosong';
    box.appendChild(grid('g2', [
      selField(TPL, 'jenis', JENIS.map(function (j) { return { v: j.id, l: j.label }; }), { label: 'Kelompok usaha', rerender: draw }),
      selField(TPL, 'preset', ps.map(function (p) { return { v: p.id, l: p.label }; }).concat([{ v: 'kosong', l: 'Lainnya (kosong)' }]), { label: 'Usaha spesifik' }),
      selField(TPL, 'n', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (x) { return { v: x, l: String(x) }; }), { label: TPL.jenis === 'dagang' ? 'Jumlah kategori' : (TPL.jenis === 'ternak' || TPL.jenis === 'tani' ? 'Jumlah komoditas' : 'Jumlah produk atau layanan'), num: true }),
      selField(TPL, 'skema', [{ v: 'konvensional', l: 'Konvensional' }, { v: 'syariah', l: 'Syariah' }], { label: 'Skema' })]));
    box.appendChild(el('div', { style: 'margin-top:12px' }, [el('button', { class: 'btn pri', type: 'button', onclick: function (ev) {
      var b = ev.currentTarget; busy(b, 'Menyiapkan...', function () { var u = templateFor(TPL.preset === 'kosong' ? '' : TPL.preset, TPL.jenis, TPL.n, TPL.skema); return xlsxReady().then(function () { return XL.makeTemplate(u); }).then(function (blob) { saveBlob(blob, fname('template', { nama: TPL.preset === 'kosong' ? JENIS.filter(function (j) { return j.id === TPL.jenis; })[0].label : usahaLabel(u) }) + '.xlsx'); toast('Template diunduh. Isi sel biru muda lalu unggah kembali di sini.'); }); });
    } }, [ico('ti-file-spreadsheet'), 'Unduh template Excel'])]));
  }
  draw(); return box;
}
function renderBeranda() {
  var v = $('#v-beranda'); v.innerHTML = '';
  var pick = ['laundry', 'bengkel', 'coffeeshop', 'roti', 'konveksi', 'kelontong', 'lele', 'hidroponik', 'warunglaundry'];
  var chips = PRESETS.filter(function (p) { return pick.indexOf(p.id) >= 0; }).map(function (p) { var j = JENIS.filter(function (x) { return x.id === p.jenis; })[0]; return el('button', { class: 'chip', type: 'button', onclick: function () { loadPreset(p.id); go('rencana'); } }, [ico(j.ikon), p.label]); });
  var fin = el('input', { type: 'file', accept: '.xlsx', style: 'display:none', id: 'fileIn', 'aria-label': 'Unggah berkas Excel' });
  fin.addEventListener('change', function () { handleUpload(fin.files[0]); fin.value = ''; });
  var drop = el('div', { class: 'drop', tabindex: '0', role: 'button', 'aria-label': 'Pilih atau seret berkas Excel ke sini' }, [ico('ti-upload'), el('span', { text: 'Pilih atau seret berkas .xlsx ke sini' })]);
  drop.addEventListener('click', function () { fin.click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fin.click(); } });
  ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('on'); }); });
  ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('on'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; handleUpload(f); });
  v.appendChild(el('div', { class: 'wrap' }, [
    el('div', { class: 'grid g3' }, [
      el('div', { class: 'card' }, [el('div', { class: 'path' }, [el('div', { class: 'ic' }, [ico('ti-pencil')]), el('h3', { text: 'Isi langsung' }), el('p', { class: 'muted small', text: 'Jawab lima langkah singkat. Hasil dihitung saat itu juga, tanpa mengirim data ke mana pun.' }), el('button', { class: 'btn pri', type: 'button', onclick: function () { go('rencana'); } }, ['Mulai merencanakan', ico('ti-arrow-right')])])]),
      el('div', { class: 'card' }, [el('div', { class: 'path' }, [el('div', { class: 'ic' }, [ico('ti-file-spreadsheet')]), el('h3', { text: 'Unduh template Excel' }), el('p', { class: 'muted small', text: 'Bentuknya menyesuaikan usaha dan jumlah produk. Rumus terkunci, siap diisi di Excel.' }), templateCard()])]),
      el('div', { class: 'card' }, [el('div', { class: 'path' }, [el('div', { class: 'ic' }, [ico('ti-upload')]), el('h3', { text: 'Unggah Excel' }), el('p', { class: 'muted small', text: 'Unggah template yang sudah diisi (atau laporan Modalogi). Dashboard membacanya dan langsung menampilkan hasil.' }), drop, fin])])
    ]),
    el('div', { class: 'card', style: 'margin-top:14px' }, [
      el('div', { class: 'row sp' }, [el('div', [el('h3', { text: 'Coba contoh dulu' }), el('p', { class: 'muted small', text: 'Contoh usaha di bawah memakai data rekaan. Pilih satu untuk melihat hasil lengkapnya dalam beberapa detik.' })])]),
      el('div', { class: 'chips', style: 'margin-top:12px' }, chips)
    ]),
    el('div', { class: 'grid g3', style: 'margin-top:14px' }, [
      el('div', { class: 'card tight' }, [el('h4', { text: 'Syariah atau konvensional' }), el('p', { class: 'muted small', text: 'Akad, nisbah, dan Kalender Berkah untuk skema syariah. Pinjaman dan bunga untuk konvensional.' })]),
      el('div', { class: 'card tight' }, [el('h4', { text: 'Fleksibel untuk banyak usaha' }), el('p', { class: 'muted small', text: 'Belasan contoh usaha, satu sampai sepuluh produk, usaha campuran, usaha bersiklus panen, dan biaya lain yang bisa ditambah sendiri.' })]),
      el('div', { class: 'card tight' }, [el('h4', { text: 'Data tetap di perangkat' }), el('p', { class: 'muted small', text: 'Seluruh hitungan berjalan di peramban Anda. Tidak ada akun dan tidak ada pengiriman data.' })])
    ])
  ]));
}

/* ================= Wizard ================= */
var STEPS = [
  { id: 1, t: 'Profil usaha', s: 'Jenis dan skema' },
  { id: 2, t: 'Produk dan biaya', s: 'Harga, volume, biaya' },
  { id: 3, t: 'Modal dan pembiayaan', s: 'Aset, dana, akad' },
  { id: 4, t: 'Asumsi', s: 'Boleh dilewati' },
  { id: 5, t: 'Hasil', s: 'Angka dan grafik' }
];
function renderWizard() {
  var v = $('#v-rencana');
  if (!v.firstChild) {
    v.appendChild(el('div', { class: 'wrap' }, [
      el('div', { class: 'row sp', style: 'margin-bottom:14px' }, [el('div', [el('h2', { text: 'Rencana keuangan' }), el('p', { class: 'muted small', text: 'Klik langkah mana saja kapan pun. Isian tersimpan otomatis di peramban ini.' })])]),
      el('div', { class: 'stepper', id: 'stepper', role: 'tablist' }),
      el('div', { class: 'work' }, [el('div', { id: 'stepBody' }), el('aside', { class: 'side', id: 'side', 'aria-label': 'Ringkasan angka kunci' })]),
      el('div', { class: 'mobbar', id: 'mobbar' })
    ]));
  }
  renderStepper(); renderStep(); recalc();
}
function renderStepper() {
  var s = $('#stepper'); s.innerHTML = '';
  STEPS.forEach(function (st) {
    var b = el('button', { type: 'button', role: 'tab', class: (W.step === st.id ? 'on ' : '') + (W.done[st.id] && W.step !== st.id ? 'done' : ''), 'aria-selected': W.step === st.id ? 'true' : 'false', onclick: function () { setStep(st.id); } }, [
      el('span', { class: 'n' }, [W.done[st.id] && W.step !== st.id ? ico('ti-check') : String(st.id)]), el('span', [st.t, el('small', { text: st.s })])]);
    s.appendChild(b);
  });
}
function setStep(n) { if (n > W.step) W.done[W.step] = true; W.step = n; renderStepper(); renderStep(); recalc(); window.scrollTo(0, 0); }
function navButtons() {
  return el('div', { class: 'sticky-actions' }, [
    W.step > 1 ? el('button', { class: 'btn', type: 'button', onclick: function () { setStep(W.step - 1); } }, [ico('ti-arrow-left'), 'Kembali']) : el('span'),
    W.step < 5 ? el('div', { class: 'row' }, [W.step === 4 ? el('button', { class: 'btn', type: 'button', onclick: function () { U.ref = baseU().ref; U.musim.mode = U.skema === 'syariah' ? 'kb' : 'tanpa'; setStep(5); } }, ['Pakai bawaan dan lihat hasil']) : null, el('button', { class: 'btn pri', type: 'button', onclick: function () { setStep(W.step + 1); } }, [W.step === 4 ? 'Lihat hasil' : 'Lanjut', ico('ti-arrow-right')])]) : el('span')
  ]);
}
function renderStep() {
  live = [];
  var b = $('#stepBody'); b.innerHTML = '';
  var fn = { 1: stepProfil, 2: stepProduk, 3: stepModal, 4: stepAsumsi, 5: stepHasil }[W.step];
  b.appendChild(fn()); b.appendChild(navButtons());
  if (R) live.forEach(function (f) { try { f(); } catch (e) { } });
}
function verdictInfo() { return verdictOf(R); }
function avgLaba() { return R ? R.total12.labaBersih / 12 : 0; }
function updateSide() {
  var s = $('#side'), m = $('#mobbar'); if (!s || !R) return;
  var vi = verdictInfo();
  var bep = R.bep.rupiah > 0 ? cmp(R.bep.rupiah) + '/bln' : '-';
  var rows = [['Status', '<span class="pill ' + vi.c + '">' + esc(vi.t) + '</span>'], ['Laba bersih rata-rata', '<b>' + cmp(avgLaba()) + '/bln</b>'], ['Titik impas', '<b>' + bep + '</b>'], ['Kebutuhan modal', '<b>' + cmp(R.modal.total) + '</b>']];
  s.innerHTML = '<div class="card tight"><h4 style="margin-bottom:6px">Ringkasan sementara</h4>' + rows.map(function (r) { return '<div class="sidekpi"><span class="muted">' + r[0] + '</span>' + r[1] + '</div>'; }).join('') + (W.step < 5 ? '<button class="btn sm" style="margin-top:10px;width:100%;justify-content:center" type="button" id="toHasil">Lihat hasil lengkap</button>' : '') + '</div>';
  var th = $('#toHasil'); if (th) th.onclick = function () { setStep(5); };
  m.innerHTML = '<span class="pill ' + vi.c + '">' + esc(vi.t) + '</span><span class="small">Laba <b>' + cmp(avgLaba()) + '</b>/bln</span><span class="small">Modal <b>' + cmp(R.modal.total) + '</b></span>';
}

/* ---------- Langkah 1: Profil ---------- */
function keepProfile() { return { nama: U.nama, skema: U.skema, status: U.status, bulanMulai: U.bulanMulai }; }
function restoreProfile(k, defNama) {
  U.nama = k.nama || defNama || ''; U.skema = k.skema; U.status = k.status; U.bulanMulai = k.bulanMulai; onSkema();
}
function switchJenis(id) {
  var k = keepProfile(); U = blankFor(id); restoreProfile(k, ''); U.usahaLain = '';
  recalc(); save(); renderStep();
}
function stepProfil() {
  var jbtn = JENIS.map(function (j) {
    return el('button', { type: 'button', class: 'opt' + (U.jenis === j.id ? ' on' : ''), 'aria-pressed': U.jenis === j.id ? 'true' : 'false', onclick: function () { if (U.jenis !== j.id) { switchJenis(j.id); toast('Kelompok usaha diganti. Silakan pilih usaha spesifik atau mulai kosong.'); } } }, [ico(j.ikon), el('span', [el('b', { style: 'font-weight:500;display:block', text: j.label }), el('span', { class: 'muted xs', text: j.ket })])]);
  });
  var contoh = PRESETS.filter(function (p) { return p.jenis === U.jenis; });
  var spes = contoh.map(function (p) {
    return el('button', { class: 'chip' + (U.preset === p.id ? ' on' : ''), type: 'button', 'aria-pressed': U.preset === p.id ? 'true' : 'false', onclick: function () { var k = keepProfile(); U = p.build(); restoreProfile(k, U.nama); U.usahaLain = ''; recalc(); save(); renderStep(); toast('Struktur dan angka contoh dimuat. Komponen biaya bisa dihapus, diganti, atau ditambah.'); } }, [p.label]);
  });
  spes.push(el('button', { class: 'chip' + (U.preset === 'kosong' ? ' on' : ''), type: 'button', 'aria-pressed': U.preset === 'kosong' ? 'true' : 'false', onclick: function () { var k = keepProfile(), j = U.jenis; U = blankFor(j); restoreProfile(k, ''); U.usahaLain = ''; recalc(); save(); renderStep(); } }, [ico('ti-pencil'), 'Lainnya (mulai kosong)']));
  var wrap = el('div', { class: 'stack' }, [
    section('Tentang usaha', 'Isian singkat. Sisanya bisa diisi bertahap.', [
      grid('g2', [textField(U, 'nama', { label: 'Nama usaha', ph: 'Misalnya: Laundry Berkah' }), selField(U, 'bulanMulai', MONTHS.map(function (m, i) { return { v: i, l: m }; }), { label: 'Bulan mulai beroperasi', num: true, hint: 'Hanya untuk label bulan di tabel.' })])]),
    section('Kelompok usaha', 'Menentukan bentuk isian di langkah berikutnya. Bila usaha Anda gabungan, pilih Usaha campuran.', [el('div', { class: 'grid af' }, jbtn)]),
    section('Usaha spesifik', 'Pilih yang paling dekat untuk mendapat komponen biaya yang relevan, atau mulai kosong. Semua komponen bisa dihapus, diganti, dan ditambah. Angka contoh hanya ilustrasi.', [
      el('div', { class: 'chips' }, spes),
      U.preset === 'kosong' ? el('div', { style: 'margin-top:12px;max-width:420px' }, [textField(U, 'usahaLain', { label: 'Jenis usaha Anda (opsional)', ph: 'Misalnya: Bengkel las, jasa fotografi', hint: 'Dicantumkan di hasil dan laporan.' })]) : null]),
    section('Skema dan status', null, [
      el('div', { class: 'row' }, [el('div', [el('div', { class: 't small muted', style: 'margin-bottom:4px', text: 'Skema' }), segField(U, 'skema', [{ v: 'syariah', l: 'Syariah' }, { v: 'konvensional', l: 'Konvensional' }], { aria: 'Skema', onchange: function () { onSkema(); }, rerender: function () { renderStep(); } })])]),
      el('p', { class: 'hint', text: U.skema === 'syariah' ? 'Syariah: pilihan akad dan nisbah, pembiayaan murabahah atau ijarah, dan Kalender Berkah sebagai pola musim.' : 'Konvensional: pembiayaan berupa pinjaman dengan bunga. Pola musim bisa diatur sendiri.' }),
      grid('g2', [selField(U, 'status', STATUS, { label: 'Status usaha', hint: 'Dipakai untuk premi risiko dan batas horizon kelayakan.' }),
        el('div', [el('div', { class: 'small muted', style: 'margin-bottom:4px', text: 'Bahan baku utama berupa pangan?' }), el('div', { class: 'row' }, [toggle(U, 'pangan'), el('span', { class: 'small muted', text: 'Memakai inflasi bahan pangan' })])])])])
  ]);
  return wrap;
}
function onSkema() {
  if (U.skema === 'syariah') { if (U.musim.mode === 'tanpa') U.musim.mode = 'kb'; if (U.pembiayaan.jenis.indexOf('Pinjaman') === 0) U.pembiayaan.jenis = 'Tidak ada'; }
  else { if (U.musim.mode === 'kb') U.musim.mode = 'tanpa'; if (U.pembiayaan.jenis === 'Murabahah' || U.pembiayaan.jenis === 'Ijarah') U.pembiayaan.jenis = 'Tidak ada'; }
}

/* ---------- Langkah 2: Produk dan biaya ---------- */
function productCard(p, i) {
  var j = U.jenis, tp = tipeOf(U, p), card = el('div', { class: 'pcard' });
  var label = tp === 'omzet' ? 'Kategori' : (tp === 'batch' ? 'Komoditas' : (j === 'jasa' ? 'Layanan' : (j === 'kuliner' ? 'Menu' : 'Produk')));
  var head = el('div', { class: 'ph' }, [el('span', { class: 'num', text: String(i + 1) }), j === 'campuran' ? el('span', { class: 'tag', text: tp === 'omzet' ? 'Dagang' : (tp === 'batch' ? 'Bersiklus' : 'Barang atau jasa') }) : null, el('div', { style: 'flex:1' }, [textField(p, 'nama', { ph: 'Nama ' + label.toLowerCase(), aria: 'Nama ' + label.toLowerCase(), onchange: function () { } })]),
    U.produk.length > 1 ? el('button', { type: 'button', class: 'x', 'aria-label': 'Hapus ' + label.toLowerCase(), onclick: function () { U.produk.splice(i, 1); fixBiayaLainRef(); change(); renderStep(); } }, [ico('ti-trash')]) : null]);
  card.appendChild(head);
  if (tp === 'omzet') {
    card.appendChild(grid('g3', [rpField(p, 'omzet', { label: 'Penjualan per bulan' }), numField(p, 'margin', { label: 'Margin kotor', suf: '%', hint: 'Laba kotor dari harga jual.' }), numField(p, 'hariStok', { label: 'Perputaran stok', suf: 'hari', rp: false, hint: 'Menentukan stok awal sebagai modal kerja.' }), numField(p, 'susutPct', { label: 'Susut atau kedaluwarsa', suf: '%', hint: 'Dari harga pokok.' }), numField(p, 'tumbuh', { label: 'Pertumbuhan per bulan', suf: '%' })]));
  } else if (tp === 'batch') {
    card.appendChild(grid('g3', [textField(p, 'satuan', { label: 'Satuan hasil', ph: 'kg' }), rpField(p, 'harga', { label: 'Harga per satuan hasil' }), numField(p, 'siklus', { label: 'Panjang siklus', suf: 'bln', rp: false, hint: 'Dari mulai sampai panen.' }), numField(p, 'jumlah', { label: 'Jumlah batch bergilir', suf: 'batch', rp: false, hint: 'Batch dimulai bergantian agar panen merata.' }), numField(p, 'hasil', { label: 'Hasil per batch', suf: p.satuan || 'kg', rp: false }), numField(p, 'matiPct', { label: j === 'ternak' ? 'Kematian atau susut' : (j === 'campuran' ? 'Kematian, gagal panen, atau susut' : 'Gagal panen atau susut'), suf: '%' })]));
    card.appendChild(el('div', { class: 'grp' }, [el('h4', { text: 'Biaya per batch' }), itemList(p.biayaBatch, { namePh: 'Misalnya: bibit, pakan', tahap: true, addLabel: 'Tambah biaya batch' })]));
    card.appendChild(liveText('div', function () {
      var q = R && R.produkInternal[i]; if (!q || !q.batch) return '';
      var rev = q.batch.hasilNet * q.hargaAvg, lb = rev - q.batch.biayaTotal, first = null; if (R.laba) for (var m = 0; m < 12; m++) if (R.laba.volume[m] > 0 && R.produkInternal.length === 1) { first = m + 1; break; }
      return '<div class="sumline"><span>Hasil bersih per batch <b>' + dec(q.batch.hasilNet, 0) + ' ' + esc(q.satuan) + '</b> · Biaya per batch <b>' + rp(q.batch.biayaTotal) + '</b></span><span>Selisih per batch <b style="color:' + (lb >= 0 ? '#0B6B4F' : '#7E2D1A') + '">' + rp(lb) + '</b>' + (first ? ' · Panen pertama bulan ke-' + first : '') + '</span></div>';
    }, ''));
  } else {
    card.appendChild(grid('g3', [textField(p, 'satuan', { label: 'Satuan', ph: 'kg, buah, porsi' }), rpField(p, 'harga', { label: 'Harga jual per satuan' }), numField(p, 'volume', { label: 'Volume per bulan', suf: p.satuan || 'unit', rp: false, hint: 'Rata-rata di luar pengaruh musim.' }), numField(p, 'kapasitas', { label: 'Kapasitas per bulan', suf: p.satuan || 'unit', rp: false, hint: 'Opsional. Volume dibatasi kapasitas.' }), numField(p, 'tumbuh', { label: 'Pertumbuhan per bulan', suf: '%' }), (j === 'produksi' || j === 'campuran' || j === 'kuliner') ? numField(p, 'susutPct', { label: 'Susut bahan', suf: '%', hint: 'Tambahan biaya bahan.' }) : null]));
    [['hppA', 'Bahan baku dan barang dagangan'], ['hppB', 'Tenaga kerja langsung'], ['hppC', 'Kemasan dan bahan pendukung'], ['hppD', 'Biaya langsung lain']].forEach(function (g) {
      card.appendChild(el('div', { class: 'grp' }, [el('h4', { text: g[1] + ' (per satuan)' }), itemList(p[g[0]], { namePh: 'Nama komponen', addLabel: 'Tambah komponen' })]));
    });
    card.appendChild(liveText('div', function () {
      var x = R && R.produk[i]; if (!x) return '';
      var warn = x.margin < 0 && x.harga > 0;
      return '<div class="sumline"><span>Biaya per satuan <b>' + rp(x.hpp) + '</b></span><span>Margin <b style="color:' + (warn ? '#7E2D1A' : '#0B6B4F') + '">' + rp(x.margin) + ' (' + pct(x.marginPct, 0) + ')</b></span></div>';
    }, ''));
  }
  return card;
}
function fixBiayaLainRef() { U.biayaLain.forEach(function (b) { if (typeof b.produk === 'number' && b.produk >= U.produk.length) b.produk = 'semua'; }); }
function newProduk(tipe) {
  var j = U.jenis;
  if (j === 'campuran') return emptyProduk(j, tipe || 'unit');
  return emptyProduk(j, j === 'dagang' ? 'omzet' : (j === 'ternak' || j === 'tani' ? 'batch' : 'unit'));
}
function question(title, hint, obj, body) {
  var wrap = el('div');
  var holder = el('div', { class: 'qbody' + (obj.on ? '' : ' hide') }, body ? [body] : []);
  var row = el('div', { class: 'tog' }, [el('div', { class: 'q' }, [el('div', { text: title }), hint ? el('div', { class: 'xs muted', text: hint }) : null]), toggle(obj, 'on', function () { holder.classList.toggle('hide', !obj.on); })]);
  wrap.appendChild(row); wrap.appendChild(holder);
  var inp = $('input[type=checkbox]', row); inp.addEventListener('change', function () { holder.classList.toggle('hide', !obj.on); });
  return wrap;
}
function listrikBody() {
  var L = U.q.listrik, body = el('div', { class: 'stack' });
  function draw() {
    body.innerHTML = '';
    body.appendChild(el('div', [el('div', { class: 'small muted', style: 'margin-bottom:4px', text: 'Cara menghitung' }), segField(L, 'metode', [{ v: 'A', l: 'Dari tagihan' }, { v: 'B', l: 'Dari daya alat' }], { aria: 'Metode listrik', rerender: draw })]));
    if (L.metode === 'A') {
      body.appendChild(grid('g2', [rpField(L, 'ramaiTagihan', { label: 'Tagihan bulan ramai' }), numField(L, 'ramaiVol', { label: 'Volume bulan ramai', suf: 'unit', rp: false }), rpField(L, 'sepiTagihan', { label: 'Tagihan bulan sepi' }), numField(L, 'sepiVol', { label: 'Volume bulan sepi', suf: 'unit', rp: false }), numField(L, 'porsiA', { label: 'Porsi untuk usaha ini', suf: '%', hint: '100% bila tagihan khusus usaha. Kurang dari itu bila tagihan bersama.' })]));
    } else {
      body.appendChild(grid('g2', [numField(L, 'daya', { label: 'Total daya alat produksi', suf: 'watt', rp: false }), numField(L, 'jam', { label: 'Jam pakai per hari', suf: 'jam', rp: false }), numField(L, 'hari', { label: 'Hari pakai per bulan', suf: 'hari', rp: false }), rpField(L, 'tarif', { label: 'Tarif listrik per kWh', hint: 'Lihat tagihan.' }), rpField(L, 'tetapLain', { label: 'Listrik dan air tetap lain per bulan', hint: 'Misalnya penerangan.' })]));
    }
    body.appendChild(liveText('div', function () { return R && R.listrik ? '<div class="note pri">Bagian variabel masuk ke biaya per satuan (' + rp(R.listrik.varUnit) + ' per satuan). Bagian tetap masuk ke biaya tetap (' + rp(R.listrik.tetap) + ' per bulan).</div>' : ''; }));
  }
  draw(); return body;
}
function stepProduk() {
  var wrap = el('div', { class: 'stack' });
  var j = JENIS.filter(function (x) { return x.id === U.jenis; })[0];
  var plist = el('div');
  function drawP() {
    plist.innerHTML = '';
    U.produk.forEach(function (p, i) { plist.appendChild(productCard(p, i)); });
    var lab = U.jenis === 'dagang' ? 'kategori' : (U.jenis === 'ternak' || U.jenis === 'tani' ? 'komoditas' : (U.jenis === 'campuran' ? 'lini usaha' : 'produk'));
    var btns = [];
    function addBtn(t, txt) { return el('button', { type: 'button', class: 'btn', onclick: function () { U.produk.push(newProduk(t)); drawP(); change(); } }, [ico('ti-plus'), txt]); }
    if (U.produk.length < 10) { if (U.jenis === 'campuran') btns = [addBtn('unit', 'Tambah barang atau jasa'), addBtn('omzet', 'Tambah dagangan'), addBtn('batch', 'Tambah usaha bersiklus')]; else btns = [addBtn(null, 'Tambah ' + (lab === 'produk' && U.jenis === 'jasa' ? 'layanan' : lab))]; }
    else btns = [el('span', { class: 'small muted', text: 'Batas 10 tercapai.' })];
    plist.appendChild(el('div', { class: 'row' }, btns.concat([el('span', { class: 'small muted', text: U.produk.length + ' dari 10' })])));
  }
  drawP();
  var sub = U.jenis === 'campuran' ? 'Setiap kartu bisa berbeda jenisnya: barang atau jasa, dagangan per kategori, atau usaha bersiklus. Tambahkan sesuai lini usaha Anda.' : U.jenis === 'dagang' ? 'Dagang diisi per kategori, bukan per barang. Cukup penjualan, margin, dan perputaran stok.' : (U.jenis === 'ternak' || U.jenis === 'tani' ? 'Usaha bersiklus: biaya keluar lebih dulu, hasil masuk saat panen. Atur panjang siklus dan jumlah batch bergilir.' : 'Satu sampai sepuluh produk. Bila hanya satu, cukup isi satu kartu.');
  wrap.appendChild(section((U.jenis === 'dagang' ? 'Kategori dagangan' : (U.jenis === 'ternak' || U.jenis === 'tani' ? 'Komoditas dan siklus' : (U.jenis === 'campuran' ? 'Lini usaha' : 'Produk dan biaya per satuan'))) + ' · ' + usahaLabel(U), sub, [plist]));
  wrap.appendChild(section('Biaya tetap per bulan', 'Dibayar walau tidak ada penjualan. Jawab pertanyaan berikut, hanya yang Ya akan memunculkan isian.', [
    itemList(U.biayaTetap, { namePh: 'Misalnya: upah pengelola, perawatan', addLabel: 'Tambah biaya tetap' }),
    el('div', { style: 'margin-top:14px' }, [
      question('Usaha membayar sewa tempat?', null, U.q.sewa, rpField(U.q.sewa, 'nilai', { label: 'Sewa per bulan' })),
      question('Mempekerjakan karyawan dengan upah tetap?', null, U.q.karyawan, rpField(U.q.karyawan, 'nilai', { label: 'Upah tetap per bulan' })),
      question('Memakai mesin atau alat listrik besar?', 'Memisahkan listrik tetap dan variabel.', U.q.listrik, listrikBody()),
      question('Berjualan lewat marketplace atau antar-jemput?', null, U.q.marketplace, numField(U.q.marketplace, 'pct', { label: 'Komisi dan biaya platform', suf: '% dari penjualan' })),
      question('Memakai kendaraan untuk usaha?', null, U.q.kendaraan, rpField(U.q.kendaraan, 'nilai', { label: 'BBM dan perawatan per bulan', hint: 'Penyusutan kendaraan dimasukkan sebagai aset di langkah 3.' })),
      question('Perlu izin, sertifikasi, atau legalitas?', 'Biayanya dibagi rata sepanjang masa amortisasi.', U.q.legalitas, rpField(U.q.legalitas, 'nilai', { label: 'Total biaya izin dan sertifikasi' })),
      question('Menjual secara tempo (dibayar belakangan)?', 'Bagian tempo tertagih bulan berikutnya.', U.q.tempo, numField(U.q.tempo, 'porsiTunai', { label: 'Porsi penjualan tunai', suf: '%' }))
    ])]));
  var bl = el('div');
  function drawBL() {
    bl.innerHTML = '';
    U.biayaLain.forEach(function (b, i) {
      var jenisOpts = [{ v: 'tetap', l: 'Tetap per bulan (Rp)' }, { v: 'unit', l: 'Variabel per satuan (Rp)' }, { v: 'persen', l: 'Variabel persen penjualan (%)' }];
      if (U.produk.some(function (x) { return tipeOf(U, x) === 'batch'; })) jenisOpts.push({ v: 'batch', l: 'Variabel per batch (Rp)' });
      var prodOpts = [{ v: 'semua', l: 'Semua' }].concat(U.produk.map(function (p, k) { return { v: k, l: p.nama || ('Produk ' + (k + 1)) }; }));
      var nilai = b.jenis === 'persen' ? numField(b, 'nilai', { suf: '%', aria: 'Nilai' }) : rpField(b, 'nilai', { aria: 'Nilai' });
      var prodSel = (b.jenis === 'tetap' || b.jenis === 'persen' && false) ? el('div', { class: 'xs muted', text: 'Berlaku umum' }) : selField(b, 'produk', prodOpts, { aria: 'Berlaku untuk', num: false, onchange: function () { if (b.produk !== 'semua') b.produk = +b.produk; } });
      var row = el('div', { class: 'itemrow w5' }, [textField(b, 'nama', { ph: 'Nama biaya', aria: 'Nama biaya' }), nilai, selField(b, 'jenis', jenisOpts, { aria: 'Jenis biaya', rerender: drawBL }), prodSel, el('button', { type: 'button', class: 'x', 'aria-label': 'Hapus biaya', onclick: function () { U.biayaLain.splice(i, 1); drawBL(); change(); } }, [ico('ti-x')])]);
      bl.appendChild(row);
    });
    if (U.biayaLain.length < 15) bl.appendChild(el('button', { type: 'button', class: 'btn sm', onclick: function () { U.biayaLain.push({ nama: '', nilai: 0, jenis: 'tetap', produk: 'semua' }); drawBL(); change(); } }, [ico('ti-plus'), 'Tambah biaya lain']));
  }
  drawBL();
  wrap.appendChild(section('Biaya lain yang terlewat (opsional)', 'Tambahkan sendiri bila ada biaya yang belum tercantum. Biaya ini ikut terhitung di semua hasil dan tercatat di laporan dan template Excel.', [bl]));
  return wrap;
}

/* ---------- Langkah 3: Modal dan pembiayaan ---------- */
function stepModal() {
  var wrap = el('div', { class: 'stack' });
  wrap.appendChild(section('Aset tetap dan investasi awal', 'Peralatan, bangunan, kendaraan. Umur ekonomis menentukan penyusutan bulanan.', [
    itemList(U.aset, { namePh: 'Nama aset', umur: true, addLabel: 'Tambah aset' }),
    el('div', { style: 'margin-top:12px;max-width:320px' }, [rpField(U, 'pemasaranAwal', { label: 'Pemasaran dan promosi awal', hint: 'Foto produk, banner, konten awal.' })])]));
  wrap.appendChild(section('Kebutuhan modal', 'Dihitung otomatis dari isian sebelumnya.', [liveText('div', function () {
    if (!R) return ''; var m = R.modal.modalKerja;
    var rows = [['Stok awal bahan atau barang', m.stokAwal], ['Biaya operasional bulan pertama', m.biayaOperasional], ['Kas cadangan (target kas minimum)', m.kasCadangan], ['Pemasaran awal', m.pemasaranAwal], ['Izin dan legalitas', m.legalitas], ['Investasi aset tetap', R.modal.investasi]];
    return '<div class="tw"><table class="tbl2"><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td style="text-align:right">' + rp(r[1]) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total kebutuhan modal</td><td style="text-align:right">' + rp(R.modal.total) + '</td></tr></tbody></table></div>';
  })]));
  var finBox = el('div');
  function drawFin() {
    finBox.innerHTML = ''; var P = U.pembiayaan, syr = U.skema === 'syariah';
    var opts = syr ? ['Tidak ada', 'Murabahah', 'Ijarah'] : ['Tidak ada', 'Pinjaman anuitas', 'Pinjaman flat'];
    finBox.appendChild(grid('g2', [selField(P, 'jenis', opts, { label: syr ? 'Pembiayaan eksternal (bank syariah, BMT, KUR syariah)' : 'Pinjaman eksternal (bank, koperasi, KUR)', rerender: drawFin }), P.jenis !== 'Tidak ada' ? textField(P, 'lembaga', { label: 'Nama lembaga (opsional)' }) : null]));
    var f = null;
    if (P.jenis === 'Murabahah') f = grid('g3', [rpField(P, 'hargaBeli', { label: 'Harga beli barang oleh lembaga', hint: 'Yang diterima usaha sebagai dana.' }), rpField(P, 'margin', { label: 'Total margin disepakati' }), numField(P, 'tenor', { label: 'Tenor', suf: 'bln', rp: false })]);
    if (P.jenis === 'Ijarah') f = grid('g2', [rpField(P, 'sewa', { label: 'Sewa per bulan' }), numField(P, 'tenor', { label: 'Tenor', suf: 'bln', rp: false })]);
    if (P.jenis === 'Pinjaman anuitas' || P.jenis === 'Pinjaman flat') f = grid('g3', [rpField(P, 'pokok', { label: 'Pokok pinjaman' }), numField(P, 'bunga', { label: 'Bunga per tahun', suf: '%' }), numField(P, 'tenor', { label: 'Tenor', suf: 'bln', rp: false })]);
    if (f) { finBox.appendChild(el('div', { style: 'margin-top:12px' }, [f])); finBox.appendChild(liveText('div', function () { return R && R.pembiayaan.tenor > 0 ? '<div class="note pri" style="margin-top:10px">Angsuran bulan pertama <b>' + rp(R.pembiayaan.angsuranBulan1) + '</b>, beban ' + (U.skema === 'syariah' ? 'margin atau sewa' : 'bunga') + ' <b>' + rp(R.pembiayaan.bebanBulan1) + '</b>. Dana yang diterima <b>' + rp(R.pembiayaan.dana) + '</b>.</div>' : ''; })); }
    finBox.appendChild(el('div', { class: 'grid g2', style: 'margin-top:12px' }, [rpField(U, 'ziswaf', { label: syr ? 'Dana sosial (zakat, infak, sedekah, wakaf)' : 'Hibah atau dana sosial' }), rpField(U, 'lainnya', { label: 'Sumber lain (hibah program, mitra)' })]));
    finBox.appendChild(liveText('div', function () {
      if (!R) return ''; var s = R.modal.sumber, ok = s.internal >= 0;
      return '<div style="margin-top:14px">' + svgStack([{ n: 'Modal sendiri', v: Math.max(0, s.internal), c: COL.pri }, { n: 'Pembiayaan eksternal', v: s.eksternal, c: COL.ink }, { n: 'Dana sosial', v: s.ziswaf, c: COL.pos }, { n: 'Sumber lain', v: s.lainnya, c: COL.acc }], R.modal.total) + '<div class="lg"><span><i style="background:' + COL.pri + '"></i>Modal sendiri ' + rp(s.internal) + '</span><span><i style="background:' + COL.ink + '"></i>Eksternal ' + rp(s.eksternal) + '</span><span><i style="background:' + COL.pos + '"></i>Dana sosial ' + rp(s.ziswaf) + '</span><span><i style="background:' + COL.acc + '"></i>Lain ' + rp(s.lainnya) + '</span></div></div>' + (ok ? '' : '<div class="note bad" style="margin-top:10px">Dana dari luar melebihi kebutuhan modal. Periksa jumlahnya.</div>');
    }));
    finBox.appendChild(el('div', { class: 'note pri', style: 'margin-top:12px' }, [el('span', { html: 'Ingin membandingkan tawaran pinjaman produktif? Cek dulu di <a href="https://mrk29-feb.github.io/lampu-pindar/#kalkulator" target="_blank" rel="noopener">Lampu Pindar</a>. Angka bantu ada di tab Pembiayaan pada hasil.' })]));
  }
  drawFin();
  wrap.appendChild(section('Sumber dana', 'Sisa kebutuhan ditutup modal sendiri.', [finBox]));
  if (U.skema === 'syariah') {
    var akadBox = el('div');
    function drawAkad() {
      akadBox.innerHTML = ''; var A = U.akad;
      akadBox.appendChild(grid('g2', [selField(A, 'jenis', ['Dikelola langsung', 'Mudharabah', 'Musyarakah'], { label: 'Akad kerja sama pengelolaan', rerender: drawAkad, hint: 'Dikelola langsung: pemilik modal mengelola sendiri.' }), selField(A, 'frek', ['Bulanan', 'Triwulanan', 'Tahunan'], { label: 'Frekuensi pembayaran bagi hasil' })]));
      var g = [];
      if (A.jenis !== 'Dikelola langsung') g.push(numField(A, 'nisbahPemilik', { label: 'Nisbah pemilik modal atas laba', suf: '%' }));
      if (A.jenis === 'Musyarakah') g.push(numField(A, 'porsiModal', { label: 'Porsi modal pemilik modal', suf: '%', hint: 'Dasar pembagian bila rugi.' }));
      g.push(numField(A, 'wakaf', { label: 'Nisbah wakaf atau dana sosial atas laba', suf: '%', hint: 'Opsional. Hanya dibayar saat laba positif.' }));
      akadBox.appendChild(el('div', { style: 'margin-top:12px' }, [grid('g3', g)]));
      akadBox.appendChild(el('p', { class: 'hint', style: 'margin-top:8px', text: 'Aturan rugi: Mudharabah dan dikelola langsung, rugi modal ditanggung pemilik modal. Musyarakah, rugi dibagi sesuai porsi modal. Verifikasikan ke dewan pengawas syariah atau ustadz.' }));
    }
    drawAkad();
    wrap.appendChild(section('Akad dan bagi hasil', 'Hanya untuk skema syariah. Dipakai untuk membagi laba bersih.', [akadBox]));
  }
  return wrap;
}

/* ---------- Langkah 4: Asumsi ---------- */
function stepAsumsi() {
  var wrap = el('div', { class: 'stack' }), M = U.musim;
  var mbox = el('div');
  function drawM() {
    mbox.innerHTML = '';
    var opts = [{ v: 'tanpa', l: 'Tanpa musim' }, { v: 'kb', l: 'Kalender Berkah' }, { v: 'sendiri', l: 'Pola sendiri' }];
    mbox.appendChild(el('div', { class: 'row' }, [segField(M, 'mode', opts, { aria: 'Pola musim', rerender: drawM })]));
    mbox.appendChild(el('p', { class: 'hint', style: 'margin:8px 0 10px', text: M.mode === 'tanpa' ? 'Pendapatan dianggap merata tiap bulan.' : (M.mode === 'kb' ? 'Dua belas periode berbasis kalender hijriah dan kegiatan lembaga. Tingkat tiap periode bisa diubah. Pengali dinormalkan agar rata-ratanya 1,00.' : 'Dua belas bulan operasi dengan tingkat permintaan yang Anda tentukan. Pengali dinormalkan agar rata-ratanya 1,00.') }));
    if (M.mode === 'tanpa') return;
    var arrT = M.mode === 'kb' ? M.tingkatKB : M.tingkatSendiri;
    var names = M.mode === 'kb' ? KB_PERIODE : MONTHS.map(function (m, i) { return 'Bulan operasi ke-' + (i + 1); });
    if (M.mode === 'kb') mbox.appendChild(el('div', { style: 'max-width:340px;margin-bottom:10px' }, [selField(M, 'periodeAwal', KB_PERIODE.map(function (p, i) { return { v: i + 1, l: p }; }), { label: 'Periode pada bulan operasi ke-1', num: true })]));
    var tb = el('div', { class: 'tw' }, [el('table', { class: 'tbl2' }, [el('thead', [el('tr', [el('th', { text: 'Periode' }), el('th', { text: 'Tingkat' }), el('th', { text: 'Pengali' })])]), el('tbody', names.map(function (n, i) {
      var sel = selField(arrT, i, LEVELS, { aria: 'Tingkat ' + n });
      var pm = el('td', { class: 'pm', text: '' });
      return el('tr', [el('td', { text: n }), el('td', [sel]), pm]);
    }))])]);
    mbox.appendChild(tb);
    live.push(function () { if (!R) return; $$('td.pm', tb).forEach(function (td, i) { td.textContent = dec(R.musim.norm[i], 2) + 'x'; }); });
    mbox.appendChild(liveText('div', function () { return R ? '<div style="margin-top:12px">' + heatStrip(R.musim.mult, MONTHS.map(function (m, i) { return 'Bln ' + (i + 1); })) + '<div class="hint" style="margin-top:6px">Pengali musim per bulan operasi (rata-rata ' + dec(R.musim.avg, 2) + ').</div></div>' : ''; }));
  }
  drawM();
  wrap.appendChild(section('Pola musim', U.skema === 'syariah' ? 'Kalender Berkah menyesuaikan volume dengan ritme musim. Bisa dipakai juga untuk usaha non-syariah.' : 'Atur ritme musim bila usaha Anda punya bulan ramai dan sepi.', [mbox]));
  var rf = el('div'); var Rr = U.ref;
  rf.appendChild(el('div', { class: 'note', style: 'margin-bottom:12px', text: 'Parameter standar per Okt 2026. Ubah hanya bila Anda punya data yang lebih baru atau lebih tepat.' }));
  rf.appendChild(grid('g3', [numField(Rr, 'inflasiUmum', { label: 'Inflasi umum per tahun', suf: '%' }), numField(Rr, 'inflasiPangan', { label: 'Inflasi bahan pangan per tahun', suf: '%' }), numField(Rr, 'pph', { label: 'PPh final atas penjualan', suf: '%', hint: 'Tarif UMKM yang berlaku saat ini.' }), numField(Rr, 'dTinggi', { label: 'Tambahan diskonto skenario tinggi', suf: 'poin %' }), numField(Rr, 'dSangatTinggi', { label: 'Tambahan diskonto sangat tinggi', suf: 'poin %' }), numField(Rr, 'kasMinBulan', { label: 'Target kas minimum', suf: 'bln biaya', rp: false }), numField(Rr, 'amortBulan', { label: 'Masa amortisasi izin', suf: 'bln', rp: false })]));
  rf.appendChild(el('button', { class: 'btn sm', style: 'margin-top:12px', type: 'button', onclick: function () { U.ref = baseU().ref; change(); renderStep(); toast('Parameter dikembalikan ke nilai standar.'); } }, [ico('ti-refresh'), 'Kembalikan ke standar']));
  wrap.appendChild(section('Parameter standar', 'Inflasi, pajak, dan diskonto. Sudah terisi.', [rf]));
  var kj = el('div');
  function drawKJ() {
    kj.innerHTML = '';
    U.kejadian.forEach(function (k, i) {
      kj.appendChild(el('div', { class: 'itemrow w5' }, [textField(k, 'ket', { ph: 'Keterangan', aria: 'Keterangan' }), numField(k, 'bulan', { suf: 'bulan ke-', aria: 'Bulan ke', rp: false }), selField(k, 'jenis', ['Kas masuk', 'Kas keluar'], { aria: 'Jenis' }), rpField(k, 'jumlah', { aria: 'Jumlah' }), el('button', { type: 'button', class: 'x', 'aria-label': 'Hapus', onclick: function () { U.kejadian.splice(i, 1); drawKJ(); change(); } }, [ico('ti-x')])]));
    });
    if (U.kejadian.length < 10) kj.appendChild(el('button', { type: 'button', class: 'btn sm', onclick: function () { U.kejadian.push({ ket: '', bulan: 1, jenis: 'Kas keluar', jumlah: 0 }); drawKJ(); change(); } }, [ico('ti-plus'), 'Tambah kejadian']));
  }
  drawKJ();
  wrap.appendChild(section('Kejadian khusus (opsional)', 'Pembelian besar, hibah, atau penerimaan sekali waktu di bulan tertentu.', [kj]));
  wrap.appendChild(el('div', { class: 'grid g2' }, [section('Kas awal', null, [rpField(U, 'kasAwal', { label: 'Saldo kas awal unit usaha' })])]));
  return wrap;
}
