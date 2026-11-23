// Tests E2E (Playwright) avec une base Firebase simulée en mémoire.  Lancer : NODE_PATH=$(npm root -g) node tests/e2e.js
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), OUT = process.env.OUT || '/tmp';
const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const makeMock = require('./fbmock.js'); const S = makeMock(); const execSync = require('child_process').execSync;
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': mt[path.extname(f)] || 'text/plain' }); r.end(d); } }); }).listen(8124);
const EXTRA = new Set();
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const fails = [], ok = []; const check = (n, c, extra) => { (c ? ok : fails).push(n + (c ? '' : ' → ' + (extra || ''))); };
const seed = []; const subj = ['Management', 'Droit', 'Économie', 'RH'];
const W = ['capital','salarié','contrat','marché','budget','stock','prix','client','fournisseur','bilan','impôt','société','dividende','licenciement','concurrence','inflation','marge','audit','brevet','crédit','épargne','taxe','syndicat','recrutement'];
const V = ['finance','embauche','vend','achète','protège','calcule','contrôle','déclare','rémunère','négocie','produit','distribue'];
for (let i = 1; i <= 24; i++) seed.push({ id: i, term: 'Notion ' + W[i - 1], matiere: subj[i % 4], def: 'Ce mécanisme ' + V[i % 12] + ' le ' + W[(i * 5) % 24] + ' ainsi que le ' + W[(i * 7 + 3) % 24] + ' selon la règle numéro ' + i + ' appliquée par ' + W[(i * 11 + 1) % 24] + '.', createdAt: new Date(Date.now() - i * 3 * 864e5).toISOString() });
(async () => {
  S.db.definitions = JSON.parse(JSON.stringify(seed));
  const b = await chromium.launch(); const errs = [];
  const mk = async (opts0 = {}, cloud = true) => {
    const { tour, ...opts } = opts0;
    const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, serviceWorkers: 'block' }, opts)); const pg = await ctx.newPage();
    if (!tour) await ctx.addInitScript(() => { try { localStorage.setItem('lexiprof_tour', '1'); } catch (e) {} });
    const log = { events: [], failPut: false };
    await pg.route('**/js/config.js*', rt => rt.fulfill({ contentType: 'text/javascript', body: 'window.LP_CONFIG=' + JSON.stringify({ backend: 'firebase', db: 'https://lexiprof-44e50-default-rtdb.firebaseio.com', apiKey: cloud ? 'TESTKEY' : '' }) }));
    await S.install(pg, { onEvent: e => { log.events.push(e); EXTRA.add(e.a); }, flags: { get failDefsPut() { return log.failPut; } } });
    await pg.route(/fonts\.(googleapis|gstatic)\.com/, rt => { log.fonts = (log.fonts || 0) + 1; rt.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
    pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    return { ctx, pg, log };
  };
  const go = async (pg, h) => { await pg.evaluate(h => (location.hash = '#/' + h), h); await pg.waitForTimeout(350); };

  /* ---------- 1. consentement ---------- */
  { const { pg, log, ctx } = await mk(); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1500);
    check('bannière affichée au 1er passage', !!(await pg.$('#consent')));
    await go(pg, 'review'); await pg.click('[data-act=rv-start]'); await pg.click('[data-act=rv-flip]'); await pg.click('[data-act=rv-grade][data-g="2"]');
    await pg.waitForTimeout(300); check('aucun événement envoyé AVANT le choix', log.events.length === 0, JSON.stringify(log.events)); check('aucune requête Google Fonts avant le choix', !log.fonts);
    await pg.click('[data-act=consent-no]'); await go(pg, 'quiz'); await pg.click('[data-act=qz-start]'); for (let i = 0; i < 10; i++) { await pg.click('.opt'); await pg.waitForTimeout(50); await pg.click('[data-act=qz-next]'); } await pg.waitForTimeout(400);
    check('aucun événement après REFUS', log.events.length === 0, JSON.stringify(log.events)); check('bannière fermée', !(await pg.$('#consent')));
    await pg.reload(); await pg.waitForTimeout(1200); check('refus conservé (pas de bannière)', !(await pg.$('#consent'))); check('pas de Google Fonts après refus', !log.fonts);
    await go(pg, 'privacy'); await pg.click('input[data-k=analytics]', { force: true }); await pg.waitForTimeout(500);
    check("activation → événement 'open' envoyé", log.events.some(e => e.t === 'open' && e.a), JSON.stringify(log.events));
    const ev = log.events[0]; check("l'événement ne contient aucune donnée personnelle", Object.keys(ev).every(k => ['t', 'd', 'a', 'ts', 'n', 'c'].includes(k)), JSON.stringify(ev));
    await go(pg, 'review'); await pg.click('[data-act=rv-start]'); await pg.click('[data-act=rv-flip]'); await pg.click('[data-act=rv-grade][data-g="2"]'); await pg.waitForTimeout(300);
    check('révision suivie après consentement', log.events.some(e => e.t === 'review'));
    await go(pg, 'privacy'); const n0 = log.events.length; await pg.click('input[data-k=analytics]', { force: true }); await pg.waitForTimeout(300);
    check('retrait : identifiant effacé', await pg.evaluate(() => !localStorage.getItem('lexiprof_anon')));
    await go(pg, 'review'); await pg.click('[data-act=rv-start]'); await pg.click('[data-act=rv-flip]'); await pg.click('[data-act=rv-grade][data-g="2"]'); await pg.waitForTimeout(300);
    check('retrait : plus aucun envoi', log.events.length === n0, log.events.length + ' vs ' + n0);
    await go(pg, 'privacy'); await pg.click('input[data-k=fonts]', { force: true }); await pg.waitForTimeout(400); check('polices Google chargées seulement après accord', !!(await pg.$('#gfonts')));
    await pg.click('input[data-k=fonts]', { force: true }); await pg.waitForTimeout(200); check('polices retirées au retrait', !(await pg.$('#gfonts')));
    await pg.screenshot({ path: OUT + '/privacy.png' }); await ctx.close(); }

  /* ---------- 2. taille du texte, couleurs, installation (profil) ---------- */
  { const { pg, ctx } = await mk({ viewport: { width: 390, height: 844 } }); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1200); await pg.evaluate(() => { localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, analytics: false, fonts: false, decided: true })); }); await pg.reload(); await pg.waitForTimeout(1000);
    const sizes = []; for (const [lbl, v] of [['Petit', 88], ['Normal', 100], ['Grand', 115], ['Très grand', 130]]) {
      await go(pg, 'profile'); await pg.click(`[data-act=pf-pref][data-k=fontSize][data-v="${v}"]`); await pg.waitForTimeout(200);
      const m = await pg.evaluate(() => ({ root: parseFloat(getComputedStyle(document.documentElement).fontSize), body: parseFloat(getComputedStyle(document.body).fontSize), h1: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize), btn: parseFloat(getComputedStyle(document.querySelector('.btn')).fontSize), ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      sizes.push(m); await go(pg, 'library'); const lib = await pg.evaluate(() => ({ t: parseFloat(getComputedStyle(document.querySelector('.def-term')).fontSize), ov: document.documentElement.scrollWidth - document.documentElement.clientWidth })); m.libTerm = lib.t; m.libOv = lib.ov;
      check('taille ' + lbl + " : pas de débordement horizontal", m.ov <= 1 && lib.ov <= 1, JSON.stringify([m.ov, lib.ov])); }
    check('taille : body strictement croissant sur 4 niveaux', sizes.every((s, i) => !i || s.body > sizes[i - 1].body), JSON.stringify(sizes.map(s => s.body)));
    check('taille : titres, boutons et cartes suivent', sizes.every((s, i) => !i || (s.h1 > sizes[i - 1].h1 && s.btn > sizes[i - 1].btn && s.libTerm > sizes[i - 1].libTerm)), JSON.stringify(sizes));
    await go(pg, 'profile'); await pg.click('[data-act=pf-pref][data-k=fontSize][data-v="130"]'); await pg.reload(); await pg.waitForTimeout(1000);
    check('taille conservée après actualisation', (await pg.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))) > 20);
    await go(pg, 'profile'); await pg.click('[data-act=pf-appr-reset]'); await pg.waitForTimeout(200); check('réinitialisation apparence → 16px', (await pg.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))) === 16);
    // couleurs
    const bgs = {}; for (const a of ['blue', 'violet', 'emerald', 'teal', 'amber', 'orange', 'rose', 'graphite']) { await go(pg, 'profile'); await pg.click(`[data-act=pf-pref][data-k=accent][data-v="${a}"]`); await pg.waitForTimeout(120);
      bgs[a] = await pg.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, acc: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), sw: getComputedStyle(document.querySelector('.sw')).backgroundImage.slice(0, 20) })); }
    check('8 couleurs → 8 fonds différents (teinte visible)', new Set(Object.values(bgs).map(x => x.bg)).size === 8, JSON.stringify(bgs));
    check('pastilles de couleur rendues (dégradé)', Object.values(bgs).every(x => /gradient/.test(x.sw)));
    await pg.click('[data-act=pf-pref][data-k=accent][data-v="violet"]'); await pg.reload(); await pg.waitForTimeout(900); check('couleur conservée après actualisation', (await pg.evaluate(() => document.documentElement.dataset.accent)) === 'violet');
    await pg.screenshot({ path: OUT + '/profile-violet-m.png' });
    await go(pg, 'profile'); await pg.click('[data-act=pf-tint] , input[data-change=pf-tint]', { force: true }).catch(() => {}); 
    for (const th of ['dark', 'light']) { await pg.click(`[data-act=pf-pref][data-k=theme][data-v="${th}"]`); await go(pg, 'library'); await pg.click('.def-card'); await pg.waitForTimeout(400);
      const c = await pg.evaluate(() => { const rgb = s => s.startsWith('color(srgb') ? s.match(/[\d.]+/g).slice(0, 3).map(v => Number(v) * 255) : s.match(/[\d.]+/g).slice(0, 3).map(Number); const lum = c => { const f = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; }; const el = document.querySelector('.dr-def'), bg = getComputedStyle(document.querySelector('.drawer')).backgroundColor; const L1 = lum(getComputedStyle(el).color), L2 = lum(bg); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); });
      check('contraste texte/fond tiroir (' + th + ') ≥ 4.5', c >= 4.5, c.toFixed(2)); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); await go(pg, 'profile'); }
    // installation
    await go(pg, 'profile'); await pg.click('#view [data-act=install]'); await pg.waitForTimeout(400); const d1 = await pg.$('.modal'); check("bouton installer : explication quand l'invite native est indisponible", !!d1 && /Installer|HTTPS|menu/.test(await d1.innerText()));
    await pg.screenshot({ path: OUT + '/install-m.png' }); await pg.click('[data-m=ok]'); await ctx.close(); }
  { const { pg, ctx } = await mk({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1200); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true }))); await pg.reload(); await pg.waitForTimeout(900); await go(pg, 'profile'); await pg.click('#view [data-act=install]'); await pg.waitForTimeout(300); check('iOS : instructions « Sur l\'écran d\'accueil »', /écran d'accueil/.test(await (await pg.$('.modal')).innerText())); await ctx.close(); }
  { const { pg, ctx } = await mk(); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1200);
    await pg.evaluate(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt() { window.__prompted = 1; }, userChoice: Promise.resolve({ outcome: 'accepted' }), preventDefault() {} })));
    await pg.click('.sidebar [data-act=install]'); await pg.waitForTimeout(300); check('installation native déclenchée quand beforeinstallprompt existe', await pg.evaluate(() => window.__prompted === 1));
    const man = await (await ctx.request.get('http://localhost:8124/manifest.json')).json(); check('manifest : icônes 192 et 512 + maskable', ['192x192', '512x512'].every(s => man.icons.some(i => i.sizes === s)) && man.icons.some(i => i.purpose === 'maskable') && man.start_url && man.display === 'standalone' && man.name && man.short_name);
    for (const i of man.icons) { const r = await ctx.request.get('http://localhost:8124/' + i.src); check('icône ' + i.src + ' accessible', r.ok()); }
    const swr = await ctx.request.get('http://localhost:8124/sw.js'); check('service worker servi', swr.ok()); await ctx.close(); }

  /* ---------- 3. admin (Firebase Auth + règles) : import, atomicité, stats ---------- */
  { const { pg, log, ctx } = await mk();
    const adminUid = S.addAccount('admin@lexi.test', 'AdminPass123', 'Admin'); S.db.admins[adminUid] = true;
    S.addAccount('eleve@lexi.test', 'EleveMdp123', 'Eleve'); const pr = await (async () => { S.db.proposals.p1 = { term: 'Prop A', matiere: 'Droit', def: 'Une proposition suffisamment longue.', pseudo: 'Léa', email: 'lea@x.fr', status: 'pending', createdAt: new Date().toISOString() }; S.db.reports.r1 = { definitionId: 2, term: 'Notion salarié', reason: 'Erreur', message: 'Faute', status: 'pending', createdAt: new Date().toISOString() }; })();
    const today = new Date(); const dk = o => { const d = new Date(today); d.setDate(d.getDate() - o); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const evs = []; for (let i = 0; i < 5; i++) evs.push({ t: 'open', d: dk(i), a: 'device' + i }); evs.push({ t: 'open', d: dk(10), a: 'device0' }, { t: 'open', d: dk(9), a: 'oldusr1' }, { t: 'open', d: dk(9), a: 'oldusr2' }, { t: 'quiz', d: dk(1), a: 'device1', n: 10, c: 7 }, { t: 'quiz', d: dk(2), a: 'device2', n: 10, c: 9 }, { t: 'review', d: dk(0), a: 'device0' }, { t: 'view', d: dk(0), a: 'device0' });
    evs.forEach((e, i) => (S.db.events['e' + i] = e));
    S.db.profiles[adminUid] = { createdAt: Date.now() - 3 * 864e5, plan: 'free', lastSeen: Date.now() };
    const defs = () => JSON.parse(JSON.stringify(S.db.definitions));
    await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1000); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true }))); await pg.reload(); await pg.waitForTimeout(900);
    check('aucun lien vers /admin dans le site', await pg.evaluate(() => !document.querySelector('a[href="#/admin"]')));
    await go(pg, 'admin'); check('admin verrouillé par défaut', !!(await pg.$('#ad-pw')) && !!(await pg.$('#ad-mail')));
    await pg.fill('#ad-mail', 'admin@lexi.test'); await pg.fill('#ad-pw', 'mauvais'); await pg.press('#ad-pw', 'Enter'); await pg.waitForTimeout(500); check('mauvais mot de passe refusé', /incorrect/.test(await pg.innerText('#ad-err')));
    await pg.fill('#ad-mail', 'eleve@lexi.test'); await pg.fill('#ad-pw', 'EleveMdp123'); await pg.press('#ad-pw', 'Enter'); await pg.waitForTimeout(900); check("compte étudiant refusé sur l'admin", /pas administrateur/.test(await pg.innerText('#ad-err')));
    check('étudiant : le serveur refuse l\'écriture des définitions', await (async () => { const p2 = await mk(); await p2.pg.goto('http://localhost:8124/'); await p2.pg.waitForTimeout(800); await p2.pg.evaluate(async () => { await LP.auth.login({ email: 'eleve@lexi.test', password: 'EleveMdp123' }); }); const r = await p2.pg.evaluate(async () => { try { await LP.api.put('definitions', []); return 'ok'; } catch (e) { return e.status; } }); const r2 = await p2.pg.evaluate(async () => { try { await LP.api.get('proposals'); return 'ok'; } catch (e) { return e.status; } }); await p2.ctx.close(); return r === 401 && r2 === 401 && S.db.definitions.length === 24; })());
    await pg.fill('#ad-mail', 'admin@lexi.test'); await pg.fill('#ad-pw', 'AdminPass123'); await pg.press('#ad-pw', 'Enter'); await pg.waitForTimeout(1500); check('connexion admin', !!(await pg.$('#ad-body')));
    await pg.click('[data-act=ad-tab][data-v=import]'); await pg.waitForTimeout(300);
    const csv = 'terme;matière;définition;exemple;synonymes\nBilan;Management;Document comptable décrivant le patrimoine de l’entreprise à une date donnée.;Bilan 2025;Situation patrimoniale\n' + seed[4].term + ';Droit;Doublon d’un terme existant dans la base de données actuelle.;;\nVide;Droit;;;\nMatière bidon;Chimie;Définition valide mais matière inconnue pour le test.;;\nBilan;Management;Doublon interne au fichier avec définition assez longue.;;\nProduit;Économie;Résultat de la production destiné à la vente sur un marché.;;';
    fs.writeFileSync(OUT + '/imp.csv', csv); const before = JSON.stringify(defs());
    await pg.setInputFiles('#imp-file', OUT + '/imp.csv'); await pg.waitForTimeout(500);
    const kp = await pg.$$eval('#ad-body .kpi b', e => e.map(x => x.textContent)); check('aperçu import : 2 à ajouter, 0 maj, 2 ignorées, 2 rejetées', JSON.stringify(kp) === JSON.stringify(['2', '0', '2', '2']), JSON.stringify(kp)); check("rien n'est écrit avant validation", JSON.stringify(defs()) === before);
    await pg.screenshot({ path: OUT + '/import-preview.png' });
    log.failPut = true; await pg.click('[data-act=imp-commit]'); await pg.waitForTimeout(900); check('échec serveur : base inchangée', JSON.stringify(defs()) === before); check('échec serveur : état local restauré', (await pg.evaluate(() => LP.defs.length)) === 24); check("échec : message d'erreur affiché", /échoué/.test(await pg.innerText('#ad-body')));
    await pg.click('[data-act=imp-new]'); await pg.setInputFiles('#imp-file', OUT + '/imp.csv'); await pg.waitForTimeout(400); log.failPut = false; await pg.click('[data-act=imp-commit]'); await pg.waitForTimeout(1200);
    const after = defs(); check('import réussi : 26 notions (24 + 2)', after.length === 26, String(after.length)); check('notions existantes préservées', seed.every((s0, i) => after[i].term === s0.term && after[i].def === s0.def)); check('ids uniques', new Set(after.map(d => d.id)).size === 26);
    check('bilan affiché', /2 ajoutée/.test(await pg.innerText('#ad-body')) && /2 ignorée/.test(await pg.innerText('#ad-body')) && /2 rejetée/.test(await pg.innerText('#ad-body')), await pg.innerText('#ad-body'));
    await pg.click('[data-act=imp-new]'); await pg.fill('#imp-text', '[{"term":'); await pg.click('[data-act=imp-analyze]'); await pg.waitForTimeout(200); check('JSON invalide : message clair', /JSON invalide/.test(await pg.innerText('#ad-body')));
    await pg.fill('#imp-text', 'Capital : Ensemble des apports financiers des associés à la société.\nMarge ; Économie ; Différence entre le prix de vente et le coût de revient.'); await pg.click('[data-act=imp-analyze]'); await pg.waitForTimeout(250);
    const kp2 = await pg.$$eval('#ad-body .kpi b', e => e.map(x => x.textContent)); check('collage libre : 2 notions reconnues', kp2[0] === '2', JSON.stringify(kp2)); await pg.click('[data-act=imp-commit]'); await pg.waitForTimeout(1200); check('import par copier-coller : 28 notions', defs().length === 28, String(defs().length));
    await pg.click('[data-act=ad-tab][data-v=stats]'); await pg.waitForTimeout(1500); const stx = await pg.innerText('#ad-body');
    const exp = await pg.evaluate(() => { const d = LP.adminStats.compute(30); return { users: d.users, quizzes: d.quizzes, ans: d.answers, cor: d.correct, ret: d.ret }; });
    check('stats usage : 7 appareils de test + ceux du test de consentement', exp.users === 7 + EXTRA.size, JSON.stringify([exp, EXTRA.size])); check('stats : 2 quiz, réussite 16/20 = 80 %', exp.quizzes === 2 && exp.ans === 20 && exp.cor === 16 && /80 %/.test(stx), JSON.stringify(exp)); check('stats : rétention calculée', exp.ret.base >= 1 && /rétention/.test(stx));
    check('stats : comptes réels (profils Firebase)', /comptes créés/.test(stx) && /inscriptions sur 30 j/.test(stx)); check('stats : notions = 28 réelles', /\b28\b/.test(stx)); await pg.screenshot({ path: OUT + '/admin-stats.png', fullPage: true });
    await pg.click('[data-act=ad-tab][data-v=quality]'); await pg.waitForTimeout(250); check('onglet qualité : provenance expliquée', /ne vérifie pas/.test(await pg.innerText('#ad-body')));
    /* --- journal d'audit, sélection multiple --- */
    await pg.click('[data-act=ad-tab][data-v=defs]'); await pg.waitForTimeout(300);
    await pg.click('[data-act=ad-new]'); await pg.fill('#f-term', 'Notion audit test'); await pg.selectOption('#f-m', 'Droit'); await pg.fill('#f-def', 'Définition de départ suffisamment longue pour passer.'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(900);
    const adT = () => Object.values(S.db.audit || {}).map(e => e.type);
    check('audit : création de notion enregistrée côté serveur', adT().includes('def.create'));
    const newId = await pg.evaluate(() => LP.defs.find(d => d.term === 'Notion audit test').id);
    await pg.click('[data-act=ad-edit][data-id="' + newId + '"]'); await pg.fill('#f-def', 'Définition MODIFIÉE suffisamment longue pour passer.'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(900);
    const upd = Object.values(S.db.audit).find(e => e.type === 'def.update');
    check('audit : modification enregistrée avec le avant/après', !!upd && upd.meta.changes.length === 1 && upd.meta.changes[0].f === 'def' && /départ/.test(upd.meta.changes[0].from) && /MODIFIÉE/.test(upd.meta.changes[0].to), JSON.stringify(upd));
    await pg.click('[data-act=ad-del][data-id="' + newId + '"]'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(900);
    check('audit : suppression enregistrée avec copie de la notion', Object.values(S.db.audit).some(e => e.type === 'def.delete' && e.meta.def && e.meta.def.term === 'Notion audit test'));
    check('audit : auteur = compte admin', Object.values(S.db.audit).every(e => e.who === 'admin@lexi.test'));
    const nBefore = await pg.evaluate(() => LP.defs.length);
    await pg.locator('[data-change=ad-sel]').nth(0).check(); await pg.locator('[data-change=ad-sel]').nth(1).check(); await pg.waitForTimeout(200);
    check('sélection multiple : barre d\'actions affichée', /2 sélectionnées/.test(await pg.innerText('.bulkbar')));
    await pg.click('[data-act=ad-bulk-move]'); await pg.selectOption('#bm', 'RH'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(900);
    check('sélection multiple : changement de matière groupé (serveur + journal)', S.db.definitions.filter(d => d.matiere === 'RH').length >= 2 && adT().includes('def.bulk-move'));
    await pg.locator('[data-change=ad-sel]').nth(0).check(); await pg.locator('[data-change=ad-sel]').nth(1).check(); await pg.click('[data-act=ad-bulk-del]'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(1000);
    check('sélection multiple : suppression groupée (−2 notions) + journal', (await pg.evaluate(() => LP.defs.length)) === nBefore - 2 && S.db.definitions.length === nBefore - 2 && adT().includes('def.bulk-delete'));
    await pg.click('[data-act=ad-tab][data-v=audit]'); await pg.waitForTimeout(1200);
    const jt = await pg.innerText('#ad-body');
    check('journal : frise chronologique affichée', (await pg.$$('.tl-item')).length >= 8 && /aujourd.hui/i.test(jt), String((await pg.$$('.tl-item')).length));
    check('journal : types lisibles (import, création, suppression groupée)', /Import de notions/.test(jt) && /Notion créée/.test(jt) && /Suppression groupée/.test(jt));
    check('journal : graphique 30 jours + indicateurs', (await pg.$$('.jr-chart i')).length === 30 && /actions enregistrées/.test(jt));
    check('journal : mention honnête « actions passées non enregistrées »', /avant cette version/.test(jt));
    await pg.screenshot({ path: OUT + '/admin-journal.png', fullPage: true });
    await pg.fill('#jr-q', 'audit test'); await pg.waitForTimeout(250); const nf = (await pg.$$('.tl-item')).length; check('journal : recherche filtre la liste', nf >= 3 && nf <= 5, String(nf));
    await pg.fill('#jr-q', ''); await pg.click('[data-act=jr-cat][data-v=securite]'); await pg.waitForTimeout(200); check('journal : filtre « Sécurité » (connexion)', (await pg.$$('.tl-item')).length >= 1 && /Connexion admin/.test(await pg.innerText('#jr-list')));
    await pg.click('[data-act=jr-cat][data-v=all]'); await pg.fill('#jr-q', 'audit test'); await pg.waitForTimeout(200);
    const dets = pg.locator('.tl-det summary'); for (let i = 0; i < await dets.count(); i++) await dets.nth(i).click();
    check('journal : bouton « Restaurer » proposé sur la suppression', !!(await pg.$('[data-act=jr-restore]')));
    await pg.click('[data-act=jr-restore]'); await pg.waitForTimeout(1200);
    check('journal : restauration → notion revenue (serveur) + entrée « restaurée »', S.db.definitions.some(d => d.term === 'Notion audit test') && adT().includes('def.restore'));
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act=jr-csv]')]); check('journal : export CSV', /lexiprof-journal-.*\.csv/.test(dl.suggestedFilename()));
    const keyOne = Object.keys(S.db.audit)[0];
    check('journal en ajout seul : modification et suppression d\'une entrée refusées', (await pg.evaluate(async k => { const r = []; try { await LP.api.put('audit/' + k, { t: 1, type: 'x', label: 'x', who: 'x' }); r.push('put-ok'); } catch (e) { r.push(e.status); } try { await LP.api.del('audit/' + k); r.push('del-ok'); } catch (e) { r.push(e.status); } return r.join(','); }, keyOne)) === '401,401');
    await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(250); await pg.screenshot({ path: OUT + '/m-admin-journal.png', fullPage: true }); check('journal mobile : pas de débordement horizontal', await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await pg.setViewportSize({ width: 1280, height: 900 });

    check("admin : pas d'onglet Export ni Offres", !(await pg.$('[data-act=ad-tab][data-v=export]')) && !(await pg.$('[data-act=ad-tab][data-v=plans]')));
    await pg.click('[data-act=ad-lock]'); await pg.waitForTimeout(500); check('verrouillage', !!(await pg.$('#ad-pw'))); check('après verrouillage le serveur refuse les écritures', (await pg.evaluate(async () => { try { await LP.api.put('definitions', []); return 'ok'; } catch (e) { return e.status; } })) === 401);
    await ctx.close(); }
  /* ---------- comptes étudiants Firebase : inscription, synchro, profil serveur ---------- */
  { const A1 = await mk(), B1 = await mk(); const pa = A1.pg, pb = B1.pg;
    for (const p of [pa, pb]) { await p.goto('http://localhost:8124/'); await p.waitForTimeout(900); await p.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true }))); await p.reload(); await p.waitForTimeout(800); }
    await go(pa, 'profile'); await pa.click('[data-act=auth-tab][data-v=register]'); await pa.fill('#a-name', 'Sofia'); await pa.fill('#a-mail', 'sofia@lexi.test'); await pa.fill('#a-pw', 'court'); await pa.press('#a-pw', 'Enter'); await pa.waitForTimeout(500); check('inscription : mot de passe trop court refusé', /8 caractères/.test(await pa.innerText('#a-err')));
    await pa.fill('#a-pw', 'MotDePasse123'); await pa.press('#a-pw', 'Enter'); await pa.waitForTimeout(1500); check('inscription réussie (carte profil)', /Sofia/.test(await pa.innerText('#view')));
    const uid = S.accounts['sofia@lexi.test'].uid; check('profil serveur créé en plan « free »', S.db.profiles[uid] && S.db.profiles[uid].plan === 'free');
    check('un élève ne peut pas se donner le plan premium', await pa.evaluate(async uid => { try { await LP.api.patch('profiles/' + uid, { plan: 'premium' }); return 'ok'; } catch (e) { return e.status; } }, uid) === 401);
    await pa.click('[data-act=pf-pref][data-k=accent][data-v="rose"]').catch(() => {});
    await go(pa, 'review'); await pa.click('[data-act=rv-start]'); await pa.click('[data-act=rv-flip]'); await pa.click('[data-act=rv-grade][data-g="2"]'); await pa.waitForTimeout(5200);
    check('progression poussée sur le serveur', !!(S.db.users[uid] && S.db.users[uid].progress && S.db.users[uid].progress.stats.reviews >= 1));
    await go(pb, 'profile'); await pb.fill('#a-mail', 'sofia@lexi.test'); await pb.fill('#a-pw', 'MotDePasse123'); await pb.press('#a-pw', 'Enter'); await pb.waitForTimeout(2500);
    check('SYNCHRO : la progression de l\'appareil A apparaît sur l\'appareil B', (await pb.evaluate(() => LP.stats().reviews)) >= 1);
    await pb.reload(); await pb.waitForTimeout(1500); check('session conservée après actualisation (jeton Firebase)', /Sofia/.test(await (async () => { await go(pb, 'profile'); return pb.innerText('#view'); })()));
    await pb.evaluate(() => { const t = JSON.parse(localStorage.lexiprof_tok); t.exp = 1; localStorage.lexiprof_tok = JSON.stringify(t); }); await pb.reload(); await pb.waitForTimeout(1500); check('jeton expiré : renouvelé automatiquement (refresh token)', await pb.evaluate(() => JSON.parse(localStorage.lexiprof_tok).exp > Date.now()) && !!(await pb.evaluate(() => LP.auth.session())));
    await go(pb, 'profile'); await pb.click('[data-act=pf-delete]'); await pb.fill('#dp', 'MotDePasse123'); await pb.click('[data-m=ok]'); await pb.waitForTimeout(1500); check('suppression du compte : compte, profil et progression effacés', !S.accounts['sofia@lexi.test'] && !S.db.profiles[uid] && !S.db.users[uid]);
    await A1.ctx.close(); await B1.ctx.close(); }
  /* ---------- lot 2 : quiz ---------- */
  { const { pg, ctx } = await mk({}, false); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(800); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true, at: Date.now() }))); await pg.reload(); await pg.waitForTimeout(900);
    await go(pg, 'quiz'); await pg.click('[data-act=qz-cfg][data-k=n][data-v="5"]'); await pg.click('[data-act=qz-cfg][data-k=type][data-v=t2d]');
    await pg.reload(); await pg.waitForTimeout(900); await go(pg, 'quiz');
    check('quiz : réglages mémorisés après actualisation', /5/.test(await pg.innerText('.seg .on')) && /Terme/.test(await pg.innerText('.qt4 .qt.on')));
    const runs0 = await pg.evaluate(() => LP.stats().quizRuns);
    await pg.click('[data-act=qz-start]');
    check('quiz : options en radiogroup (role=radio, aria-checked)', await pg.evaluate(() => document.querySelector('.opts').getAttribute('role') === 'radiogroup' && [...document.querySelectorAll('.opt')].every(o => o.getAttribute('role') === 'radio' && o.getAttribute('aria-checked') === 'false')));
    await pg.keyboard.press('ArrowDown'); check('quiz : flèches bas/haut déplacent le focus entre les options', await pg.evaluate(() => document.activeElement.classList.contains('opt')));
    await pg.keyboard.press('ArrowDown'); const f2 = await pg.evaluate(() => [...document.querySelectorAll('.opt')].indexOf(document.activeElement)); check('quiz : navigation aux flèches (2e option)', f2 === 1, String(f2));
    await pg.screenshot({ path: OUT + '/quiz-q-focus.png' });
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
    check('quiz : après la réponse, le focus passe sur « Question suivante »', await pg.evaluate(() => document.activeElement && document.activeElement.dataset.act === 'qz-next'));
    check('quiz : options verrouillées en aria-disabled (pas disabled)', await pg.evaluate(() => [...document.querySelectorAll('.opt')].every(o => o.getAttribute('aria-disabled') === 'true' && !o.disabled)));
    await pg.screenshot({ path: OUT + '/quiz-q-answered.png', fullPage: true });
    check('quiz : lien « Voir la fiche complète »', !!(await pg.$('.explain [data-act=open-def]')));
    check('quiz : score direct bonnes + erreurs', !!(await pg.$('.qscore')) && !!(await pg.$('.qscore.bad')));
    await pg.keyboard.press('Enter'); await pg.waitForTimeout(150);
    await pg.click('[data-act=qz-skip]'); await pg.waitForTimeout(200); check('quiz : « Je ne sais pas » compte comme erreur et montre la réponse', /Pas de souci/.test(await pg.innerText('.explain')) && /✕\s*\d/.test(await pg.innerText('.qscore.bad')));
    check('quiz : « je ne sais pas » enregistré dans la session', await pg.evaluate(() => JSON.parse(sessionStorage.getItem('lexiprof_qz_run')).log.some(l => l.skipped && l.ok === false)));
    await go(pg, 'progress'); await go(pg, 'quiz'); check('quiz : bannière « reprendre le quiz en cours »', !!(await pg.$('[data-act=qz-resume]')) && /Question 2 sur 5/.test(await pg.innerText('.qz-resume')), (await pg.innerText('#view')).slice(0, 160));
    await pg.click('[data-act=qz-resume]'); await pg.waitForTimeout(200); check('quiz : reprise à la bonne question', /2 \/ 5/.test(await pg.innerText('.study-top')));
    for (let i = 0; i < 4; i++) { if (!(await pg.$('.opt'))) break; if (!(await pg.$('.explain'))) { await pg.click('.opt'); await pg.waitForTimeout(60); } await pg.click('[data-act=qz-next]'); await pg.waitForTimeout(60); }
    check('quiz : écran final avec « Refaire mes erreurs »', !!(await pg.$('[data-act=qz-redo]')) && /Refaire mes erreurs/.test(await pg.innerText('.result')));
    check('quiz : plus de session en cours après la fin', await pg.evaluate(() => !sessionStorage.getItem('lexiprof_qz_run')));
    const runs1 = await pg.evaluate(() => LP.stats().quizRuns); check('quiz : le quiz terminé compte une fois', runs1 === runs0 + 1);
    const xp1 = await pg.evaluate(() => LP.stats().xp); await pg.click('[data-act=qz-redo]'); await pg.waitForTimeout(200); check('quiz : mode entraînement sur les erreurs', /Entraînement sur tes erreurs/.test(await pg.innerText('.study')));
    for (let i = 0; i < 12 && await pg.$('.opt'); i++) { if (!(await pg.$('.explain'))) { await pg.click('.opt'); await pg.waitForTimeout(50); } await pg.click('[data-act=qz-next]'); await pg.waitForTimeout(50); }
    check('quiz : l\'entraînement ne donne ni XP ni quiz compté (pas d\'abus)', (await pg.evaluate(() => LP.stats().quizRuns)) === runs1 && (await pg.evaluate(() => LP.stats().xp)) === xp1);
    await ctx.close(); }
  /* ---------- coach de réussite (aperçu Premium) ---------- */
  { const { pg, ctx } = await mk({}, false); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(800); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true, at: Date.now() }))); await pg.reload(); await pg.waitForTimeout(900);
    check('accueil : bandeau « coach » visible', !!(await pg.$('.coach-teaser')));
    await pg.click('.coach-teaser'); await pg.waitForTimeout(500);
    check('coach : demande la date d\'examen au départ', !!(await pg.$('#co-date')) && /Quand est ton examen/.test(await pg.innerText('#view')));
    await pg.click('[data-act=co-quick][data-n="60"]'); await pg.waitForTimeout(1600);
    const exp = await pg.evaluate(() => ({ ready: Math.round(LP.coach.compute().ready * 100), D: LP.coach.examDays() }));
    check('coach : compte à rebours J-60', exp.D === 60 && /J-60/.test(await pg.innerText('.co-hero')));
    check('coach : le score affiché = le score calculé (animation terminée)', Number(await pg.innerText('#co-num')) === exp.ready, await pg.innerText('#co-num') + ' vs ' + exp.ready);
    check('coach : projection au jour J affichée (graphique + texte)', !!(await pg.$('.co-chart')) && /jour J/.test(await pg.innerText('.co-hero')));
    check('coach : plan et points faibles verrouillés sans essai (contenu flouté, lecteur d\'écran masqué)', (await pg.$$('.locked-wrap')).length === 2 && (await pg.getAttribute('.locked-wrap .blur', 'aria-hidden')) === 'true');
    await pg.screenshot({ path: OUT + '/coach-locked.png', fullPage: true });
    await pg.click('[data-act=co-trial]'); await pg.waitForTimeout(500);
    check('essai 7 jours : tout se débloque', (await pg.$$('.locked-wrap')).length === 0 && (await pg.$$('.co-plan li')).length === 7 && /Essai Premium actif/.test(await pg.innerText('#view')));
    check('essai : durée de 7 jours exacte', await pg.evaluate(() => { const t = LP.plans.trial.get(); return Math.round((t.end - t.start) / 864e5) === 7 && LP.plans.trial.daysLeft() === 7; }));
    await pg.screenshot({ path: OUT + '/coach-trial.png', fullPage: true });
    await pg.evaluate(() => { const t = LP.plans.trial.get(); t.end = Date.now() - 1000; localStorage.setItem('lexiprof_trial', JSON.stringify(t)); }); await pg.reload(); await pg.waitForTimeout(900); await go(pg, 'coach'); await pg.waitForTimeout(500);
    check('essai terminé : re-verrouillé, pas de nouvel essai possible', (await pg.$$('.locked-wrap')).length === 2 && !(await pg.$('[data-act=co-trial]')) && /essai gratuit est terminé/.test(await pg.innerText('#view')));
    const n0 = Object.keys(S.db.interest || {}).length;
    await pg.click('.lock-card [data-act=co-interest]'); await pg.waitForTimeout(700);
    check('« Je veux Premium au lancement » : intérêt compté une seule fois (anonyme)', Object.keys(S.db.interest || {}).length === n0 + 1 && Object.values(S.db.interest).every(e => /^i[a-z0-9]+$/.test(e.a) && !('email' in e)));
    await pg.reload(); await pg.waitForTimeout(800); await go(pg, 'plans'); check('offres : bouton d\'intérêt déjà pris en compte', /Intérêt noté/.test(await pg.innerText('#view')));
    await pg.setViewportSize({ width: 390, height: 844 }); await go(pg, 'coach'); await pg.waitForTimeout(500); check('coach mobile : pas de débordement horizontal', await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await pg.screenshot({ path: OUT + '/m-coach.png', fullPage: true });
    await ctx.close(); }
  /* ---------- mode local (sans clé Firebase) ---------- */
  { const { pg, ctx } = await mk({}, false); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(900); await pg.evaluate(h => { localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true })); localStorage.setItem('lexiprof_admin_pwd', h); }, sha('test-admin-1')); await pg.reload(); await pg.waitForTimeout(900);
    check('mode local détecté', (await pg.evaluate(() => LP.authMode)) === 'local');
    await go(pg, 'profile'); await pg.click('[data-act=auth-tab][data-v=register]'); await pg.fill('#a-name', 'Local'); await pg.fill('#a-mail', 'l@l.fr'); await pg.fill('#a-pw', 'MotDePasse1'); await pg.press('#a-pw', 'Enter'); await pg.waitForTimeout(700); check('compte local créé', /Local/.test(await pg.innerText('#view')));
    await pg.reload(); await pg.waitForTimeout(900); check('compte local conservé après actualisation', !!(await pg.evaluate(() => LP.auth.session())));
    await go(pg, 'admin'); check('admin local : avertissement « mode provisoire », sans champ email', /provisoire/.test(await pg.innerText('#view')) && !(await pg.$('#ad-mail')));
    await pg.fill('#ad-pw', 'faux'); await pg.press('#ad-pw', 'Enter'); await pg.waitForTimeout(400); check('admin local : mauvais mot de passe refusé', /incorrect/.test(await pg.innerText('#ad-err')));
    await pg.fill('#ad-pw', 'test-admin-1'); await pg.press('#ad-pw', 'Enter'); await pg.waitForTimeout(1200); check('admin local : accès avec le bon mot de passe', !!(await pg.$('#ad-body')));
    /* --- lot 1 : zone de dépôt, encodage, brouillon, tableaux --- */
    await pg.click('[data-act=ad-tab][data-v=import]'); await pg.waitForTimeout(300);
    check('zone de dépôt : focus clavier + rôle bouton', await pg.evaluate(() => { const d = document.querySelector('#imp-drop'); return d.tabIndex === 0 && d.getAttribute('role') === 'button'; }));
    check('zone de dépôt : pas de clignotement quand le curseur passe sur un enfant', await pg.evaluate(() => { const dz = document.querySelector('#imp-drop'), ch = dz.querySelector('p'); const ev = (el, t) => el.dispatchEvent(new Event(t, { bubbles: true, cancelable: true })); ev(dz, 'dragenter'); ev(ch, 'dragenter'); ev(dz, 'dragleave'); const still = dz.classList.contains('over'); ev(ch, 'dragleave'); return still && !dz.classList.contains('over'); }));
    check('un fichier lâché hors zone ne fait pas naviguer (preventDefault)', await pg.evaluate(() => { const e = new Event('drop', { bubbles: true, cancelable: true }); Object.defineProperty(e, 'dataTransfer', { value: { types: ['Files'], files: [] } }); document.body.dispatchEvent(e); return e.defaultPrevented; }));
    await pg.setInputFiles('#imp-file', { name: 'liste.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from([0x50, 0x4B, 3, 4, 1, 2]) }); await pg.waitForTimeout(400);
    check('.xlsx : message clair', /Excel détecté/.test(await pg.innerText('#ad-body')));
    await pg.setInputFiles('#imp-file', { name: 'excel-win.csv', mimeType: 'text/csv', buffer: Buffer.from('terme;matière;définition\n\xc9pargne;\xc9conomie;Part du revenu non consomm\xe9e et mise de c\xf4t\xe9 pour plus tard.', 'latin1') }); await pg.waitForTimeout(500);
    check('CSV Windows-1252 : accents corrects + information affichée', /Épargne/.test(await pg.innerText('#ad-body')) && /Windows-1252/.test(await pg.innerText('#ad-body')));
    check('statut : icône + texte (pas seulement la couleur)', await pg.evaluate(() => /✓/.test(document.querySelector('.tbl .st-ok').textContent)));
    check('en-têtes de tableau collants', await pg.evaluate(() => getComputedStyle(document.querySelector('.tbl thead th')).position === 'sticky'));
    await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(300);
    check('mobile : tableau en cartes (étiquette avant la valeur), sans défilement horizontal', await pg.evaluate(() => { const td = document.querySelector('.tbl.rs tbody td[data-l="Terme"]'); return getComputedStyle(td).display === 'block' && /Terme/.test(getComputedStyle(td, '::before').content) && document.documentElement.scrollWidth <= innerWidth + 1; }));
    await pg.setViewportSize({ width: 1280, height: 900 }); await pg.click('[data-act=imp-back]'); await pg.waitForTimeout(200);
    await pg.fill('#imp-text', 'Brouillon : Une définition de test assez longue.\nAutre : Deuxième définition de test assez longue.'); await pg.waitForTimeout(200);
    check('compteur de lignes collées', /2 ligne/.test(await pg.innerText('#imp-count')));
    await pg.reload(); await pg.waitForTimeout(1000); await go(pg, 'admin'); await pg.waitForTimeout(500); await pg.click('[data-act=ad-tab][data-v=import]').catch(() => {}); await pg.waitForTimeout(300);
    check('brouillon conservé après actualisation', (await pg.inputValue('#imp-text').catch(() => '')).startsWith('Brouillon'));
    /* --- lot 3 : aperçu trié / recherché / paginé --- */
    const big = 'terme;matiere;def\n' + Array.from({ length: 120 }, (_, i) => 'Zterme' + String(i).padStart(3, '0') + ';Droit;Définition numéro ' + i + ' suffisamment longue pour être valide.').join('\n') + '\nBad;Droit;court';
    await pg.fill('#imp-text', big); await pg.click('[data-act=imp-analyze]'); await pg.waitForTimeout(400);
    check('aperçu : pagination 50 lignes + compteur', (await pg.$$('#imp-tbody tr')).length === 50 && /50 affichées sur 121/.test(await pg.innerText('#imp-foot')));
    await pg.click('[data-act=imp-more]'); check('aperçu : « Afficher 50 de plus »', (await pg.$$('#imp-tbody tr')).length === 100);
    await pg.click('[data-act=imp-sort][data-k=status]'); await pg.waitForTimeout(150); await pg.click('[data-act=imp-sort][data-k=status]'); await pg.waitForTimeout(150);
    check('aperçu : tri par statut décroissant (rejetée en premier) + aria-sort', /Rejetée/.test(await pg.innerText('#imp-tbody tr:first-child')) && (await pg.getAttribute('th[aria-sort=descending]', 'aria-sort')) === 'descending');
    await pg.fill('#imp-q', 'zterme042'); await pg.waitForTimeout(200); check('aperçu : recherche texte', (await pg.$$('#imp-tbody tr')).length === 1 && /Zterme042/.test(await pg.innerText('#imp-tbody')));
    const [dl2] = await Promise.all([pg.waitForEvent('download'), pg.click('[data-act=imp-csvview]')]); check('aperçu : export CSV de la vue', /apercu-import/.test(dl2.suggestedFilename()));
    /* --- lot 3 : journal technique + bandeau de version --- */
    await pg.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'erreur de test', filename: 'x.js', lineno: 7 })));
    check('journal technique : erreur notée localement', await pg.evaluate(() => LP.errlog.list().some(e => e.msg === 'erreur de test' && e.src === 'x.js:7')));
    await go(pg, 'profile'); check('journal technique : visible dans le profil', /Journal technique/.test(await pg.innerText('#view')));
    await pg.route('**/version.json*', rt => rt.fulfill({ contentType: 'application/json', body: '{"v":"9.9.9"}' }));
    await pg.evaluate(() => LP.checkVersion(true)); await pg.waitForTimeout(500);
    check('bandeau « nouvelle version » quand version.json change', !!(await pg.$('#upd-banner')) && /nouvelle version/i.test(await pg.innerText('#upd-banner')));
    await pg.click('[data-act=upd-later]'); check('bandeau : « Plus tard » le ferme', !(await pg.$('#upd-banner')));


    await ctx.close(); }
  { const { pg, ctx } = await mk(); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1200); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true }))); await pg.reload(); await pg.waitForTimeout(900);
    await go(pg, 'review'); await pg.click('[data-act=rv-start]'); await pg.click('[data-act=rv-flip]'); await pg.click('[data-act=rv-grade][data-g="0"]'); await pg.waitForTimeout(200);
    await go(pg, 'library'); await pg.click('.def-card'); await pg.waitForTimeout(300); await pg.click('[data-act=fav]'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    await go(pg, 'profile'); const [d1] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }), pg.click('[data-act=pf-pdf]')]); await d1.saveAs(OUT + '/mon-rapport.pdf');
    const t1 = require('child_process').execSync(`pdftotext -layout ${OUT}/mon-rapport.pdf -`).toString(); check('PDF étudiant : progression + données stockées', /Ma progression/.test(t1) && /Données stockées/.test(t1) && /Cartes révisées/.test(t1)); check('PDF étudiant : favoris listés', /Mes favoris/.test(t1) && /Notion/.test(t1));
    const [d2] = await Promise.all([pg.waitForEvent('download', { timeout: 15000 }), pg.click('[data-act=pf-pdf-favs]')]); await d2.saveAs(OUT + '/fiches.pdf'); const t2 = require('child_process').execSync(`pdftotext -layout ${OUT}/fiches.pdf -`).toString(); check('fiches PDF : définition complète du favori', /Définition/.test(t2) && /Page 1 \/ 1/.test(t2) && t2.split('\n').filter(l => l.trim()).length > 6);
    await go(pg, 'privacy'); check('page Confidentialité : bouton PDF', !!(await pg.$('#view [data-act=pf-pdf]')));
    await go(pg, 'plans'); const pt = await pg.innerText('#view'); check('page Offres étudiant : phase de test, aucun paiement, prix à venir', /Phase de test/.test(pt) && /Bientôt disponible/.test(pt) && /à venir/.test(pt) && !!(await pg.$('.sidebar a[href="#/plans"]')));
    await ctx.close(); }

  /* ---------- 5. v2.4 : modes de quiz, cartes à trous, personnage, coffre ---------- */
  { const { pg, ctx } = await mk({ viewport: { width: 390, height: 844 } }, false); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(800);
    await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true, at: Date.now() }))); await pg.reload(); await pg.waitForTimeout(900);
    const run = () => pg.evaluate(() => JSON.parse(sessionStorage.getItem('lexiprof_qz_run')));
    check('accueil : carte de Fenn affichée', !!(await pg.$('.fenn-card svg.fenn'))); await pg.screenshot({ path: OUT + '/m-home-fenn.png' });
    // Survie : 3 erreurs = fin
    await go(pg, 'quiz'); await pg.click('[data-act=qz-cfg][data-k=mode][data-v=survival]'); await pg.click('[data-act=qz-start]'); await pg.waitForTimeout(200);
    check('survie : 3 vies au départ', /3 vies/.test(await pg.getAttribute('.qlives', 'aria-label')));
    for (let k = 0; k < 3; k++) { const r = await run(), q = r.qs[r.i]; const wrong = q.opts.find(o => o !== q.id); await pg.click('.opt[data-id="' + wrong + '"]'); await pg.waitForTimeout(100);
      if (k === 0) check('survie : une erreur retire une vie', /2 vies/.test(await pg.getAttribute('.qlives', 'aria-label')));
      if (k === 2) check('survie : dernier bouton = résultat', /Voir le résultat/.test(await pg.innerText('[data-act=qz-next]')));
      await pg.click('[data-act=qz-next]'); await pg.waitForTimeout(100); }
    check('survie : écran de fin après 3 erreurs', /Partie terminée/.test(await pg.innerText('.result')));
    check('fin de partie : Fenn présent', !!(await pg.$('.result .fenn-res svg')));
    check('refaire mes erreurs proposé après une partie de survie', !!(await pg.$('[data-act=qz-redo]')));
    await pg.click('[data-act=qz-redo]'); await pg.waitForTimeout(200);
    check('refaire mes erreurs : série d\'entraînement sans XP', /pas de XP/.test(await pg.innerText('.study')));
    await pg.click('[data-act=qz-quit]'); await pg.waitForTimeout(150); if (await pg.$('[data-m=ok]')) await pg.click('[data-m=ok]'); await pg.waitForTimeout(200);
    // Express + cartes à trous
    await go(pg, 'quiz'); await pg.click('[data-act=qz-cfg][data-k=mode][data-v=express]'); await pg.click('[data-act=qz-cfg][data-k=type][data-v=cloze]'); await pg.click('[data-act=qz-start]'); await pg.waitForTimeout(300);
    check('express : minuteur affiché', /^[0-3]:\d\d$/.test((await pg.innerText('#qz-time')).trim()));
    check('cartes à trous : un trou visible', !!(await pg.$('.q-text .blank')));
    { const r = await run(), q = r.qs[r.i], word = q.opts[q.a]; check('cartes à trous : la réponse n\'est pas dans le texte', !q.masked.toLowerCase().includes(word.toLowerCase()), word + ' | ' + q.masked);
      await pg.click('.opt[data-i="' + q.a + '"]'); await pg.waitForTimeout(120); check('cartes à trous : bonne réponse reconnue + mot surligné', /Bien joué/.test(await pg.innerText('.explain')) && !!(await pg.$('.explain mark'))); await pg.screenshot({ path: OUT + '/m-cloze.png' }); }
    await pg.click('[data-act=qz-next]'); await pg.waitForTimeout(150);
    // temps écoulé : on simule une reprise avec 0,6 s restantes
    await pg.evaluate(() => { const r = JSON.parse(sessionStorage.getItem('lexiprof_qz_run')); r.left = 600; sessionStorage.setItem('lexiprof_qz_run', JSON.stringify(r)); });
    await pg.reload(); await pg.waitForTimeout(900); await go(pg, 'quiz'); await pg.click('[data-act=qz-resume]'); await pg.waitForTimeout(1600);
    check('express : fin automatique à 0:00', /Temps écoulé/.test(await pg.innerText('.result')));
    check('express : record enregistré', (await pg.evaluate(() => LP.stats().bestExp)) >= 1);
    // profil : pseudo, avatar, titre
    await go(pg, 'profile'); check('profil : carte « Mon personnage »', !!(await pg.$('.fn-card [data-act=fn-edit]')));
    await pg.click('[data-act=fn-edit]'); await pg.waitForTimeout(250);
    check('avatars verrouillés non sélectionnables', (await pg.$$eval('.fn-av.lock', e => e.filter(x => x.disabled).length)) >= 3);
    await pg.fill('#fn-pseudo', '<b>x</b>'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(200);
    check('pseudo invalide refusé (la fenêtre reste ouverte)', !!(await pg.$('#fn-pseudo')));
    await pg.fill('#fn-pseudo', 'Léa_92'); await pg.click('[data-m=ok]'); await pg.waitForTimeout(400);
    check('pseudo enregistré et affiché', (await pg.evaluate(() => LP.fun.name())) === 'Léa_92' && /Léa_92/.test(await pg.innerText('.fn-card h2')));
    await pg.reload(); await pg.waitForTimeout(900); check('pseudo conservé après actualisation', (await pg.evaluate(() => LP.fun.name())) === 'Léa_92');
    // badges rares cachés
    await go(pg, 'progress'); const rareTxt = await pg.$$eval('.bdg.rare.lock', e => e.map(x => x.innerText).join('|'));
    check('badges rares : cachés tant que non obtenus', (await pg.$$('.bdg.rare.lock')).length >= 6 && !/Dimanche|Lève-tôt|Centenaire/.test(rareTxt), rareTxt.slice(0, 80));
    // coffre
    await go(pg, ''); check('coffre : pas de coffre avant l\'objectif', !(await pg.$('[data-act=fn-chest]')));
    await pg.evaluate(() => { LP.today().rv = 99; LP.emit('progress'); }); await go(pg, 'quiz'); await go(pg, '');
    check('coffre : proposé quand l\'objectif du jour est atteint', !!(await pg.$('.fenn-card [data-act=fn-chest]')));
    const xp0 = await pg.evaluate(() => LP.stats().xp); await pg.click('.fenn-card [data-act=fn-chest]'); await pg.waitForTimeout(1700);
    check('coffre : récompense affichée', !!(await pg.$('.chest-win')) && /XP|avatar|titre/.test(await pg.innerText('.chest-win')));
    await pg.screenshot({ path: OUT + '/m-chest.png' });
    await pg.click('[data-m=ok]'); await pg.waitForTimeout(400);
    check('coffre : un seul par jour', !(await pg.$('[data-act=fn-chest]')) && (await pg.evaluate(() => !!LP.fun.chest.today())));
    check('coffre : XP ou objet crédité', (await pg.evaluate(() => LP.stats().xp)) > xp0 || (await pg.evaluate(() => LP.fun.chest.today().reward.kind)) === 'item');
    await go(pg, 'profile'); await pg.screenshot({ path: OUT + '/m-profile-fenn.png', fullPage: false });
    await ctx.close(); }
  // mobile : aucune page ne déborde horizontalement avec Fenn
  { const { pg, ctx } = await mk({ viewport: { width: 360, height: 740 } }, false); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(900);
    for (const h of ['', 'quiz', 'profile', 'progress']) { await go(pg, h); const w = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth); check('360 px : pas de défilement horizontal sur #/' + h, w <= 1, 'dépassement ' + w + ' px'); }
    await ctx.close(); }

  /* ---------- 4. régression : parcours principaux + mobile ---------- */
  for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 800 }, { width: 768, height: 1024 }]) { const { pg, ctx } = await mk({ viewport: vp }); await pg.goto('http://localhost:8124/'); await pg.waitForTimeout(1200); await pg.evaluate(() => localStorage.setItem('lexiprof_consent', JSON.stringify({ v: 1, decided: true }))); await pg.reload(); await pg.waitForTimeout(900);
    for (const h of ['', 'library', 'review', 'quiz', 'progress', 'profile', 'propose', 'privacy', 'plans', 'admin']) { await go(pg, h); const r = await pg.evaluate(() => ({ n: document.querySelector('#view').innerText.length, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth })); check(vp.width + 'px /' + h + ' rendu sans débordement', r.n > 20 && r.ov <= 1, JSON.stringify(r)); }
    await go(pg, 'quiz'); await pg.click('[data-act=qz-start]'); let score = 0; for (let i = 0; i < 10; i++) { const ids = await pg.$$eval('.opt', e => e.map(x => x.dataset.id)); const qid = await pg.evaluate(() => 0); const pick = i % 2 ? ids[0] : null; const chosen = await pg.evaluate(() => 0); await pg.click('.opt'); await pg.waitForTimeout(40); const good = await pg.$('.opt.ok'); const bad = await pg.$('.opt.bad'); if (!good) errs.push('quiz sans bonne réponse affichée'); if (!bad) score++; await pg.click('[data-act=qz-next]'); }
    const shown = await pg.innerText('.result .score'); check(vp.width + 'px quiz : score affiché = bonnes réponses (' + shown + ')', shown === score + '/10', shown + ' vs ' + score);
    if (vp.width === 390) await pg.screenshot({ path: OUT + '/m-quiz-end.png' });
    await ctx.close(); }
  /* ---------- 6. v2.5 : visite guidée, polices, matières ---------- */
  { const { pg, ctx } = await mk({ tour: true }, false); await pg.goto('http://localhost:8124/'); await pg.waitForSelector('#tour', { timeout: 8000 }).catch(() => {});
    check('visite guidée au 1er lancement', !!(await pg.$('#tour')));
    check('Fenn présente dans la visite', !!(await pg.$('#tour svg.fenn')));
    await pg.click('.tr-next'); await pg.waitForTimeout(250); await pg.fill('#tr-pseudo', '<b>'); await pg.click('.tr-next'); await pg.waitForTimeout(250);
    check('pseudo invalide : on reste sur l\'étape', !!(await pg.$('#tr-pseudo')));
    await pg.fill('#tr-pseudo', 'Momo'); await pg.click('.tr-next'); await pg.waitForTimeout(250);
    await pg.click('.tr-ch >> nth=3'); check('objectif choisi = pref réelle', (await pg.evaluate(() => LP.prefs.get().dailyGoal)) === 40);
    for (let i = 0; i < 4; i++) { await pg.click('.tr-next'); await pg.waitForTimeout(250); }
    await pg.waitForFunction(() => !document.getElementById('tour'), null, { timeout: 4000 }).catch(() => {});
    check('visite terminée : fermée + mémorisée', !(await pg.$('#tour')) && (await pg.evaluate(() => localStorage.getItem('lexiprof_tour'))) === '1');
    check('pseudo de la visite enregistré', (await pg.evaluate(() => LP.fun.pseudo())) === 'Momo');
    await pg.reload(); await pg.waitForTimeout(2200); check('pas de visite au 2e lancement', !(await pg.$('#tour')));
    await go(pg, 'profile'); await pg.click('[data-act=tr-replay]'); await pg.waitForSelector('#tour'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(500);
    check('rejouable depuis le profil, Échap ferme', !(await pg.$('#tour')));
    await go(pg, 'profile'); await pg.click('[data-k=font][data-v=dys]'); await pg.waitForTimeout(200);
    check('police dyslexie appliquée', (await pg.evaluate(() => document.documentElement.dataset.font)) === 'dys');
    await pg.evaluate(() => LP.prefs.set({ spacing: true })); check('espacement renforcé appliqué', (await pg.evaluate(() => document.documentElement.dataset.spacing)) === 'on');
    await pg.evaluate(() => LP.resetAppearance()); check('réinitialiser l\'apparence remet la police', (await pg.evaluate(() => document.documentElement.dataset.font)) === 'std');
    await pg.evaluate(() => { const d = document.createElement('span'); d.dataset.m = 'Matière inconnue'; d.id = 'zz'; document.body.appendChild(d); }); await pg.waitForTimeout(250);
    check('matière inconnue : couleur calculée', /hsl/.test(await pg.evaluate(() => document.getElementById('zz').style.getPropertyValue('--c'))));
    await ctx.close(); }
  { const { pg, ctx } = await mk({ tour: true, viewport: { width: 360, height: 640 } }, false); await pg.goto('http://localhost:8124/'); await pg.waitForSelector('#tour', { timeout: 8000 }).catch(() => {});
    const o = await pg.evaluate(() => { const t = document.getElementById('tour'), n = document.querySelector('.tr-next').getBoundingClientRect(); return { x: t.scrollWidth - t.clientWidth, vis: n.bottom <= innerHeight + 1 }; });
    check('visite 360 px : pas de débordement, bouton visible', o.x <= 0 && o.vis, JSON.stringify(o));
    await ctx.close(); }

  console.log(ok.length + ' contrôles réussis'); if (fails.length || errs.length) { console.log('ÉCHECS :\n' + fails.join('\n')); console.log('ERREURS CONSOLE :\n' + [...new Set(errs)].join('\n')); process.exitCode = 1; } else console.log('Aucun échec, aucune erreur console.');
  await b.close(); srv.close();
})();
