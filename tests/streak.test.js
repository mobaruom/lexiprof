// Tests unitaires de la logique des flammes (Node, sans navigateur).
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
const act = LP.activity(), day = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return LP.dkey(d); };
const clear = () => Object.keys(act).forEach(k => delete act[k]);
const mark = (...offs) => offs.forEach(o => { act[day(o)] = { rv: 1, qz: 0, ok: 0, xp: 0, nw: 0 }; });

t('aucune activité → 0', () => { clear(); assert.equal(LP.streakInfo().n, 0); });
t("aujourd'hui seul → 1", () => { clear(); mark(0); const s = LP.streakInfo(); assert.equal(s.n, 1); assert.ok(s.doneToday && !s.atRisk); });
t('3 jours consécutifs → 3', () => { clear(); mark(0, -1, -2); assert.equal(LP.streak(), 3); });
t("hier sans aujourd'hui → série en sursis", () => { clear(); mark(-1, -2); const s = LP.streakInfo(); assert.equal(s.n, 2); assert.ok(s.atRisk); });
t('trou de 2 jours → rupture (0)', () => { clear(); mark(-2, -3); assert.equal(LP.streak(), 0); });
t('un trou au milieu coupe la série', () => { clear(); mark(0, -1, -3, -4); assert.equal(LP.streak(), 2); });
t('plusieurs actions le même jour = 1 seul jour', () => { clear(); act[day(0)] = { rv: 40, qz: 20, ok: 10, xp: 5, nw: 3 }; assert.equal(LP.streak(), 1); });
t('entrée à 0 action ne valide pas la journée', () => { clear(); act[day(0)] = { rv: 0, qz: 0, ok: 0, xp: 0, nw: 0 }; assert.equal(LP.streak(), 0); });
t('jours futurs ignorés (horloge)', () => { clear(); mark(1, 2, 3); assert.equal(LP.streak(), 0); });
t('série longue > 400 jours', () => { clear(); for (let i = 0; i > -500; i--) mark(i); assert.equal(LP.streak(), 500); });
t('simulation minuit : 23:59 puis 00:01 le lendemain', () => {
  clear(); const base = new Date(); base.setHours(23, 59, 0, 0); mark(0);
  assert.equal(LP.streakInfo(base).n, 1);
  const next = new Date(base.getTime() + 2 * 60000); // 00:01 le lendemain, pas encore d'activité
  const s = LP.streakInfo(next); assert.equal(s.n, 1); assert.ok(s.atRisk);
  const after = new Date(next.getTime() + 24 * 3600e3); assert.equal(LP.streakInfo(after).n, 0);
});
t('record historique conservé après rupture', () => { clear(); mark(0, -1, -2, -3, -4); LP.stats(); clear(); assert.ok(LP.streakInfo().best >= 5); });
t('traversée du changement d\'heure (dates calendaires)', () => {
  clear(); [ '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31' ].forEach(k => (act[k] = { rv: 1, qz: 0 }));
  const s = LP.streakInfo(new Date(2026, 2, 31, 10)); assert.equal(s.n, 4);
});
t('un rafraîchissement ne crée pas de série (lecture pure)', () => { clear(); LP.today(); LP.today(); LP.stats(); assert.equal(LP.streak(), 0); });
t('une vraie révision valide la journée', () => { clear(); LP.defs.length || LP.loadDefs && 0; const d = { id: 999 }; LP.srs.grade(999, 2); assert.equal(LP.streak(), 1); LP.srs.grade(999, 2); assert.equal(LP.streak(), 1); });
console.log(pass + ' tests réussis');
