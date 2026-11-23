/* ============================================================
   LexiProf 2.0 — userpages.js : export PDF étudiant + page Offres (côté étudiant)
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, esc = LP.esc, ic = LP.ic, A = LP.actions, V = LP.views;
  const fd = ts => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const build = async (doc, name) => {
    const bytes = await LP.pdf.build(doc), url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), l = document.createElement('a');
    l.href = url; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  LP.userReport = async () => {
    const s = LP.auth.session(), st = LP.stats(), lv = LP.level(), si = LP.streakInfo(), p = LP.prefs.get(), c = LP.consent ? LP.consent.get() : {}, act = LP.activity();
    const days = Object.keys(act).filter(k => act[k].rv + act[k].qz > 0).length;
    const state = d => LP.STATUS_LABEL[LP.status(d.id)];
    const weak = LP.srs.weak(15), favs = LP.defs.filter(d => LP.favs.has(d.id));
    const sections = [
      { title: 'Ma progression', intro: 'Ces données sont calculées à partir de ce qui est enregistré sur TON appareil. Elles ne sont pas envoyées au serveur.', kpis: [['Niveau', lv.level], ['XP', lv.xp], ['Série en cours', si.n + ' j'], ['Record', Math.max(st.best || 0, si.n) + ' j'], ['Cartes révisées', st.reviews], ['Quiz terminés', st.quizRuns], ['Réussite quiz', st.quiz ? Math.round(st.correct / st.quiz * 100) + ' %' : '—'], ['Jours actifs', days]] },
      { title: 'Maîtrise par matière', columns: [{ h: 'Matière', w: 3 }, { h: 'Notions', w: 1, align: 'right' }, { h: 'Maîtrisées', w: 1.2, align: 'right' }, { h: 'Part', w: 1, align: 'right' }], rows: LP.SUBJECTS.map(m => { const x = LP.masteryBy(m); return [m, x.total, x.mastered, (x.total ? Math.round(x.mastered / x.total * 100) : 0) + ' %']; }) },
      { title: 'Notions à retravailler', intro: 'Celles que tu as le plus oubliées.', columns: [{ h: 'Notion', w: 2.5 }, { h: 'Matière', w: 1.3 }, { h: 'Oublis', w: .8, align: 'right' }, { h: 'Prochaine révision', w: 1.6 }], rows: weak.map(w => [w.d.term, w.d.matiere, w.s.l, LP.fmtDue(w.s.d)]) },
      { title: 'Mes favoris', columns: [{ h: 'Notion', w: 2.5 }, { h: 'Matière', w: 1.3 }, { h: 'Statut', w: 1.5 }], rows: favs.map(d => [d.term, d.matiere, state(d)]) },
      { title: 'Données stockées sur mon appareil', intro: 'Aucune donnée personnelle n’est envoyée au serveur sans ton action volontaire (proposition, signalement) ou ton accord (statistiques anonymes).', columns: [{ h: 'Donnée', w: 3 }, { h: 'Valeur', w: 3 }], rows: [
        ['Compte', s ? s.displayName + ' · ' + s.email : 'Aucun compte'], ['Thème / couleur / taille du texte', p.theme + ' / ' + p.accent + ' / ' + p.fontSize + ' %'], ['Objectif quotidien', p.dailyGoal + ' actions'],
        ['Statistiques anonymes', c.analytics ? 'Acceptées' : 'Refusées ou non choisies'], ['Polices Google', c.fonts ? 'Acceptées' : 'Refusées ou non choisies'], ['Cartes suivies en révision', Object.keys(LP.exportAll().srs || {}).length], ['Propositions envoyées', LP.sent.list().length]] }
    ];
    await build({ title: 'Mon rapport LexiProf', subtitle: (s ? s.displayName + ' · ' : '') + 'généré le ' + new Date().toLocaleString('fr-FR'), footer: 'LexiProf · données personnelles — ne pas partager sans nécessité', sections }, 'lexiprof-mon-rapport-' + LP.dkey() + '.pdf');
  };
  LP.favSheets = async () => {
    const favs = LP.defs.filter(d => LP.favs.has(d.id)).sort((a, b) => a.matiere.localeCompare(b.matiere, 'fr') || a.term.localeCompare(b.term, 'fr'));
    if (!favs.length) return LP.toast('Ajoute d’abord des favoris (étoile sur une fiche).', 'info');
    await build({ title: 'Mes fiches de révision', subtitle: favs.length + ' notion(s) · LexiProf · ' + fd(Date.now()), footer: 'LexiProf — définitions issues de la bibliothèque LexiProf, à compléter avec ton cours', sections: LP.SUBJECTS.map(m => ({ m, l: favs.filter(d => d.matiere === m) })).filter(x => x.l.length).map(x => ({ title: x.m, columns: [{ h: 'Notion', w: 2 }, { h: 'Définition', w: 5 }, { h: 'Exemple / À retenir', w: 4 }], rows: x.l.map(d => [d.term, d.def, [d.example && 'Ex. : ' + d.example, d.remember && 'À retenir : ' + d.remember].filter(Boolean).join('\n') || '—']) })) }, 'lexiprof-mes-fiches-' + LP.dkey() + '.pdf');
  };
  const run = fn => async el => { if (el.disabled) return; el.disabled = true; try { await fn(); LP.toast('PDF généré', 'ok'); } catch (e) { LP.toast('Échec du PDF : ' + e.message, 'err'); } el.disabled = false; };
  A['pf-pdf'] = run(() => LP.userReport()); A['pf-pdf-favs'] = el => LP.favSheets().catch(e => LP.toast('Échec du PDF : ' + e.message, 'err'));
  const pvPdf = A['pv-export']; A['pv-pdf'] = A['pf-pdf'];

  /* ---- Offres (étudiants) ---- */
  V.plans = root => {
    const P = LP.plans;
    root.innerHTML = `<div class="page-head"><div><h1>Offres</h1><p>Une base gratuite solide pour réviser, des options pour aller plus loin.</p></div></div>
    <div class="notice warn" style="margin-bottom:16px">${ic('alert')}<div><b>Phase de test.</b> Les offres ne sont pas encore ouvertes : aucun paiement n'est possible et tout reste accessible gratuitement. Rien ne te sera débité.</div></div>
    <div class="grid"><section class="plan cur c6"><h3 style="font:400 1.8rem var(--display)">Gratuit</h3><p class="muted">Pour réviser son bac sérieusement</p><ul><li>Toute la bibliothèque de définitions</li><li>Révision espacée et quiz</li><li>Séries, XP, badges</li><li>Personnalisation et mode hors ligne</li><li>Export PDF de tes données et favoris</li><li>Proposer des notions</li></ul><button class="btn soft block" disabled>Ton offre actuelle</button></section>
    <section class="plan c6"><h3 style="font:400 1.8rem var(--display)">Premium</h3><p class="muted">Prix : à venir · <b>Bientôt disponible</b></p><ul><li><b>Coach de réussite</b> : plan jour par jour et points faibles</li>${P.catalog.map(c => `<li>${esc(c[1])}</li>`).join('')}</ul><button class="btn primary block" data-act="co-interest" ${P.interest.has() ? 'disabled' : ''}>${P.interest.has() ? 'Intérêt noté, merci !' : 'Je veux Premium au lancement'}</button><a class="btn ghost block" href="#/coach" style="margin-top:8px">${ic('sparkles', 16)} ${P.trial.used() ? 'Retour au coach' : 'Essayer le coach 7 jours'}</a></section></div>
    <p class="muted" style="font-size:.8125rem;margin-top:14px">Les fonctionnalités Premium indiquées sont à l'étude et peuvent changer. L'abonnement nécessitera un compte et un paiement sécurisé, qui ne sont pas encore en place.</p>`;
  };
})();
