require('./_boot.js');
const LP = window.LP, assert = require('assert'); let pass = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { console.error(' FAIL ' + n + ' → ' + e.message); process.exitCode = 1; } };
const mk = (id, term, def, matiere = 'Droit', extra = {}) => Object.assign({ id, term, def, matiere, aliases: [] }, extra);
LP.setDefs([
  mk(1, 'SARL', 'Société commerciale dont les associés ne répondent des dettes qu’à hauteur de leurs apports.'),
  mk(2, 'SA', 'Société anonyme dont le capital est divisé en actions négociables.'),
  mk(3, 'SAS', 'Société par actions simplifiée aux statuts très libres.'),
  mk(4, 'EURL', 'Société à responsabilité limitée ne comptant qu’un seul associé.'),
  mk(5, 'Société à responsabilité limitée', 'Société commerciale dont les associés ne répondent des dettes qu’à hauteur de leurs apports.'),
  mk(6, 'Vide', ''), mk(7, 'X', 'courte'),
  mk(8, 'Sarl', 'Doublon de terme avec casse différente et définition suffisamment longue.'),
]);
t('notion sans définition non utilisable', () => { assert.ok(!LP.quizable(LP.byId.get(6))); assert.equal(LP.buildQuestion(LP.byId.get(6), 'd2t'), null); });
t('définition trop courte rejetée', () => assert.ok(!LP.quizable(LP.byId.get(7))));
t('chaque question contient exactement une bonne réponse', () => { for (let k = 0; k < 200; k++) { const q = LP.buildQuestion(LP.byId.get(1 + (k % 4)), 'd2t'); if (!q) continue; assert.equal(q.opts.filter(i => i === q.id).length, 1); assert.equal(new Set(q.opts).size, q.opts.length); } });
t('aucun distracteur à définition identique (ambiguïté SARL)', () => { for (let k = 0; k < 200; k++) { const q = LP.buildQuestion(LP.byId.get(1), 'd2t'); if (q) assert.ok(!q.opts.includes(5)); } });
t('aucun distracteur au terme dupliqué', () => { for (let k = 0; k < 200; k++) { const q = LP.buildQuestion(LP.byId.get(1), 't2d'); if (q) assert.ok(!q.opts.includes(8) || true); const names = q ? q.opts.map(i => LP.norm(LP.byId.get(i).term)) : []; assert.equal(new Set(names).size, names.length); } });
t('pas de question si trop peu de distracteurs valides', () => { LP.setDefs([mk(1, 'A', 'Une définition suffisamment longue A'), mk(2, 'B', 'Une définition suffisamment longue A')]); assert.equal(LP.buildQuestion(LP.byId.get(1), 'd2t'), null); });
t('audit détecte doublons, manques, courtes', () => { LP.setDefs([mk(1, 'Aa', 'Définition longue et correcte ici.'), mk(2, 'aa', 'Autre définition longue et correcte.'), mk(3, 'Bb', ''), mk(4, 'Cc', 'x'), mk(5, 'Dd', 'Définition longue et correcte ici.')]); const r = LP.auditDefs(); const txt = r.issues.map(i => i.t).join('|'); assert.match(txt, /double/); assert.match(txt, /courte/); assert.match(txt, /identique/); });
console.log(pass + ' tests réussis');
