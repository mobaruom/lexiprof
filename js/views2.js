/* ============================================================
   LexiProf 2.0 — views2.js
   Progrès · Profil · Proposer · Admin
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, $$ = LP.$$, esc = LP.esc, ic = LP.ic, subj = LP.subj;
  const V = LP.views, A = LP.actions;
  const view = () => $('#view');
  const plural = (n, a, b) => (n > 1 ? b : a);
  const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

  /* ============================ PROGRÈS ============================ */
  V.progress = root => {
    const st = LP.stats(), lv = LP.level(), act = LP.activity(), streak = LP.streak(), badges = LP.badges();
    const acc = st.quiz ? Math.round((st.correct / st.quiz) * 100) : null;
    // heatmap : 17 semaines, lundi en haut
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7, weeks = 17, totalDays = weeks * 7;
    const start = new Date(today); start.setDate(start.getDate() - (dow + (weeks - 1) * 7));
    const cells = []; let active = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const a = act[LP.dkey(d)], n = a ? a.rv + a.qz : 0, fut = d > today;
      if (n) active++;
      const l = n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : n < 25 ? 3 : 4;
      cells.push(`<i class="hc${fut ? ' fut' : ''}${d.getTime() === today.getTime() ? ' today' : ''}" data-l="${l}" title="${esc(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))} : ${n} ${plural(n, 'action', 'actions')}"></i>`);
    }
    // 7 derniers jours
    const days = []; let mx = 1;
    for (let k = 6; k >= 0; k--) { const d = new Date(today); d.setDate(d.getDate() - k); const a = act[LP.dkey(d)]; const n = a ? a.rv + a.qz : 0; mx = Math.max(mx, n); days.push({ d, n }); }
    const weak = LP.srs.weak(6), misses = LP.topMisses(5), got = badges.filter(b => b.got).length;
    root.innerHTML = `
    <div class="page-head"><div><h1>Progrès</h1><p>${st.reviews + st.quiz ? 'Ton parcours, jour après jour.' : 'Révise ou fais un quiz pour voir tes statistiques apparaître ici.'}</p></div></div>
    <div class="grid">
      <section class="card c5"><div class="lvl-card">
        <div class="lvl-badge"><small>Niveau</small><b>${lv.level}</b></div>
        <div style="flex:1;min-width:160px"><b style="font-size:20px">${lv.xp} XP</b><div class="pbar" style="margin:10px 0 6px"><i style="--w:${lv.pct}%"></i></div><small class="muted">${lv.next - lv.xp} XP avant le niveau ${lv.level + 1}</small></div>
      </div></section>
      <section class="card c7"><div class="tiles t4" style="margin:0">
        <div class="tile" style="--c:var(--drt)"><b>${streak}</b><span>série</span></div>
        <div class="tile"><b>${st.best || 0}</b><span>record</span></div>
        <div class="tile"><b>${st.reviews}</b><span>révisions</span></div>
        <div class="tile"><b>${acc == null ? '—' : acc + '%'}</b><span>quiz</span></div></div></section>
      <section class="card c12" style="grid-column:span 12">
        <div class="card-head"><h3>${ic('calendar', 18)} Activité</h3><span class="muted" style="font-size:13px">${active} ${plural(active, 'jour actif', 'jours actifs')} sur ${weeks} semaines</span></div>
        <div class="heat">${cells.join('')}</div></section>
      <section class="card c6"><div class="card-head"><h3>${ic('chart', 18)} 7 derniers jours</h3></div>
        <div class="bars">${days.map(x => `<div><i style="--h:${Math.round((x.n / mx) * 100)}%" title="${x.n}"></i><span>${x.d.toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase()}</span></div>`).join('')}</div></section>
      <section class="card c6"><div class="card-head"><h3>${ic('target', 18)} Maîtrise par matière</h3></div>
        ${LP.SUBJECTS.map(m => { const x = LP.masteryBy(m); return x.total ? `<div class="mrow"><div class="t"><span>${subj(m)}</span><span>${x.mastered}/${x.total} maîtrisées</span></div><div class="pbar" data-m="${m}"><i style="--w:${Math.round((x.mastered / x.total) * 100)}%"></i></div></div>` : ''; }).join('') || '<p class="muted">Rien à afficher.</p>'}</section>
      <section class="card c6"><div class="card-head"><h3>${ic('flag', 18)} Points faibles</h3></div>
        ${weak.length ? `<div class="list">${weak.map(w => `<button class="li" data-m="${esc(w.d.matiere)}" data-act="open-def" data-id="${w.d.id}"><span class="dotc"></span><div><b>${esc(w.d.term)}</b><small>${w.s.l} ${plural(w.s.l, 'oubli', 'oublis')}</small></div></button>`).join('')}</div>` : '<p class="muted">Aucune notion difficile pour l\'instant. Continue comme ça.</p>'}</section>
      <section class="card c6"><div class="card-head"><h3>${ic('search', 18)} Recherches sans résultat</h3></div>
        ${misses.length ? `<div class="list">${misses.map(m => `<a class="li" href="#/propose?term=${encodeURIComponent(m.term)}"><div><b>${esc(m.term)}</b><small>${m.count} ${plural(m.count, 'fois', 'fois')} · proposer cette notion</small></div></a>`).join('')}</div>` : '<p class="muted">Rien de manquant détecté.</p>'}</section>
      <section class="card c12" style="grid-column:span 12"><div class="card-head"><h3>${ic('trophy', 18)} Badges</h3><span class="muted" style="font-size:13px">${got} / ${badges.length}</span></div>
        <div class="badges">${badges.map(b => `<div class="bdg ${b.got ? '' : 'lock'}${b.rare ? ' rare' : ''}"><div class="b">${ic(b.rare && !b.got ? 'lock' : (b.i || 'star'), 20)}</div><div><b>${b.rare && !b.got ? 'Badge rare' : esc(b.n)}${b.rare ? ' <em class="rare-tag">Rare</em>' : ''}</b><small>${b.rare && !b.got ? 'À découvrir…' : esc(b.d)}</small></div></div>`).join('')}</div></section>
    </div>`;
  };

  /* ============================ PROFIL ============================ */
  const authState = { tab: 'login' };
  const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const avatarHtml = s => LP.fun ? LP.fun.avatar() : `<div class="avatar">${s.avatar ? `<img src="${esc(s.avatar)}" alt="">` : esc(initials(s.displayName))}</div>`;
  const ACCENTS = { blue: 'Bleu', violet: 'Violet', emerald: 'Émeraude', teal: 'Turquoise', amber: 'Ambre', orange: 'Orange', rose: 'Rose', graphite: 'Graphite' };

  V.profile = root => {
    const s = LP.auth.session(), p = LP.prefs.get(), st = LP.stats(), lv = LP.level();
    root.innerHTML = `
    <div class="page-head"><div><h1>Profil</h1><p>Compte, apparence et données.</p></div></div>
    <div class="stack">
      ${LP.fun ? LP.fun.profileCard() : ''}
      ${s ? `<section class="card id-card">${avatarHtml(s)}<div style="flex:1;min-width:160px"><h2>${esc(s.displayName)}</h2><p class="muted">${esc(s.email)} · niveau ${lv.level} · ${st.xp} XP</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn soft sm" data-act="pf-edit">${ic('edit', 15)} Modifier</button><button class="btn ghost sm" data-act="pf-logout">${ic('logout', 15)} Déconnexion</button></div></section>`
      : `<section class="card auth" style="margin:0;max-width:none">
        <div class="tabs"><button class="${authState.tab === 'login' ? 'on' : ''}" data-act="auth-tab" data-v="login">Connexion</button><button class="${authState.tab === 'register' ? 'on' : ''}" data-act="auth-tab" data-v="register">Créer un compte</button></div>
        <form data-submit="auth" novalidate class="stack" style="gap:12px;max-width:none">
          ${authState.tab === 'register' ? `<div class="field"><label for="a-name">Prénom</label><input id="a-name" name="displayName" class="input" autocomplete="given-name" required></div>` : ''}
          <div class="field"><label for="a-mail">Email</label><input id="a-mail" name="email" type="email" class="input" autocomplete="email" required></div>
          <div class="field"><label for="a-pw">Mot de passe</label><input id="a-pw" name="password" type="password" class="input" autocomplete="${authState.tab === 'login' ? 'current-password' : 'new-password'}" required></div>
          <p class="notice" id="a-err" hidden style="color:var(--bad)"></p>
          <button class="btn primary lg block" type="submit">${authState.tab === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
          <p class="muted" style="font-size:12.5px">Le compte synchronise ta progression entre tes appareils. Tout fonctionne aussi sans compte.</p>
        </form></section>`}
      <section class="card"><div class="card-head"><h3>${ic('sliders', 18)} Apparence</h3></div>
        <div class="setting"><div><b>Thème</b><small>Clair, sombre ou selon ton appareil</small></div><div class="seg">${[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, t]) => `<button class="${p.theme === v ? 'on' : ''}" data-act="pf-pref" data-k="theme" data-v="${v}">${t}</button>`).join('')}</div></div>
        <div class="setting"><div><b>Couleur</b></div><div class="swatches">${Object.entries(ACCENTS).map(([k, t]) => `<button class="sw ${p.accent === k ? 'on' : ''}" data-act="pf-pref" data-k="accent" data-v="${k}" data-accent="${k}" aria-label="${t}" title="${t}"></button>`).join('')}</div></div>
        <div class="setting"><div><b>Taille du texte</b><small>${p.fontSize}% · aperçu : <span style="font-size:${p.fontSize / 100}em">Aa</span></small></div><div class="seg">${[[88, 'Petit'], [100, 'Normal'], [115, 'Grand'], [130, 'Très grand']].map(([v, t]) => `<button class="${p.fontSize === v ? 'on' : ''}" data-act="pf-pref" data-k="fontSize" data-v="${v}">${t}</button>`).join('')}</div></div>
        <div class="setting"><div><b>Police</b><small>Lisible (Atkinson) ou adaptée à la dyslexie (OpenDyslexic)</small></div><div class="seg">${[['std', 'Standard'], ['hyper', 'Lisible'], ['dys', 'Dyslexie']].map(([v, t]) => `<button class="${p.font === v ? 'on' : ''}" data-act="pf-pref" data-k="font" data-v="${v}">${t}</button>`).join('')}</div></div>
        <div class="setting"><div><b>Espacement renforcé</b><small>Plus d'air entre les lettres, les mots et les lignes</small></div><label class="switch"><input type="checkbox" data-change="pf-spacing" ${p.spacing ? 'checked' : ''} aria-label="Espacement renforcé"><span></span></label></div>
        <div class="setting"><div><b>Teinter l'interface</b><small>Les fonds prennent la couleur choisie</small></div><label class="switch"><input type="checkbox" data-change="pf-tint" ${p.tint !== false ? 'checked' : ''} aria-label="Teinter l'interface"><span></span></label></div>
        <div class="setting"><div><b>Réduire les animations</b></div><label class="switch"><input type="checkbox" data-change="pf-motion" ${p.reduceMotion ? 'checked' : ''} aria-label="Réduire les animations"><span></span></label></div></section>
      <section class="card"><div class="setting" style="padding-top:0"><div><b>Réinitialiser l'apparence</b><small>Thème, couleur, taille, police, animations</small></div><button class="btn soft sm" data-act="pf-appr-reset">Par défaut</button></div></section>
      <section class="card"><div class="card-head"><h3>${ic('target', 18)} Objectifs</h3></div>
        <div class="setting"><div><b>Objectif quotidien</b><small>Actions par jour</small></div><div class="seg">${[5, 10, 15, 25, 40].map(v => `<button class="${p.dailyGoal === v ? 'on' : ''}" data-act="pf-pref" data-k="dailyGoal" data-v="${v}">${v}</button>`).join('')}</div></div>
        <div class="setting"><div><b>Nouvelles notions par jour</b><small>Limite en révision</small></div><div class="seg">${[3, 5, 8, 12, 20].map(v => `<button class="${p.newPerDay === v ? 'on' : ''}" data-act="pf-pref" data-k="newPerDay" data-v="${v}">${v}</button>`).join('')}</div></div></section>
      <section class="card"><div class="setting" style="padding:0"><div><b>Installer l'application</b><small>Accès direct depuis l'écran d'accueil, fonctionne hors ligne</small></div><button class="btn soft sm" data-act="install">${ic('phone', 15)} Installer</button></div></section>
      <section class="card"><div class="card-head"><h3>${ic('download', 18)} Mes données</h3></div>
        <div class="setting"><div><b>Mon rapport PDF</b><small>Progression, notions à revoir, favoris, données stockées</small></div><button class="btn primary sm" data-act="pf-pdf">${ic('download', 15)} Télécharger le PDF</button></div>
        <div class="setting"><div><b>Mes favoris en fiches PDF</b><small>Définitions complètes, prêtes à imprimer</small></div><button class="btn soft sm" data-act="pf-pdf-favs">${ic('download', 15)} Fiches PDF</button></div>
        <div class="setting"><div><b>Sauvegarde complète</b><small>JSON, réimportable sur un autre appareil</small></div><button class="btn soft sm" data-act="pf-export">${ic('download', 15)} Exporter</button></div>
        <div class="setting"><div><b>Journal technique</b><small>${LP.errlog.list().length} erreur(s) notée(s) sur cet appareil — jamais envoyées. Utile pour me signaler un bug.</small></div><div style="display:flex;gap:8px"><button class="btn soft sm" data-act="pf-errlog">${ic('download', 15)} Exporter</button><button class="btn ghost sm" data-act="pf-errlog-clear">Effacer</button></div></div>
        <div class="setting"><div><b>Importer</b><small>Fusionne une sauvegarde sans rien écraser</small></div><button class="btn soft sm" data-act="pf-import">${ic('upload', 15)} Importer</button><input type="file" id="pf-file" accept="application/json,.json" hidden></div>
        <div class="setting"><div><b>Réinitialiser ma progression</b><small>Révisions, XP, favoris, série</small></div><button class="btn danger sm" data-act="pf-reset">Réinitialiser</button></div>
        ${s ? `<div class="setting"><div><b>Mot de passe</b></div><button class="btn soft sm" data-act="pf-pw">${ic('lock', 15)} Changer</button></div>
        <div class="setting"><div><b>Supprimer mon compte</b><small>Efface le compte et la progression synchronisée</small></div><button class="btn danger sm" data-act="pf-delete">Supprimer</button></div>` : ''}</section>
      <p class="muted" style="text-align:center;font-size:12.5px">LexiProf ${esc(LP.cfg.version)} · <a href="#/privacy">Confidentialité</a></p>
    </div>`;
  };
  A['auth-tab'] = el => { authState.tab = el.dataset.v; V.profile(view()); };
  A['pf-pref'] = el => { const k = el.dataset.k; let v = el.dataset.v; if (['fontSize', 'dailyGoal', 'newPerDay'].includes(k)) v = Number(v); LP.prefs.set({ [k]: v }); V.profile(view()); };
  A['pf-tint'] = el => { LP.prefs.set({ tint: el.checked }); };
  A['pf-spacing'] = el => { LP.prefs.set({ spacing: !!el.checked }); };
  A['pf-tour'] = () => LP.tour.start();
  A['pf-appr-reset'] = () => { LP.resetAppearance(); LP.toast('Apparence réinitialisée', 'ok'); V.profile(view()); };
  A['pf-motion'] = el => { LP.prefs.set({ reduceMotion: el.checked }); };
  A['pf-errlog'] = () => { LP.download('lexiprof-journal-technique-' + LP.dkey() + '.json', { version: LP.VERSION, navigateur: navigator.userAgent, erreurs: LP.errlog.list() }); };
  A['pf-errlog-clear'] = () => { LP.errlog.clear(); LP.toast('Journal technique effacé', 'ok'); V.profile(view()); };
  A['pf-export'] = () => { LP.download('lexiprof-sauvegarde-' + LP.dkey() + '.json', LP.exportAll()); LP.toast('Sauvegarde téléchargée', 'ok'); };
  A['pf-import'] = () => { const f = $('#pf-file'); if (f) f.click(); };
  A['pf-file'] = async el => {
    const f = el.files && el.files[0]; if (!f) return;
    try { LP.importAll(JSON.parse(await f.text())); LP.toast('Sauvegarde importée', 'ok'); V.profile(view()); } catch (e) { LP.toast(e.message || 'Fichier invalide', 'err'); }
    el.value = '';
  };
  A['pf-reset'] = async () => { if (await LP.confirm('Réinitialiser ta progression ?', 'Révisions, XP, favoris et série seront effacés. Cette action est définitive.', { ok: 'Réinitialiser', danger: true })) { LP.resetProgress(); LP.toast('Progression réinitialisée', 'ok'); V.profile(view()); } };
  A['pf-logout'] = async () => { await LP.auth.logout(); LP.toast('Déconnecté', 'ok'); LP.emit('session'); V.profile(view()); };
  A['pf-delete'] = async () => {
    const r = await LP.dialog({ title: 'Supprimer le compte ?', ok: 'Supprimer définitivement', danger: true, body: `<p class="muted-p" style="margin-bottom:12px">Ton compte et la progression synchronisée sur le serveur seront effacés. Tes données sur cet appareil restent.</p><div class="field"><label for="dp">Mot de passe</label><input id="dp" type="password" class="input" autocomplete="current-password"></div>`, collect: m => m.querySelector('#dp').value });
    if (!r) return;
    try { await LP.auth.remove(r); LP.toast('Compte supprimé', 'ok'); LP.emit('session'); V.profile(view()); } catch (e) { LP.toast(e.message, 'err'); }
  };
  A['pf-edit'] = async () => {
    const s = LP.auth.session(); if (!s) return;
    const r = await LP.dialog({ title: 'Modifier le profil', ok: 'Enregistrer', body: `<div class="field"><label for="e-name">Prénom</label><input id="e-name" class="input" value="${esc(s.displayName)}"></div>`, collect: m => ({ displayName: m.querySelector('#e-name').value }) });
    if (!r) return;
    try { await LP.auth.update(r); LP.emit('session'); V.profile(view()); } catch (e) { LP.toast(e.message, 'err'); }
  };
  A['pf-pw'] = async () => {
    const r = await LP.dialog({ title: 'Changer le mot de passe', ok: 'Valider', body: `<div class="field"><label for="p1">Mot de passe actuel</label><input id="p1" type="password" class="input" autocomplete="current-password"></div><div class="field"><label for="p2">Nouveau mot de passe</label><input id="p2" type="password" class="input" autocomplete="new-password"></div>`, collect: m => ({ a: m.querySelector('#p1').value, b: m.querySelector('#p2').value }) });
    if (!r) return;
    try { await LP.auth.password(r.a, r.b); LP.toast('Mot de passe modifié', 'ok'); } catch (e) { LP.toast(e.message, 'err'); }
  };
  A['submit:auth'] = async form => {
    const f = Object.fromEntries(new FormData(form).entries()), err = $('#a-err'), btn = form.querySelector('[type=submit]');
    err.hidden = true; btn.disabled = true;
    try {
      if (authState.tab === 'login') await LP.auth.login(f); else await LP.auth.register(f);
      LP.toast('Bienvenue !', 'ok'); LP.emit('session'); V.profile(view());
    } catch (e) { err.textContent = e.message; err.hidden = false; btn.disabled = false; }
  };

  /* ============================ PROPOSER ============================ */
  V.propose = (root, params) => {
    const sent = LP.sent.list(), s = LP.auth.session();
    root.innerHTML = `
    <div class="page-head"><div><h1>Proposer une notion</h1><p>Il manque un terme ? Ajoute-le : il sera relu avant publication.</p></div></div>
    <div class="stack">
      <form class="card stack" data-submit="propose" novalidate style="gap:14px;max-width:none">
        <div class="row2">
          <div class="field"><label for="pr-term">Terme</label><input id="pr-term" name="term" class="input" maxlength="120" required value="${esc((params && params.term) || '')}"></div>
          <div class="field"><label for="pr-m">Matière</label><select id="pr-m" name="matiere" class="select">${LP.SUBJECTS.map(m => `<option>${m}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="pr-def">Définition</label><textarea id="pr-def" name="def" class="textarea" maxlength="2000" rows="4" required placeholder="Claire, précise, avec tes mots."></textarea></div>
        <div class="field"><label for="pr-ex">Exemple <small>(facultatif)</small></label><textarea id="pr-ex" name="example" class="textarea" maxlength="1000" rows="2"></textarea></div>
        <div class="row2">
          <div class="field"><label for="pr-re">À retenir <small>(facultatif)</small></label><input id="pr-re" name="remember" class="input" maxlength="500"></div>
          <div class="field"><label for="pr-src">Source <small>(lien, facultatif)</small></label><input id="pr-src" name="source" class="input" type="url" maxlength="500" placeholder="https://"></div>
        </div>
        <div class="field"><label for="pr-ps">Ton prénom ou pseudo <small>(facultatif)</small></label><input id="pr-ps" name="pseudo" class="input" maxlength="60" value="${esc(s ? s.displayName : '')}"></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="notice" id="pr-err" hidden style="color:var(--bad)"></p>
        <button class="btn primary lg block" type="submit">${ic('arrow', 16)} Envoyer la proposition</button>
      </form>
      ${sent.length ? `<section class="card"><div class="card-head"><h3>${ic('inbox', 18)} Mes propositions</h3></div><div class="list">${sent.slice(0, 8).map(p => `<div class="li" data-m="${esc(p.matiere)}"><span class="dotc"></span><div><b>${esc(p.term)}</b><small>${esc(trunc(p.def, 90))}</small></div><span class="r">${esc(LP.timeAgo(Date.parse(p.createdAt)))}</span></div>`).join('')}</div></section>` : ''}
    </div>`;
  };
  A['submit:propose'] = async form => {
    const f = Object.fromEntries(new FormData(form).entries()), err = $('#pr-err'), btn = form.querySelector('[type=submit]');
    err.hidden = true;
    if (f.website) { LP.toast('Merci !', 'ok'); return; } // honeypot
    const bad = m => { err.textContent = m; err.hidden = false; };
    if (f.term.trim().length < 2) return bad('Indique un terme.');
    if (f.def.trim().length < 15) return bad('La définition est trop courte (15 caractères minimum).');
    if (f.source && !LP.safeUrl(f.source)) return bad('Le lien source doit commencer par http(s)://');
    if (LP.defs.some(d => LP.norm(d.term) === LP.norm(f.term).trim())) return bad('Cette notion existe déjà dans la bibliothèque.');
    btn.disabled = true;
    try { await LP.submitProposal(f); LP.toast('Proposition envoyée, merci !', 'ok'); LP.confetti(); V.propose(view(), {}); }
    catch (e) { bad(e.message || 'Envoi impossible.'); btn.disabled = false; }
  };

  /* ============================ ADMIN ============================ */
  const adm = { tab: 'props', props: null, reps: null, q: '', loading: false, sel: new Set() };
  const alog = (t, l, m) => { try { LP.audit && LP.audit.log(t, l, m); } catch (e) {} };
  V.admin = async root => {
    if (!LP.admin.unlocked()) {
      root.innerHTML = `<div class="auth card"><div style="text-align:center;margin-bottom:14px"><div class="bub" style="display:inline-grid;place-items:center;width:56px;height:56px;border-radius:18px;background:var(--accent-soft);color:var(--accent)">${ic('shield', 26)}</div><h2 style="font:400 28px var(--display);margin-top:10px">Administration</h2></div>
        <form data-submit="admin-login" class="stack" style="gap:12px">${LP.admin.needsEmail ? '<div class="field"><label for="ad-mail">Email administrateur</label><input id="ad-mail" type="email" class="input" autocomplete="username"></div>' : '<p class="notice warn">Mode provisoire : la connexion Firebase n\'est pas configurée (<code>apiKey</code> dans js/config.js). Ce verrou ne protège pas les données.</p>'}<div class="field"><label for="ad-pw">Mot de passe</label><input id="ad-pw" type="password" class="input" autocomplete="current-password" autofocus></div>
        <p class="notice" id="ad-err" hidden style="color:var(--bad)"></p><button class="btn primary lg block" type="submit">Déverrouiller</button></form></div>`;
      return;
    }
    LP.admin.touch();
    root.innerHTML = `<div class="page-head"><div><h1>Administration</h1><p>Modération et gestion de la bibliothèque.</p></div><button class="btn ghost" data-act="ad-lock">${ic('lock', 16)} Verrouiller</button></div>
      <div id="ad-body"><div class="sk" style="height:200px"></div></div>`;
    if (!adm.props) await adLoad();
    adRender();
  };
  async function adLoad() {
    try { const [p, r] = await Promise.all([LP.api.get('proposals'), LP.api.get('reports')]); adm.props = p.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); adm.reps = r.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); }
    catch (e) { adm.props = adm.props || []; adm.reps = adm.reps || []; LP.toast('Serveur injoignable : ' + e.message, 'err'); }
  }
  function adRender() {
    const body = $('#ad-body'); if (!body) return;
    const pend = adm.props.filter(p => p.status === 'pending' || !p.status), reps = adm.reps.filter(r => r.status !== 'done');
    let h = `<div class="tabs" style="margin-bottom:16px">
      <button class="${adm.tab === 'props' ? 'on' : ''}" data-act="ad-tab" data-v="props">Propositions ${pend.length ? `<span class="pill">${pend.length}</span>` : ''}</button>
      <button class="${adm.tab === 'defs' ? 'on' : ''}" data-act="ad-tab" data-v="defs">Notions (${LP.defs.length})</button>
      <button class="${adm.tab === 'reps' ? 'on' : ''}" data-act="ad-tab" data-v="reps">Signalements ${reps.length ? `<span class="pill">${reps.length}</span>` : ''}</button>
      <button class="${adm.tab === 'set' ? 'on' : ''}" data-act="ad-tab" data-v="set">Réglages</button>
      ${(LP.adminTabList || []).map(([k, t]) => `<button class="${adm.tab === k ? 'on' : ''}" data-act="ad-tab" data-v="${k}">${t}</button>`).join('')}</div>`;
    if (adm.tab === 'props') {
      h += pend.length ? pend.map(p => `<article class="prop" data-m="${esc(p.matiere)}"><div class="meta">${subj(p.matiere)}<span>${esc(p.pseudo || 'Anonyme')}</span><span>${esc(LP.timeAgo(Date.parse(p.createdAt)))}</span></div>
        <h4>${esc(p.term)}</h4><p>${esc(p.def)}</p>${p.example ? `<p class="muted"><b>Exemple :</b> ${esc(p.example)}</p>` : ''}${p.remember ? `<p class="muted"><b>À retenir :</b> ${esc(p.remember)}</p>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary sm" data-act="ad-accept" data-k="${esc(p._key)}">${ic('check', 15)} Publier</button><button class="btn soft sm" data-act="ad-edit-prop" data-k="${esc(p._key)}">${ic('edit', 15)} Modifier puis publier</button><button class="btn danger sm" data-act="ad-reject" data-k="${esc(p._key)}">${ic('x', 15)} Refuser</button></div></article>`).join('')
        : `<div class="empty"><div class="bub">${ic('inbox', 28)}</div><h3>Aucune proposition en attente</h3></div>`;
    } else if (adm.tab === 'defs') {
      const list = adm.q ? LP.search(adm.q) : LP.defs.slice().sort((a, b) => b.id - a.id);
      h += `<div style="display:flex;gap:10px;margin-bottom:12px"><input class="input" data-input="ad-q" placeholder="Filtrer…" value="${esc(adm.q)}" style="flex:1"><button class="btn primary" data-act="ad-new">${ic('plus', 16)} Nouvelle</button></div>
        ${adm.sel.size ? `<div class="bulkbar" role="region" aria-label="Actions groupées"><b>${adm.sel.size} sélectionnée${adm.sel.size > 1 ? 's' : ''}</b><button class="btn soft sm" data-act="ad-bulk-move">${ic('edit', 15)} Changer la matière</button><button class="btn danger sm" data-act="ad-bulk-del">${ic('trash', 15)} Supprimer</button><button class="btn ghost sm" data-act="ad-sel-none">Annuler</button></div>` : ''}
        <div class="card" style="padding:8px 16px"><label class="admin-row selall"><input type="checkbox" data-change="ad-sel-all" ${list.slice(0, 80).length && list.slice(0, 80).every(d => adm.sel.has(d.id)) ? 'checked' : ''}> <span class="muted" style="font-size:.8125rem">Tout sélectionner (${Math.min(80, list.length)} affichées)</span></label>${list.slice(0, 80).map(d => `<div class="admin-row${adm.sel.has(d.id) ? ' sel' : ''}"><input type="checkbox" data-change="ad-sel" data-id="${d.id}" aria-label="Sélectionner ${esc(d.term)}" ${adm.sel.has(d.id) ? 'checked' : ''}><div class="main"><b>${esc(d.term)}</b><small>${esc(d.matiere)} · ${esc(trunc(d.def, 80))}</small></div><div class="acts"><button class="icon-btn" data-act="ad-edit" data-id="${d.id}" aria-label="Modifier">${ic('edit', 16)}</button><button class="icon-btn" data-act="ad-del" data-id="${d.id}" aria-label="Supprimer">${ic('trash', 16)}</button></div></div>`).join('') || '<p class="muted" style="padding:16px">Aucune notion.</p>'}</div>`;
    } else if (adm.tab === 'reps') {
      h += adm.reps.length ? `<div class="card" style="padding:8px 16px">${adm.reps.map(r => `<div class="admin-row"><div class="main"><b>${esc(r.term)} <span class="tag ${r.status === 'done' ? 's-mastered' : 'bad'}">${esc(r.reason || 'Autre')}</span></b><small style="white-space:normal">${esc(r.message || 'Sans détail')}</small></div><div class="acts">${r.definitionId ? `<button class="icon-btn" data-act="open-def" data-id="${r.definitionId}" aria-label="Voir">${ic('eye', 16)}</button>` : ''}${r.status !== 'done' ? `<button class="icon-btn" data-act="ad-rep-done" data-k="${esc(r._key)}" aria-label="Traité">${ic('check', 16)}</button>` : ''}<button class="icon-btn" data-act="ad-rep-del" data-k="${esc(r._key)}" aria-label="Supprimer">${ic('trash', 16)}</button></div></div>`).join('')}</div>`
        : `<div class="empty"><div class="bub">${ic('check', 28)}</div><h3>Aucun signalement</h3></div>`;
    } else if (LP.adminTabs && LP.adminTabs[adm.tab]) {
      const host = { import: 'imp', stats: 'st', audit: 'jr' }[adm.tab] || 'x';
      body.innerHTML = h + `<div class="${host}-host"></div>`;
      LP.adminTabs[adm.tab]($('.' + host + '-host', body)); return;
    } else {
      const per = LP.SUBJECTS.map(m => `<div class="metric"><span>${esc(m)}</span><b>${LP.defs.filter(d => d.matiere === m).length}</b></div>`).join('');
      h += `<div class="grid"><section class="card c6"><div class="card-head"><h3>Contenu</h3></div><div class="metric"><span>Notions</span><b>${LP.defs.length}</b></div>${per}<div class="metric"><span>Source des données</span><b>${esc(LP.source)}</b></div></section>
        <section class="card c6"><div class="card-head"><h3>Outils</h3></div>
        <div class="setting"><div><b>Mot de passe admin</b></div><button class="btn soft sm" data-act="ad-pw">Changer</button></div>
        <div class="setting"><div><b>Exporter les notions</b></div><button class="btn soft sm" data-act="ad-export">${ic('download', 15)} JSON</button></div>
        <div class="setting"><div><b>Recharger depuis le serveur</b></div><button class="btn soft sm" data-act="ad-reload">${ic('refresh', 15)} Recharger</button></div>
        </section></div>`;
    }
    body.innerHTML = h;
  }
  LP.adm = () => adm; LP.adminLoad = adLoad;
  const guard = () => { if (!LP.admin.unlocked()) { V.admin(view()); return false; } LP.admin.touch(); return true; };
  A['submit:admin-login'] = async form => {
    const pw = $('#ad-pw').value, err = $('#ad-err'); err.hidden = true;
    try { await LP.admin.signIn(($('#ad-mail') || {}).value || '', pw); alog('admin.login', 'Connexion à l\'administration'); V.admin(view()); } catch (e) { err.textContent = e.message; err.hidden = false; }
  };
  A['ad-lock'] = async () => { try { await LP.audit.log('admin.lock', 'Session administrateur verrouillée'); } catch (e) {} LP.admin.lock(); adm.props = adm.reps = null; V.admin(view()); };
  A['ad-tab'] = el => { adm.tab = el.dataset.v; adRender(); };
  A['ad-q'] = el => { adm.q = el.value; adRender(); const i = $('[data-input=ad-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  const defForm = (d = {}) => `
    <div class="field"><label>Terme</label><input id="f-term" class="input" value="${esc(d.term || '')}"></div>
    <div class="row2"><div class="field"><label>Matière</label><select id="f-m" class="select">${LP.SUBJECTS.map(m => `<option ${d.matiere === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
    <div class="field"><label>Synonymes <small>(séparés par des virgules)</small></label><input id="f-al" class="input" value="${esc((d.aliases || []).join(', '))}"></div></div>
    <div class="field"><label>Définition</label><textarea id="f-def" class="textarea" rows="4">${esc(d.def || '')}</textarea></div>
    <div class="field"><label>Exemple</label><textarea id="f-ex" class="textarea" rows="2">${esc(d.example || '')}</textarea></div>
    <div class="row2"><div class="field"><label>À retenir</label><input id="f-re" class="input" value="${esc(d.remember || '')}"></div><div class="field"><label>Source</label><input id="f-src" class="input" value="${esc(d.source || '')}"></div></div>`;
  const defCollect = m => ({ term: m.querySelector('#f-term').value.trim(), matiere: m.querySelector('#f-m').value, aliases: m.querySelector('#f-al').value.split(',').map(x => x.trim()).filter(Boolean), def: m.querySelector('#f-def').value.trim(), example: m.querySelector('#f-ex').value.trim(), remember: m.querySelector('#f-re').value.trim(), source: m.querySelector('#f-src').value.trim() });
  async function saveWith(fn, okMsg) {
    const snapshot = LP.defs.slice();
    try { fn(); await LP.saveDefs(); LP.toast(okMsg, 'ok'); }
    catch (e) { LP.setDefs(snapshot); LP.toast('Échec : ' + e.message, 'err'); throw e; }
  }
  A['ad-new'] = async () => {
    if (!guard()) return;
    const r = await LP.dialog({ title: 'Nouvelle notion', ok: 'Créer', wide: true, body: defForm(), collect: defCollect });
    if (!r) return; if (!r.term || !r.def) return LP.toast('Terme et définition requis', 'err');
    const nd = LP.makeDef(r);
    try { await saveWith(() => LP.setDefs(LP.defs.concat(nd)), 'Notion créée'); alog('def.create', '« ' + r.term + ' » ajoutée (' + r.matiere + ')', { id: nd.id, term: r.term, matiere: r.matiere }); adRender(); } catch (e) {}
  };
  A['ad-edit'] = async el => {
    if (!guard()) return;
    const d = LP.byId.get(Number(el.dataset.id)); if (!d) return;
    const r = await LP.dialog({ title: 'Modifier la notion', ok: 'Enregistrer', wide: true, body: defForm(d), collect: defCollect });
    if (!r) return; if (!r.term || !r.def) return LP.toast('Terme et définition requis', 'err');
    const before = Object.assign({}, d), changes = LP.audit.diff(before, r);
    try { await saveWith(() => LP.setDefs(LP.defs.map(x => x.id === d.id ? Object.assign({}, x, r) : x)), 'Notion modifiée'); alog('def.update', '« ' + r.term + ' » modifiée' + (changes.length ? ' (' + changes.map(c => c.f).join(', ') + ')' : ' (aucun changement)'), { id: d.id, term: r.term, changes: changes.slice(0, 6) }); adRender(); } catch (e) {}
  };
  A['ad-del'] = async el => {
    if (!guard()) return;
    const d = LP.byId.get(Number(el.dataset.id)); if (!d) return;
    if (!(await LP.confirm('Supprimer « ' + esc(d.term) + ' » ?', 'La notion sera retirée de la bibliothèque pour tout le monde.', { ok: 'Supprimer', danger: true }))) return;
    try { await saveWith(() => LP.setDefs(LP.defs.filter(x => x.id !== d.id)), 'Notion supprimée'); adm.sel.delete(d.id); alog('def.delete', '« ' + d.term + ' » supprimée (' + d.matiere + ')', { id: d.id, term: d.term, matiere: d.matiere, def: d }); adRender(); } catch (e) {}
  };
  async function publish(p, over) {
    const f = Object.assign({ term: p.term, matiere: p.matiere, def: p.def, example: p.example, remember: p.remember, source: p.source }, over || {});
    await saveWith(() => LP.setDefs(LP.defs.concat(LP.makeDef(f))), 'Notion publiée');
    try { await LP.api.patch('proposals/' + p._key, { status: 'accepted' }); } catch (e) {}
    p.status = 'accepted'; alog('prop.accept', '« ' + f.term + ' » publiée' + (over ? ' après modification' : '') + ' — proposée par ' + (p.pseudo || 'Anonyme'), { term: f.term, matiere: f.matiere, pseudo: p.pseudo || '', edited: !!over }); adRender();
  }
  A['ad-accept'] = async el => { if (!guard()) return; const p = adm.props.find(x => x._key === el.dataset.k); if (p) { try { await publish(p); } catch (e) {} } };
  A['ad-edit-prop'] = async el => {
    if (!guard()) return;
    const p = adm.props.find(x => x._key === el.dataset.k); if (!p) return;
    const r = await LP.dialog({ title: 'Modifier puis publier', ok: 'Publier', wide: true, body: defForm(p), collect: defCollect });
    if (!r || !r.term || !r.def) return;
    try { await publish(p, r); } catch (e) {}
  };
  A['ad-reject'] = async el => {
    if (!guard()) return;
    const p = adm.props.find(x => x._key === el.dataset.k); if (!p) return;
    if (!(await LP.confirm('Refuser cette proposition ?', 'Elle sera supprimée.', { ok: 'Refuser', danger: true }))) return;
    try { await LP.api.del('proposals/' + p._key); adm.props = adm.props.filter(x => x !== p); alog('prop.reject', 'Proposition « ' + p.term + ' » refusée — par ' + (p.pseudo || 'Anonyme'), { term: p.term, matiere: p.matiere, pseudo: p.pseudo || '' }); adRender(); } catch (e) { LP.toast('Échec : ' + e.message, 'err'); }
  };
  A['ad-rep-done'] = async el => { if (!guard()) return; const r = adm.reps.find(x => x._key === el.dataset.k); if (!r) return; try { await LP.api.patch('reports/' + r._key, { status: 'done' }); r.status = 'done'; alog('rep.done', 'Signalement traité : « ' + r.term + ' » (' + (r.reason || 'Autre') + ')', { term: r.term, reason: r.reason || '', message: String(r.message || '').slice(0, 200) }); adRender(); } catch (e) { LP.toast('Échec : ' + e.message, 'err'); } };
  A['ad-rep-del'] = async el => { if (!guard()) return; const r = adm.reps.find(x => x._key === el.dataset.k); if (!r) return; try { await LP.api.del('reports/' + r._key); adm.reps = adm.reps.filter(x => x !== r); alog('rep.delete', 'Signalement supprimé : « ' + r.term + ' »', { term: r.term, reason: r.reason || '' }); adRender(); } catch (e) { LP.toast('Échec : ' + e.message, 'err'); } };
  A['ad-export'] = () => { LP.download('lexiprof-notions-' + LP.dkey() + '.json', LP.defs); alog('export', 'Export JSON de ' + LP.defs.length + ' notions', { n: LP.defs.length }); };
  A['ad-reload'] = async () => { adm.props = null; await LP.refreshDefs(); await adLoad(); adRender(); LP.toast('Données rechargées', 'ok'); };
  A['ad-pw'] = async () => {
    if (!guard()) return;
    const r = await LP.dialog({ title: 'Mot de passe administrateur', ok: 'Enregistrer', body: `<div class="field"><label for="n0">Mot de passe actuel</label><input id="n0" type="password" class="input" autocomplete="current-password"></div><div class="field"><label for="n1">Nouveau mot de passe <small>(8 caractères min.)</small></label><input id="n1" type="password" class="input" autocomplete="new-password"></div>`, collect: m => ({ a: m.querySelector('#n0').value, b: m.querySelector('#n1').value }) });
    if (!r) return;
    try { await LP.admin.changePassword(r.a, r.b); alog('admin.pw', 'Mot de passe administrateur modifié'); LP.toast('Mot de passe modifié', 'ok'); } catch (e) { LP.toast(e.message, 'err'); }
  };
  A['ad-sel'] = el => { const id = Number(el.dataset.id); el.checked ? adm.sel.add(id) : adm.sel.delete(id); adRender(); };
  A['ad-sel-all'] = el => { const list = (adm.q ? LP.search(adm.q) : LP.defs.slice().sort((a, b) => b.id - a.id)).slice(0, 80); list.forEach(d => el.checked ? adm.sel.add(d.id) : adm.sel.delete(d.id)); adRender(); };
  A['ad-sel-none'] = () => { adm.sel.clear(); adRender(); };
  A['ad-bulk-del'] = async () => {
    if (!guard() || !adm.sel.size) return;
    const ids = [...adm.sel], ds = ids.map(id => LP.byId.get(id)).filter(Boolean);
    if (!(await LP.confirm('Supprimer ' + ds.length + ' notion' + (ds.length > 1 ? 's' : '') + ' ?', 'Elles seront retirées de la bibliothèque pour tout le monde. L\'action sera inscrite au journal.', { ok: 'Supprimer', danger: true }))) return;
    try { await saveWith(() => LP.setDefs(LP.defs.filter(x => !adm.sel.has(x.id))), ds.length + ' notions supprimées'); alog('def.bulk-delete', ds.length + ' notion' + (ds.length > 1 ? 's' : '') + ' supprimée' + (ds.length > 1 ? 's' : '') + ' : ' + ds.slice(0, 5).map(d => '« ' + d.term + ' »').join(', ') + (ds.length > 5 ? '…' : ''), { n: ds.length, terms: ds.slice(0, 40).map(d => d.term), ids: ids.slice(0, 80) }); adm.sel.clear(); adRender(); } catch (e) {}
  };
  A['ad-bulk-move'] = async () => {
    if (!guard() || !adm.sel.size) return;
    const r = await LP.dialog({ title: 'Changer la matière de ' + adm.sel.size + ' notion' + (adm.sel.size > 1 ? 's' : ''), ok: 'Appliquer', body: `<div class="field"><label for="bm">Nouvelle matière</label><select id="bm" class="select">${LP.SUBJECTS.map(m => `<option>${esc(m)}</option>`).join('')}</select></div>`, collect: m => m.querySelector('#bm').value });
    if (!r) return;
    const ds = [...adm.sel].map(id => LP.byId.get(id)).filter(Boolean);
    try { await saveWith(() => LP.setDefs(LP.defs.map(x => adm.sel.has(x.id) ? Object.assign({}, x, { matiere: r }) : x)), 'Matière modifiée'); alog('def.bulk-move', ds.length + ' notion' + (ds.length > 1 ? 's' : '') + ' passée' + (ds.length > 1 ? 's' : '') + ' en « ' + r + ' »', { n: ds.length, to: r, terms: ds.slice(0, 40).map(d => d.term) }); adm.sel.clear(); adRender(); } catch (e) {}
  };
  LP.on('defs', () => { if (/^#\/admin/.test(location.hash) && LP.admin.unlocked() && adm.props) adRender(); });
})();
