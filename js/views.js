/* ============================================================
   LexiProf 2.0 — views.js
   Accueil · Bibliothèque · Fiche · Révision · Quiz
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, $$ = LP.$$, esc = LP.esc, ic = LP.ic, subj = LP.subj;
  const view = () => $('#view');
  const V = (LP.views = LP.views || {});
  const A = (LP.actions = LP.actions || {});
  LP.keys = null; LP.cleanup = null;
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  const plural = (n, a, b) => (n > 1 ? b : a);
  const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; };

  function ring(pct) {
    const C = 2 * Math.PI * 48, off = C * (1 - pct / 100);
    return `<svg width="112" height="112" viewBox="0 0 112 112"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent2)"/></linearGradient></defs>
      <circle class="bg" cx="56" cy="56" r="48" fill="none" stroke-width="10"/><circle class="fg" cx="56" cy="56" r="48" fill="none" stroke-width="10" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>`;
  }

  /* ============================ ACCUEIL ============================ */
  V.home = root => {
    const s = LP.auth.session(), name = LP.fun ? LP.fun.name() : (s ? s.displayName.split(' ')[0] : '');
    const q = LP.srs.queue(), due = q.due.length, fresh = q.fresh.length, total = due + fresh;
    const st = LP.stats(), lv = LP.level(), g = LP.goal(), streak = LP.streak();
    const first = st.reviews === 0 && st.quizRuns === 0;
    const acc = st.quiz ? Math.round((st.correct / st.quiz) * 100) : null;
    const mastered = LP.defs.filter(d => LP.status(d.id) === 'mastered').length;
    const daily = LP.daily();
    const recent = LP.defs.slice().sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0) || b.id - a.id).slice(0, 5);
    let sub;
    if (!LP.defs.length) sub = "La bibliothèque est vide pour l'instant.";
    else if (first) sub = `Bienvenue. Lance ta première session : ${Math.min(5, total)} notions, 3 minutes suffisent.`;
    else if (total) sub = `${due ? due + ' ' + plural(due, 'notion à réviser', 'notions à réviser') : ''}${due && fresh ? ' · ' : ''}${fresh ? fresh + ' ' + plural(fresh, 'nouvelle', 'nouvelles') : ''}. Quelques minutes suffisent.`;
    else sub = "Tout est à jour. Fais un quiz ou explore la bibliothèque en attendant la prochaine échéance.";
    const offline = LP.source === 'offline' || LP.source === 'seed';

    root.innerHTML = `
    ${offline ? `<div class="notice warn" style="margin-bottom:16px">${ic('wifi')}<div><b>${LP.source === 'seed' ? 'Mode démo' : 'Mode hors ligne'}.</b> ${LP.source === 'seed' ? 'Impossible de joindre le serveur : quelques notions d\'exemple sont affichées.' : 'Tes données locales sont utilisées. La synchronisation reprendra dès que tu seras reconnecté.'}</div></div>` : ''}
    ${LP.defs.length ? (() => { const cc = LP.coach.compute(); return `<a class="coach-teaser" href="#/coach"><span class="ct-ico">${ic('target', 22)}</span><div><b>${first ? 'Découvre ton coach de réussite' : 'Ton score de préparation : ' + Math.round(cc.ready * 100) + ' %'}</b><small>${cc.D != null ? 'J-' + cc.D + ' avant ton examen · ' : ''}Ton plan, tes points faibles et ta projection au jour J</small></div><span class="ct-go">${ic('arrow', 18)}</span></a>`; })() : ''}
    ${LP.fun ? LP.fun.homeCard(first) : ''}
    <div class="grid">
      <section class="hero c8">
        <div>
          <div class="eyebrow">${ic('sparkles', 16)} ${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
          <h1>${greeting()}${name ? ', ' + esc(name) : ''}.</h1>
          <p>${sub}</p>
        </div>
        <div class="cta">
          ${total ? `<a class="btn light lg" href="#/review">${ic('play', 16)} Réviser · ${Math.min(LP.cfg.sessionMax, total)} ${plural(Math.min(LP.cfg.sessionMax, total), 'carte', 'cartes')}</a>` : `<a class="btn light lg" href="#/library">${ic('book', 18)} Explorer la bibliothèque</a>`}
          <a class="btn glass lg" href="#/quiz">${ic('zap', 18)} Faire un quiz</a>
        </div>
      </section>
      <section class="card c4">
        <div class="card-head"><h3>${ic('target', 18)} Objectif du jour</h3></div>
        <div class="ring-wrap">
          <div class="ring">${ring(g.pct)}<div class="mid"><b>${g.done}</b><small>/ ${g.goal}</small></div></div>
          <div><p style="font-weight:650">${g.pct >= 100 ? 'Objectif atteint 🎉' : 'Encore ' + (g.goal - g.done) + ' actions'}</p>
          <p class="muted" style="font-size:13px;margin-top:4px">Une action = une carte révisée ou une réponse de quiz.</p></div>
        </div>
      </section>
    </div>
    <div class="tiles" style="margin:16px 0">
      <div class="tile" style="--c:var(--drt)"><div class="bub">${ic('flame', 20)}</div><b>${streak}</b><span>${plural(streak, 'jour de série', 'jours de série')}${st.best > streak ? ' · record ' + st.best : ''}</span></div>
      <div class="tile"><div class="bub">${ic('trophy', 20)}</div><b>Niv. ${lv.level}</b><span>${lv.xp} XP · ${lv.next - lv.xp} avant le niveau ${lv.level + 1}</span></div>
      <div class="tile" style="--c:var(--eco)"><div class="bub">${ic('check', 20)}</div><b>${mastered}<small style="font-size:16px;color:var(--muted)"> / ${LP.defs.length}</small></b><span>notions maîtrisées</span></div>
      <div class="tile" style="--c:var(--rh)"><div class="bub">${ic('zap', 20)}</div><b>${acc == null ? '—' : acc + '%'}</b><span>précision au quiz</span></div>
    </div>
    <div class="grid">
      <section class="card c7 daily" ${daily ? `data-m="${esc(daily.matiere)}"` : ''}>
        <div class="card-head"><h3>${ic('sparkles', 18)} Notion du jour</h3></div>
        ${daily ? `${subj(daily.matiere)}<h2>${esc(daily.term)}</h2><p>${esc(daily.def)}</p>
        <div style="margin-top:16px"><button class="btn soft" data-act="open-def" data-id="${daily.id}">Ouvrir la fiche ${ic('arrow', 16)}</button></div>` : '<p class="muted">Aucune notion disponible.</p>'}
      </section>
      <section class="card c5">
        <div class="card-head"><h3>${ic('chart', 18)} Par matière</h3><a href="#/progress">Détails ${ic('chevron', 14)}</a></div>
        ${LP.SUBJECTS.map(m => { const x = LP.masteryBy(m); return x.total ? `<div class="mrow"><div class="t"><span>${subj(m)}</span><span>${x.mastered}/${x.total}</span></div><div class="pbar" data-m="${m}"><i style="--w:${Math.round((x.mastered / x.total) * 100)}%"></i></div></div>` : ''; }).join('') || '<p class="muted">Rien à afficher.</p>'}
      </section>
      <section class="card c12" style="grid-column:span 12">
        <div class="card-head"><h3>${ic('inbox', 18)} Dernières notions</h3><a href="#/library">Tout voir ${ic('chevron', 14)}</a></div>
        <div class="list">${recent.map(d => `<button class="li" data-m="${esc(d.matiere)}" data-act="open-def" data-id="${d.id}"><span class="dotc"></span><div><b>${esc(d.term)}</b><small>${esc(trunc(d.def, 90))}</small></div><span class="r">${esc(d.matiere)}</span></button>`).join('') || '<p class="muted">Aucune notion.</p>'}</div>
      </section>
    </div>`;
  };

  /* ============================ BIBLIOTHÈQUE ============================ */
  const lib = { q: '', m: 'all', st: 'all', sort: 'az', shown: 24, rendered: 0 };
  let libList = [];

  function defCard(d, q, i, still) {
    const st = LP.status(d.id), fav = LP.favs.has(d.id), due = LP.srs.isDue(d.id);
    const isNew = d.createdAt && Date.now() - Date.parse(d.createdAt) < 14 * LP.DAY;
    return `<article class="def-card" role="button" tabindex="0" data-act="open-def" data-id="${d.id}" data-m="${esc(d.matiere)}" style="--i:${Math.min(i, 12)}${still ? ';animation:none' : ''}">
      <div class="def-top">${subj(d.matiere)}<span style="display:flex;gap:6px">${isNew ? '<span class="tag new">Nouveau</span>' : ''}${st !== 'new' ? `<span class="tag s-${st}">${LP.STATUS_LABEL[st]}</span>` : ''}</span></div>
      <h3 class="def-term">${LP.hl(d.term, q)}</h3>
      <p class="def-text">${LP.hl(d.def, q)}</p>
      <div class="def-foot">${fav ? ic('star', 14) + ' Favori' : ''}${due ? '<span class="tag bad">À revoir</span>' : ''}</div></article>`;
  }
  function computeLib() {
    let list = LP.defs.slice();
    if (lib.m !== 'all') list = list.filter(d => d.matiere === lib.m);
    if (lib.st === 'fav') list = list.filter(d => LP.favs.has(d.id));
    else if (lib.st === 'due') list = list.filter(d => LP.srs.isDue(d.id));
    else if (lib.st === 'mastered') list = list.filter(d => LP.status(d.id) === 'mastered');
    else if (lib.st === 'new') list = list.filter(d => LP.status(d.id) === 'new');
    if (lib.q.trim()) return LP.search(lib.q, list);
    if (lib.sort === 'recent') list.sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0) || b.id - a.id);
    else if (lib.sort === 'subject') list.sort((a, b) => a.matiere.localeCompare(b.matiere, 'fr') || a.term.localeCompare(b.term, 'fr'));
    else list.sort((a, b) => a.term.localeCompare(b.term, 'fr'));
    return list;
  }
  function libRender() {
    const box = $('#lib-results'); if (!box) return;
    libList = computeLib();
    lib.shown = 24;
    const n = libList.length, filtered = lib.q || lib.m !== 'all' || lib.st !== 'all';
    $('#lib-count').textContent = filtered ? `${n} ${plural(n, 'résultat', 'résultats')} sur ${LP.defs.length}` : `${LP.defs.length} ${plural(LP.defs.length, 'notion', 'notions')} à explorer`;
    $('#lib-clear').hidden = !lib.q;
    const hist = LP.history.list();
    $('#lib-hist').innerHTML = !lib.q && hist.length ? `<span class="muted" style="font-size:12.5px;align-self:center">Récent :</span>` + hist.map(h => `<button class="chip" data-act="lib-hist" data-v="${esc(h)}">${esc(h)}</button>`).join('') : '';
    if (!n) {
      if (lib.q.trim().length >= 2) LP.recordMiss(lib.q);
      box.innerHTML = `<div class="empty"><div class="bub">${ic('search', 28)}</div><h3>Aucun résultat</h3>
        <p>${lib.q ? `Rien ne correspond à « ${esc(lib.q)} ».` : 'Aucune notion ne correspond à ces filtres.'} Essaie un autre mot ou retire un filtre.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px"><button class="btn soft" data-act="lib-reset">Réinitialiser</button>${lib.q ? `<a class="btn primary" href="#/propose?term=${encodeURIComponent(lib.q)}">Proposer « ${esc(trunc(lib.q, 24))} »</a>` : ''}</div></div>`;
      lib.rendered = 0; return;
    }
    const slice = libList.slice(0, lib.shown);
    box.innerHTML = `<div class="defs" id="lib-grid">${slice.map((d, i) => defCard(d, lib.q, i)).join('')}</div><div id="lib-sentinel" style="height:1px"></div>`;
    lib.rendered = slice.length;
    observeMore();
  }
  let io = null;
  function observeMore() {
    if (io) io.disconnect();
    const s = $('#lib-sentinel'); if (!s || lib.rendered >= libList.length || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      const next = Math.min(libList.length, lib.rendered + 24);
      $('#lib-grid').insertAdjacentHTML('beforeend', libList.slice(lib.rendered, next).map((d, i) => defCard(d, lib.q, i % 12)).join(''));
      lib.rendered = next;
      if (next >= libList.length) io.disconnect();
    }, { rootMargin: '400px' });
    io.observe(s);
  }
  function libPatch(id) {
    const el = $(`#lib-results .def-card[data-id="${id}"]`), d = LP.byId.get(Number(id));
    if (!el || !d) return;
    if (lib.st !== 'all') { libRender(); return; }
    el.outerHTML = defCard(d, lib.q, 0, true);
  }
  V.library = (root, params) => {
    if (params && params.m && LP.SUBJECTS.includes(params.m)) lib.m = params.m;
    if (params && params.st) lib.st = params.st;
    root.innerHTML = `
    <div class="page-head"><div><h1>Bibliothèque</h1><p id="lib-count"></p></div><a class="btn soft" href="#/propose">${ic('plus', 16)} Proposer une notion</a></div>
    <div class="lib-tools">
      <div class="searchbox">${ic('search', 20)}<input id="lib-q" class="input" type="search" placeholder="Rechercher un terme, une définition…" value="${esc(lib.q)}" autocomplete="off" data-input="lib-q" aria-label="Rechercher"><button class="icon-btn clear" id="lib-clear" data-act="lib-clear" aria-label="Effacer" hidden>${ic('x', 16)}</button></div>
      <div class="tools-row">
        <div class="chips">
          <button class="chip ${lib.m === 'all' ? 'on' : ''}" data-act="lib-m" data-v="all">Toutes</button>
          ${LP.SUBJECTS.map(m => `<button class="chip ${lib.m === m ? 'on' : ''}" data-act="lib-m" data-v="${m}" data-m="${m}"><i></i>${m}</button>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <select class="select" data-change="lib-st" aria-label="Statut">
            ${[['all', 'Tous les statuts'], ['fav', 'Favoris'], ['due', 'À revoir'], ['new', 'Nouvelles'], ['mastered', 'Maîtrisées']].map(([v, t]) => `<option value="${v}" ${lib.st === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select class="select" data-change="lib-sort" aria-label="Tri">
            ${[['az', 'A → Z'], ['recent', 'Récentes'], ['subject', 'Par matière']].map(([v, t]) => `<option value="${v}" ${lib.sort === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="chips" id="lib-hist"></div>
    </div>
    <div id="lib-results"></div>`;
    libRender();
    LP.cleanup = () => { if (io) io.disconnect(); };
    if (params && params.focus) setTimeout(() => $('#lib-q') && $('#lib-q').focus(), 50);
  };
  const libSearch = LP.debounce(() => { libRender(); }, 120);
  A['lib-q'] = el => { lib.q = el.value; libSearch(); };
  A['lib-clear'] = () => { lib.q = ''; const i = $('#lib-q'); if (i) { i.value = ''; i.focus(); } libRender(); };
  A['lib-m'] = el => { lib.m = el.dataset.v; $$('[data-act=lib-m]').forEach(b => b.classList.toggle('on', b.dataset.v === lib.m)); libRender(); };
  A['lib-st'] = el => { lib.st = el.value; libRender(); };
  A['lib-sort'] = el => { lib.sort = el.value; libRender(); };
  A['lib-hist'] = el => { lib.q = el.dataset.v; const i = $('#lib-q'); if (i) i.value = lib.q; libRender(); };
  A['lib-reset'] = () => { lib.q = ''; lib.m = 'all'; lib.st = 'all'; V.library(view(), {}); };
  LP.libFocusSearch = () => { const i = $('#lib-q'); if (i) { i.focus(); i.select(); return true; } return false; };

  /* ============================ FICHE (tiroir) ============================ */
  const dstack = [];
  LP.on('drawer-closed', () => { dstack.length = 0; if (/^#\/def\//.test(location.hash)) history.replaceState(null, '', '#/library'); });
  LP.openDef = (id, push) => {
    const d = LP.byId.get(Number(id));
    if (!d) { LP.toast('Notion introuvable', 'err'); return; }
    if (push !== false && dstack[dstack.length - 1] !== d.id) dstack.push(d.id);
    if (lib.q.trim().length >= 2 && $('#lib-q')) LP.history.add(lib.q);
    LP.drawer.open(defDetail(d));
    LP.track && LP.track('view');
  };
  function defDetail(d) {
    const st = LP.status(d.id), s = LP.srs.state(d.id), fav = LP.favs.has(d.id), rel = LP.related(d), src = LP.safeUrl(d.source);
    const manual = LP.manual.has(d.id);
    return `
    <div class="dr-head" data-m="${esc(d.matiere)}">
      ${dstack.length > 1 ? `<button class="icon-btn" data-act="drawer-back" aria-label="Retour">${ic('back')}</button>` : ''}
      ${subj(d.matiere)}<span class="grow"></span>
      <button class="icon-btn ${fav ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-label="Favori" aria-pressed="${fav}">${ic('star')}</button>
      <button class="icon-btn" data-act="close-drawer" aria-label="Fermer">${ic('x')}</button>
    </div>
    <div class="dr-body">
      <div><h2 class="dr-term">${esc(d.term)}</h2></div>
      ${d.aliases.length ? `<p class="dr-alias">Aussi appelé : ${d.aliases.map(esc).join(' · ')}</p>` : ''}
      <p class="dr-def">${LP.linkify(d.def, d.id)}</p>
      ${d.example ? `<section class="dr-block"><h4>${ic('sparkles', 15)} Exemple concret</h4><p>${esc(d.example)}</p></section>` : ''}
      ${d.remember ? `<section class="dr-block remember"><h4>${ic('target', 15)} À retenir</h4><p>${esc(d.remember)}</p></section>` : ''}
      ${src ? `<a class="btn soft sm" href="${esc(src)}" target="_blank" rel="noopener noreferrer" style="align-self:flex-start">${ic('link', 15)} Source</a>` : ''}
      <section class="dr-block"><h4>${ic('chart', 15)} Ta progression</h4>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="tag ${st === 'new' ? 'new' : 's-' + st}">${LP.STATUS_LABEL[st]}</span>
          ${s ? `<span class="muted" style="font-size:13px">Prochaine révision : ${esc(LP.fmtDue(s.d))} · ${s.r} ${plural(s.r, 'réussite', 'réussites')} d'affilée${s.l ? ' · ' + s.l + ' ' + plural(s.l, 'oubli', 'oublis') : ''}</span>` : '<span class="muted" style="font-size:13px">Pas encore révisée.</span>'}
        </div>
        <div style="margin-top:12px"><button class="btn soft sm" data-act="mastered" data-id="${d.id}">${manual ? ic('refresh', 15) + ' Remettre à revoir' : ic('check', 15) + ' Je la maîtrise déjà'}</button></div>
      </section>
      ${rel.length ? `<section><h4 class="muted" style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px">Voir aussi</h4><div class="rel">${rel.map(r => `<button class="chip" data-act="open-def" data-id="${r.id}" data-m="${esc(r.matiere)}"><i></i>${esc(r.term)}</button>`).join('')}</div></section>` : ''}
    </div>
    <div class="dr-foot">
      <button class="btn soft" data-act="copy-def" data-id="${d.id}">${ic('copy', 16)} Copier</button>
      <button class="btn soft" data-act="share-def" data-id="${d.id}">${ic('share', 16)} Partager</button>
      <button class="btn ghost" data-act="report-def" data-id="${d.id}" aria-label="Signaler une erreur">${ic('flag', 16)}</button>
    </div>`;
  }
  const redrawDrawer = id => { if (LP.drawer.isOpen() && dstack[dstack.length - 1] === Number(id)) LP.drawer.open(defDetail(LP.byId.get(Number(id)))); };
  A['open-def'] = (el, e) => { if (e) e.preventDefault(); LP.openDef(el.dataset.id); };
  A['close-drawer'] = () => LP.drawer.close();
  A['drawer-back'] = () => { dstack.pop(); const id = dstack[dstack.length - 1]; if (id) LP.openDef(id, false); else LP.drawer.close(); };
  A.fav = el => {
    const on = LP.favs.toggle(el.dataset.id);
    LP.toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris', 'ok', 1800);
    redrawDrawer(el.dataset.id); libPatch(el.dataset.id);
  };
  A.mastered = el => {
    const on = LP.manual.toggle(el.dataset.id);
    LP.toast(on ? 'Marquée comme maîtrisée' : 'Remise dans ta révision', 'ok', 1800);
    redrawDrawer(el.dataset.id); libPatch(el.dataset.id);
  };
  A['copy-def'] = async el => {
    const d = LP.byId.get(Number(el.dataset.id)); if (!d) return;
    const t = `${d.term} (${d.matiere})\n${d.def}${d.example ? '\nExemple : ' + d.example : ''}${d.remember ? '\nÀ retenir : ' + d.remember : ''}`;
    try { await navigator.clipboard.writeText(t); LP.toast('Définition copiée', 'ok'); } catch (e) { LP.toast('Copie impossible', 'err'); }
  };
  A['share-def'] = async el => {
    const d = LP.byId.get(Number(el.dataset.id)); if (!d) return;
    const url = `${location.origin}${location.pathname}#/def/${d.id}`;
    if (navigator.share) { try { await navigator.share({ title: 'LexiProf — ' + d.term, text: `${d.term} — ${d.matiere}`, url }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(url); LP.toast('Lien copié', 'ok'); } catch (e) { LP.toast('Partage impossible', 'err'); } }
  };
  A['report-def'] = async el => {
    const d = LP.byId.get(Number(el.dataset.id)); if (!d) return;
    const r = await LP.dialog({
      title: 'Signaler un problème', ok: 'Envoyer',
      body: `<p class="muted-p" style="margin-bottom:14px">Notion : <b>${esc(d.term)}</b></p>
        <div class="field"><label>Motif</label><div class="chips" id="rp-reasons">${['Erreur', 'Pas clair', 'Incomplet', 'Autre'].map((t, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-r="${t}">${t}</button>`).join('')}</div></div>
        <div class="field"><label for="rp-msg">Détails <small>(facultatif)</small></label><textarea id="rp-msg" class="textarea" placeholder="Qu'est-ce qui ne va pas ?"></textarea></div>`,
      onMount: m => m.querySelector('#rp-reasons').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) { $$('#rp-reasons .chip', m).forEach(x => x.classList.toggle('on', x === b)); } }),
      collect: m => ({ reason: (m.querySelector('#rp-reasons .on') || {}).dataset.r || 'Autre', message: m.querySelector('#rp-msg').value })
    });
    if (!r) return;
    try { await LP.submitReport({ definitionId: d.id, term: d.term, reason: r.reason, message: r.message }); LP.toast('Merci, signalement envoyé', 'ok'); }
    catch (e) { LP.toast("Envoi impossible : " + e.message, 'err'); }
  };

  /* ============================ RÉVISION ============================ */
  let rvScope = 'all', rv = null;
  V.review = root => { rv = null; LP.keys = null; rvSetup(root); };
  function rvSetup(root) {
    root = root || view();
    const q = LP.srs.queue({ matiere: rvScope }), nDue = q.due.length, nNew = q.fresh.length, n = Math.min(LP.cfg.sessionMax, q.cards.length);
    const fc = LP.srs.forecast(7), mx = Math.max(1, ...fc);
    const pool = LP.defs.filter(d => rvScope === 'all' || d.matiere === rvScope).length;
    root.innerHTML = `
    <div class="page-head"><div><h1>Révision</h1><p>Répétition espacée : chaque carte revient juste avant que tu l'oublies.</p></div></div>
    <div class="setup">
      <div class="chips">
        <button class="chip ${rvScope === 'all' ? 'on' : ''}" data-act="rv-scope" data-v="all">Toutes les matières</button>
        ${LP.SUBJECTS.map(m => `<button class="chip ${rvScope === m ? 'on' : ''}" data-act="rv-scope" data-v="${m}" data-m="${m}"><i></i>${m}</button>`).join('')}
      </div>
      <div class="card">
        <div class="big-nums"><div><b>${nDue}</b><span>à réviser</span></div><div><b>${nNew}</b><span>nouvelles aujourd'hui</span></div><div><b>${pool}</b><span>dans cette sélection</span></div></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          ${n ? `<button class="btn primary lg" data-act="rv-start" style="flex:1">${ic('play', 16)} Commencer · ${n} ${plural(n, 'carte', 'cartes')}</button>` : `<div class="notice" style="flex:1">${ic('check')}<div><b>Tout est à jour.</b> ${q.cards.length === 0 && pool ? 'Reviens demain, ou entraîne-toi librement.' : 'Aucune notion dans cette sélection.'}</div></div>`}
          ${pool ? `<button class="btn soft lg" data-act="rv-free">${ic('refresh', 16)} Mode libre</button>` : ''}
        </div>
        ${nDue + nNew > LP.cfg.sessionMax ? `<p class="muted" style="font-size:13px;margin-top:12px">Les sessions sont limitées à ${LP.cfg.sessionMax} cartes pour rester efficaces.</p>` : ''}
      </div>
      <div class="card"><div class="card-head"><h3>${ic('calendar', 18)} Prochains jours</h3></div>
        <div class="forecast">${fc.map((c, k) => `<div><span style="color:var(--text2);font-weight:650">${c}</span><i style="--h:${Math.round((c / mx) * 70)}%"></i><span>${k === 0 ? 'Auj.' : k === 1 ? 'Dem.' : new Date(Date.now() + k * LP.DAY).toLocaleDateString('fr-FR', { weekday: 'short' })}</span></div>`).join('')}</div>
      </div>
      <div class="notice">${ic('sparkles')}<div><b>Comment ça marche ?</b> Révèle la réponse, puis note-toi honnêtement. <i>À revoir</i> te la remontre dans 10 minutes, <i>Facile</i> l'espace de plusieurs jours. Raccourcis : <span class="kbd">Espace</span> puis <span class="kbd">1</span>–<span class="kbd">4</span>.</div></div>
    </div>`;
  }
  A['rv-scope'] = el => { rvScope = el.dataset.v; rvSetup(); };
  function rvStart(free) {
    const q = LP.srs.queue({ matiere: rvScope });
    let defs = q.cards.slice(0, LP.cfg.sessionMax);
    if (free || !defs.length) {
      const pool = LP.defs.filter(d => rvScope === 'all' || d.matiere === rvScope);
      if (!pool.length) return;
      defs = LP.shuffle(pool).slice(0, 12); free = true;
    }
    rv = { cards: defs.map(d => ({ d, retry: false, tries: 0 })), i: 0, flipped: false, log: [], t0: Date.now(), free, xp0: LP.stats().xp, total: defs.length, done: 0 };
    LP.keys = rvKeys; rvRender();
    window.scrollTo(0, 0);
  }
  A['rv-start'] = () => rvStart(false);
  A['rv-free'] = () => rvStart(true);
  A['rv-flip'] = () => { if (rv && !rv.flipped) { rv.flipped = true; rvRender(); } };
  A['rv-grade'] = el => rvGrade(Number(el.dataset.g));
  A['rv-quit'] = async () => {
    if (rv && rv.done > 0 && rv.done < rv.total) { const ok = await LP.confirm('Quitter la session ?', 'Tes réponses sont déjà enregistrées. Tu pourras reprendre plus tard.', { ok: 'Quitter' }); if (!ok) return; }
    rv = null; LP.keys = null; rvSetup();
  };
  function rvKeys(e) {
    if (!rv) return false;
    if (e.key === 'Escape') { A['rv-quit'](); return true; }
    if (!rv.cards[rv.i]) return false;
    if (!rv.flipped && (e.key === ' ' || e.key === 'Enter')) { A['rv-flip'](); return true; }
    if (rv.flipped) {
      if (['1', '2', '3', '4'].includes(e.key)) { rvGrade(Number(e.key) - 1); return true; }
      if (e.key === 'Enter' || e.key === ' ') { rvGrade(2); return true; }
    }
    return false;
  }
  function rvGrade(g) {
    const c = rv && rv.cards[rv.i]; if (!c || !rv.flipped) return;
    if (!c.retry && !rv.free) LP.srs.grade(c.d.id, g);
    if (!c.retry) { rv.log.push({ id: c.d.id, g }); rv.done++; }
    if (g === 0 && c.tries < 2) rv.cards.push({ d: c.d, retry: true, tries: c.tries + 1 });
    rv.i++; rv.flipped = false; rvRender();
  }
  function rvRender() {
    const root = view(), c = rv && rv.cards[rv.i];
    if (!c) return rvDone();
    const d = c.d, isNew = !LP.srs.state(d.id) && !c.retry && !rv.free;
    const pv = c.retry || rv.free ? ['', '', '', ''] : LP.srs.preview(d.id);
    const labels = ['À revoir', 'Difficile', 'Bien', 'Facile'];
    root.innerHTML = `<div class="study">
      <div class="study-top"><button class="icon-btn" data-act="rv-quit" aria-label="Quitter">${ic('x')}</button><div class="pbar"><i style="--w:${Math.round((rv.done / rv.total) * 100)}%"></i></div><small>${rv.done} / ${rv.total}</small></div>
      <div class="card s-card" data-m="${esc(d.matiere)}">
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${subj(d.matiere)}${isNew ? '<span class="tag new">Nouvelle</span>' : ''}${c.retry ? '<span class="tag bad">À retenter</span>' : ''}${rv.free ? '<span class="tag">Mode libre</span>' : ''}</div>
        <h2 class="s-term">${esc(d.term)}</h2>
        ${rv.flipped ? `<div class="s-ans">
          <p class="dr-def">${esc(d.def)}</p>
          ${d.example ? `<section class="dr-block"><h4>${ic('sparkles', 15)} Exemple</h4><p>${esc(d.example)}</p></section>` : ''}
          ${d.remember ? `<section class="dr-block remember"><h4>${ic('target', 15)} À retenir</h4><p>${esc(d.remember)}</p></section>` : ''}</div>`
          : `<p class="s-hint">Essaie de te rappeler la définition, puis révèle la réponse.</p>`}
      </div>
      ${rv.flipped ? `<div class="grades">${labels.map((l, g) => `<button class="grade g${g}" data-act="rv-grade" data-g="${g}">${l}<small>${pv[g] || '&nbsp;'}</small><kbd>${g + 1}</kbd></button>`).join('')}</div>`
        : `<button class="btn primary lg reveal-btn" data-act="rv-flip">Afficher la réponse <span class="kbd" style="background:rgba(255,255,255,.2);color:inherit;border-color:transparent">Espace</span></button>`}
    </div>`;
  }
  function rvDone() {
    const root = view(), n = rv.log.length, good = rv.log.filter(l => l.g >= 2).length;
    const xp = LP.stats().xp - rv.xp0, mins = Math.max(1, Math.round((Date.now() - rv.t0) / 60000)), tomorrow = LP.srs.forecast(2)[1];
    if (!rv.free && n) LP.confetti();
    LP.keys = e => { if (e.key === 'Enter') { rv = null; LP.keys = null; rvSetup(); return true; } return false; };
    root.innerHTML = `<div class="study"><div class="card result">
      <span class="tag new">${rv.free ? 'Mode libre terminé' : 'Session terminée'}</span>
      <div class="score">${n ? Math.round((good / n) * 100) : 0}%</div>
      <p class="muted-p">${n} ${plural(n, 'carte révisée', 'cartes révisées')} · ${good} ${plural(good, 'maîtrisée', 'maîtrisées')} du premier coup</p>
      <div class="stats"><div><b>+${xp}</b>XP</div><div><b>${mins} min</b>durée</div>${!rv.free ? `<div><b>${tomorrow}</b>demain</div>` : ''}</div>
      ${LP.fun && LP.fun.resultExtras ? LP.fun.resultExtras({ pct: n ? Math.round((good / n) * 100) : 0, n }) : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        <button class="btn primary" data-act="rv-again">${ic('refresh', 16)} Continuer</button>
        <a class="btn soft" href="#/quiz">${ic('zap', 16)} Faire un quiz</a>
        <a class="btn ghost" href="#/">Accueil</a>
      </div></div></div>`;
  }
  A['rv-again'] = () => { rv = null; LP.keys = null; rvSetup(); };

  /* ============================ QUIZ ============================ */
  const CFG_K = 'lexiprof_qzcfg', RUN_K = 'lexiprof_qz_run';
  const lsGet = (s, k) => { try { return JSON.parse(s.getItem(k)); } catch (e) { return null; } };
  const lsSet = (s, k, v) => { try { v == null ? s.removeItem(k) : s.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const MODES = [['classic', 'Classique', 'Un nombre de questions fixé'], ['express', 'Express · 3 min', 'Un maximum de bonnes réponses en 3 minutes'], ['survival', 'Survie · 3 vies', 'Trois erreurs et c\'est fini']];
  const TYPES = [['mix', 'Mixte', 'Alterne les deux formats'], ['d2t', 'Définition → terme', 'Retrouve le mot'], ['t2d', 'Terme → définition', 'Retrouve le sens'], ['cloze', 'Cartes à trous', 'Retrouve le mot manquant']];
  const EXPRESS_MS = 180000, LIVES = 3;
  const qzCfg = { m: 'all', n: 10, type: 'mix', mode: 'classic' };
  (() => { const s = lsGet(localStorage, CFG_K) || {}; if (s.m === 'all' || (LP.SUBJECTS || []).includes(s.m)) qzCfg.m = s.m; if ([5, 10, 20].includes(s.n)) qzCfg.n = s.n; if (TYPES.some(t => t[0] === s.type)) qzCfg.type = s.type; if (MODES.some(t => t[0] === s.mode)) qzCfg.mode = s.mode; })();
  const say = t => { let r = document.getElementById('lp-live'); if (!r) { r = document.createElement('div'); r.id = 'lp-live'; r.className = 'sr-only'; r.setAttribute('aria-live', 'polite'); document.body.appendChild(r); } r.textContent = ''; setTimeout(() => { r.textContent = t; }, 60); };
  LP.say = say;
  let qz = null, qzInt = null;
  const fmtT = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const qzStop = () => { if (qzInt) { clearInterval(qzInt); qzInt = null; } };
  const qzSave = () => lsSet(sessionStorage, RUN_K, qz && !qz.finished ? { qs: qz.qs, i: qz.i, sel: qz.sel, correct: qz.correct, log: qz.log, noXp: !!qz.noXp, redo: !!qz.redo, mode: qz.mode, lives: qz.lives, left: qz.mode === 'express' ? Math.max(0, qz.deadline - Date.now()) : 0 } : null);
  const qOk = q => q && LP.byId.get(q.id) && Array.isArray(q.opts) && (q.type === 'cloze' ? q.opts.every(o => typeof o === 'string') && typeof q.masked === 'string' && Number.isInteger(q.a) && q.a >= 0 && q.a < q.opts.length : q.opts.every(o => LP.byId.get(o)));
  const qzSaved = () => { const r = lsGet(sessionStorage, RUN_K); return r && Array.isArray(r.qs) && r.qs.length && r.i < r.qs.length && r.qs.every(qOk) ? r : null; };
  V.quiz = root => { qzStop(); qz = null; LP.keys = null; qzSetup(root); };
  function qzSetup(root) {
    root = root || view(); qzStop();
    const pool = LP.defs.filter(d => (qzCfg.m === 'all' || d.matiere === qzCfg.m) && LP.quizable(d));
    const ok = LP.defs.filter(LP.quizable).length >= 4 && pool.length >= 1;
    const n = Math.min(qzCfg.n, pool.length);
    const st = LP.stats(), run = qzSaved();
    const few = qzCfg.m !== 'all' && pool.length > 0 && pool.length < 6;
    const startLbl = qzCfg.mode === 'express' ? 'Lancer · 3 minutes' : qzCfg.mode === 'survival' ? 'Lancer · 3 vies' : `Lancer · ${n} ${plural(n, 'question', 'questions')}`;
    const runMode = run ? (run.mode || 'classic') : '';
    root.innerHTML = `
    <div class="page-head"><div><h1>Quiz</h1><p>Teste-toi en situation. Les erreurs reviennent automatiquement en révision.</p></div></div>
    <div class="setup">
      ${run ? `<div class="card qz-resume"><div><b>Un quiz est en cours</b><small>${runMode === 'express' ? 'Express · ' + fmtT(run.left) + ' restantes · ' : runMode === 'survival' ? 'Survie · ' + run.lives + ' ' + plural(run.lives, 'vie', 'vies') + ' · ' : 'Question ' + (run.i + 1) + ' sur ' + run.qs.length + ' · '}${run.correct} bonne${run.correct > 1 ? 's' : ''} réponse${run.correct > 1 ? 's' : ''}</small></div><div class="qz-resume-btns"><button class="btn primary" data-act="qz-resume">Reprendre</button><button class="btn ghost" data-act="qz-discard">Abandonner</button></div></div>` : ''}
      <div class="card qz-card">
        <div class="field"><label>Mode</label><div class="qt-grid">${MODES.map(([v, t, s]) => `<button class="qt ${qzCfg.mode === v ? 'on' : ''}" data-act="qz-cfg" data-k="mode" data-v="${v}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></div>
        <div class="field"><label>Matière</label><div class="qm-grid">
          ${[['all', 'Toutes', LP.defs.filter(LP.quizable).length]].concat(LP.SUBJECTS.map(m => [m, m, LP.defs.filter(d => d.matiere === m && LP.quizable(d)).length])).map(([k, t, c]) => `<button class="qm ${qzCfg.m === k ? 'on' : ''}" data-act="qz-cfg" data-k="m" data-v="${k}" ${k === 'all' ? '' : 'data-m="' + k + '"'}><i></i><b>${t}</b><small>${c} ${plural(c, 'notion', 'notions')}</small></button>`).join('')}</div></div>
        ${qzCfg.mode === 'classic' ? `<div class="field"><label>Nombre de questions</label><div class="seg full">${[5, 10, 20].map(v => `<button class="${qzCfg.n === v ? 'on' : ''}" data-act="qz-cfg" data-k="n" data-v="${v}">${v}</button>`).join('')}</div></div>` : ''}
        <div class="field"><label>Type de question</label><div class="qt-grid qt4">${TYPES.map(([v, t, s]) => `<button class="qt ${qzCfg.type === v ? 'on' : ''}" data-act="qz-cfg" data-k="type" data-v="${v}"><b>${t}</b><small>${s}</small></button>`).join('')}</div></div>
        ${few ? `<div class="notice">${ic('alert')}<div>Peu de notions dans cette matière : les mauvaises réponses viendront aussi des autres matières.</div></div>` : ''}
        ${qzCfg.mode !== 'classic' && pool.length < 12 ? `<div class="notice">${ic('alert')}<div>Avec ${pool.length} ${plural(pool.length, 'notion', 'notions')}, les questions reviendront plusieurs fois. Choisis « Toutes » pour plus de variété.</div></div>` : ''}
        ${ok ? `<button class="btn primary lg block" data-act="qz-start">${ic('zap', 16)} ${startLbl}</button>` : `<div class="notice warn">${ic('alert')}<div>${LP.defs.filter(LP.quizable).length < 4 ? 'Il faut au moins 4 notions dans la bibliothèque pour générer un quiz.' : 'Aucune notion exploitable dans cette matière : choisis-en une autre.'}</div></div>`}
      </div>
      ${st.quiz ? `<div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><b>${st.quizRuns}</b><span>quiz terminés</span></div><div class="tile"><b>${st.quiz}</b><span>réponses</span></div><div class="tile"><b>${Math.round((st.correct / st.quiz) * 100)}%</b><span>de réussite</span></div></div>` : ''}
      ${st.bestExp || st.bestSurv ? `<div class="tiles" style="grid-template-columns:repeat(2,1fr)"><div class="tile"><b>${st.bestExp || 0}</b><span>record Express</span></div><div class="tile"><b>${st.bestSurv || 0}</b><span>record Survie</span></div></div>` : ''}
    </div>`;
  }
  A['qz-cfg'] = el => { const k = el.dataset.k; qzCfg[k] = k === 'n' ? Number(el.dataset.v) : el.dataset.v; lsSet(localStorage, CFG_K, qzCfg); qzSetup(); };
  const qzMake = (d, type) => {
    if (type === 'cloze') return LP.buildCloze(d) || LP.buildQuestion(d, 'd2t');
    return LP.buildQuestion(d, type);
  };
  const qzPickType = () => qzCfg.type === 'mix' ? (Math.random() < 0.6 ? 'd2t' : 't2d') : qzCfg.type;
  function qzBuild(count) {
    const pool = LP.defs.filter(d => (qzCfg.m === 'all' || d.matiere === qzCfg.m) && LP.quizable(d));
    const out = [], want = count || (qzCfg.mode === 'classic' ? qzCfg.n : Math.min(pool.length, 30));
    for (const d of LP.shuffle(pool)) {
      if (out.length >= want) break;
      const q = qzMake(d, qzPickType()); if (q) out.push(q);
    }
    return out;
  }
  function qzLaunch() {
    LP.keys = qzKeys; LP.cleanup = qzStop; qzRender(); window.scrollTo(0, 0);
    if (qz.mode === 'express') { qzStop(); qzInt = setInterval(qzTick, 250); }
  }
  function qzTick() {
    if (!qz || qz.mode !== 'express' || qz.finished) return qzStop();
    const left = Math.max(0, qz.deadline - Date.now()), el = document.getElementById('qz-time');
    if (el) { el.textContent = fmtT(left); el.classList.toggle('low', left <= 30000); }
    if (left <= 30000 && !qz.w30) { qz.w30 = 1; say('Il reste 30 secondes'); }
    if (left <= 10000 && !qz.w10) { qz.w10 = 1; say('Il reste 10 secondes'); }
    if (left <= 0) { qzStop(); qz.timeUp = true; qzDone(); }
  }
  A['qz-start'] = () => {
    const qs = qzBuild(); if (!qs.length) return;
    qz = { qs, i: 0, sel: null, correct: 0, log: [], mode: qzCfg.mode, lives: LIVES, deadline: Date.now() + EXPRESS_MS };
    qzSave(); qzLaunch();
  };
  A['qz-resume'] = () => {
    const r = qzSaved(); if (!r) return qzSetup();
    qz = { qs: r.qs, i: r.i, sel: r.sel, correct: r.correct, log: r.log || [], noXp: r.noXp, redo: r.redo, mode: r.mode || 'classic', lives: r.lives == null ? LIVES : r.lives, deadline: Date.now() + (r.left || EXPRESS_MS) };
    qzLaunch();
  };
  A['qz-discard'] = async () => { const ok = await LP.confirm('Abandonner ce quiz ?', 'Ta progression dans ce quiz sera perdue.', { ok: 'Abandonner', danger: true }); if (!ok) return; lsSet(sessionStorage, RUN_K, null); qzSetup(); };
  // « Refaire mes erreurs » : mini-série sur les notions ratées, quel que soit le mode (entraînement, sans XP)
  A['qz-redo'] = () => {
    qzStop();
    const seen = new Set(), qs = [];
    qz.log.filter(l => !l.ok).forEach((l, k) => {
      if (seen.has(l.id)) return; seen.add(l.id);
      const d = LP.byId.get(l.id); if (!d) return;
      const t = l.type === 'cloze' ? 'cloze' : (k % 2 ? 't2d' : 'd2t');
      const q = qzMake(d, t) || qzMake(d, t === 't2d' ? 'd2t' : 't2d'); if (q) qs.push(q);
    });
    if (!qs.length) return;
    qz = { qs, i: 0, sel: null, correct: 0, log: [], noXp: true, redo: true, mode: 'classic', lives: LIVES, deadline: 0 };
    qzSave(); qzLaunch();
  };
  function qzKeys(e) {
    if (!qz) return false;
    if (e.key === 'Escape') { A['qz-quit'](); return true; }
    const q = qz.qs[qz.i]; if (!q) return false;
    if (qz.sel == null && ['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
      const ix = /\d/.test(e.key) ? Number(e.key) - 1 : 'abcd'.indexOf(e.key.toLowerCase());
      if (q.opts[ix] != null) A['qz-pick']({ dataset: q.type === 'cloze' ? { i: String(ix) } : { id: String(q.opts[ix]) } });
      return true;
    }
    if (qz.sel == null && e.key === '0') { A['qz-skip'](); return true; }
    if (qz.sel == null && /^Arrow(Down|Up|Left|Right)$/.test(e.key)) {
      const os = [...document.querySelectorAll('.opts .opt')], cur = os.indexOf(document.activeElement), dir = /Down|Right/.test(e.key) ? 1 : -1;
      if (os.length) os[(cur < 0 ? (dir > 0 ? 0 : os.length - 1) : (cur + dir + os.length) % os.length)].focus();
      return true;
    }
    if (qz.sel != null && (e.key === 'Enter' || e.key === ' ')) { A['qz-next'](); return true; }
    return false;
  }
  A['qz-quit'] = async () => {
    if (qz && (qz.i > 0 || qz.log.length)) { const ok = await LP.confirm('Abandonner le quiz ?', 'Ta progression dans ce quiz sera perdue.', { ok: 'Abandonner', danger: true }); if (!ok) return; }
    qzStop(); qz = null; LP.keys = null; lsSet(sessionStorage, RUN_K, null); qzSetup();
  };
  // Enregistre une réponse. ok = bonne réponse ; en survie une mauvaise réponse coûte une vie.
  function qzAnswer(q, sel, ok, extra) {
    qz.sel = sel;
    if (ok) qz.correct++; else { LP.srs.flag(q.id); if (qz.mode === 'survival') qz.lives = Math.max(0, qz.lives - 1); }
    qz.log.push(Object.assign({ id: q.id, ok, type: q.type }, extra));
    qzSave(); qzRender();
  }
  A['qz-pick'] = el => {
    if (!qz || qz.sel != null) return;
    const q = qz.qs[qz.i]; if (!q) return;
    if (q.type === 'cloze') { const i = Number(el.dataset.i); if (!(i >= 0 && i < q.opts.length)) return; return qzAnswer(q, i, i === q.a, { picked: q.opts[i] }); }
    const id = Number(el.dataset.id); qzAnswer(q, id, id === q.id, { picked: id });
  };
  // « Je ne sais pas » : compte comme une erreur (la notion reviendra en révision), sans deviner au hasard
  A['qz-skip'] = () => {
    if (!qz || qz.sel != null) return;
    const q = qz.qs[qz.i]; if (!q) return;
    qzAnswer(q, -1, false, { picked: null, skipped: true });
  };
  const qzDead = () => qz.mode === 'survival' && qz.lives <= 0;
  A['qz-next'] = () => {
    if (!qz || qz.sel == null) return;
    if (qzDead()) return qzDone();
    qz.i++; qz.sel = null;
    if (qz.mode !== 'classic' && qz.i >= qz.qs.length) { const more = qzBuild(); if (more.length) qz.qs = qz.qs.concat(more); }
    qzSave(); qzRender();
  };
  const blankHtml = masked => esc(masked).replace(/\[\[BLANK\]\]/g, '<span class="blank" role="img" aria-label="mot manquant">&nbsp;</span>');
  const markWord = (def, word) => { const k = LP.norm(word).replace(/[^a-z]/g, ''); return esc(def).replace(/[\p{L}][\p{L}'’-]*/gu, w => LP.norm(w).replace(/[^a-z]/g, '') === k ? '<mark>' + w + '</mark>' : w); };
  function qzRender() {
    const root = view(), q = qz && qz.qs[qz.i];
    if (!q) return qzDone();
    const d = LP.byId.get(q.id), answered = qz.sel != null, cloze = q.type === 'cloze', skipped = qz.sel === -1;
    const last = qz.mode === 'classic' ? qz.i === qz.qs.length - 1 : qzDead();
    const hadFocus = !!document.querySelector('.study :focus');
    const wrongN = qz.log.length - qz.correct;
    const okSel = cloze ? qz.sel === q.a : qz.sel === q.id;
    const dots = qz.mode === 'classic' ? qz.qs.map((_, k) => { const l = qz.log[k]; return `<i class="${l ? (l.ok ? 'ok' : 'bad') : k === qz.i ? 'cur' : ''}"></i>`; }).join('') : '';
    const pk = !cloze && answered && qz.sel > 0 && qz.sel !== q.id ? LP.byId.get(qz.sel) : null;
    const pickNote = pk ? (q.type === 'd2t' ? `Ton choix « ${esc(pk.term)} » correspond à : ${esc(trunc(pk.def, 150))}` : `Ta réponse était la définition de « ${esc(pk.term)} ».`) : '';
    const goodTxt = cloze ? q.opts[q.a] : d.term;
    const verdict = okSel ? 'Bien joué !' : skipped ? 'Pas de souci, voici la réponse' + (q.type === 't2d' ? '.' : ' : « ' + goodTxt + ' ».') : 'Pas tout à fait — ' + (q.type === 't2d' ? 'voici la bonne définition.' : 'la réponse était « ' + goodTxt + ' ».');
    const hearts = `<span class="qlives" role="img" aria-label="${qz.lives} ${plural(qz.lives, 'vie restante', 'vies restantes')}">${'♥'.repeat(qz.lives)}<i>${'♥'.repeat(LIVES - qz.lives)}</i></span>`;
    const left = qz.mode === 'express' ? Math.max(0, qz.deadline - Date.now()) : 0;
    const head = qz.mode === 'express' ? `<span class="qtimer ${left <= 30000 ? 'low' : ''}" id="qz-time" role="timer" aria-live="off">${fmtT(left)}</span>` : qz.mode === 'survival' ? hearts : '';
    const prompt = cloze ? 'Quel mot manque dans cette définition ?' : q.type === 'd2t' ? 'Quelle notion correspond à cette définition ?' : 'Quelle est la bonne définition ?';
    const qtext = cloze ? blankHtml(q.masked) : q.type === 'd2t' ? esc(d.def) : esc(d.term);
    const longCls = (cloze ? q.masked.length > 70 : q.type === 'd2t' && d.def.length > 120) ? 'long' : '';
    root.innerHTML = `<div class="study">
      <div class="study-top"><button class="icon-btn" data-act="qz-quit" aria-label="Quitter">${ic('x')}</button>${qz.mode === 'classic' ? `<div class="qdots" role="progressbar" aria-valuemin="1" aria-valuemax="${qz.qs.length}" aria-valuenow="${qz.i + 1}">${dots}</div><small>${qz.i + 1} / ${qz.qs.length}</small>` : `<div class="qmode"><b>${qz.mode === 'express' ? 'Express' : 'Survie'}</b><small>Question ${qz.log.length + (answered ? 0 : 1)}</small></div>${head}`}<span class="qscore" title="Bonnes réponses">${ic('check', 14)} ${qz.correct}</span><span class="qscore bad" title="Erreurs et « je ne sais pas »">✕ ${wrongN}</span></div>
      ${qz.redo ? `<p class="muted" style="font-size:.8125rem;margin:0 0 10px;text-align:center">Entraînement sur tes erreurs · pas de XP</p>` : ''}
      <div class="card qz-q" data-m="${esc(d.matiere)}" style="padding:clamp(20px,4vw,32px)">
        <div class="qhead"><span class="qtag"><i></i>${esc(d.matiere)}</span><div class="q-prompt" id="qz-prompt">${prompt}</div></div>
        <div class="q-text ${longCls}" style="margin-top:10px">${qtext}</div>
        <div class="opts" role="radiogroup" aria-labelledby="qz-prompt">${q.opts.map((o, i) => {
          const isOk = cloze ? i === q.a : o === q.id, isSel = cloze ? i === qz.sel : o === qz.sel;
          const cls = !answered ? '' : isOk ? ' ok' : isSel ? ' bad' : ' dim';
          const o2 = cloze ? null : LP.byId.get(o);
          return `<button class="opt${cls}" role="radio" aria-checked="${isSel}" data-act="qz-pick" ${cloze ? 'data-i="' + i + '"' : 'data-id="' + o + '"'} ${answered ? 'aria-disabled="true" tabindex="-1"' : ''}><span class="k">${answered && isOk ? '✓' : answered && isSel ? '✕' : 'ABCD'[i]}</span><span>${esc(cloze ? o : q.type === 'd2t' ? o2.term : trunc(o2.def, 190))}</span></button>`;
        }).join('')}</div>
        ${!answered ? `<button class="btn ghost block qz-idk" data-act="qz-skip">Je ne sais pas <span class="kbd">0</span></button>` : ''}
        ${answered ? `<div class="explain">
          <p style="font-weight:650;color:${okSel ? 'var(--ok)' : 'var(--bad)'}">${esc(verdict)}</p>
          ${qz.mode === 'survival' && !okSel ? `<p class="muted-p">${qz.lives > 0 ? 'Il te reste ' + qz.lives + ' ' + plural(qz.lives, 'vie', 'vies') + '.' : 'Plus de vie : fin de la partie.'}</p>` : ''}
          ${pickNote ? `<p class="muted-p">${pickNote}</p>` : ''}
          ${q.type === 't2d' ? `<p class="muted-p">${esc(d.def)}</p>` : ''}
          ${cloze ? `<p class="muted-p"><b>${esc(d.term)}</b> : ${markWord(d.def, q.opts[q.a])}</p>` : ''}
          ${d.remember ? `<section class="dr-block remember"><h4>${ic('target', 15)} À retenir</h4><p>${esc(d.remember)}</p></section>` : d.example ? `<section class="dr-block"><h4>${ic('sparkles', 15)} Exemple</h4><p>${esc(d.example)}</p></section>` : ''}
          <button class="btn soft block" data-act="open-def" data-id="${d.id}" style="margin-bottom:10px">${ic('book', 16)} Voir la fiche complète</button>
          <button class="btn primary lg block" data-act="qz-next">${last ? 'Voir le résultat' : 'Question suivante'} ${ic('arrow', 16)} <span class="kbd" style="background:rgba(255,255,255,.2);color:inherit;border-color:transparent">Entrée</span></button></div>` : ''}
      </div></div>`;
    if (answered) { say(verdict.replace(/« |»/g, '')); const nb = root.querySelector('[data-act=qz-next]'); if (nb) nb.focus({ preventScroll: true }); }
    else if (hadFocus) { const f = root.querySelector('.opt'); if (f) f.focus({ preventScroll: true }); }
  }
  function qzDone() {
    qzStop();
    const root = view(), n = qz.mode === 'classic' ? qz.qs.length : qz.log.length, c = qz.correct, pct = n ? Math.round((c / n) * 100) : 0;
    if (qz.xp == null) {
      const st0 = LP.stats(), prev = qz.mode === 'survival' ? st0.bestSurv || 0 : qz.mode === 'express' ? st0.bestExp || 0 : 0;
      qz.xp = qz.noXp || !n ? 0 : LP.recordQuiz(n, c);
      qz.record = !qz.noXp && qz.mode !== 'classic' && c > prev;
      if (!qz.noXp && n) LP.recordMode(qz.mode, c, qz.log.filter(l => l.type === 'cloze').length);
      if (qz.redo && n >= 3 && c === n) LP.bump('redo');
    }
    qz.finished = true; lsSet(sessionStorage, RUN_K, null);
    const xp = qz.xp;
    if (((pct >= 70 && qz.mode === 'classic') || qz.record) && !qz.fx && !qz.noXp) { qz.fx = 1; LP.confetti(); }
    const wrong = qz.log.filter(l => !l.ok), skippedN = qz.log.filter(l => l.skipped).length;
    LP.keys = null;
    const title = qz.redo ? 'Entraînement terminé' : qz.mode === 'express' ? (qz.timeUp ? 'Temps écoulé' : 'Express terminé') : qz.mode === 'survival' ? 'Partie terminée' : 'Quiz terminé';
    const msg = !n ? 'Aucune réponse donnée cette fois.' : qz.mode === 'survival' ? (c === 0 ? 'Rate pas la prochaine !' : c + ' ' + plural(c, 'bonne réponse', 'bonnes réponses') + ' avant la fin.') : qz.mode === 'express' ? c + ' ' + plural(c, 'bonne réponse', 'bonnes réponses') + ' en 3 minutes.' : pct === 100 ? 'Sans faute !' : pct >= 70 ? 'Très solide.' : pct >= 40 ? 'Bonne base, continue.' : 'Pas grave : les notions ratées reviendront en révision.';
    root.innerHTML = `<div class="study"><div class="card result">
      <span class="tag new">${title}</span>
      <div class="ring" style="--p:${pct}"><div class="score">${c}/${n}</div></div>
      <p class="muted-p">${msg}${skippedN ? ' · ' + skippedN + ' « je ne sais pas »' : ''}</p>
      ${qz.record ? `<p class="record">Nouveau record !</p>` : ''}
      <div class="stats"><div><b>${pct}%</b>réussite</div><div><b>${qz.noXp ? '—' : '+' + xp}</b>XP</div>${qz.mode !== 'classic' && !qz.redo ? `<div><b>${qz.mode === 'express' ? LP.stats().bestExp || 0 : LP.stats().bestSurv || 0}</b>record</div>` : ''}</div>
      ${LP.fun && LP.fun.resultExtras ? LP.fun.resultExtras(qz.noXp ? null : { pct, n }) : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        ${wrong.length ? `<button class="btn primary" data-act="qz-redo">${ic('refresh', 16)} Refaire mes erreurs (${new Set(wrong.map(l => l.id)).size})</button>` : ''}
        <button class="btn ${wrong.length ? 'soft' : 'primary'}" data-act="qz-start">${ic('refresh', 16)} ${qz.mode === 'classic' || qz.redo ? 'Nouveau quiz' : 'Rejouer'}</button>
        <button class="btn soft" data-act="qz-reset">Changer les réglages</button>
        ${wrong.length ? '<a class="btn ghost" href="#/review">' + ic('cards', 16) + ' Réviser mes erreurs</a>' : ''}
      </div></div>
      ${wrong.length ? `<div class="card" style="margin-top:16px"><div class="card-head"><h3>${ic('flag', 18)} À retravailler</h3></div><div class="list">${[...new Set(wrong.map(l => l.id))].map(id => { const d = LP.byId.get(id); return d ? `<button class="li" data-m="${esc(d.matiere)}" data-act="open-def" data-id="${d.id}"><span class="dotc"></span><div><b>${esc(d.term)}</b><small>${esc(trunc(d.def, 100))}</small></div></button>` : ''; }).join('')}</div></div>` : ''}
    </div>`;
  }
  A['qz-reset'] = () => { qzStop(); qz = null; LP.keys = null; lsSet(sessionStorage, RUN_K, null); qzSetup(); };

  /* rafraîchissement quand les données changent */
  LP.on('defs', () => { if ((location.hash || '#/') === '#/library' || /^#\/library/.test(location.hash)) libRender(); });
})();
