/* ============================================================
   LexiProf 2.4 — fun.js
   Mascotte Fenn, pseudo & avatars, titres, coffre de récompense
   Tout est stocké sur l'appareil (clé lexiprof_fun) : rien n'est envoyé.
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, esc = LP.esc;
  const ic = (n, s) => (LP.ic ? LP.ic(n, s) : '');
  const A = (LP.actions = LP.actions || {});
  const FK = 'lexiprof_fun';
  const fresh = () => ({ pseudo: '', avatar: 'fenn', title: 'recrue', ownedA: [], ownedT: [], chest: null, seen: [], init: false });
  let S = Object.assign(fresh(), LP.lsGet(FK, {}) || {});
  const save = () => { LP.lsSet(FK, S); LP.emit('fun'); };

  /* ---------- Fenn : dessin dans js/fenn.js ---------- */
  const fenn = (mood, acc, size, label, o) => LP.fenn(mood, Object.assign({ acc, size, label, crop: 'bust' }, o));

  /* ---------- avatars, titres : déblocage ---------- */
  const AVATARS = [
    { id: 'fenn', n: 'Fenn', acc: '', bg: '#BFD6FF', u: () => true },
    { id: 'lunettes', n: 'Fenn studieux', acc: 'glasses', bg: '#CFE8D8', u: c => c.level >= 2, h: 'Atteins le niveau 2' },
    { id: 'foulard', n: 'Fenn au chaud', acc: 'scarf', bg: '#FAD1CB', u: c => c.level >= 3, h: 'Atteins le niveau 3' },
    { id: 'casquette', n: 'Fenn sportif', acc: 'cap', bg: '#CBD9F5', u: c => c.level >= 5, h: 'Atteins le niveau 5' },
    { id: 'casque', n: 'Fenn concentré', acc: 'phones', bg: '#E0D4F7', u: c => c.s.reviews >= 100, h: 'Révise 100 cartes' },
    { id: 'diplome', n: 'Fenn diplômé', acc: 'grad', bg: '#D5DCE8', u: c => c.mastered >= 10, h: 'Maîtrise 10 notions' },
    { id: 'etoile', n: 'Fenn étoilé', acc: 'star', bg: '#FBE6A8', u: c => c.s.best >= 7, h: 'Série de 7 jours' },
    { id: 'couronne', n: 'Fenn royal', acc: 'crown', bg: '#F7DDA0', u: c => c.level >= 12 || c.s.best >= 30, h: 'Niveau 12 ou série de 30 jours' },
    { id: 'ninja', n: 'Fenn ninja', acc: 'ninja', bg: '#C9CED8', chest: 1, h: 'À trouver dans un coffre' },
    { id: 'soleil', n: 'Fenn cool', acc: 'shades', bg: '#FFD9B0', chest: 1, h: 'À trouver dans un coffre' },
    { id: 'fete', n: 'Fenn en fête', acc: 'party', bg: '#F6C9E3', chest: 1, h: 'À trouver dans un coffre' }
  ];
  const TITLES = [
    { id: 'recrue', n: 'Recrue', u: () => true },
    { id: 'curieux', n: 'Curieux', u: c => c.s.quizRuns >= 1, h: 'Termine un quiz' },
    { id: 'assidu', n: 'Assidu', u: c => c.s.best >= 3, h: 'Série de 3 jours' },
    { id: 'eclair', n: 'Éclair', u: c => c.s.bestExp >= 10, h: '10 bonnes réponses en Express' },
    { id: 'survivant', n: 'Survivant', u: c => c.s.bestSurv >= 10, h: '10 bonnes réponses en Survie' },
    { id: 'trous', n: 'As des trous', u: c => c.s.cloze >= 30, h: '30 cartes à trous' },
    { id: 'sansfaute', n: 'Sans faute', u: c => c.s.perfect >= 1, h: 'Un quiz parfait' },
    { id: 'expert', n: 'Expert', u: c => c.mastered >= 50, h: 'Maîtrise 50 notions' },
    { id: 'nocturne', n: 'Oiseau de nuit', u: c => c.s.night >= 1, h: 'Révise après 23 h' },
    { id: 'legende', n: 'Légende', u: c => c.level >= 10, h: 'Atteins le niveau 10' },
    { id: 'chanceux', n: 'Chanceux', chest: 1, h: 'À trouver dans un coffre' },
    { id: 'ami', n: 'Ami des fennecs', chest: 1, h: 'À trouver dans un coffre' }
  ];
  const ctx = () => ({ level: LP.level().level, s: LP.stats(), mastered: LP.masteryBy().mastered });
  const has = (list, owned, it, c) => (it.chest ? owned.includes(it.id) : !!(it.u && it.u(c)) || owned.includes(it.id));
  const avatars = () => { const c = ctx(); return AVATARS.map(a => Object.assign({ open: has(AVATARS, S.ownedA, a, c) }, a)); };
  const titles = () => { const c = ctx(); return TITLES.map(t => Object.assign({ open: has(TITLES, S.ownedT, t, c) }, t)); };
  const curAvatar = () => { const a = avatars().find(x => x.id === S.avatar && x.open); return a || AVATARS[0]; };
  const curTitle = () => { const t = titles().find(x => x.id === S.title && x.open); return t || TITLES[0]; };
  const avatarHtml = (size, id) => {
    const a = id ? AVATARS.find(x => x.id === id) || AVATARS[0] : curAvatar();
    return `<span class="avatar fav" style="--fb:${a.bg}">${fenn('happy', a.acc, 100, 'Avatar : ' + a.n, { crop: 'head' })}</span>`;
  };

  /* ---------- annonces de nouveaux déblocages ---------- */
  function checkUnlocks() {
    const ids = [].concat(avatars().filter(a => a.open).map(a => 'a:' + a.id), titles().filter(t => t.open).map(t => 't:' + t.id));
    if (!S.init) { S.init = true; S.seen = ids; save(); return; }
    const news = ids.filter(i => !S.seen.includes(i));
    if (!news.length) return;
    S.seen = S.seen.concat(news); save();
    news.slice(0, 2).forEach(i => { const [k, id] = i.split(':'); const it = (k === 'a' ? AVATARS : TITLES).find(x => x.id === id); if (it && !it.chest) LP.toast((k === 'a' ? 'Nouvel avatar : ' : 'Nouveau titre : ') + it.n, 'xp', 3600); });
  }
  LP.on('progress', LP.debounce(() => { try { checkUnlocks(); } catch (e) {} }, 120));

  /* ---------- pseudo ---------- */
  const PSEUDO_RE = /^[\p{L}\p{N}][\p{L}\p{N} _.'’-]{1,19}$/u;
  const validPseudo = v => v === '' || PSEUDO_RE.test(String(v).trim());
  const name = () => {
    if (S.pseudo) return S.pseudo;
    const s = LP.auth && LP.auth.session && LP.auth.session();
    return s && s.displayName ? String(s.displayName).trim().split(/\s+/)[0] : '';
  };

  /* ---------- coffre de récompense ---------- */
  // Mission = objectif du jour atteint. Un coffre par jour ; le contenu est tiré à l'ouverture puis mémorisé.
  const chestToday = () => (S.chest && S.chest.date === LP.dkey() ? S.chest : null);
  const chestAvailable = () => LP.goal().pct >= 100 && !chestToday();
  function roll() {
    const n = LP.stats().chests || 0, r = Math.random();
    const pool = AVATARS.filter(a => a.chest && !S.ownedA.includes(a.id)).map(a => ({ t: 'avatar', it: a })).concat(TITLES.filter(t => t.chest && !S.ownedT.includes(t.id)).map(t => ({ t: 'titre', it: t })));
    if (pool.length && ((n + 1) % 5 === 0 || r < 0.1)) { const p = pool[Math.floor(Math.random() * pool.length)]; return { kind: 'item', type: p.t, id: p.it.id, name: p.it.n }; }
    const xp = r < 0.75 ? 15 + Math.floor(Math.random() * 26) : 40 + Math.floor(Math.random() * 41);
    return { kind: 'xp', xp };
  }
  function openChest() {
    const done = chestToday(); if (done) return done;
    if (!chestAvailable()) return null;
    const reward = roll();
    S.chest = { date: LP.dkey(), reward };
    if (reward.kind === 'item') (reward.type === 'avatar' ? S.ownedA : S.ownedT).push(reward.id);
    save();
    LP.bump('chests');
    if (reward.kind === 'xp') LP.award(reward.xp);
    return S.chest;
  }
  const chestSvg = open => `<svg class="chest-svg${open ? ' open' : ''}" width="110" height="96" viewBox="0 0 110 96" aria-hidden="true"><rect x="10" y="40" width="90" height="48" rx="8" fill="#B9773A"/><rect x="10" y="40" width="90" height="14" fill="#9A5F2B"/><path d="M10 40q0-26 45-26t45 26z" fill="#D18A45" class="lid"/><rect x="50" y="46" width="10" height="16" rx="3" fill="#F2C230" stroke="#C9971B" stroke-width="1.5"/><path d="M10 64h90" stroke="#9A5F2B" stroke-width="3"/></svg>`;
  const rewardHtml = ch => {
    const r = ch.reward;
    if (r.kind === 'xp') return `<div class="chest-win"><b>+${r.xp} XP</b><p class="muted-p">Un joli bonus pour ta mission du jour.</p></div>`;
    const it = (r.type === 'avatar' ? AVATARS : TITLES).find(x => x.id === r.id);
    return `<div class="chest-win">${r.type === 'avatar' ? avatarHtml(80, r.id) : ''}<b>${r.type === 'avatar' ? 'Nouvel avatar' : 'Nouveau titre'} : ${esc(it ? it.n : r.name)}</b><p class="muted-p">Retrouve-le dans Profil, « Mon personnage ».</p></div>`;
  };
  A['fn-chest'] = async () => {
    const reduce = document.documentElement.dataset.motion === 'reduce';
    const ch = openChest(); if (!ch) { LP.toast('Atteins ton objectif du jour pour gagner un coffre.', 'info'); return; }
    document.querySelectorAll('.chest-cta').forEach(e => e.remove());
    await LP.dialog({
      title: 'Coffre de récompense', hideCancel: true, ok: 'Super !',
      body: `<div class="chest-stage" aria-live="polite"><div class="chest-box ${reduce ? '' : 'shake'}">${chestSvg(reduce)}</div><p class="muted-p">${reduce ? '' : 'Ouverture…'}</p></div>`,
      onMount: modal => {
        const reveal = () => { const st = modal.querySelector('.chest-stage'); if (!st) return; st.innerHTML = `<div class="chest-box">${chestSvg(true)}</div>${rewardHtml(ch)}`; if (!reduce) LP.confetti(); };
        reduce ? reveal() : setTimeout(reveal, 1100);
      }
    });
    const v = document.querySelector('#view');
    if (v && (!location.hash || location.hash === '#/') && LP.views && LP.views.home) LP.views.home(v);
    if (v && /^#\/profile/.test(location.hash) && LP.views && LP.views.profile) LP.views.profile(v);
  };

  /* ---------- bloc affiché en fin de session (quiz et révision) ---------- */
  function resultExtras(info) {
    const pct = info ? info.pct : null;
    const mood = pct == null ? 'happy' : pct >= 90 ? 'cheer' : pct >= 60 ? 'proud' : pct >= 30 ? 'happy' : 'think';
    const msg = pct == null ? 'Chaque erreur est une notion de plus à retenir.' : pct >= 90 ? 'Incroyable, tu m\'impressionnes !' : pct >= 60 ? 'Très bien joué, on continue ?' : pct >= 30 ? 'Pas mal ! Les erreurs reviendront en révision.' : 'Ça viendra. Refais tes erreurs et tu verras la différence.';
    const chest = chestAvailable();
    return `<div class="fenn-res">${fenn(mood, curAvatar().acc, 84, '', { anim: true })}<p>${esc(msg)}</p></div>${chest ? `<div class="chest-cta">${chestSvg(false)}<div><b>Mission accomplie !</b><small>Ton objectif du jour est atteint : un coffre t'attend.</small></div><button class="btn primary" data-act="fn-chest">Ouvrir le coffre</button></div>` : ''}`;
  }

  /* ---------- carte Fenn de l'accueil ---------- */
  function homeCard(first) {
    const si = LP.streakInfo(), g = LP.goal(), h = new Date().getHours(), nm = name();
    let mood = 'happy', msg;
    if (first) msg = 'Salut' + (nm ? ' ' + nm : '') + ' ! Moi c\'est Fenn, je t\'accompagne dans tes révisions.';
    else if (si.atRisk) { mood = 'sad'; msg = 'Ta série de ' + si.n + ' ' + (si.n > 1 ? 'jours est' : 'jour est') + ' en danger… Une petite session suffit.'; }
    else if (g.pct >= 100) { mood = 'cheer'; msg = chestAvailable() ? 'Objectif atteint, bravo ! Un coffre t\'attend.' : 'Objectif du jour atteint, bravo !'; }
    else if (h >= 23 || h < 5) { mood = 'sleepy'; msg = 'Il est tard… une petite session et au lit ?'; }
    else {
      const tips = ['Mieux vaut un peu chaque jour qu\'une grosse séance la veille.', 'Une erreur, c\'est une notion qui va enfin rester.', 'Essaie le mode Survie : trois vies, combien tiendras-tu ?', 'Les cartes à trous sont parfaites pour retenir les mots-clés.'];
      msg = tips[Math.floor(Date.now() / 864e5) % tips.length]; mood = 'think';
      if (g.done > 0) { mood = 'proud'; msg = g.done + ' ' + (g.done > 1 ? 'actions' : 'action') + ' aujourd\'hui, continue comme ça !'; }
    }
    return `<div class="fenn-card">${fenn(mood, curAvatar().acc, 84, '', { anim: true })}<div><p class="fenn-msg">${esc(msg)}</p>${chestAvailable() ? `<button class="btn primary sm" data-act="fn-chest">Ouvrir mon coffre</button>` : ''}</div></div>`;
  }

  /* ---------- profil : « Mon personnage » ---------- */
  function profileCard() {
    const av = avatars(), ti = titles(), a = curAvatar(), t = curTitle();
    const nOpen = av.filter(x => x.open).length + ti.filter(x => x.open).length;
    return `<section class="card fn-card"><div class="fn-me">${avatarHtml(96)}<div style="flex:1;min-width:160px"><h2>${esc(name() || 'Choisis ton pseudo')}</h2><p class="muted"><span class="fn-title">${esc(t.n)}</span> · ${esc(a.n)}</p><p class="muted" style="font-size:.8125rem;margin-top:4px">${nOpen} / ${av.length + ti.length} déblocages · pseudo et avatar restent sur cet appareil</p><button class="btn ghost sm" style="margin-top:6px" data-act="tr-replay">Revoir la visite avec Fenn</button></div><button class="btn soft" data-act="fn-edit">${ic('edit', 15)} Personnaliser</button></div></section>`;
  }
  A['fn-edit'] = async () => {
    const av = avatars(), ti = titles(), cur = curAvatar().id;
    const body = `<div class="field"><label for="fn-pseudo">Pseudo (2 à 20 caractères)</label><input id="fn-pseudo" class="input" maxlength="20" autocomplete="off" value="${esc(S.pseudo)}" placeholder="${esc(name() || 'Ton pseudo')}"></div>
      <div class="field"><label>Avatar</label><div class="fn-grid" role="radiogroup" aria-label="Avatar">${av.map(a => `<button type="button" class="fn-av${a.id === cur ? ' on' : ''}${a.open ? '' : ' lock'}" role="radio" aria-checked="${a.id === cur}" data-av="${a.id}" ${a.open ? '' : 'disabled'} title="${esc(a.open ? a.n : a.n + ' : ' + a.h)}"><span class="avatar fav" style="--fb:${a.bg}">${fenn('happy', a.acc, 100, a.n, { crop: 'head' })}</span><b>${esc(a.n)}</b><small>${a.open ? '&nbsp;' : esc(a.h)}</small></button>`).join('')}</div></div>
      <div class="field"><label for="fn-title">Titre</label><select id="fn-title" class="input">${ti.map(t => `<option value="${t.id}" ${t.id === curTitle().id ? 'selected' : ''} ${t.open ? '' : 'disabled'}>${esc(t.open ? t.n : t.n + ' (verrouillé : ' + t.h + ')')}</option>`).join('')}</select></div>`;
    const r = await LP.dialog({
      title: 'Mon personnage', ok: 'Enregistrer', wide: true, body,
      onMount: m => { m.addEventListener('click', e => { const b = e.target.closest('.fn-av'); if (!b || b.disabled) return; m.querySelectorAll('.fn-av').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); }); },
      collect: m => {
        const pseudo = m.querySelector('#fn-pseudo').value.trim();
        if (!validPseudo(pseudo)) { LP.toast('Pseudo invalide : 2 à 20 lettres, chiffres, espaces, . _ - \'', 'err'); return false; }
        const on = m.querySelector('.fn-av.on');
        return { pseudo, avatar: on ? on.dataset.av : cur, title: m.querySelector('#fn-title').value };
      }
    });
    if (!r) return;
    S.pseudo = r.pseudo; S.avatar = r.avatar; S.title = r.title; save();
    LP.toast('Personnage enregistré', 'ok');
    const v = document.querySelector('#view'); if (v && LP.views && LP.views.profile) LP.views.profile(v);
  };

  /* ---------- sauvegarde / restauration / remise à zéro ---------- */
  const dump = () => ({ pseudo: S.pseudo, avatar: S.avatar, title: S.title, ownedA: S.ownedA.slice(), ownedT: S.ownedT.slice() });
  const restore = o => {
    if (!o || typeof o !== 'object') return;
    if (typeof o.pseudo === 'string' && validPseudo(o.pseudo)) S.pseudo = o.pseudo.trim();
    const okA = new Set(AVATARS.map(a => a.id)), okT = new Set(TITLES.map(t => t.id));
    (o.ownedA || []).forEach(i => { if (okA.has(i) && !S.ownedA.includes(i)) S.ownedA.push(i); });
    (o.ownedT || []).forEach(i => { if (okT.has(i) && !S.ownedT.includes(i)) S.ownedT.push(i); });
    if (okA.has(o.avatar)) S.avatar = o.avatar; if (okT.has(o.title)) S.title = o.title;
    save();
  };
  const reset = () => { const p = S.pseudo; S = Object.assign(fresh(), { pseudo: p }); save(); };

  LP.fun = { fenn, setPseudo: v => { if (!validPseudo(v)) return false; S.pseudo = String(v).trim(); save(); return true; }, chestSvg, avatar: avatarHtml, name, pseudo: () => S.pseudo, title: () => curTitle().n, avatars, titles, validPseudo, homeCard, profileCard, resultExtras, dump, restore, reset, checkUnlocks, chest: { available: chestAvailable, today: chestToday, open: openChest } };
  try { checkUnlocks(); } catch (e) {}
})();
