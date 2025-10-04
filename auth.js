// auth.js — umkmall (login & claim)
// Mengandalkan WORKER_URL dari config.js → window.UMKM_CONFIG.WORKER_URL
(function(){
  // --- Start: Diadaptasi dari gate.js untuk konsistensi ---
  const GATE_CONFIG = {
    SERVICE_REQUIRED: (window.UMKM_CONFIG && window.UMKM_CONFIG.SERVICE_REQUIRED) || 'umkm_basic',
    PAY_PAGE:   (window.UMKM_CONFIG && window.UMKM_CONFIG.PAGES && window.UMKM_CONFIG.PAGES.pay)   || './pay.html',
    TIMEOUT_MS: 5000 // Timeout untuk request API
  };

  // KODE YANG BENAR: Hanya mengandalkan WORKER_URL dari config.js
  const WORKER_URL =
    (window.UMKM_CONFIG && window.UMKM_CONFIG.WORKER_URL) ||
    window.__WORKER_BASE__ ||
    "https://umkm.msabiq-stan.workers.dev";

  const $ = (id)=>document.getElementById(id);
  const qs = new URLSearchParams(location.search);

  function setLoading(btn, loading){
    if (!btn) return;
    const t = btn.querySelector('.t'), s = btn.querySelector('.s');
    if (t && s) {
      t.classList.toggle('d-none', loading);
      s.classList.toggle('d-none', !loading);
    }
    btn.disabled = loading;
  }
  function msg(el, text, type='secondary'){
    if (!el) return;
    el.className = 'small mt-2 text-' + type;
    el.textContent = text || '';
  }
  function isLocalDev(){
    const h = location.hostname;
    return !h || h === 'localhost' || h === '127.0.0.1' || location.protocol === 'file:';
  }

  function toArr(x){ if(!x) return []; if(Array.isArray(x)) return x; if(typeof x==='string') return x.split(',').map(s=>s.trim()).filter(Boolean); return []; }
  function hasSvc(services, svc){ return toArr(services).map(s=>s.toLowerCase()).includes(String(svc||'').toLowerCase()); }
  function goPay(q){
    const qs = q ? ('?'+new URLSearchParams(q).toString()) : '';
    location.replace(GATE_CONFIG.PAY_PAGE + qs);
  }
  function withTimeout(p, ms, name='request'){
    let to; const killer = new Promise((_,rej)=>{ to=setTimeout(()=>rej(new Error(name+' timeout')), ms); });
    return Promise.race([p.finally(()=>clearTimeout(to)), killer]);
  }
  // --- End: Diadaptasi dari gate.js ---

  async function call(route, payload){
    const r = await withTimeout(fetch(WORKER_URL + '/?route=' + route, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify(payload || {})
    }), GATE_CONFIG.TIMEOUT_MS, route); // Menggunakan withTimeout
    let j; try{ j = await r.json(); }catch{ j={}; }
    if (!r.ok || j.ok === false) throw new Error(j.error || 'Request gagal');
    return j;
  }

  async function userLogin(username, password){
    return await call('user-login', { username, password }); // {ok, token, username, services}
  }
  async function orderClaim(order_id, contact){
    return await call('order-claim', { order_id, contact }); // {ok, username, password}
  }

  // ==== LOGIN ====
  $('btnLogin')?.addEventListener('click', async ()=>{
    const u = $('u')?.value.trim();
    const p = $('p')?.value.trim();
    if (!u || !p) return msg($('loginMsg'), 'Lengkapi username & password.', 'danger');

    setLoading($('btnLogin'), true);
    msg($('loginMsg'), '');
    try{
      const j = await userLogin(u, p);
      if (j.ok && j.token){
        // Pengecekan service sebelum redirect, selaras dengan gate.js
        if (GATE_CONFIG.SERVICE_REQUIRED && !hasSvc(j.services, GATE_CONFIG.SERVICE_REQUIRED)) {
          msg($('loginMsg'), 'Login berhasil, namun Anda belum memiliki layanan yang dibutuhkan. Mengarahkan ke halaman pembayaran...', 'warning');
          return setTimeout(()=>goPay(), 1500); // Arahkan ke halaman pembayaran
        }

        // Jika layanan valid, lanjutkan
        try{ localStorage.setItem('umkm_token', j.token); }catch(_){}
        const defaultAppPage = (window.UMKM_CONFIG && window.UMKM_CONFIG.PAGES.app) || './akses.html';
        const next = qs.get('next') || defaultAppPage;
        location.replace(next);
      } else {
        msg($('loginMsg'), 'Login gagal. Coba lagi.', 'danger');
      }
    }catch(e){
      msg($('loginMsg'), e.message || 'Login gagal.', 'danger');
    }finally{
      setLoading($('btnLogin'), false);
    }
  });

  // Enter to submit (di field password)
  $('p')?.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter') $('btnLogin')?.click(); });

  // Dev helper: prefill (mendukung key {u,p} atau {username,password})
  if (isLocalDev() && $('u') && $('p') && !$('u').value && !$('p').value) {
    const dev = (window.UMKM_CONFIG && window.UMKM_CONFIG.DEV_DEFAULT_USER) || {};
    $('u').value = dev.username || dev.u || 'user1';
    $('p').value = dev.password || dev.p || 'User@123';
  }

  // ==== ORDER CLAIM ====
  $('btnClaim')?.addEventListener('click', async ()=>{
    const order_id = $('claimOrder')?.value.trim();
    const contact  = $('claimContact')?.value.trim();
    if (!order_id || !contact) return msg($('claimMsg'), 'Isi Order ID & kontak.', 'danger');

    setLoading($('btnClaim'), true);
    msg($('claimMsg'), '');
    $('credBox')?.classList.add('d-none');
    try{
      const j = await orderClaim(order_id, contact);
      if (j && j.username && j.password){
        $('uOut').textContent = j.username;
        $('pOut').textContent = j.password;
        $('credBox')?.classList.remove('d-none');
        msg($('claimMsg'), 'Akun ditemukan. Silakan login di atas.', 'success');
      } else {
        msg($('claimMsg'), 'Tidak ditemukan. Pastikan Order ID & kontak benar.', 'warning');
      }
    }catch(e){
      msg($('claimMsg'), e.message || 'Tidak ditemukan.', 'danger');
    }finally{
      setLoading($('btnClaim'), false);
    }
  });

  // Copy credentials
  $('copyCred')?.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(`Username: ${$('uOut').textContent}\nPassword: ${$('pOut').textContent}`);
      msg($('claimMsg'), 'Credensial disalin ke clipboard.', 'success');
    }catch(_){
      msg($('claimMsg'), 'Gagal menyalin. Salin manual.', 'warning');
    }
  });
})();

