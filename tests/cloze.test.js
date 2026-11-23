require('./_boot.js');
const LP = window.LP, assert = require('assert'); let pass = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { console.error(' FAIL ' + n + ' → ' + e.message); process.exitCode = 1; } };
const mk = (id, term, def, matiere = 'Droit') => ({ id, term, def, matiere, aliases: [] });
LP.setDefs([
  mk(1, 'SARL', 'Société commerciale dont les associés ne répondent des dettes qu’à hauteur de leurs apports financiers.'),
  mk(2, 'SA', 'Société anonyme dont le capital est divisé en actions négociables librement transmissibles.'),
  mk(3, 'Marge', 'Différence entre le prix de vente et le coût d’achat d’un produit commercialisé.', 'Économie'),
  mk(4, 'Salaire', 'Rémunération versée par l’employeur en contrepartie du travail effectivement accompli.', 'RH'),
  mk(5, 'Stratégie', 'Ensemble des décisions coordonnées permettant d’atteindre durablement les objectifs fixés.', 'Management'),
  mk(6, 'Court', 'trop court'),
]);
t('notion non exploitable : pas de trou', () => assert.equal(LP.buildCloze(LP.byId.get(6)), null));
t('une seule bonne réponse, options uniques, trou présent', () => {
  for (let k = 0; k < 300; k++) {
    const q = LP.buildCloze(LP.byId.get(1 + (k % 5))); assert.ok(q, 'question attendue');
    assert.equal(q.type, 'cloze'); assert.ok(q.masked.includes('[[BLANK]]'));
    assert.equal(new Set(q.opts).size, q.opts.length); assert.ok(q.opts.length >= 3 && q.opts.length <= 4);
    assert.ok(q.a >= 0 && q.a < q.opts.length);
  }
});
t('le mot masqué n’apparaît plus dans le texte et la réponse est dans la définition', () => {
  for (let k = 0; k < 300; k++) {
    const d = LP.byId.get(1 + (k % 5)), q = LP.buildCloze(d), ans = q.opts[q.a];
    assert.ok(LP.norm(d.def).includes(LP.norm(ans)));
    assert.ok(!LP.norm(q.masked).includes(LP.norm(ans)), 'fuite de la réponse : ' + ans);
  }
});
t('aucun distracteur présent dans la définition', () => {
  for (let k = 0; k < 300; k++) { const d = LP.byId.get(1 + (k % 5)), q = LP.buildCloze(d); q.opts.forEach((o, i) => { if (i !== q.a) assert.ok(!LP.norm(d.def).includes(LP.norm(o)), 'distracteur dans la définition : ' + o); }); }
});
t('pas de question s’il n’y a pas assez de distracteurs', () => { LP.setDefs([mk(1, 'A', 'Une définition suffisamment longue pour tester.')]); assert.equal(LP.buildCloze(LP.byId.get(1)), null); });
t('recordMode garde les meilleurs scores', () => { LP.recordMode('survival', 7, 0); LP.recordMode('survival', 4, 0); LP.recordMode('express', 9, 5); const s = LP.stats(); assert.equal(s.bestSurv, 7); assert.equal(s.bestExp, 9); assert.equal(s.cloze, 5); });
console.log(pass + ' tests réussis');
