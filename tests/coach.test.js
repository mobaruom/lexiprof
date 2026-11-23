// Tests unitaires du coach de réussite (Node, sans navigateur).
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] };
global.sessionStorage = global.localStorage;
global.matchMedia = () => ({ matches: false, addEventListener() {} });
global.document = { documentElement: { dataset: {}, style: {}, removeAttribute() {} }, querySelector: () => null };
global.window = global; global.EventTarget = EventTarget; global.CustomEvent = CustomEvent;
global.crypto = require('crypto').webcrypto; global.fetch = () => Promise.reject(new Error('offline'));
require('../js/core.js');
const LP = window.LP, assert = require('assert');

let pass = 0; const t = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { console.error(' FAIL ' + n + ' → ' + e.message); process.exitCode = 1; } };
Object.assign(LP, { auth: { session: () => null }, $: () => null, esc: s => s, ic: () => '', actions: {}, views: {}, confetti() {}, toast() {} });
LP.plans = { unlocked: () => false, trial: {}, interest: {} };
require('../js/coach.js');
const mk = n => Array.from({ length: n }, (_, i) => ({ id: i + 1, term: 'Terme' + i, matiere: LP.SUBJECTS[i % LP.SUBJECTS.length], def: 'Une définition suffisamment longue pour compter.' }));
const act = LP.activity(), dk = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return LP.dkey(d); };
LP.setDefs(mk(10));
const C = LP.coach;
t('départ : score 0 %, 10 notions nouvelles, charge 40 révisions', () => { const c = C.compute(); assert.equal(c.ready, 0); assert.equal(c.cnt.new, 10); assert.equal(c.work, 40); });
t('sans date d\'examen : pas de compte à rebours ni de charge/jour', () => { assert.equal(C.examDays(), null); const c = C.compute(); assert.equal(c.D, null); assert.equal(c.needed, null); });
t('une notion maîtrisée = +10 % de score', () => { for (let i = 0; i < 8; i++) LP.srs.grade(1, 3); assert.equal(LP.status(1), 'mastered'); const c = C.compute(); assert.ok(Math.abs(c.ready - 0.1) < 1e-9, String(c.ready)); assert.equal(c.cnt.mastered, 1); assert.equal(c.work, 36); });
t('date d\'examen dans 10 jours → J-10 et charge/jour = travail / 10', () => { LP.prefs.set({ examDate: dk(10) }); assert.equal(C.examDays(), 10); const c = C.compute(); assert.ok(Math.abs(c.needed - c.work / 10) < 1e-9); });
t('date passée → ignorée', () => { LP.prefs.set({ examDate: dk(-3) }); assert.equal(C.examDays(), null); LP.prefs.set({ examDate: dk(10) }); });
t('projection : plus on révise, plus elle monte, plafonnée à 100 %', () => {
  Object.keys(act).forEach(k => delete act[k]);
  const p0 = C.compute().projected; act[dk(0)] = { rv: 14, qz: 0, ok: 0, xp: 0, nw: 0 };
  const c1 = C.compute(); assert.ok(c1.rate === 1 && c1.projected > p0 && c1.projected <= 1);
  act[dk(0)].rv = 5000; const c2 = C.compute(); assert.ok(Math.abs(c2.projected - 1) < 1e-9);
});
t('rythme = moyenne sur 14 jours (jours sans activité compris)', () => { Object.keys(act).forEach(k => delete act[k]); act[dk(0)] = { rv: 7, qz: 0, ok: 0, xp: 0, nw: 0 }; act[dk(-5)] = { rv: 7, qz: 0, ok: 0, xp: 0, nw: 0 }; assert.equal(C.rate14(), 1); act[dk(-20)] = { rv: 99, qz: 0, ok: 0, xp: 0, nw: 0 }; assert.equal(C.rate14(), 1); });
t('plan : 7 jours, matière la plus fragile en tête, charge ≥ 5 cartes', () => { const c = C.compute(), p = C.plan(c); assert.equal(p.length, 7); assert.ok(p.every(x => x.cards >= 5 && x.min >= 1)); const weakest = c.subs.slice().sort((a, b) => a.ready - b.ready)[0].m; assert.equal(p[0].focus, weakest); });
t('plan raccourci quand l\'examen est dans 3 jours', () => { LP.prefs.set({ examDate: dk(3) }); const p = C.plan(C.compute()); assert.equal(p.length, 4); });
t('tout maîtrisé → charge 0, projection 100 %', () => { LP.setDefs(mk(2)); [1, 2].forEach(id => { for (let i = 0; i < 8; i++) LP.srs.grade(id, 3); }); const c = C.compute(); assert.equal(c.work, 0); assert.equal(c.ready, 1); assert.equal(c.projected, 1); });
t('bibliothèque vide : aucune division par zéro', () => { LP.setDefs([]); const c = C.compute(); assert.equal(c.ready, 0); assert.ok(Number.isFinite(c.projected)); });
console.log(pass + ' tests réussis');
