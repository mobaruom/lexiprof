/* ============================================================
   LexiProf 2.0 — app.js : routeur, événements, démarrage
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, $$ = LP.$$, ic = LP.ic, esc = LP.esc;
  const V = LP.views, A = LP.actions;
  const ROUTES = {
    '': ['home', 'Accueil'], library: ['library', 'Bibliothèque'], review: ['review', 'Révision'], quiz: ['quiz', 'Quiz'],
    progress: ['progress', 'Progrès'], coach: ['coach', 'Coach de réussite'], privacy: ['privacy', 'Confidentialité'], plans: ['plans', 'Offres'], profile: ['profile', 'Profil'], propose: ['propose', 'Proposer'], admin: ['admin', 'Administration']
  };
  const NAV = [['', 'home', 'Accueil'], ['library', 'book', 'Bibliothèque'], ['review', 'cards', 'Révision'], ['quiz', 'zap', 'Quiz'], ['progress', 'chart', 'Progrès']];

  function parse() {
    const h = (location.hash || '#/').replace(/^#\/?/, ''), [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean), params = {};
    new URLSearchParams(qs || '').forEach((v, k) => (params[k] = v));
    return { name: parts[0] || '', arg: parts[1], params };
  }

  /* ---------- shell ---------- */
  function buildShell() {
    $('#app').innerHTML = `
    <aside class="sidebar" aria-label="Navigation">
      <a class="brand" href="#/"><img src="icons/IMG_6870.png" alt="">LexiProf</a>
      <nav class="nav">${NAV.map(([p, i, t]) => `<a href="#/${p}" data-nav="${p}">${ic(i, 20)}<span>${t}</span>${p === 'review' ? '<span class="pill" id="nav-due" hidden></span>' : ''}</a>`).join('')}
        <div class="nav-sep"></div>
        <a href="#/coach" data-nav="coach">${ic('target', 20)}<span>Coach</span><em class="nav-new">Nouveau</em></a>
        <a href="#/propose" data-nav="propose">${ic('plus', 20)}<span>Proposer</span></a>
        <a href="#/profile" data-nav="profile">${ic('user', 20)}<span>Profil</span></a>
        <a href="#/plans" data-nav="plans">${ic('star', 20)}<span>Offres</span></a>
        <a href="#/privacy" data-nav="privacy">${ic('shield', 20)}<span>Confidentialité</span></a></nav>
      <div class="side-card"><a class="side-me" href="#/profile" aria-label="Mon personnage"><span id="sb-av"></span><span class="side-me-t"><b id="sb-name"></b><small id="sb-title"></small></span></a><div class="row"><b id="sb-lv"></b><span class="muted" id="sb-xp"></span></div><div class="pbar"><i id="sb-bar" style="--w:0%"></i></div></div>
      <button class="btn soft install-btn show" id="install" data-act="install">${ic('phone', 16)} Installer l'app</button>
    </aside>
    <div class="main-col">
      <header class="topbar">
        <a class="top-logo" href="#/"><img src="icons/IMG_6870.png" alt="">LexiProf</a>
        <span class="top-title" id="top-title"></span><span style="flex:1"></span>
        <button class="btn soft sm search-btn" data-act="palette" aria-label="Rechercher">${ic('search', 16)}<span class="hide-sm">Rechercher</span><span class="kbd hide-sm">Ctrl K</span></button>
        <button class="icon-btn s-only" data-act="palette" aria-label="Rechercher">${ic('search', 20)}</button>
        <span class="chip-streak cold" id="streak" title="Série de jours">${ic('flame', 16)}<b>0</b></span>
        <button class="icon-btn" data-act="theme" aria-label="Changer de thème" id="theme-btn"></button>
        <a href="#/profile" id="top-avatar" aria-label="Profil"></a>
      </header>
      <main id="view" class="view" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Navigation mobile">${NAV.map(([p, i, t]) => `<a href="#/${p}" data-nav="${p}">${ic(i, 22)}<span>${t}</span>${p === 'review' ? '<em class="dot" id="tab-due" hidden></em>' : ''}</a>`).join('')}</nav>`;
  }
  function chrome() {
    const s = LP.auth.session(), lv = LP.level(), si = LP.streakInfo(), n = si.n, due = LP.srs.queue().cards.length;
    $('#sb-lv').textContent = 'Niveau ' + lv.level; $('#sb-xp').textContent = lv.xp + ' XP'; $('#sb-bar').style.setProperty('--w', lv.pct + '%');
    const sk = $('#streak'); sk.classList.toggle('cold', n === 0 || si.atRisk); sk.title = n === 0 ? 'Révise aujourd\'hui pour lancer ta série' : si.atRisk ? 'Série de ' + n + ' j : révise avant minuit pour la garder' : 'Série de ' + n + ' jours'; sk.querySelector('b').textContent = n;
    ['nav-due', 'tab-due'].forEach(id => { const e = $('#' + id); if (e) { e.hidden = !due; e.textContent = due > 99 ? '99+' : due; } });
    $('#theme-btn').innerHTML = ic(LP.resolvedTheme() === 'dark' ? 'sun' : 'moon', 20);
    if (LP.fun) { $('#sb-av').innerHTML = LP.fun.avatar(); $('#sb-name').textContent = LP.fun.name() || 'Visiteur'; $('#sb-title').textContent = LP.fun.title(); }
    if (LP.fun) $('#top-avatar').innerHTML = LP.fun.avatar(); else $('#top-avatar').innerHTML = s ? `<div class="avatar">${s.avatar ? `<img src="${esc(s.avatar)}" alt="">` : esc(String(s.displayName).trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div>` : `<div class="icon-btn">${ic('user', 20)}</div>`;
  }

  /* ---------- routeur ---------- */
  let cur = null, firstRoute = true;
  function route() {
    const r = parse();
    if (r.name === 'def') { // lien direct vers une fiche
      const id = Number(r.arg);
      if (cur !== 'library') { history.replaceState(null, '', '#/library'); render({ name: 'library', params: {} }); }
      setTimeout(() => LP.openDef(id), 60);
      return;
    }
    render(r);
  }
  function render(r) {
    const def = ROUTES[r.name] || ROUTES[''], key = ROUTES[r.name] ? r.name : '';
    if (!ROUTES[r.name]) history.replaceState(null, '', '#/');
    if (LP.cleanup) { try { LP.cleanup(); } catch (e) {} LP.cleanup = null; }
    LP.keys = null;
    if (LP.drawer.isOpen()) LP.drawer.close();
    const root = $('#view');
    root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
    root.innerHTML = '';
    try { V[def[0]](root, r.params || {}); } catch (e) { console.error(e); root.innerHTML = `<div class="empty"><h3>Une erreur est survenue</h3><p>${esc(e.message)}</p><a class="btn primary" href="#/">Retour à l'accueil</a></div>`; }
    cur = key;
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === key));
    $('#top-title').textContent = def[1];
    document.title = (key ? def[1] + ' · ' : '') + 'LexiProf';
    if (!firstRoute) window.scrollTo(0, 0); firstRoute = false;
    chrome();
  }

  /* ---------- événements ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = A[el.dataset.act];
    if (fn) { if (el.tagName === 'A' && el.dataset.act === 'open-def') e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('keydown', e => {
    if ((e.target.closest && e.target.closest('.def-card[data-act]') === e.target) && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); A['open-def'](e.target, e); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); LP.palette.isOpen() ? LP.palette.close() : LP.palette.open(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') { if (LP.palette.isOpen()) return; if (LP.drawer.isOpen() && !$('.modal-wrap')) { LP.drawer.close(); return; } }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || $('.modal-wrap')) return;
    if (LP.keys && LP.keys(e)) { e.preventDefault(); return; }
    if (e.key === '/') { e.preventDefault(); if (!LP.libFocusSearch()) { location.hash = '#/library?focus=1'; } }
  });
  document.addEventListener('input', e => { const n = e.target.dataset && e.target.dataset.input; if (n && A[n]) A[n](e.target, e); });
  document.addEventListener('change', e => {
    const t = e.target, n = (t.dataset && t.dataset.change) || (t.id === 'pf-file' ? 'pf-file' : null);
    if (n && A[n]) A[n](t, e);
  });
  document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (!f) return; e.preventDefault(); const fn = A['submit:' + f.dataset.submit]; if (fn) fn(f, e); });
  window.addEventListener('hashchange', route);

  A.palette = () => LP.palette.open();
  A.theme = () => LP.toggleTheme();
  /* ---------- installation (PWA) ---------- */
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ua = navigator.userAgent, isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua), isFirefox = /Firefox|FxiOS/i.test(ua), isSafariMac = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua) && !isIOS;
  const secure = window.isSecureContext;
  function installUI() { const b = $$('[data-act=install]'); b.forEach(x => { x.hidden = standalone(); }); }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; installUI(); });
  window.addEventListener('appinstalled', () => { deferred = null; LP.toast('Application installée', 'ok'); installUI(); });
  A.install = async () => {
    if (standalone()) return LP.toast("L'application est déjà installée.", 'info');
    if (deferred) {
      const d = deferred; deferred = null;
      try { d.prompt(); const c = await d.userChoice; LP.toast(c.outcome === 'accepted' ? 'Installation en cours…' : 'Installation annulée', c.outcome === 'accepted' ? 'ok' : 'info'); }
      catch (e) { LP.toast("Impossible de lancer l'installation.", 'err'); }
      return;
    }
    let title = "Installer LexiProf", body;
    if (!secure) body = "L'installation exige une connexion sécurisée (HTTPS). Ouvre le site depuis son adresse https://.";
    else if (isIOS) body = `<ol style="padding-left:20px;display:grid;gap:8px"><li>Ouvre LexiProf dans <b>Safari</b>.</li><li>Touche le bouton <b>Partager</b> ${LP.ic('share', 16)}.</li><li>Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li></ol><p class="muted" style="margin-top:10px;font-size:13px">Sur iPhone et iPad, Apple n'autorise pas d'installation par bouton : c'est la seule méthode.</p>`;
    else if (isSafariMac) body = "Dans Safari : menu <b>Fichier → Ajouter au Dock</b>.";
    else if (isFirefox && !isAndroid) body = "Firefox sur ordinateur ne gère pas l'installation d'applications web. Utilise Chrome, Edge ou Safari, ou garde LexiProf en favori.";
    else body = isAndroid ? "Ouvre le menu <b>⋮</b> du navigateur puis choisis <b>Installer l'application</b> (ou <b>Ajouter à l'écran d'accueil</b>). Si l'option est absente, le navigateur ne la propose pas encore : navigue quelques secondes sur le site puis réessaie." : "Ton navigateur n'a pas (encore) proposé l'installation. Dans Chrome ou Edge, cherche l'icône d'installation dans la barre d'adresse ou le menu <b>⋮ → Installer LexiProf</b>.";
    LP.dialog({ title, body: `<div class="muted-p">${body}</div>`, ok: 'Compris', hideCancel: true });
  };
  installUI();

  // toasts d'événements
  LP.on('badge', e => { const b = (e && e.detail) || e || {}; LP.toast((b.rare ? 'Badge rare débloqué : ' : 'Badge débloqué : ') + (b.n || ''), 'xp', 3600); if (b.rare) LP.confetti(); });
  LP.on('levelup', e => { const d = (e && e.detail) || e || {}; LP.toast('Niveau ' + (d.level || '') + ' atteint !', 'xp', 3600); LP.confetti(); });
  ['progress', 'favs', 'session', 'prefs', 'defs', 'fun'].forEach(ev => LP.on(ev, LP.debounce(() => { try { chrome(); } catch (e) {} }, 60)));
  LP.on('prefs', () => { try { chrome(); } catch (e) {} });
  window.addEventListener('online', () => LP.refreshDefs());

  /* ---------- démarrage ---------- */
  /* ---------- version : bandeau « nouvelle version » ---------- */
  LP.VERSION = '2.5.0';   // à garder identique à version.json à chaque mise en ligne
  let verChecked = 0;
  LP.checkVersion = async (force) => {
    if (!force && Date.now() - verChecked < 5 * 60000) return; verChecked = Date.now();
    if (location.protocol === 'file:' || document.getElementById('upd-banner')) return;
    try {
      const r = await fetch('version.json?_=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
      const j = await r.json(); if (!j || !j.v || j.v === LP.VERSION || document.getElementById('upd-banner')) return;
      const b = document.createElement('div'); b.id = 'upd-banner'; b.className = 'upd-banner'; b.setAttribute('role', 'status');
      b.innerHTML = '<span>Une nouvelle version de LexiProf est disponible.</span><button class="btn primary sm" data-act="upd-reload">Recharger</button><button class="btn ghost sm" data-act="upd-later" aria-label="Plus tard">Plus tard</button>';
      document.body.appendChild(b);
    } catch (e) { /* hors ligne : on réessaiera */ }
  };
  A['upd-reload'] = () => { try { navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.update())); } catch (e) {} location.reload(); };
  A['upd-later'] = () => { const b = document.getElementById('upd-banner'); if (b) b.remove(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) LP.checkVersion(); });
  window.addEventListener('focus', () => LP.checkVersion());
  setTimeout(() => LP.checkVersion(true), 4000);
  /* ---------- journal d'erreurs technique (local, sur cet appareil uniquement, jamais envoyé) ---------- */
  const ERRK = 'lexiprof_errlog';
  LP.errlog = {
    list() { try { return JSON.parse(localStorage.getItem(ERRK) || '[]'); } catch (e) { return []; } },
    add(msg, src) { try { const l = this.list(); l.push({ t: new Date().toISOString(), msg: String(msg == null ? '' : msg).slice(0, 300), src: String(src || '').slice(0, 200), v: LP.VERSION, page: location.hash }); localStorage.setItem(ERRK, JSON.stringify(l.slice(-50))); } catch (e) {} },
    clear() { try { localStorage.removeItem(ERRK); } catch (e) {} }
  };
  window.addEventListener('error', e => { if (e.message && e.message !== 'Script error.') LP.errlog.add(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', e => LP.errlog.add((e.reason && e.reason.message) || e.reason, 'promesse'));
  async function start() {
    (LP.backends[LP.cfg.backend] || LP.backends.firebase)();
    LP.applyPrefs();
    buildShell();
    try { await Promise.all([LP.boot(), LP.auth.refresh()]); } catch (e) { console.error(e); }
    LP.sync && LP.sync.pull();
    LP.checkBadges && LP.checkBadges();
    route();
    LP.consentBanner && LP.consentBanner(); LP.trackOpen && LP.trackOpen();
    LP.hideBoot ? LP.hideBoot() : (() => { const b = $('#boot'); if (b) { b.classList.add('off'); setTimeout(() => b.remove(), 600); } })();
    setTimeout(() => { try { LP.tour && LP.tour.maybeStart(); } catch (e) { console.error(e); } }, 900);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  start();
})();
