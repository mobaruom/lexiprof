/* ============================================================
   LexiProf — coach.js : « Coach de réussite » (page #/coach)
   Score de préparation, compte à rebours, projection au jour J, plan sur 7 jours, points faibles.
   Tout est calculé sur les données réelles de l'élève, dans son navigateur. Rien n'est envoyé.
   Le détail Premium (plan 7 jours, points faibles) est un aperçu : essai de 7 jours, puis verrouillé.
   Les estimations reposent sur un modèle simple et annoncé comme tel (pas une prédiction de note).
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, esc = LP.esc, ic = LP.ic, A = LP.actions, V = LP.views;
  const DAY = 864e5;
  const W_READY = { mastered: 1, review: 0.7, learning: 0.35, new: 0 };   // poids d'une notion dans le score
  const W_WORK = { new: 4, learning: 3, review: 1.5, mastered: 0 };       // révisions restantes estimées avant « maîtrisée »
  const SEC_PER_CARD = 25;

  const startOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  LP.coach = {
    W_READY, W_WORK,
    examDays() { const v = LP.prefs.get().examDate; if (!v) return null; const t = Date.parse(v + 'T00:00:00'); if (isNaN(t)) return null; const n = Math.round((t - startOf(Date.now())) / DAY); return n >= 0 ? n : null; },
    rate14() { const a = LP.activity(); let s = 0; for (let i = 0; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() - i); const x = a[LP.dkey(d)]; if (x) s += x.rv || 0; } return s / 14; },
    compute() {
      const defs = LP.defs, total = defs.length, cnt = { new: 0, learning: 0, review: 0, mastered: 0 };
      const bySub = {}; LP.SUBJECTS.forEach(m => (bySub[m] = { total: 0, score: 0, work: 0 }));
      let score = 0, work = 0;
      defs.forEach(d => { const s = LP.status(d.id); cnt[s]++; score += W_READY[s]; work += W_WORK[s]; const b = bySub[d.matiere]; if (b) { b.total++; b.score += W_READY[s]; b.work += W_WORK[s]; } });
      const ready = total ? score / total : 0, D = this.examDays(), rate = this.rate14();
      const needed = D != null && D > 0 ? work / D : null;
      const frac = needed ? Math.min(1, rate / needed) : (work === 0 ? 1 : 0);
      const projected = ready + (1 - ready) * frac;
      const subs = LP.SUBJECTS.map(m => ({ m, total: bySub[m].total, ready: bySub[m].total ? bySub[m].score / bySub[m].total : 0, work: bySub[m].work })).filter(x => x.total);
      return { total, cnt, ready, work, D, rate, needed, projected, subs };
    },
    // Plan des 7 prochains jours : charge répartie jusqu'à l'examen, matière la plus fragile en tête
    plan(c) {
      const order = c.subs.slice().sort((a, b) => a.ready - b.ready), base = c.needed != null ? Math.ceil(c.needed) : LP.prefs.get().dailyGoal, out = [];
      for (let k = 0; k < 7; k++) {
        if (c.D != null && k > c.D) break;
        const d = new Date(); d.setDate(d.getDate() + k);
        const cards = Math.max(5, Math.min(80, base)), focus = order.length ? order[k % order.length].m : '';
        out.push({ date: d, cards, focus, min: Math.max(1, Math.round(cards * SEC_PER_CARD / 60)) });
      }
      return out;
    }
  };

  const pct = x => Math.round(x * 100);
  const reduce = () => LP.prefs.get().reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const unlocked = () => LP.plans.unlocked('coach') || (LP.admin && LP.admin.unlocked && LP.admin.unlocked());

  function chart(c) {
    if (c.D == null || c.D < 1 || c.work === 0) return '';
    const w = 600, h = 190, px = 34, py = 18, n = Math.min(c.D, 120), X = t => px + (t / n) * (w - 2 * px), Y = v => h - py - v * (h - 2 * py);
    const pts = f => Array.from({ length: n + 1 }, (_, t) => X(t).toFixed(1) + ',' + Y(f(t)).toFixed(1)).join(' ');
    const now = t => c.ready + (1 - c.ready) * Math.min(1, (c.rate * t * (c.D / n)) / c.work), plan = t => c.ready + (1 - c.ready) * (t / n);
    return `<svg class="co-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Projection de ton score de préparation jusqu'au jour J : à ton rythme actuel ${pct(c.projected)} %, rythme minimum pour tout maîtriser : 100 % au jour J.">
      ${[0, .5, 1].map(v => `<line x1="${px}" x2="${w - px}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${px - 6}" y="${Y(v) + 4}" text-anchor="end" class="ax">${pct(v)}</text>`).join('')}
      <polyline points="${pts(plan)}" class="l-plan"/><polyline points="${pts(now)}" class="l-now"/>
      <circle cx="${X(0)}" cy="${Y(c.ready)}" r="5" class="dot-now"/><circle cx="${X(n)}" cy="${Y(now(n))}" r="5" class="dot-now"/><circle cx="${X(n)}" cy="${Y(1)}" r="5" class="dot-plan"/>
      <text x="${px}" y="${h - 2}" class="ax">Aujourd'hui</text><text x="${w - px}" y="${h - 2}" text-anchor="end" class="ax">Jour J</text></svg>`;
  }
  const lockBox = (inner, what) => unlocked() ? inner : `<div class="locked-wrap"><div class="blur" aria-hidden="true">${inner}</div><div class="lock-over"><div class="lock-card"><span class="lk">${ic('lock', 20)}</span><b>${esc(what)}</b>${LP.plans.trial.used() ? `<p class="muted">Ton essai gratuit est terminé. Premium n'est pas encore ouvert : dis-nous que ça t'intéresse, on te prévient au lancement.</p><div class="lk-btns"><button class="btn primary" data-act="co-interest">${ic('star', 16)} ${LP.plans.interest.has() ? 'Intérêt noté, merci !' : 'Je veux Premium au lancement'}</button><a class="btn ghost" href="#/plans">Voir les offres</a></div>` : `<p class="muted">Débloque-le <b>7 jours gratuitement</b>, sans carte bancaire, sans compte.</p><button class="btn primary" data-act="co-trial">${ic('sparkles', 16)} Essayer 7 jours</button>`}</div></div></div>`;

  V.coach = root => {
    const c = LP.coach.compute(), D = c.D, P = LP.plans, tr = P.trial, due = LP.srs.queue().cards.length;
    const msg = D == null ? '' : c.work === 0 ? 'Tout est maîtrisé : continue d\'entretenir.' : c.rate >= c.needed ? `À ton rythme (${c.rate.toFixed(1).replace('.', ',')} cartes/jour), tu es dans les temps.` : `Il faut <b>${Math.ceil(c.needed)} cartes/jour</b> pour tout maîtriser. Tu en fais ${c.rate.toFixed(1).replace('.', ',')} en moyenne.`;
    const plan = LP.coach.plan(c), weak = LP.srs.weak(5);
    root.innerHTML = `
    <div class="page-head"><div><h1>Coach de réussite</h1><p>Ton score de préparation, ton plan et tes points faibles, calculés sur tes vraies données.</p></div>${unlocked() ? '' : '<span class="tag">Aperçu Premium</span>'}</div>
    ${tr.active() ? `<div class="notice" style="margin-bottom:14px">${ic('sparkles')}<div><b>Essai Premium actif</b> : encore ${tr.daysLeft()} jour${tr.daysLeft() > 1 ? 's' : ''}. Premium n'est pas encore en vente : rien ne te sera débité.</div></div>` : ''}
    ${D == null ? `<section class="card co-date"><h3>${ic('target', 18)} Quand est ton examen ?</h3><p class="muted">Indique la date pour obtenir ton compte à rebours, ta charge de travail et ton plan.</p>
        <div class="co-date-row"><input type="date" class="input" id="co-date" min="${LP.dkey()}" aria-label="Date de l'examen"><button class="btn primary" data-act="co-setdate">Valider</button></div>
        <div class="chips" style="margin-top:12px">${[30, 60, 90, 180].map(n => `<button class="chip" data-act="co-quick" data-n="${n}">Dans ${n} jours</button>`).join('')}</div></section>` : ''}
    <section class="card co-hero">
      <div class="co-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" id="co-fg" stroke-dasharray="326.7" stroke-dashoffset="326.7"/></svg><div class="mid"><b id="co-num" data-v="${pct(c.ready)}">0</b><small>% prêt(e)</small></div></div>
      <div class="co-hero-t">
        <h2>${D != null ? `<span class="co-j">J-${D}</span> avant ton examen` : 'Ton score de préparation'}</h2>
        <p>${c.cnt.mastered} notion${c.cnt.mastered > 1 ? 's' : ''} maîtrisée${c.cnt.mastered > 1 ? 's' : ''} sur ${c.total} · ${c.cnt.learning + c.cnt.review} en cours · ${c.cnt.new} à découvrir</p>
        ${msg ? `<p class="co-msg">${msg}</p>` : ''}
        ${D != null && c.work > 0 ? `<p class="co-proj">À ton rythme actuel, tu seras prêt(e) à environ <b>${pct(c.projected)} %</b> le jour J.</p>` : ''}
        <div class="co-cta">${due ? `<a class="btn primary lg" href="#/review">${ic('cards', 16)} Ma séance du jour · ${due} carte${due > 1 ? 's' : ''}</a>` : `<a class="btn primary lg" href="#/quiz">${ic('zap', 16)} Tout est à jour : lance un quiz</a>`}${D != null ? `<button class="btn ghost" data-act="co-cleardate">Changer la date</button>` : ''}</div>
      </div></section>
    ${chart(c) ? `<section class="card"><div class="card-head"><h3>${ic('chart', 18)} Projection jusqu'au jour J</h3><div class="co-leg"><span class="k-now"></span>Ton rythme actuel<span class="k-plan"></span>Rythme minimum pour tout maîtriser</div></div>${chart(c)}
      <details class="co-how"><summary>Comment c'est calculé ?</summary><p class="muted">Score = moyenne pondérée de tes notions (maîtrisée 100 %, consolidation 70 %, en cours 35 %, nouvelle 0 %). On estime qu'il faut encore environ 4 révisions pour une notion nouvelle, 3 en cours, 1,5 en consolidation. La projection compare ton rythme des 14 derniers jours à la charge restante. C'est une <b>estimation simple</b>, pas une prédiction de ta note.</p></details></section>` : ''}
    <section class="card"><div class="card-head"><h3>${ic('book', 18)} Par matière</h3></div>
      ${c.subs.map(s => `<div class="co-bar" data-m="${esc(s.m)}"><span>${esc(s.m)}</span><div class="bar"><i style="--w:${pct(s.ready)}%"></i></div><b>${pct(s.ready)} %</b></div>`).join('')}</section>
    <section class="card"><div class="card-head"><h3>${ic('clock', 18)} Ton plan des 7 prochains jours</h3></div>
      ${lockBox(`<ol class="co-plan">${plan.map((p, k) => `<li class="${k === 0 ? 'today' : ''}"><div class="d"><b>${k === 0 ? 'Aujourd\'hui' : p.date.toLocaleDateString('fr-FR', { weekday: 'long' })}</b><small>${p.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</small></div><div class="t"><b>${p.cards} cartes</b><small>≈ ${p.min} min${p.focus ? ' · priorité : ' + esc(p.focus) : ''}${c.needed != null && c.rate >= c.needed * 1.5 ? ' · tu es en avance, ça suffit pour entretenir' : ''}</small></div></li>`).join('')}</ol>`, 'Le plan détaillé jour par jour')}</section>
    <section class="card"><div class="card-head"><h3>${ic('flag', 18)} Tes points faibles</h3></div>
      ${lockBox(weak.length ? `<div class="list">${weak.map(w => `<div class="li" data-m="${esc(w.d.matiere)}"><span class="dotc"></span><div><b>${esc(w.d.term)}</b><small>ratée ${w.s.l} fois · ${esc(w.d.matiere)}</small></div></div>`).join('')}</div>` : '<p class="muted" style="padding:8px 0">Aucun point faible pour l\'instant : fais quelques révisions et quiz, ils apparaîtront ici.</p>', 'Tes notions les plus difficiles')}</section>`;
    const fg = $('#co-fg'), num = $('#co-num');
    if (fg && num) {
      const target = Number(num.dataset.v);
      if (reduce()) { fg.style.strokeDashoffset = 326.7 * (1 - target / 100); num.textContent = target; }
      else { requestAnimationFrame(() => { fg.style.strokeDashoffset = 326.7 * (1 - target / 100); }); const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 1000); num.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1 && num.isConnected) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    }
  };
  A['co-setdate'] = () => { const v = ($('#co-date') || {}).value; if (!v) return LP.toast('Choisis une date', 'err'); LP.prefs.set({ examDate: v }); V.coach(LP.$('#view')); };
  A['co-quick'] = el => { const d = new Date(); d.setDate(d.getDate() + Number(el.dataset.n)); LP.prefs.set({ examDate: LP.dkey(d) }); V.coach(LP.$('#view')); };
  A['co-cleardate'] = () => { LP.prefs.set({ examDate: '' }); V.coach(LP.$('#view')); };
  A['co-trial'] = () => { if (LP.plans.trial.start()) { LP.confetti(); LP.toast('Essai de 7 jours activé', 'ok'); } V.coach(LP.$('#view')); };
  A['co-interest'] = async () => { await LP.plans.interest.register('coach'); LP.toast('Merci, c\'est noté !', 'ok'); V.coach(LP.$('#view')); };
})();
