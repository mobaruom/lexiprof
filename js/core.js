/* ============================================================
   LexiProf 2.0 — core.js
   Données, recherche, répétition espacée, progression, comptes
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  const DAY = 864e5;
  LP.DAY = DAY;

  // Réglages : modifie js/config.js (jamais ce fichier).
  LP.cfg = Object.assign({
    backend: 'firebase', db: 'https://lexiprof-44e50-default-rtdb.firebaseio.com', apiKey: '', adminEmail: '',
    api: 'api/index.php', version: '2.2.0', sessionMax: 30
  }, window.LP_CONFIG || {});


  const K = (LP.K = {
    favorites: 'lexiprof_favorites', mastered: 'lexiprof_mastered', theme: 'lexiprof_theme',
    history: 'lexiprof_search_history', misses: 'lexiprof_search_misses', lastExport: 'lexiprof_last_export',
    users: 'lexiprof_users', session: 'lexiprof_session', prefs: 'lexiprof_user_prefs', sent: 'lexiprof_proposals_sent',
    fallback: 'lexiprof_fallback', adminPwd: 'lexiprof_admin_pwd', srs: 'lexiprof_srs', activity: 'lexiprof_activity',
    stats: 'lexiprof_stats', accent: 'lexiprof_accent', fs: 'lexiprof_fs', rm: 'lexiprof_rm', lastSent: 'lexiprof_last_sent'
  });

  /* ---------- utilitaires ---------- */
  const $ = (LP.$ = (s, r = document) => r.querySelector(s));
  LP.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (LP.esc = v =>
    v == null ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
  const norm = (LP.norm = s =>
    String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const lsGet = (LP.lsGet = (k, d) => {
    try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  });
  const lsSet = (LP.lsSet = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  });
  const pad = n => String(n).padStart(2, '0');
  const dkey = (LP.dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  const dayStart = (LP.dayStart = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); });
  LP.shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  LP.uid = () => Date.now() * 10 + Math.floor(Math.random() * 10);
  LP.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  LP.fmtInterval = d => d < 1 ? '< 10 min' : d < 30 ? d + ' j' : d < 365 ? Math.round(d / 30) + ' mois' : (d / 365).toFixed(1).replace('.0', '') + ' an(s)';
  LP.fmtDue = ts => {
    const n = Math.round((dayStart(ts) - dayStart()) / DAY);
    return n <= 0 ? "aujourd'hui" : n === 1 ? 'demain' : 'dans ' + n + ' j';
  };
  LP.timeAgo = ts => {
    if (!ts) return '';
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 60) return "à l'instant";
    if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
    const d = Math.floor(s / 86400);
    return d === 1 ? 'hier' : d < 30 ? 'il y a ' + d + ' j' : new Date(ts).toLocaleDateString('fr-FR');
  };
  LP.safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
  LP.download = (name, obj, type) => {
    const blob = new Blob([typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)], { type: type || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const bus = new EventTarget();
  LP.on = (e, f) => bus.addEventListener(e, f);
  LP.off = (e, f) => bus.removeEventListener(e, f);
  LP.emit = (e, d) => bus.dispatchEvent(new CustomEvent(e, { detail: d }));
  LP.SUBJECTS = ['Management', 'Droit', 'Économie', 'RH'];

  async function sha256(text) {
    if (!(window.crypto && crypto.subtle)) throw new Error('Contexte non sécurisé : ouvre le site en HTTPS.');
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  LP.sha256 = sha256;

  /* ---------- cache ---------- */
  function getCache(key) {
    try {
      const item = localStorage.getItem('cache:' + key);
      if (!item) return null;
      const { data, expiry } = JSON.parse(item);
      if (Date.now() > expiry) { localStorage.removeItem('cache:' + key); return null; }
      return data;
    } catch (e) { return null; }
  }
  function setCache(key, data, ttl) { try { localStorage.setItem('cache:' + key, JSON.stringify({ data, expiry: Date.now() + ttl })); } catch (e) {} }
  LP.clearCache = () => Object.keys(localStorage).filter(k => k.startsWith('cache:')).forEach(k => localStorage.removeItem(k));

  /* ---------- backend (Firebase par défaut, PHP en option) : voir js/backend-*.js ---------- */
  LP.backends = {};

  /* ---------- définitions ---------- */
  LP.defs = [];
  LP.byId = new Map();
  LP.source = 'seed';
  let lastRaw = '';
  let sidx = new Map();
  let xref = null;

  LP.seed = [
    { id: 1, term: 'Management', matiere: 'Management', def: "Ensemble des techniques permettant de diriger, organiser et coordonner les ressources d'une organisation afin d'atteindre ses objectifs.", example: 'Un manager organise le travail de son équipe, répartit les tâches et suit les résultats.', remember: 'Le management consiste à organiser, décider, coordonner et motiver.' },
    { id: 2, term: 'Leadership', matiere: 'Management', def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs.", example: "Un responsable qui motive son équipe autour d'un projet fait preuve de leadership.", remember: 'Leadership = influencer, guider et motiver.' },
    { id: 3, term: 'Organigramme', matiere: 'Management', def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation.", example: "L'organigramme d'une entreprise permet de voir qui dépend de quel responsable.", remember: 'Il permet de visualiser les relations hiérarchiques.' },
    { id: 4, term: 'Stratégie', matiere: 'Management', def: "Ensemble des choix par lesquels une organisation cherche à atteindre ses objectifs à long terme en tenant compte de son environnement.", example: "Une enseigne décide de se positionner sur le haut de gamme plutôt que sur les prix bas.", remember: 'Stratégie = choix à long terme face à un environnement.' },
    { id: 5, term: 'Diagnostic SWOT', matiere: 'Management', aliases: ['SWOT', 'FFOM'], def: "Outil d'analyse stratégique croisant les forces et faiblesses internes d'une organisation avec les opportunités et menaces de son environnement.", example: "Une PME analyse ses points forts (savoir-faire) et les menaces (nouveau concurrent) avant de lancer un produit.", remember: 'Forces + Faiblesses (interne) / Opportunités + Menaces (externe).' },
    { id: 6, term: 'Motivation', matiere: 'Management', def: "Ensemble des facteurs qui poussent un individu à agir et à s'investir dans son travail.", example: 'Une prime, la reconnaissance ou un projet intéressant peuvent motiver un salarié.', remember: 'La motivation explique pourquoi on agit, avec quelle intensité.' },
    { id: 7, term: 'Contrat de travail', matiere: 'Droit', def: "Convention par laquelle une personne, le salarié, s'engage à travailler pour le compte et sous la direction d'un employeur en échange d'une rémunération.", example: 'Un CDI signé entre une entreprise et un salarié constitue un contrat de travail.', remember: 'Travail + rémunération + lien de subordination.' },
    { id: 8, term: 'Personne morale', matiere: 'Droit', def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres.", example: 'Une société ou une association peut être une personne morale.', remember: 'Une personne morale possède une existence juridique propre.' },
    { id: 9, term: 'SARL', matiere: 'Droit', aliases: ['Société à responsabilité limitée'], def: "Société commerciale dont les associés ne sont responsables des dettes qu'à hauteur de leurs apports.", example: 'Deux amis créent une SARL pour ouvrir un restaurant sans engager leur patrimoine personnel.', remember: 'SARL = responsabilité limitée aux apports.' },
    { id: 10, term: 'Responsabilité civile', matiere: 'Droit', def: "Obligation de réparer le dommage causé à autrui, par sa faute ou par le fait des personnes ou des choses dont on a la garde.", example: "Un automobiliste qui provoque un accident doit indemniser la victime.", remember: 'Faute + dommage + lien de causalité = réparation.' },
    { id: 11, term: 'PIB', matiere: 'Économie', aliases: ['Produit Intérieur Brut'], def: "Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.", example: 'Le PIB permet de mesurer la production économique d\'un pays.', remember: 'PIB = valeur des biens et services produits sur un territoire.' },
    { id: 12, term: 'Inflation', matiere: 'Économie', def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie.", example: 'Lorsque les prix augmentent durablement, le pouvoir d\'achat de la monnaie diminue.', remember: 'Inflation = hausse générale et durable des prix.' },
    { id: 13, term: 'Marché', matiere: 'Économie', def: "Lieu réel ou virtuel de rencontre entre l'offre et la demande, où se fixe un prix d'échange.", example: 'Une place de marché en ligne met en relation vendeurs et acheteurs.', remember: 'Marché = rencontre offre / demande → prix.' },
    { id: 14, term: 'Taux de chômage', matiere: 'Économie', def: "Part des chômeurs dans la population active, c'est-à-dire parmi les personnes en emploi ou à la recherche d'un emploi.", example: "Si 3 millions de personnes sont au chômage pour 30 millions d'actifs, le taux est de 10 %.", remember: 'Chômeurs ÷ population active × 100.' },
    { id: 15, term: 'Recrutement', matiere: 'RH', def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats afin de pourvoir un poste vacant.", example: 'Une entreprise publie une offre d\'emploi puis sélectionne les candidats.', remember: 'Recruter = rechercher, sélectionner puis intégrer un candidat.' },
    { id: 16, term: 'GPEC', matiere: 'RH', aliases: ['Gestion prévisionnelle des emplois et des compétences'], def: "Démarche permettant d'anticiper les besoins futurs d'une organisation en emplois et en compétences.", example: 'Une entreprise prévoit des formations pour préparer ses salariés à de nouvelles compétences.', remember: 'GPEC = anticiper les besoins futurs en emplois et compétences.' },
    { id: 17, term: 'Cotisations sociales', matiere: 'RH', def: "Prélèvements assis sur les salaires, payés par le salarié et l'employeur, qui financent la protection sociale (santé, retraite, chômage).", example: 'Sur une fiche de paie, les cotisations salariales sont déduites du salaire brut.', remember: 'Elles financent la Sécurité sociale, la retraite et le chômage.' }
  ];

  function normDef(d) {
    const x = Object.assign({}, d); delete x._key; delete x._pushKey;
    const map = { management: 'Management', droit: 'Droit', economie: 'Économie', rh: 'RH' };
    const m = String(d.matiere || 'Management').trim();
    return Object.assign(x, {
      id: Number(d.id) || 0,
      term: String(d.term || '').trim(),
      matiere: map[norm(m)] || m,
      def: String(d.def || d.definition || '').trim(),
      example: String(d.example || '').trim(),
      remember: String(d.remember || '').trim(),
      source: String(d.source || '').trim(),
      aliases: Array.isArray(d.aliases) ? d.aliases.map(String).filter(Boolean) : String(d.aliases || '').split(',').map(a => a.trim()).filter(Boolean),
      createdAt: d.createdAt || null,
      needsReview: Boolean(d.needsReview)
    });
  }
  function setDefs(arr) {
    const list = (arr || []).filter(Boolean).map(normDef).filter(d => d.term && d.def);
    const seen = new Set(); let max = list.reduce((m, d) => Math.max(m, d.id), 0);
    list.forEach(d => { if (!d.id || seen.has(d.id)) d.id = ++max; seen.add(d.id); });
    LP.defs = list;
    LP.byId = new Map(list.map(d => [d.id, d]));
    sidx = new Map(list.map(d => [d.id, { t: norm(d.term), a: d.aliases.map(norm), d: norm(d.def), x: norm(d.example), r: norm(d.remember) }]));
    xref = null;
  }
  LP.setDefs = setDefs;
  LP.nextDefId = () => LP.defs.reduce((m, d) => Math.max(m, d.id), 0) + 1;

  LP.loadDefs = async function () {
    try {
      const data = await LP.api.get('definitions');
      lastRaw = JSON.stringify(data);
      setDefs(data); setCache('defs:all', data, 3600e3); lsSet(K.fallback, data); LP.source = 'remote';
    } catch (e) {
      const fbk = lsGet(K.fallback, null);
      if (Array.isArray(fbk) && fbk.length) { setDefs(fbk); LP.source = 'offline'; }
      else { setDefs(LP.seed); LP.source = 'seed'; }
    }
    LP.emit('defs');
    return LP.source;
  };
  LP.refreshDefs = async function () {
    try {
      const data = await LP.api.get('definitions');
      const raw = JSON.stringify(data);
      LP.source = 'remote';
      if (raw !== lastRaw) { lastRaw = raw; setDefs(data); setCache('defs:all', data, 3600e3); lsSet(K.fallback, data); LP.emit('defs'); }
    } catch (e) { /* hors ligne : on garde le cache */ }
  };
  LP.boot = async function () {
    const cached = getCache('defs:all') || lsGet(K.fallback, null);
    if (Array.isArray(cached) && cached.length) {
      setDefs(cached); LP.source = 'cache'; lastRaw = JSON.stringify(cached);
      LP.refreshDefs();
    } else { await LP.loadDefs(); }
  };
  LP.saveDefs = async function () {
    const out = LP.defs.map(d => Object.assign({}, d));
    await LP.api.put('definitions', out);
    lastRaw = ''; LP.clearCache(); lsSet(K.fallback, out); LP.emit('defs');
  };
  LP.makeDef = f => normDef(Object.assign({ id: LP.nextDefId(), createdAt: new Date().toISOString() }, f));

  /* ---------- recherche ---------- */
  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function fuzzy(h, n) {
    const th = n.length <= 4 ? 1 : 2;
    return h.split(/[^a-z0-9]+/).some(w => w && Math.abs(w.length - n.length) <= th && lev(w, n) <= th);
  }
  function score(d, words, nq) {
    const i = sidx.get(d.id); if (!i) return -1;
    let s = 0;
    for (const w of words) {
      const inT = i.t.includes(w), inA = i.a.some(a => a.includes(w));
      const inO = i.d.includes(w) || i.x.includes(w) || i.r.includes(w);
      const fz = !(inT || inA || inO) && w.length >= 3 && (fuzzy(i.t, w) || i.a.some(a => fuzzy(a, w)));
      if (!(inT || inA || inO || fz)) return -1;
      if (i.t === w || i.a.includes(w)) s += 100;
      else if (i.t.startsWith(w) || i.a.some(a => a.startsWith(w))) s += 75;
      else if (inT || inA) s += 50;
      else if (fz) s += 30;
      else s += 10;
    }
    if (i.t === nq) s += 100;
    return s;
  }
  LP.search = (q, list) => {
    list = list || LP.defs;
    const nq = norm(q).trim();
    const words = nq.split(/\s+/).filter(Boolean);
    if (!words.length) return list.slice();
    return list.map(d => ({ d, s: score(d, words, nq) })).filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.d.term.localeCompare(b.d.term, 'fr')).map(x => x.d);
  };
  LP.hl = (text, q) => {
    text = String(text == null ? '' : text);
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return esc(text);
    const chars = Array.from(text);
    const nt = chars.map(c => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()).join('');
    if (nt.length !== chars.length) return esc(text);
    const on = new Array(chars.length).fill(false);
    words.forEach(w => { let i = nt.indexOf(w); while (i !== -1) { for (let k = i; k < i + w.length; k++) on[k] = true; i = nt.indexOf(w, i + w.length); } });
    let out = '', open = false;
    chars.forEach((c, i) => {
      if (on[i] && !open) { out += '<mark>'; open = true; }
      if (!on[i] && open) { out += '</mark>'; open = false; }
      out += esc(c);
    });
    return out + (open ? '</mark>' : '');
  };

  /* ---------- liens entre notions ---------- */
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function buildXref() {
    const map = new Map(), keys = [];
    for (const d of LP.defs) {
      for (const t of [d.term].concat(d.aliases)) {
        const k = norm(t).trim();
        if (k.length < 3 || map.has(k)) continue;
        map.set(k, d.id); keys.push(t.trim());
      }
    }
    keys.sort((a, b) => b.length - a.length);
    let re = null;
    if (keys.length) {
      const alt = keys.map(escRe).join('|');
      try { re = new RegExp('(?<![\\p{L}\\p{N}])(' + alt + ')(?![\\p{L}\\p{N}])', 'giu'); }
      catch (e) { re = new RegExp('\\b(' + alt + ')\\b', 'gi'); }
    }
    xref = { map, re };
  }
  LP.linkify = (text, selfId) => {
    text = String(text || '');
    if (!xref) buildXref();
    if (!xref.re) return esc(text);
    const re = xref.re; re.lastIndex = 0;
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      const id = xref.map.get(norm(m[1]).trim());
      out += esc(text.slice(last, m.index));
      out += id != null && id !== selfId
        ? `<a href="#/def/${id}" class="xref" data-act="open-def" data-id="${id}">${esc(m[1])}</a>` : esc(m[1]);
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    return out + esc(text.slice(last));
  };
  LP.related = d => {
    if (!xref) buildXref();
    const ids = new Set();
    if (xref.re) {
      const re = xref.re; re.lastIndex = 0; let m;
      const txt = d.def + ' ' + d.example;
      while ((m = re.exec(txt))) { const id = xref.map.get(norm(m[1]).trim()); if (id != null && id !== d.id) ids.add(id); if (!m[0].length) re.lastIndex++; }
    }
    const nt = norm(d.term);
    if (nt.length >= 4) LP.defs.forEach(o => { if (o.id !== d.id && sidx.get(o.id).d.includes(nt)) ids.add(o.id); });
    return Array.from(ids).slice(0, 8).map(id => LP.byId.get(id)).filter(Boolean);
  };
  LP.daily = () => {
    if (!LP.defs.length) return null;
    const s = dkey(); let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return LP.defs[h % LP.defs.length];
  };

  /* historique & recherches sans résultat */
  LP.history = {
    list: () => lsGet(K.history, []).filter(x => typeof x === 'string'),
    add(q) { q = String(q || '').trim(); if (q.length < 2) return; const l = this.list().filter(x => norm(x) !== norm(q)); l.unshift(q); lsSet(K.history, l.slice(0, 6)); },
    clear: () => localStorage.removeItem(K.history)
  };
  LP.recordMiss = q => {
    q = norm(q).trim(); if (q.length < 2) return;
    const m = lsGet(K.misses, {}); m[q] = (m[q] || 0) + 1;
    lsSet(K.misses, Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 50)));
  };
  LP.topMisses = (n = 8) => Object.entries(lsGet(K.misses, {})).sort((a, b) => b[1] - a[1]).slice(0, n).map(([term, count]) => ({ term, count }));

  /* ---------- favoris & maîtrise manuelle ---------- */
  const favs = new Set((lsGet(K.favorites, []) || []).map(Number));
  LP.favs = {
    has: id => favs.has(Number(id)),
    toggle(id) { id = Number(id); const on = !favs.has(id); on ? favs.add(id) : favs.delete(id); lsSet(K.favorites, [...favs]); LP.checkBadges(); LP.emit('favs'); return on; },
    count: () => favs.size, list: () => [...favs]
  };
  const manual = new Set((lsGet(K.mastered, []) || []).map(Number).filter(Number.isFinite));
  LP.manual = {
    has: id => manual.has(Number(id)),
    toggle(id) { id = Number(id); const on = !manual.has(id); on ? manual.add(id) : manual.delete(id); lsSet(K.mastered, [...manual]); LP.checkBadges(); LP.emit('progress'); return on; }
  };

  /* ---------- activité, stats, niveaux ---------- */
  let srsMap = lsGet(K.srs, {}) || {};
  let act = lsGet(K.activity, {}) || {};
  let stats = Object.assign({ xp: 0, reviews: 0, quiz: 0, correct: 0, quizRuns: 0, perfect: 0, night: 0, best: 0, bestSurv: 0, bestExp: 0, cloze: 0, chests: 0, sun: 0, early: 0, redo: 0, badges: {}, since: Date.now() }, lsGet(K.stats, {}) || {});
  const saveSrs = () => lsSet(K.srs, srsMap);
  const saveAct = () => lsSet(K.activity, act);
  const saveStats = () => lsSet(K.stats, stats);
  (function prune() {
    const lim = dkey(new Date(Date.now() - 1100 * DAY));
    Object.keys(act).forEach(k => { if (k < lim) delete act[k]; });
  })();

  LP.today = () => { const k = dkey(); if (!act[k]) act[k] = { rv: 0, qz: 0, ok: 0, xp: 0, nw: 0 }; return act[k]; };
  LP.activity = () => act;
  LP.stats = () => { const n = LP.streak(); if (n > stats.best) stats.best = n; return stats; };
  const need = l => 50 * (l - 1) * (l - 1);
  LP.level = () => {
    const xp = stats.xp; let l = 1;
    while (xp >= need(l + 1)) l++;
    const cur = need(l), nxt = need(l + 1);
    return { level: l, xp, cur, next: nxt, pct: Math.round(((xp - cur) / (nxt - cur)) * 100) };
  };
  // Une journée est « validée » dès qu'au moins une carte est révisée ou une réponse de quiz donnée (jour calendaire local).
  const isActive = d => { const a = act[dkey(d)]; return !!a && a.rv + a.qz > 0; };
  // Série en cours : jours consécutifs validés. Si aujourd'hui n'est pas encore validé, la série d'hier reste « en sursis » jusqu'à minuit.
  LP.streakInfo = (now) => {
    const t = now ? new Date(now) : new Date(); t.setHours(12, 0, 0, 0);
    const doneToday = isActive(t), d = new Date(t);
    if (!doneToday) d.setDate(d.getDate() - 1);
    let n = 0;
    while (isActive(d)) { n++; d.setDate(d.getDate() - 1); }
    return { n, doneToday, atRisk: !doneToday && n > 0, best: Math.max(stats.best || 0, n) };
  };
  LP.streak = () => LP.streakInfo().n;
  LP.goal = () => {
    const t = LP.today(), goal = LP.prefs.get().dailyGoal, done = t.rv + t.qz;
    return { done, goal, pct: Math.min(100, Math.round((done / goal) * 100)) };
  };
  LP.award = n => {
    const before = LP.level().level;
    stats.xp += n; LP.today().xp += n;
    stats.best = Math.max(stats.best, LP.streak());
    saveStats(); saveAct();
    const after = LP.level().level;
    if (after > before) LP.emit('levelup', { level: after });
    LP.checkBadges();
    LP.emit('progress');
  };
  const nightNow = () => { const h = new Date().getHours(); return h >= 23 || h < 4; };
  const sunNow = () => { const t = new Date(); return t.getDay() === 0 && t.getHours() >= 20; };
  const earlyNow = () => { const h = new Date().getHours(); return h >= 4 && h < 6; };
  const timeFlags = () => { if (sunNow()) stats.sun = (stats.sun || 0) + 1; if (earlyNow()) stats.early = (stats.early || 0) + 1; };
  // Compteur générique (ex. coffres ouverts, séries « refaire mes erreurs » parfaites)
  LP.bump = (k, n) => { stats[k] = (stats[k] || 0) + (n || 1); saveStats(); LP.checkBadges(); LP.emit('progress'); return stats[k]; };

  /* ---------- répétition espacée ---------- */
  const newState = () => ({ e: 2.5, i: 0, r: 0, l: 0, d: 0, t: 0 });
  function schedule(prev, g, now) {
    now = now || Date.now();
    const s = Object.assign(newState(), prev || {});
    if (g === 0) { s.l++; s.r = 0; s.i = 0; s.e = Math.max(1.3, s.e - 0.2); s.d = now + 10 * 60e3; }
    else {
      let i;
      if (s.r === 0) i = [0, 1, 2, 4][g];
      else if (s.r === 1) i = [0, 2, 4, 7][g];
      else i = Math.max(s.i + 1, Math.round(s.i * (g === 1 ? 1.2 : g === 2 ? s.e : s.e * 1.35)));
      if (g === 1) s.e = Math.max(1.3, s.e - 0.15);
      if (g === 3) s.e = Math.min(3, s.e + 0.15);
      s.i = i; s.r++; s.d = dayStart(now) + i * DAY;
    }
    s.t = now;
    return s;
  }
  const XP_GRADE = [3, 6, 10, 14];
  LP.srs = {
    state: id => srsMap[id] || null,
    all: () => srsMap,
    isDue: (id, now) => { const s = srsMap[id]; return !!s && s.d <= (now || Date.now()); },
    preview(id) { return [0, 1, 2, 3].map(g => (g === 0 ? '< 10 min' : LP.fmtInterval(schedule(srsMap[id], g).i))); },
    grade(id, g) {
      const first = !srsMap[id];
      srsMap[id] = schedule(srsMap[id], g);
      const t = LP.today(); t.rv++; if (first) t.nw++;
      stats.reviews++; if (nightNow()) stats.night++; timeFlags();
      LP.track && LP.track('review');
      saveSrs();
      LP.award(XP_GRADE[g]);
      return srsMap[id];
    },
    flag(id) {
      if (!srsMap[id]) { srsMap[id] = newState(); srsMap[id].t = Date.now(); }
      srsMap[id].d = Math.min(srsMap[id].d || Date.now(), Date.now());
      saveSrs(); LP.emit('progress');
    },
    reset() { srsMap = {}; saveSrs(); LP.emit('progress'); },
    queue(opts) {
      opts = opts || {};
      const now = Date.now(), m = opts.matiere;
      const pool = LP.defs.filter(d => !m || m === 'all' || d.matiere === m);
      const due = pool.filter(d => srsMap[d.id] && srsMap[d.id].d <= now).sort((a, b) => srsMap[a.id].d - srsMap[b.id].d);
      const left = Math.max(0, LP.prefs.get().newPerDay - LP.today().nw);
      const fresh = LP.shuffle(pool.filter(d => !srsMap[d.id] && !manual.has(d.id))).slice(0, left);
      return { due, fresh, cards: due.concat(fresh) };
    },
    forecast(days) {
      const base = dayStart(), out = [];
      for (let k = 0; k < days; k++) {
        const lo = k === 0 ? -Infinity : base + k * DAY, hi = base + (k + 1) * DAY;
        out.push(Object.values(srsMap).filter(s => s.d >= lo && s.d < hi).length);
      }
      return out;
    },
    weak(n) {
      return Object.entries(srsMap).filter(([id, s]) => s.l > 0 && LP.byId.has(Number(id)))
        .sort((a, b) => b[1].l - a[1].l || a[1].e - b[1].e).slice(0, n).map(([id, s]) => ({ d: LP.byId.get(Number(id)), s }));
    }
  };
  LP.status = id => {
    if (manual.has(Number(id))) return 'mastered';
    const s = srsMap[id];
    if (!s) return 'new';
    if (s.i >= 21) return 'mastered';
    if (s.i >= 6) return 'review';
    return 'learning';
  };
  LP.STATUS_LABEL = { new: 'Nouvelle', learning: 'En cours', review: 'Consolidation', mastered: 'Maîtrisée' };
  LP.masteryBy = m => {
    const pool = LP.defs.filter(d => !m || d.matiere === m);
    return { total: pool.length, mastered: pool.filter(d => LP.status(d.id) === 'mastered').length, seen: pool.filter(d => LP.status(d.id) !== 'new').length };
  };
  LP.recordQuiz = (n, correct) => {
    const t = LP.today(); t.qz += n; t.ok += correct;
    LP.track && LP.track('quiz', { n, c: correct });
    stats.quiz += n; stats.correct += correct; stats.quizRuns++;
    const perfect = correct === n && n >= 10; if (perfect) stats.perfect++;
    if (nightNow()) stats.night++; timeFlags();
    saveAct(); saveStats();
    const xp = correct * 8 + (perfect ? 25 : 0);
    LP.award(xp);
    return xp;
  };

  /* ---------- badges ---------- */
  const BADGES = [
    { id: 'first', n: 'Premier pas', d: 'Termine ta première révision', i: 'sparkles', t: c => c.s.reviews >= 1 },
    { id: 'rev100', n: 'Centurion', d: '100 cartes révisées', i: 'cards', t: c => c.s.reviews >= 100 },
    { id: 'rev500', n: 'Marathonien', d: '500 cartes révisées', i: 'trophy', t: c => c.s.reviews >= 500 },
    { id: 'st3', n: 'Sur la lancée', d: '3 jours de suite', i: 'flame', t: c => c.s.best >= 3 },
    { id: 'st7', n: 'Semaine parfaite', d: '7 jours de suite', i: 'flame', t: c => c.s.best >= 7 },
    { id: 'st30', n: 'Inarrêtable', d: '30 jours de suite', i: 'flame', t: c => c.s.best >= 30 },
    { id: 'm10', n: 'Bien ancré', d: '10 notions maîtrisées', i: 'target', t: c => c.mastered >= 10 },
    { id: 'm50', n: 'Expert', d: '50 notions maîtrisées', i: 'shield', t: c => c.mastered >= 50 },
    { id: 'quiz1', n: 'Curieux', d: 'Termine un quiz', i: 'zap', t: c => c.s.quizRuns >= 1 },
    { id: 'perfect', n: 'Sans faute', d: 'Quiz parfait (10 questions ou +)', i: 'check', t: c => c.s.perfect >= 1 },
    { id: 'fav10', n: 'Collectionneur', d: '10 favoris', i: 'star', t: c => c.favs >= 10 },
    { id: 'contrib', n: 'Contributeur', d: 'Propose une définition', i: 'inbox', t: c => c.sent >= 1 },
    { id: 'night', n: 'Oiseau de nuit', d: 'Révise après 23 h', i: 'moon', t: c => c.s.night >= 1 },
    { id: 'lvl5', n: 'Niveau 5', d: 'Atteins le niveau 5', i: 'trophy', t: c => c.level >= 5 },
    // Badges rares : leur description reste cachée tant qu'ils ne sont pas obtenus
    { id: 'r_sun', rare: 1, n: 'Dimanche studieux', d: 'Révise un dimanche soir, après 20 h', i: 'moon', t: c => c.s.sun >= 1 },
    { id: 'r_early', rare: 1, n: 'Lève-tôt', d: 'Révise entre 4 h et 6 h du matin', i: 'sun', t: c => c.s.early >= 1 },
    { id: 'r_surv', rare: 1, n: 'Survivant', d: '10 bonnes réponses d\'affilée en mode Survie', i: 'shield', t: c => c.s.bestSurv >= 10 },
    { id: 'r_exp', rare: 1, n: 'Éclair', d: '15 bonnes réponses en 3 minutes (Express)', i: 'zap', t: c => c.s.bestExp >= 15 },
    { id: 'r_cloze', rare: 1, n: 'Maître des trous', d: '50 cartes à trous complétées', i: 'edit', t: c => c.s.cloze >= 50 },
    { id: 'r_redo', rare: 1, n: 'Rédemption', d: 'Refais tes erreurs sans aucune faute (3 notions ou plus)', i: 'refresh', t: c => c.s.redo >= 1 },
    { id: 'r_perfect5', rare: 1, n: 'Perfectionniste', d: '5 quiz parfaits', i: 'trophy', t: c => c.s.perfect >= 5 },
    { id: 'r_chest', rare: 1, n: 'Chasseur de coffres', d: 'Ouvre 5 coffres de récompense', i: 'star', t: c => c.s.chests >= 5 },
    { id: 'r_st100', rare: 1, n: 'Centenaire', d: '100 jours de suite', i: 'flame', t: c => c.s.best >= 100 }
  ];
  const badgeCtx = () => ({
    s: stats, favs: favs.size, sent: LP.sent.list().length, level: LP.level().level,
    mastered: LP.defs.filter(d => LP.status(d.id) === 'mastered').length
  });
  LP.badges = () => { const c = badgeCtx(); return BADGES.map(b => ({ id: b.id, n: b.n, d: b.d, i: b.i, rare: !!b.rare, got: stats.badges[b.id] || (b.t(c) ? Date.now() : 0) })); };
  LP.checkBadges = () => {
    const c = badgeCtx(); let changed = false;
    BADGES.forEach(b => { if (!stats.badges[b.id] && b.t(c)) { stats.badges[b.id] = Date.now(); changed = true; LP.emit('badge', b); } });
    if (changed) saveStats();
  };


  /* ---------- qualité des données & fiabilité des quiz ---------- */
  const words = t => new Set(norm(t).split(/[^a-z0-9]+/).filter(w => w.length > 3));
  const jac = (a, b) => { const A = words(a), B = words(b); if (!A.size || !B.size) return 0; let i = 0; A.forEach(w => B.has(w) && i++); return i / (A.size + B.size - i); };
  LP.similar = jac;
  // Une notion est utilisable en quiz si elle a un terme et une définition exploitable.
  LP.quizable = d => !!d && String(d.term || '').trim().length >= 2 && String(d.def || '').trim().length >= 15;
  // Un distracteur est valide s'il ne peut pas passer pour une autre bonne réponse.
  LP.validDistractor = (d, x) => {
    if (!LP.quizable(x) || x.id === d.id) return false;
    const names = [d.term].concat(d.aliases || []).map(norm), xn = [x.term].concat(x.aliases || []).map(norm);
    if (names.some(n => xn.includes(n))) return false;          // même terme / synonyme
    if (norm(x.def) === norm(d.def)) return false;              // définition identique
    if (jac(x.def, d.def) > 0.6) return false;                  // définitions quasi identiques : ambigu
    return true;
  };
  // Construit une question à 4 choix (ou moins s'il n'y a pas assez de distracteurs valides). Retourne null si non fiable.
  LP.buildQuestion = (d, type) => {
    if (!LP.quizable(d)) return null;
    const pick = arr => LP.shuffle(arr.filter(x => LP.validDistractor(d, x)));
    const out = [], seen = new Set([norm(d.term)]);
    const add = arr => { for (const x of arr) { if (out.length >= 3) break; const k = norm(x.term); if (!seen.has(k)) { seen.add(k); out.push(x); } } };
    add(pick(LP.defs.filter(x => x.matiere === d.matiere))); add(pick(LP.defs));
    if (out.length < 2) return null;
    return { id: d.id, type, opts: LP.shuffle([d].concat(out)).map(x => x.id) };
  };

  /* ---------- cartes à trous ---------- */
  const STOP = new Set('alors aucun aucune auquel aussi autre autres avant avec avoir cette celle celui ceux chaque chez comme comment dans depuis donc dont elle elles encore entre etre faire fait font leur leurs lors mais meme moins nous notamment parce pour pourquoi quand quel quelle quelles quels sans selon sont sous sur toute toutes tous tout tres vers vous ainsi apres afin etant etait ete peut peuvent doit doivent permet permettent ensemble ceux-ci celles'.split(' '));
  const WORD = /[\p{L}][\p{L}'’-]*/gu;
  const key = w => norm(w).replace(/[^a-z]/g, '');
  const wordsOf = text => { const out = []; String(text || '').replace(WORD, w => { const k = key(w); if (k.length >= 6 && !STOP.has(k)) out.push({ w, k }); return w; }); return out; };
  LP.buildCloze = d => {
    if (!LP.quizable(d)) return null;
    const cands = wordsOf(d.def); if (!cands.length) return null;
    const maxLen = Math.max.apply(null, cands.map(c => c.k.length));
    const best = LP.shuffle(cands.filter(c => c.k.length >= Math.max(6, maxLen - 2)))[0];
    const ans = best.w.toLowerCase(), defKeys = new Set(String(d.def).split(/[^\p{L}]+/u).map(key));
    const used = new Set([best.k]), opts = [];
    const tryDef = x => {
      if (opts.length >= 3 || x.id === d.id || !LP.quizable(x)) return;
      const c = LP.shuffle(wordsOf(x.def).filter(c => !used.has(c.k) && !defKeys.has(c.k) && Math.abs(c.k.length - best.k.length) <= 3 && c.k.slice(0, 5) !== best.k.slice(0, 5)))[0];
      if (c) { used.add(c.k); opts.push(c.w.toLowerCase()); }
    };
    LP.shuffle(LP.defs.filter(x => x.matiere === d.matiere)).forEach(tryDef);
    if (opts.length < 3) LP.shuffle(LP.defs).forEach(tryDef);
    if (opts.length < 2) return null;
    const masked = String(d.def).replace(WORD, w => key(w) === best.k ? '[[BLANK]]' : w);
    const all = LP.shuffle([ans].concat(opts));
    return { id: d.id, type: 'cloze', masked, opts: all, a: all.indexOf(ans) };
  };
  // Meilleurs scores des modes Express et Survie + compteur de cartes à trous
  LP.recordMode = (mode, correct, cloze) => {
    if (mode === 'survival') stats.bestSurv = Math.max(stats.bestSurv || 0, correct);
    if (mode === 'express') stats.bestExp = Math.max(stats.bestExp || 0, correct);
    stats.cloze = (stats.cloze || 0) + (cloze || 0);
    saveStats(); LP.checkBadges();
  };
  // Audit de la base : renvoie des problèmes concrets, jamais de « vérification » prétendue.
  LP.auditDefs = () => {
    const issues = [], byTerm = new Map(), byDef = new Map();
    LP.defs.forEach(d => {
      if (!String(d.term || '').trim()) issues.push({ id: d.id, t: 'Terme manquant', term: '#' + d.id });
      if (!String(d.def || '').trim()) issues.push({ id: d.id, t: 'Définition manquante', term: d.term });
      else if (d.def.trim().length < 15) issues.push({ id: d.id, t: 'Définition très courte', term: d.term });
      if (!LP.SUBJECTS.includes(d.matiere)) issues.push({ id: d.id, t: 'Matière inconnue : ' + d.matiere, term: d.term });
      if (d.source && !LP.safeUrl(d.source) && !/^[^<>]{3,}$/.test(d.source)) issues.push({ id: d.id, t: 'Source invalide', term: d.term });
      const k = norm(d.term).trim(), k2 = norm(d.def).trim();
      if (k) (byTerm.get(k) || byTerm.set(k, []).get(k)).push(d);
      if (k2) (byDef.get(k2) || byDef.set(k2, []).get(k2)).push(d);
    });
    byTerm.forEach(l => l.length > 1 && issues.push({ id: l[0].id, t: 'Terme en double (' + l.map(x => '#' + x.id).join(', ') + ')', term: l[0].term }));
    byDef.forEach(l => l.length > 1 && issues.push({ id: l[0].id, t: 'Définition identique : ' + l.map(x => x.term).join(' / '), term: l[0].term }));
    const withSource = LP.defs.filter(d => String(d.source || '').trim()).length;
    return { total: LP.defs.length, issues, withSource, quizable: LP.defs.filter(LP.quizable).length };
  };

  /* ---------- préférences ---------- */
  const DEF_PREFS = { theme: 'auto', accent: 'blue', tint: true, fontSize: 100, reduceMotion: false, font: 'std', spacing: false, dailyGoal: 15, newPerDay: 8, analytics: true, examDate: '' };
  LP.prefs = {
    key: () => { const s = LP.auth.session(); return s ? s.id : 'anonymous'; },
    all: () => lsGet(K.prefs, {}) || {},
    get() { const a = this.all(); return Object.assign({}, DEF_PREFS, a[this.key()] || a.anonymous || {}); },
    set(p) {
      const all = this.all(); const k = this.key();
      all[k] = Object.assign({}, all[k] || {}, p); lsSet(K.prefs, all);
      const v = this.get();
      try {
        v.theme === 'auto' ? localStorage.removeItem(K.theme) : localStorage.setItem(K.theme, v.theme);
        localStorage.setItem(K.accent, v.accent); localStorage.setItem('lexiprof_tint', v.tint ? '1' : '0'); localStorage.setItem(K.fs, String(v.fontSize));
        localStorage.setItem(K.rm, v.reduceMotion ? '1' : '0');
      } catch (e) {}
      LP.applyPrefs(); LP.emit('prefs');
    }
  };
  LP.resolvedTheme = () => { const t = LP.prefs.get().theme; return t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; };
  LP.applyPrefs = () => {
    const p = LP.prefs.get(), e = document.documentElement;
    e.dataset.theme = LP.resolvedTheme(); e.dataset.accent = p.accent;
    e.style.fontSize = p.fontSize + '%'; e.dataset.tint = p.tint === false ? 'off' : 'on';
    p.reduceMotion ? (e.dataset.motion = 'reduce') : e.removeAttribute('data-motion');
    e.dataset.font = ['hyper', 'dys'].includes(p.font) ? p.font : 'std'; p.spacing ? (e.dataset.spacing = 'on') : e.removeAttribute('data-spacing');
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = e.dataset.theme === 'dark' ? '#0a0c11' : '#f3f4f8';
  };
  LP.resetAppearance = () => LP.prefs.set({ theme: 'auto', accent: 'blue', tint: true, fontSize: 100, reduceMotion: false, font: 'std', spacing: false });
  LP.toggleTheme = () => { LP.prefs.set({ theme: LP.resolvedTheme() === 'dark' ? 'light' : 'dark' }); };
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => LP.applyPrefs()); } catch (e) {}

  /* ---------- propositions & signalements ---------- */
  LP.sent = {
    list: () => lsGet(K.sent, []) || [],
    add(p) { const l = this.list(); l.unshift({ id: p.id, term: p.term, matiere: p.matiere, def: p.def, createdAt: p.createdAt }); lsSet(K.sent, l.slice(0, 50)); }
  };
  LP.submitProposal = async f => {
    const last = Number(localStorage.getItem(K.lastSent) || 0);
    if (Date.now() - last < 20000) throw new Error('Patiente quelques secondes avant d\'envoyer une autre proposition.');
    const cut = (v, n) => String(v || '').trim().slice(0, n);
    const e = {
      id: LP.uid(), term: cut(f.term, 120), matiere: cut(f.matiere || 'Management', 30), def: cut(f.def, 2000),
      example: cut(f.example, 1000), remember: cut(f.remember, 500), source: cut(f.source, 500),
      pseudo: cut(f.pseudo, 60), email: cut(f.email, 120), status: 'pending', createdAt: new Date().toISOString()
    };
    await LP.api.post('proposals', e);
    localStorage.setItem(K.lastSent, String(Date.now()));
    LP.sent.add(e); LP.checkBadges(); LP.emit('progress');
    return e;
  };
  LP.submitReport = async r => {
    const cut = (v, n) => String(v || '').trim().slice(0, n);
    await LP.api.post('reports', { id: LP.uid(), definitionId: Number(r.definitionId) || 0, term: cut(r.term, 120), message: cut(r.message, 1000), reason: cut(r.reason, 60), status: 'pending', createdAt: new Date().toISOString() });
  };

  /* ---------- sauvegarde / restauration ---------- */
  LP.exportAll = () => ({
    app: 'LexiProf', version: 2, at: new Date().toISOString(),
    account: (s => s ? { email: s.email, displayName: s.displayName, createdAt: s.createdAt } : null)(LP.auth.session()),
    prefs: LP.prefs.get(), favorites: [...favs], mastered: [...manual], srs: srsMap, activity: act, stats, history: LP.history.list(), proposalsSent: LP.sent.list(), fun: LP.fun ? LP.fun.dump() : undefined
  });
  LP.importAll = o => {
    if (!o || o.app !== 'LexiProf') throw new Error('Fichier de sauvegarde invalide.');
    (o.favorites || []).forEach(id => favs.add(Number(id))); lsSet(K.favorites, [...favs]);
    (o.mastered || []).forEach(id => manual.add(Number(id))); lsSet(K.mastered, [...manual]);
    Object.entries(o.srs || {}).forEach(([id, s]) => { if (!srsMap[id] || (s.t || 0) > (srsMap[id].t || 0)) srsMap[id] = s; });
    Object.entries(o.activity || {}).forEach(([k, a]) => {
      const c = act[k] || { rv: 0, qz: 0, ok: 0, xp: 0, nw: 0 };
      act[k] = { rv: Math.max(c.rv, a.rv || 0), qz: Math.max(c.qz, a.qz || 0), ok: Math.max(c.ok, a.ok || 0), xp: Math.max(c.xp, a.xp || 0), nw: Math.max(c.nw, a.nw || 0) };
    });
    const s = o.stats || {};
    ['xp', 'reviews', 'quiz', 'correct', 'quizRuns', 'perfect', 'night', 'best', 'bestSurv', 'bestExp', 'cloze', 'chests', 'sun', 'early', 'redo'].forEach(k => { stats[k] = Math.max(stats[k] || 0, s[k] || 0); });
    stats.badges = Object.assign({}, s.badges || {}, stats.badges);
    if (o.fun && LP.fun) LP.fun.restore(o.fun);
    saveSrs(); saveAct(); saveStats(); LP.checkBadges(); LP.emit('progress');
  };
  LP.resetProgress = () => {
    srsMap = {}; act = {}; favs.clear(); manual.clear();
    stats = { xp: 0, reviews: 0, quiz: 0, correct: 0, quizRuns: 0, perfect: 0, night: 0, best: 0, bestSurv: 0, bestExp: 0, cloze: 0, chests: 0, sun: 0, early: 0, redo: 0, badges: {}, since: Date.now() };
    saveSrs(); saveAct(); saveStats(); lsSet(K.favorites, []); lsSet(K.mastered, []);
    LP.history.clear(); localStorage.removeItem(K.misses); if (LP.fun) LP.fun.reset(); LP.emit('progress'); LP.emit('favs');
  };
  LP.wipeLocal = () => {
    Object.keys(localStorage).filter(k => k.startsWith('lexiprof_') && !['lexiprof_me', 'lexiprof_tok', K.users, K.session, K.adminPwd].includes(k)).forEach(k => localStorage.removeItem(k));
    LP.clearCache();
  };
})();
