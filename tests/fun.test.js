require('./_boot.js');
const LP = window.LP, assert = require('assert'); let pass = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { console.error(' FAIL ' + n + ' → ' + e.message); process.exitCode = 1; } };
LP.auth = { session: () => null }; LP.toast = () => {}; LP.dialog = async () => true; LP.confetti = () => {};
require('../js/fenn.js');
require('../js/fun.js');
const F = LP.fun;
t('avatar par défaut débloqué, avatars de niveau et de coffre verrouillés', () => {
  const av = F.avatars(), by = id => av.find(a => a.id === id);
  assert.ok(by('fenn').open); assert.ok(!by('foulard').open); assert.ok(!by('ninja').open);
});
t('Fenn : toutes les humeurs et tous les accessoires donnent un SVG propre', () => {
  ['happy', 'cheer', 'proud', 'sad', 'sleepy', 'think', 'wave', 'wink', 'wow', undefined].forEach(m => ['', 'glasses', 'scarf', 'cap', 'phones', 'grad', 'star', 'crown', 'ninja', 'shades', 'party'].forEach(a => {
    const s = F.fenn(m, a, 80); assert.ok(s.startsWith('<svg') && s.endsWith('</svg>')); assert.ok(!/undefined|NaN/.test(s)); assert.match(s, /aria-label=/);
  }));
});
t('pseudo : règles de validation', () => {
  ['', 'Léa', 'Mo_hamed', "Jean-Luc", 'A1'].forEach(v => assert.ok(F.validPseudo(v), v));
  ['A', ' ', '<b>', 'x'.repeat(21), '-ab', 'a<script>'].forEach(v => assert.ok(!F.validPseudo(v), v));
});
t('coffre indisponible tant que l\'objectif du jour n\'est pas atteint', () => { assert.ok(!F.chest.available()); assert.equal(F.chest.open(), null); });
t('coffre : un par jour, récompense mémorisée, XP donné une seule fois', () => {
  LP.today().rv = 15; assert.ok(F.chest.available());
  const xp0 = LP.stats().xp, n0 = LP.stats().chests || 0, rnd = Math.random; Math.random = () => 0.5;
  const c1 = F.chest.open(); Math.random = rnd;
  assert.equal(c1.reward.kind, 'xp'); assert.ok(c1.reward.xp >= 15 && c1.reward.xp <= 80);
  assert.equal(LP.stats().xp - xp0, c1.reward.xp); assert.equal(LP.stats().chests, n0 + 1);
  assert.ok(!F.chest.available());
  const c2 = F.chest.open(); assert.deepEqual(c2.reward, c1.reward); assert.equal(LP.stats().xp - xp0, c1.reward.xp);
});
t('le 5e coffre contient toujours un objet à débloquer', () => {
  LP.bump('chests', 3);   // 4 coffres ouverts au total
  const d = new Date(); d.setDate(d.getDate() + 1);
  const real = LP.dkey; LP.dkey = () => real(d);
  LP.today().rv = 15;
  const rnd = Math.random; Math.random = () => 0.99;
  const c = F.chest.open(); Math.random = rnd; LP.dkey = real;
  assert.equal(c.reward.kind, 'item');
  const list = c.reward.type === 'avatar' ? F.avatars() : F.titles();
  assert.ok(list.find(x => x.id === c.reward.id).open);
});
t('badges rares : cachés par défaut puis obtenus', () => {
  const rare = LP.badges().filter(b => b.rare); assert.ok(rare.length >= 8);
  const get = id => LP.badges().find(b => b.id === id);
  assert.ok(!get('r_redo').got); LP.bump('redo'); assert.ok(get('r_redo').got);
  assert.ok(!get('r_surv').got); LP.recordMode('survival', 10, 0); assert.ok(get('r_surv').got);
  assert.ok(!get('r_cloze').got); LP.recordMode('classic', 0, 50); assert.ok(get('r_cloze').got);
});
t('sauvegarde : aller-retour, ids inconnus ignorés, pseudo invalide refusé', () => {
  const d = F.dump(); d.pseudo = 'Léa'; d.ownedA = ['ninja', 'inexistant']; d.title = 'inexistant';
  F.restore(d); assert.equal(F.pseudo(), 'Léa'); assert.ok(F.avatars().find(a => a.id === 'ninja').open);
  assert.ok(!F.dump().ownedA.includes('inexistant'));
  F.restore({ pseudo: '<img>' }); assert.equal(F.pseudo(), 'Léa');
});
t('remise à zéro : déblocages effacés, pseudo conservé', () => { F.reset(); assert.equal(F.pseudo(), 'Léa'); assert.ok(!F.avatars().find(a => a.id === 'ninja').open); });
console.log(pass + ' tests réussis');

t('Fenn v2 : crops et ids uniques, humeur inconnue → happy', () => { ['full', 'bust', 'head'].forEach(c => assert.match(LP.fenn('wave', { crop: c }), /viewBox=/)); assert.match(LP.fenn('zzz'), /m-happy/); assert.ok(LP.fenn('cheer', { anim: true }).includes('class="fenn m-cheer anim"')); });
t('setPseudo valide/refuse', () => { assert.ok(F.setPseudo('Momo')); assert.equal(F.pseudo(), 'Momo'); assert.ok(!F.setPseudo('<b>')); assert.equal(F.pseudo(), 'Momo'); });
