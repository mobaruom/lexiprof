/* LexiProf — visite guidée (Fenn), écran de chargement, couleurs des matières */
(function () {
  'use strict';
  const LP = window.LP, A = LP.actions, esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TK = 'lexiprof_tour';
  const seen = () => { try { return localStorage.getItem(TK) === '1'; } catch (e) { return true; } };
  const mark = () => { try { localStorage.setItem(TK, '1'); } catch (e) {} };
  const reduced = () => document.documentElement.dataset.motion === 'reduce' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- écran de chargement ---------- */
  const boot = document.getElementById('boot');
  if (boot && LP.fenn) boot.innerHTML = `<div class="bootbox">${LP.fenn('wave', { size: 150, crop: 'full', anim: true, label: 'Fenn te dit bonjour' })}<b class="bootname">LexiProf</b><div class="bootbar" aria-hidden="true"><i></i></div><small>Chargement…</small></div>`;
  LP.bootT0 = Date.now();
  LP.hideBoot = () => {
    const b = document.getElementById('boot'); if (!b) return;
    const wait = Math.max(0, 650 - (Date.now() - LP.bootT0));
    setTimeout(() => { b.classList.add('off'); setTimeout(() => b.remove(), 600); }, wait);
  };

  /* ---------- visite guidée ---------- */
  const goal = () => LP.prefs.get().dailyGoal;
  const STEPS = [
    { mood: 'wave', say: () => 'Salut ! Moi, c\'est Fenn. Je vais t\'aider à réviser sans te prendre la tête.', body: () => '' },
    { mood: 'happy', say: () => 'Comment je t\'appelle ?', body: () => `<input id="tr-pseudo" class="input tr-input" maxlength="20" autocomplete="nickname" placeholder="Ton pseudo (facultatif)" value="${esc(LP.fun.pseudo() || '')}" aria-label="Ton pseudo"><small class="muted">Il reste sur cet appareil. Tu pourras le changer dans ton profil.</small>`,
      next() { const el = document.getElementById('tr-pseudo'), v = el ? el.value.trim() : ''; if (v && !LP.fun.setPseudo(v)) { LP.toast('Pseudo invalide : 2 à 20 lettres, chiffres, espaces, . _ - \'', 'err'); return false; } return true; } },
    { mood: 'think', say: () => 'Quel rythme te convient ?', body: () => `<div class="tr-choices" role="radiogroup" aria-label="Objectif quotidien">${[[5, 'Tranquille'], [15, 'Régulier'], [25, 'Motivé'], [40, 'À fond']].map(([v, t]) => `<button type="button" class="tr-ch${goal() === v ? ' on' : ''}" role="radio" aria-checked="${goal() === v}" data-act="tr-goal" data-v="${v}"><b>${v}</b><span>actions / jour</span><small>${t}</small></button>`).join('')}</div>` },
    { mood: 'proud', say: () => 'Voilà comment on révise ensemble.', body: () => `<ul class="tr-list"><li><b>Fiches</b><span>Les définitions clés, avec exemple et astuce.</span></li><li><b>Quiz</b><span>Classique, express 3 min, survie ou à trous.</span></li><li><b>Révision espacée</b><span>Je te ressors les notions juste avant que tu les oublies.</span></li><li><b>Mes erreurs</b><span>Refais seulement ce que tu as raté.</span></li></ul>` },
    { mood: 'cheer', say: () => `Atteins ${goal()} actions dans la journée : un coffre t'attend !`, body: () => `<div class="tr-chest">${LP.fun.chestSvg ? LP.fun.chestSvg(false) : ''}<p>Un coffre par jour : titres, avatars, badges rares… Reviens chaque jour pour garder ta série.</p></div>` },
    { mood: 'celebrate', say: () => 'C\'est parti !', body: () => '<p class="tr-final">Tu es prêt. Je reste dans ton profil si tu veux revoir cette visite.</p>' }
  ];
  let st = null;
  const render = () => {
    const s = STEPS[st.i], last = st.i === STEPS.length - 1, pct = Math.round(st.i / (STEPS.length - 1) * 100);
    const m = s.mood === 'celebrate' ? 'cheer' : s.mood;
    st.root.innerHTML = `<div class="tr-top"><div class="tr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${STEPS.length}" aria-valuenow="${st.i + 1}" aria-label="Étape ${st.i + 1} sur ${STEPS.length}"><i style="width:${Math.max(6, pct)}%"></i></div><button class="tr-skip" data-act="tr-skip">Passer</button></div>
      <div class="tr-stage" key="${st.i}"><div class="tr-fenn">${LP.fenn(m, { size: 190, crop: 'full', anim: true, label: 'Fenn' })}</div>
        <div class="tr-side"><div class="tr-bubble" role="status"><p>${esc(s.say())}</p></div><div class="tr-body">${s.body()}</div></div></div>
      <div class="tr-foot">${st.i ? '<button class="btn ghost lg" data-act="tr-back">Retour</button>' : '<span></span>'}<button class="btn primary lg tr-next" data-act="tr-next">${last ? 'Commencer' : 'Continuer'}</button></div>`;
    const inp = st.root.querySelector('input'); if (inp && st.i === 1) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 60);
    else { const n = st.root.querySelector('.tr-next'); n && n.focus({ preventScroll: true }); }
  };
  const close = () => {
    if (!st) return; mark(); st.root.classList.add('off');
    const r = st.root, prev = st.prev; st = null;
    setTimeout(() => { r.remove(); document.body.classList.remove('tour-open'); try { prev && prev.focus && prev.focus(); } catch (e) {} }, reduced() ? 0 : 260);
    LP.emit('fun');
  };
  LP.tour = {
    seen,
    start() {
      if (st) return; const r = document.createElement('div');
      r.id = 'tour'; r.className = 'tour'; r.setAttribute('role', 'dialog'); r.setAttribute('aria-modal', 'true'); r.setAttribute('aria-label', 'Visite guidée de LexiProf');
      document.body.appendChild(r); document.body.classList.add('tour-open');
      st = { i: 0, root: r, prev: document.activeElement }; render();
    },
    maybeStart() { if (!seen() && !st) this.start(); },
    reset() { try { localStorage.removeItem(TK); } catch (e) {} }
  };
  A['tr-next'] = () => {
    if (!st) return; const s = STEPS[st.i]; if (s.next && s.next() === false) return;
    if (st.i >= STEPS.length - 1) { close(); LP.confetti && !reduced() && LP.confetti(); return; }
    st.i++; render();
  };
  A['tr-back'] = () => { if (st && st.i) { st.i--; render(); } };
  A['tr-skip'] = () => close();
  A['tr-goal'] = el => { LP.prefs.set({ dailyGoal: Number(el.dataset.v) }); if (st) { const i = st.i; render(); st.i = i; } };
  A['tr-replay'] = () => LP.tour.start();
  document.addEventListener('keydown', e => {
    if (!st) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) { e.preventDefault(); A['tr-next'](); }
    else if (e.key === 'Tab') { const f = [...st.root.querySelectorAll('button,input')].filter(x => !x.disabled); if (!f.length) return; const a = f[0], b = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } else if (!st.root.contains(document.activeElement)) { e.preventDefault(); a.focus(); } }
  });

  /* ---------- couleurs des matières ---------- */
  const KNOWN = new Set(LP.SUBJECTS);
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  LP.subjectColor = s => KNOWN.has(s) ? `var(--${{ Management: 'mgt', Droit: 'drt', 'Économie': 'eco', RH: 'rh' }[s]})` : `hsl(${hue(s)} 62% ${document.documentElement.dataset.theme === 'dark' ? 68 : 40}%)`;
  const paint = () => document.querySelectorAll('[data-m]').forEach(el => { const m = el.dataset.m; if (m && !KNOWN.has(m) && el.style.getPropertyValue('--c') === '') el.style.setProperty('--c', LP.subjectColor(m)); });
  const view = document.getElementById('view') || document.body; let t = 0;
  try { new MutationObserver(() => { clearTimeout(t); t = setTimeout(paint, 40); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
