/* ============================================================
   LexiProf 2.0 — ui.js
   Icônes, toasts, dialogues, tiroir, confettis, palette de commandes
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, esc = LP.esc;

  /* ---------- icônes ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/>',
    cards: '<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
    flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 12 0 4 3 7 7 7z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    command: '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
  };
  LP.ic = (n, s) => `<svg class="ic" width="${s || 18}" height="${s || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const ic = LP.ic;
  LP.subj = m => `<span class="subj" data-m="${esc(m)}">${esc(m)}</span>`;

  /* ---------- toasts ---------- */
  LP.toast = (msg, type, ms) => {
    const root = $('#toasts'); if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.setAttribute('role', 'status');
    el.innerHTML = (type === 'ok' ? ic('check', 16) : type === 'err' ? ic('alert', 16) : type === 'xp' ? ic('sparkles', 16) : '') + `<span>${esc(msg)}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, ms || 2800);
  };

  /* ---------- dialogues ---------- */
  LP.dialog = opts => new Promise(resolve => {
    opts = opts || {};
    const root = $('#overlay-root'), prev = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal${opts.wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.title || '')}">
      <div class="modal-head"><h3>${esc(opts.title || '')}</h3><button class="icon-btn" data-m="cancel" aria-label="Fermer">${ic('x')}</button></div>
      <div class="modal-body">${opts.body || ''}${opts.input ? `<input class="input" id="dlg-input" autocomplete="off" placeholder="${esc(opts.input)}">` : ''}</div>
      <div class="modal-foot">${opts.hideCancel ? '' : `<button class="btn ghost" data-m="cancel">${esc(opts.cancel || 'Annuler')}</button>`}<button class="btn ${opts.danger ? 'danger' : 'primary'}" data-m="ok">${esc(opts.ok || 'OK')}</button></div></div>`;
    root.appendChild(wrap);
    document.body.classList.add('lock');
    requestAnimationFrame(() => wrap.classList.add('in'));
    const modal = wrap.firstElementChild;
    const close = val => {
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.remove('in');
      setTimeout(() => { wrap.remove(); if (!root.children.length && !$('.drawer-wrap.in')) document.body.classList.remove('lock'); }, 200);
      try { prev && prev.focus && prev.focus(); } catch (e) {}
      resolve(val);
    };
    const ok = () => {
      let v = true;
      if (opts.input) v = $('#dlg-input', modal).value;
      if (opts.collect) { v = opts.collect(modal); if (v === false) return; }
      close(v);
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(opts.input ? null : false); }
      else if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target === modal) && !e.isComposing) { e.preventDefault(); ok(); }
    };
    document.addEventListener('keydown', onKey, true);
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-m]');
      if (b) { b.dataset.m === 'ok' ? ok() : close(opts.input ? null : false); }
      else if (e.target === wrap) close(opts.input ? null : false);
    });
    if (opts.onMount) opts.onMount(modal);
    setTimeout(() => { const f = modal.querySelector('input,textarea,select') || modal.querySelector('[data-m=ok]'); f && f.focus(); }, 60);
  });
  LP.confirm = (title, body, o) => LP.dialog(Object.assign({ title, body: `<p class="muted-p">${body || ''}</p>`, ok: 'Confirmer' }, o || {}));

  /* ---------- tiroir ---------- */
  let drawerEl = null;
  LP.drawer = {
    open(html) {
      if (!drawerEl) {
        drawerEl = document.createElement('div');
        drawerEl.className = 'drawer-wrap';
        drawerEl.innerHTML = '<div class="drawer-bg" data-act="close-drawer"></div><aside class="drawer" role="dialog" aria-modal="true"></aside>';
        $('#overlay-root').appendChild(drawerEl);
        requestAnimationFrame(() => drawerEl && drawerEl.classList.add('in'));
        document.body.classList.add('lock');
      }
      $('.drawer', drawerEl).innerHTML = html;
      $('.drawer', drawerEl).scrollTop = 0;
    },
    isOpen: () => !!drawerEl,
    close() {
      if (!drawerEl) return;
      const el = drawerEl; drawerEl = null;
      el.classList.remove('in');
      setTimeout(() => { el.remove(); if (!$('#overlay-root').children.length) document.body.classList.remove('lock'); }, 250);
      LP.emit('drawer-closed');
    }
  };

  /* ---------- confettis ---------- */
  LP.confetti = () => {
    if (document.documentElement.dataset.motion === 'reduce') return;
    const c = document.createElement('canvas');
    c.className = 'confetti'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); if (!ctx) { c.remove(); return; }
    const w = (c.width = innerWidth), h = (c.height = innerHeight);
    const cs = getComputedStyle(document.documentElement);
    const cols = [cs.getPropertyValue('--accent'), cs.getPropertyValue('--accent2'), cs.getPropertyValue('--eco'), cs.getPropertyValue('--drt'), cs.getPropertyValue('--rh')].map(s => s.trim() || '#3b82f6');
    const ps = Array.from({ length: 110 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 120, y: h * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * 6 + 3, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, col: cols[Math.floor(Math.random() * cols.length)]
    }));
    let t0 = performance.now();
    (function tick(t) {
      const dt = Math.min(2, (t - t0) / 16.6); t0 = t;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      ps.forEach(p => {
        p.vy += 0.35 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; p.vx *= 0.99;
        if (p.y < h + 20) alive++;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      });
      alive ? requestAnimationFrame(tick) : c.remove();
    })(t0);
  };

  /* ---------- palette de commandes ---------- */
  let pal = null;
  const COMMANDS = () => [
    { t: 'Accueil', i: 'home', k: 'aller accueil dashboard', run: () => (location.hash = '#/') },
    { t: 'Bibliothèque', i: 'book', k: 'aller dictionnaire définitions', run: () => (location.hash = '#/library') },
    { t: 'Réviser maintenant', i: 'cards', k: 'revision flashcards cartes', run: () => (location.hash = '#/review') },
    { t: 'Lancer un quiz', i: 'zap', k: 'quiz qcm test', run: () => (location.hash = '#/quiz') },
    { t: 'Mes progrès', i: 'chart', k: 'progression statistiques badges', run: () => (location.hash = '#/progress') },
    { t: 'Mon profil & réglages', i: 'user', k: 'compte profil préférences', run: () => (location.hash = '#/profile') },
    { t: 'Proposer une définition', i: 'inbox', k: 'ajouter proposer contribuer', run: () => (location.hash = '#/propose') },
    { t: 'Basculer clair / sombre', i: LP.resolvedTheme() === 'dark' ? 'sun' : 'moon', k: 'thème theme dark light', run: () => LP.toggleTheme() },
    { t: 'Administration', i: 'lock', k: 'admin gestion', run: () => (location.hash = '#/admin') }
  ];
  LP.palette = {
    open() {
      if (pal) return;
      const root = $('#overlay-root');
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap pal-wrap';
      wrap.innerHTML = `<div class="palette" role="dialog" aria-modal="true" aria-label="Recherche rapide">
        <div class="pal-in">${ic('search', 18)}<input id="pal-q" placeholder="Rechercher une notion ou une action…" autocomplete="off" spellcheck="false"><span class="kbd">Échap</span></div>
        <div class="pal-list" id="pal-list" role="listbox"></div></div>`;
      root.appendChild(wrap); document.body.classList.add('lock');
      requestAnimationFrame(() => wrap.classList.add('in'));
      pal = { wrap, sel: 0, items: [] };
      const input = $('#pal-q', wrap);
      const render = () => {
        const q = input.value.trim(), nq = LP.norm(q);
        const cmds = COMMANDS().filter(c => !nq || LP.norm(c.t + ' ' + c.k).includes(nq)).map(c => ({ kind: 'cmd', c }));
        const defs = nq ? LP.search(q).slice(0, 7).map(d => ({ kind: 'def', d })) : [];
        pal.items = nq ? defs.concat(cmds.slice(0, 4)) : cmds;
        pal.sel = Math.min(pal.sel, Math.max(0, pal.items.length - 1));
        $('#pal-list', wrap).innerHTML = pal.items.length ? pal.items.map((it, i) => it.kind === 'cmd'
          ? `<button class="pal-item${i === pal.sel ? ' on' : ''}" data-i="${i}" role="option">${ic(it.c.i, 18)}<span>${esc(it.c.t)}</span><em>Action</em></button>`
          : `<button class="pal-item${i === pal.sel ? ' on' : ''}" data-i="${i}" role="option">${ic('book', 18)}<span>${LP.hl(it.d.term, q)}</span><em>${esc(it.d.matiere)}</em></button>`).join('')
          : `<div class="pal-empty">Aucun résultat pour « ${esc(q)} »</div>`;
        const on = $('.pal-item.on', wrap); on && on.scrollIntoView({ block: 'nearest' });
      };
      const run = i => {
        const it = pal.items[i]; if (!it) return;
        LP.palette.close();
        if (it.kind === 'cmd') it.c.run(); else { LP.history.add(it.d.term); LP.openDef(it.d.id); }
      };
      input.addEventListener('input', () => { pal.sel = 0; render(); });
      wrap.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); pal.sel = (pal.sel + 1) % Math.max(1, pal.items.length); render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); pal.sel = (pal.sel - 1 + pal.items.length) % Math.max(1, pal.items.length); render(); }
        else if (e.key === 'Enter') { e.preventDefault(); run(pal.sel); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); LP.palette.close(); }
      });
      wrap.addEventListener('click', e => {
        const b = e.target.closest('.pal-item');
        if (b) run(Number(b.dataset.i)); else if (e.target === wrap) LP.palette.close();
      });
      render(); input.focus();
    },
    close() {
      if (!pal) return;
      const w = pal.wrap; pal = null;
      w.classList.remove('in');
      setTimeout(() => { w.remove(); if (!$('#overlay-root').children.length) document.body.classList.remove('lock'); }, 180);
    },
    isOpen: () => !!pal
  };
})();
