/* ============================================================
   LexiProf 2.0 — views3.js : onglets admin (Import, Statistiques, Export PDF, Qualité, Offres)
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, $$ = LP.$$, esc = LP.esc, ic = LP.ic, A = LP.actions;
  const plural = (n, a, b) => (n > 1 ? b : a);
  const T = (LP.adminTabs = {});
  LP.adminTabList = [['import', 'Importer'], ['stats', 'Statistiques'], ['quality', 'Qualité'], ['audit', 'Journal']];
  const admin = () => LP.adm();                     // état partagé exposé par views2
  const guard = () => { if (!LP.admin.unlocked()) { LP.views.admin($('#view')); return false; } LP.admin.touch(); return true; };
  const fdate = ts => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  // Un fichier lâché à côté de la zone ne doit pas faire quitter l'application.
  ['dragover', 'drop'].forEach(e => window.addEventListener(e, ev => { if (ev.dataTransfer && Array.from(ev.dataTransfer.types || []).includes('Files')) ev.preventDefault(); }));

  /* ================= IMPORT ================= */
  const DRAFT = 'lexiprof_import_draft';
  const draftGet = () => { try { return localStorage.getItem(DRAFT) || ''; } catch (e) { return ''; } };
  const draftSet = t => { try { t ? localStorage.setItem(DRAFT, t.slice(0, 400000)) : localStorage.removeItem(DRAFT); } catch (e) {} };
  const imp = { stage: 'input', text: draftGet(), name: '', policy: 'skip', m: 'Management', items: [], res: null, busy: false, err: '', filter: 'all', sort: 'line', dir: 1, q: '', shown: 50 };
  const impReset = () => { draftSet(''); return Object.assign(imp, { stage: 'input', text: '', name: '', items: [], res: null, busy: false, err: '', filter: 'all', info: '', sort: 'line', dir: 1, q: '', shown: 50 }); };
  const IMP_LAB = { ok: ['✓ Nouvelle', 'st-ok'], dup: ['! Ignorée', 'st-warn'], update: ['! Mise à jour', 'st-warn'], 'dup-file': ['✕ Doublon fichier', 'st-bad'], reject: ['✕ Rejetée', 'st-bad'] };
  const IMP_ORD = { ok: 0, update: 1, dup: 2, 'dup-file': 3, reject: 4 };
  const impTerm = i => (i.def && i.def.term) || (i.raw && i.raw.term) || '';
  function impList() {
    const q = LP.norm(imp.q || '');
    let l = imp.items.filter(i => imp.filter === 'all' || (imp.filter === 'bad' ? (i.status === 'reject' || i.status === 'dup-file') : imp.filter === 'dup' ? i.status === 'dup' || i.status === 'update' : i.status === 'ok'));
    if (q) l = l.filter(i => LP.norm(impTerm(i) + ' ' + ((i.def && i.def.def) || '') + ' ' + (i.reason || '')).includes(q));
    const key = { line: i => i.line, term: i => LP.norm(impTerm(i)), matiere: i => (i.def && i.def.matiere) || '', status: i => IMP_ORD[i.status] };
    return l.slice().sort((a, b) => { const x = key[imp.sort](a), y = key[imp.sort](b); return (x < y ? -1 : x > y ? 1 : a.line - b.line) * imp.dir; });
  }
  const impRowHtml = i => `<tr><td data-l="Ligne">${i.line}</td><td data-l="Terme"><b>${esc(impTerm(i) || '—')}</b></td><td data-l="Matière">${esc(i.def ? i.def.matiere : '')}</td><td data-l="Définition">${esc(((i.def && i.def.def) || '').slice(0, 90))}</td><td data-l="Statut" class="${IMP_LAB[i.status][1]}">${IMP_LAB[i.status][0]}${i.reason && i.status !== 'ok' ? '<br><small>' + esc(i.reason) + '</small>' : ''}</td></tr>`;
  const impRowsHtml = () => impList().slice(0, imp.shown).map(impRowHtml).join('') || '<tr><td colspan="5" class="muted">Rien à afficher pour ce filtre.</td></tr>';
  const impFootHtml = () => { const n = impList().length; return `<span>${Math.min(n, imp.shown)} affichée${Math.min(n, imp.shown) > 1 ? 's' : ''} sur ${n}</span>${n > imp.shown ? `<button class="btn soft sm" data-act="imp-more">Afficher 50 de plus</button>` : ''}`; };
  const impTh = (k, t) => `<th scope="col" aria-sort="${imp.sort === k ? (imp.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="thsort" data-act="imp-sort" data-k="${k}">${t}<span aria-hidden="true">${imp.sort === k ? (imp.dir > 0 ? ' ▲' : ' ▼') : ''}</span></button></th>`;
  T.import = body => {
    if (imp.stage === 'input') {
      body.innerHTML = `<div class="stack" style="max-width:none">
        <section class="card"><div class="card-head"><h3>${ic('upload', 18)} Importer des définitions</h3><button class="btn ghost sm" data-act="imp-tpl">${ic('download', 15)} Modèle CSV</button></div>
          <label class="drop" id="imp-drop" for="imp-file" tabindex="0" role="button" aria-label="Choisir ou déposer un fichier CSV, TSV ou JSON">${ic('upload', 28)}<p style="margin-top:8px"><b>Dépose un fichier ici</b> ou clique pour choisir</p><p class="muted" style="font-size:.8125rem">CSV, TSV ou JSON · 2 Mo et 2000 lignes maximum</p><p class="muted" id="imp-reading" hidden style="font-size:.8125rem">Lecture du fichier…</p><input type="file" id="imp-file" accept=".csv,.tsv,.txt,.json,text/csv,application/json"></label>
          <p class="muted" style="text-align:center;margin:12px 0">— ou colle ton texte —</p>
          <div id="imp-live" class="sr-only" aria-live="polite"></div>
          <textarea id="imp-text" class="textarea" rows="6" placeholder="Bilan : Document comptable qui décrit le patrimoine de l'entreprise.&#10;Prix ; Économie ; Valeur d'un bien exprimée en monnaie.&#10;(une notion par ligne, ou colle un CSV / JSON complet)">${esc(imp.text)}</textarea><p class="muted" id="imp-count" style="font-size:.8125rem;margin:6px 0 0">${imp.text.trim() ? imp.text.split(/\r?\n/).filter(l => l.trim()).length + ' ligne(s) collée(s) · brouillon conservé sur cet appareil' : ''}</p>
          <div class="row2" style="margin-top:12px"><div class="field"><label>Matière par défaut <small>(si absente)</small></label><select id="imp-m" class="select">${LP.SUBJECTS.map(m => `<option ${imp.m === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
          <div class="field"><label>Si la notion existe déjà</label><div class="seg"><button class="${imp.policy === 'skip' ? 'on' : ''}" data-act="imp-policy" data-v="skip">Ignorer</button><button class="${imp.policy === 'update' ? 'on' : ''}" data-act="imp-policy" data-v="update">Mettre à jour</button></div></div></div>
          ${imp.err ? `<p class="notice" style="color:var(--bad);margin-top:12px">${esc(imp.err)}</p>` : ''}
          <button class="btn primary lg block" style="margin-top:14px" data-act="imp-analyze">${ic('eye', 16)} Analyser et prévisualiser</button></section>
        <section class="card"><div class="card-head"><h3>${ic('list', 18)} Format attendu</h3></div>
          <div class="tbl-wrap"><table class="tbl rs"><caption class="sr-only">Champs acceptés</caption><thead><tr><th scope="col">Champ</th><th scope="col">Obligatoire</th><th scope="col">Détail</th></tr></thead><tbody>
          <tr><td data-l="Champ"><code>term</code> (terme)</td><td data-l="Obligatoire">Oui</td><td data-l="Détail">2 à 120 caractères</td></tr>
          <tr><td data-l="Champ"><code>def</code> (définition)</td><td data-l="Obligatoire">Oui</td><td data-l="Détail">15 à 2000 caractères</td></tr>
          <tr><td data-l="Champ"><code>matiere</code></td><td data-l="Obligatoire">Oui*</td><td data-l="Détail">${LP.SUBJECTS.join(', ')} (*ou matière par défaut)</td></tr>
          <tr><td data-l="Champ"><code>example</code>, <code>remember</code></td><td data-l="Obligatoire">Non</td><td data-l="Détail">1000 / 500 caractères</td></tr>
          <tr><td data-l="Champ"><code>source</code></td><td data-l="Obligatoire">Non</td><td data-l="Détail">Lien http(s) ou référence</td></tr>
          <tr><td data-l="Champ"><code>aliases</code></td><td data-l="Obligatoire">Non</td><td data-l="Détail">Synonymes séparés par « | »</td></tr></tbody></table></div>
          <p class="muted" style="font-size:.8125rem;margin-top:10px">CSV : séparateur « ; », « , » ou tabulation détecté automatiquement, en-têtes en français ou anglais. JSON : tableau ou <code>{ "definitions": [ … ] }</code>. Rien n'est enregistré avant ta validation.</p></section></div>`;
      const dz = $('#imp-drop'); let depth = 0;
      dz.addEventListener('dragenter', ev => { ev.preventDefault(); depth++; dz.classList.add('over'); });
      dz.addEventListener('dragover', ev => { ev.preventDefault(); dz.classList.add('over'); });
      dz.addEventListener('dragleave', ev => { ev.preventDefault(); depth = Math.max(0, depth - 1); if (!depth) dz.classList.remove('over'); });
      dz.addEventListener('drop', ev => { ev.preventDefault(); depth = 0; dz.classList.remove('over'); const f = ev.dataTransfer.files[0]; if (f) readFile(f); });
      dz.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('#imp-file').click(); } });
      $('#imp-file').addEventListener('change', ev => { const f = ev.target.files[0]; if (f) readFile(f); ev.target.value = ''; });
      $('#imp-text').addEventListener('input', ev => { imp.text = ev.target.value; imp.name = ''; draftSet(imp.text); const n = imp.text.split(/\r?\n/).filter(l => l.trim()).length; $('#imp-count').textContent = n ? n + ' ligne(s) collée(s) · brouillon conservé sur cet appareil' : ''; });
      $('#imp-m').addEventListener('change', ev => { imp.m = ev.target.value; });
    } else if (imp.stage === 'preview') {
      const s = LP.importer.summarize(imp.items);
      body.innerHTML = `<section class="card"><div class="card-head"><h3>${ic('eye', 18)} Aperçu · ${esc(imp.name || 'texte collé')}</h3><button class="btn ghost sm" data-act="imp-back">${ic('back', 15)} Modifier</button></div>
        ${imp.info ? `<div class="notice" style="margin-bottom:12px">${ic('alert')}<div>${esc(imp.info)}</div></div>` : ''}
        <div class="kpis" style="margin-bottom:14px"><div class="kpi"><b style="color:var(--ok)">${s.imported}</b><span>à ajouter</span></div><div class="kpi"><b>${s.updated}</b><span>à mettre à jour</span></div><div class="kpi"><b style="color:var(--warn)">${s.ignored}</b><span>ignorées (doublons)</span></div><div class="kpi"><b style="color:var(--bad)">${s.rejected}</b><span>rejetées</span></div></div>
        <div class="chips" style="margin-bottom:12px">${[['all', 'Toutes (' + s.total + ')'], ['ok', 'Nouvelles'], ['dup', 'Existantes'], ['bad', 'Problèmes']].map(([v, t]) => `<button class="chip ${imp.filter === v ? 'on' : ''}" data-act="imp-filter" data-v="${v}">${t}</button>`).join('')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px"><input class="input" id="imp-q" data-input="imp-q" placeholder="Rechercher dans l'aperçu…" value="${esc(imp.q)}" style="flex:1;min-width:200px"><button class="btn soft sm" data-act="imp-csvview">${ic('download', 15)} Exporter cette vue (CSV)</button></div>
        <div class="tbl-wrap" style="max-height:420px;overflow:auto"><table class="tbl rs"><caption class="sr-only">Aperçu de l'import</caption><thead><tr>${impTh('line', '#')}${impTh('term', 'Terme')}${impTh('matiere', 'Matière')}<th scope="col">Définition</th>${impTh('status', 'Statut')}</tr></thead><tbody id="imp-tbody">${impRowsHtml()}</tbody></table></div>
        <div class="tbl-foot" id="imp-foot">${impFootHtml()}</div>
        <div class="notice" style="margin-top:14px">${ic('shield')}<div>L'import est <b>atomique</b> : toutes les notions valides sont écrites en une seule opération, les notions existantes sont conservées. En cas d'échec, rien n'est modifié.</div></div>
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn primary lg" style="flex:1" data-act="imp-commit" ${s.imported + s.updated === 0 || imp.busy ? 'disabled' : ''}>${imp.busy ? 'Import en cours…' : `${ic('check', 16)} Importer ${s.imported + s.updated} ${plural(s.imported + s.updated, 'notion', 'notions')}`}</button>${s.rejected || s.ignored ? `<button class="btn soft lg" data-act="imp-rejects">${ic('download', 16)} Rapport des rejets</button>` : ''}</div></section>`;
    } else {
      const r = imp.res;
      body.innerHTML = `<section class="card result"><span class="tag ${r.ok ? 'new' : 'bad'}">${r.ok ? 'Import terminé' : 'Import échoué'}</span><div class="score" style="font-size:4rem">${r.ok ? r.imported + r.updated : 0}</div>
        <p class="muted-p">${r.ok ? `${r.imported} ajoutée${r.imported > 1 ? 's' : ''} · ${r.updated} mise${r.updated > 1 ? 's' : ''} à jour · ${r.ignored} ignorée${r.ignored > 1 ? 's' : ''} · ${r.rejected} rejetée${r.rejected > 1 ? 's' : ''}` : esc(r.error) + ' — aucune donnée n\'a été modifiée.'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button class="btn primary" data-act="imp-new">Nouvel import</button>${r.rejected + r.ignored ? `<button class="btn soft" data-act="imp-rejects">${ic('download', 16)} Rapport des rejets</button>` : ''}<button class="btn soft" data-act="ad-tab" data-v="defs">Voir les notions</button></div></section>`;
    }
  };
  const rerender = () => { const b = $('#ad-body .imp-host'); T.import(b); };
  async function readFile(f) {
    if (f.size > LP.importer.LIMITS.bytes) { imp.err = 'Fichier trop volumineux (2 Mo maximum).'; return rerender(); }
    const r = $('#imp-reading'); if (r) r.hidden = false;
    try {
      const d = LP.importer.decode(await f.arrayBuffer(), f.name);
      imp.text = d.text; imp.name = f.name; imp.err = ''; imp.info = d.encoding === 'UTF-8' ? '' : 'Encodage ' + d.encoding + ' détecté : les accents ont été convertis.';
      draftSet(''); analyze();
      const l = $('#imp-live'); if (l) l.textContent = 'Fichier reçu, ' + imp.items.length + ' lignes.';
    } catch (e) { imp.err = e.message; imp.stage = 'input'; rerender(); }
  }
  function analyze() {
    try {
      const p = LP.importer.parse(imp.text, imp.name);
      imp.items = LP.importer.validate(p.rows, { existing: LP.defs, policy: imp.policy, defaultMatiere: imp.m }); imp.parsed = p; imp.stage = 'preview'; imp.err = ''; imp.filter = 'all'; imp.shown = 50; imp.q = '';
    } catch (e) { imp.err = e.message; imp.stage = 'input'; }
    rerender();
  }
  A['imp-analyze'] = () => { imp.text = ($('#imp-text') || {}).value || imp.text; imp.m = ($('#imp-m') || {}).value || imp.m; analyze(); };
  A['imp-policy'] = el => { imp.policy = el.dataset.v; imp.text = ($('#imp-text') || {}).value || imp.text; rerender(); };
  A['imp-back'] = () => { imp.stage = 'input'; rerender(); };
  A['imp-new'] = () => { impReset(); rerender(); };
  A['imp-filter'] = el => { imp.filter = el.dataset.v; imp.shown = 50; rerender(); };
  A['imp-sort'] = el => { const k = el.dataset.k; if (imp.sort === k) imp.dir = -imp.dir; else { imp.sort = k; imp.dir = 1; } imp.shown = 50; rerender(); };
  A['imp-q'] = el => { imp.q = el.value; imp.shown = 50; const t = $('#imp-tbody'), f = $('#imp-foot'); if (t) t.innerHTML = impRowsHtml(); if (f) f.innerHTML = impFootHtml(); };
  A['imp-more'] = () => { imp.shown += 50; const t = $('#imp-tbody'), f = $('#imp-foot'); if (t) t.innerHTML = impRowsHtml(); if (f) f.innerHTML = impFootHtml(); };
  A['imp-csvview'] = () => { const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; LP.download('lexiprof-apercu-import-' + LP.dkey() + '.csv', '\ufeffligne;terme;matière;statut;motif\n' + impList().map(i => [i.line, impTerm(i), i.def ? i.def.matiere : '', IMP_LAB[i.status][0], i.reason].map(q).join(';')).join('\n'), 'text/csv;charset=utf-8'); };
  A['imp-tpl'] = () => { const b = new Blob([LP.importer.template()], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'lexiprof-modele-import.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  A['imp-rejects'] = () => { const b = new Blob([LP.importer.rejectsCSV(imp.items)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'lexiprof-rapport-import.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  A['imp-commit'] = async () => {
    if (!guard() || imp.busy) return;
    imp.busy = true; rerender();
    const snapshot = LP.defs.slice();
    try {
      await LP.refreshDefs();                                                   // repart de l'état serveur le plus récent
      imp.items = LP.importer.validate(imp.parsed.rows, { existing: LP.defs, policy: imp.policy, defaultMatiere: imp.m });
      const s = LP.importer.summarize(imp.items), next = LP.importer.apply(LP.defs, imp.items);
      if (next.length < LP.defs.length) throw new Error('Contrôle de cohérence : le nombre de notions diminuerait.');
      LP.setDefs(next);
      await LP.saveDefs();                                                      // une seule écriture
      draftSet(''); imp.res = Object.assign({ ok: true }, s); try { LP.audit.log('import', 'Import « ' + (imp.name || 'texte collé') + ' » : ' + s.imported + ' ajoutée' + (s.imported > 1 ? 's' : '') + ', ' + s.updated + ' mise' + (s.updated > 1 ? 's' : '') + ' à jour, ' + s.ignored + ' ignorée' + (s.ignored > 1 ? 's' : '') + ', ' + s.rejected + ' rejetée' + (s.rejected > 1 ? 's' : ''), { file: imp.name || '', format: imp.parsed && imp.parsed.format, imported: s.imported, updated: s.updated, ignored: s.ignored, rejected: s.rejected, terms: imp.items.filter(i => i.status === 'ok' || i.status === 'update').slice(0, 30).map(i => i.def.term) }); } catch (e) {} LP.track && LP.track('import', { n: s.imported });
    } catch (e) { LP.setDefs(snapshot); imp.res = { ok: false, error: e.message || 'Erreur inconnue', rejected: 0, ignored: 0 }; }
    imp.busy = false; imp.stage = 'done'; rerender();
  };


  /* ================= JOURNAL (audit des modifications) ================= */
  const jr = { rows: null, loading: false, err: '', cat: 'all', q: '', shown: 40 };
  const hhmm = t => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dayLabel = t => { const d = new Date(t), k = LP.dkey(d); if (k === LP.dkey()) return 'Aujourd\'hui'; const y = new Date(); y.setDate(y.getDate() - 1); if (k === LP.dkey(y)) return 'Hier'; return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
  const jrFiltered = () => { const q = LP.norm(jr.q || ''); return (jr.rows || []).filter(e => (jr.cat === 'all' || (LP.audit.TYPES[e.type] || [])[3] === jr.cat) && (!q || LP.norm(e.label + ' ' + e.who + ' ' + ((LP.audit.TYPES[e.type] || [e.type])[0])).includes(q))); };
  function jrDetails(e) {
    const m = e.meta || {}, bits = [];
    if (Array.isArray(m.changes) && m.changes.length) bits.push(m.changes.map(c => `<div class="diff"><span class="df">${esc(c.f)}</span><del>${esc(c.from || '(vide)')}</del><span class="arr">→</span><ins>${esc(c.to || '(vide)')}</ins></div>`).join(''));
    if (Array.isArray(m.terms) && m.terms.length) bits.push(`<div class="chips-s">${m.terms.slice(0, 30).map(t => `<span>${esc(t)}</span>`).join('')}${m.n > m.terms.length ? `<span>+${m.n - m.terms.length}</span>` : ''}</div>`);
    if (m.message) bits.push(`<p class="muted" style="margin:4px 0 0;font-size:.8125rem">« ${esc(m.message)} »</p>`);
    if (e.type === 'def.delete' && m.def && m.def.term) { const back = !LP.defs.some(d => LP.norm(d.term) === LP.norm(m.def.term)); bits.push(back ? `<button class="btn soft sm" data-act="jr-restore" data-t="${e.t}">${ic('refresh', 15)} Restaurer cette notion</button>` : '<small class="muted">Une notion de ce nom existe déjà.</small>'); }
    return bits.length ? `<details class="tl-det"><summary>Détails</summary>${bits.join('')}</details>` : '';
  }
  function jrListHtml() {
    const rows = jrFiltered();
    if (!rows.length) return `<div class="empty" style="padding:28px 0"><div class="bub">${ic('clock', 28)}</div><h3>${(jr.rows || []).length ? 'Aucune action pour ce filtre' : 'Aucune action enregistrée pour l\'instant'}</h3><p class="muted">${(jr.rows || []).length ? 'Change de catégorie ou efface la recherche.' : 'Dès que tu modifies une notion, importes un fichier ou traites une proposition, une ligne apparaît ici.'}</p></div>`;
    let last = '', out = '<ol class="tl">';
    rows.slice(0, jr.shown).forEach(e => {
      const t = LP.audit.TYPES[e.type] || [e.type, 'edit', 'muted', 'notions'], dl = dayLabel(e.t);
      if (dl !== last) { out += `<li class="tl-day">${esc(dl)}</li>`; last = dl; }
      out += `<li class="tl-item" data-c="${t[2]}"><span class="tl-ico" aria-hidden="true">${ic(t[1], 16)}</span><div class="tl-body"><div class="tl-top"><b>${esc(t[0])}</b><time datetime="${new Date(e.t).toISOString()}">${hhmm(e.t)}</time></div><p>${esc(e.label)}</p><small class="muted">par ${esc(e.who)}</small>${jrDetails(e)}</div></li>`;
    });
    out += '</ol>';
    if (rows.length > jr.shown) out += `<button class="btn soft block" data-act="jr-more" style="margin-top:12px">Afficher 40 de plus (${rows.length - jr.shown} restantes)</button>`;
    return out;
  }
  function jrChips() { const c = {}; (jr.rows || []).forEach(e => { const k = (LP.audit.TYPES[e.type] || [])[3]; c[k] = (c[k] || 0) + 1; }); return LP.audit.CATS.map(([k, t]) => `<button class="chip ${jr.cat === k ? 'on' : ''}" data-act="jr-cat" data-v="${k}">${t}${k === 'all' ? ' (' + (jr.rows || []).length + ')' : c[k] ? ' (' + c[k] + ')' : ''}</button>`).join(''); }
  function jrChart() {
    const days = [], cnt = {}; (jr.rows || []).forEach(e => { const k = LP.dkey(new Date(e.t)); cnt[k] = (cnt[k] || 0) + 1; });
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push([LP.dkey(d), d]); }
    const mx = Math.max(1, ...days.map(([k]) => cnt[k] || 0));
    return `<div class="jr-chart" role="img" aria-label="Actions par jour sur 30 jours">${days.map(([k, d]) => { const n = cnt[k] || 0; return `<i style="height:${n ? Math.max(8, Math.round(n / mx * 100)) : 3}%" class="${n ? 'on' : ''}" title="${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${n} action${n > 1 ? 's' : ''}"></i>`; }).join('')}</div><div class="jr-axis"><span>il y a 30 j</span><span>aujourd'hui</span></div>`;
  }
  function jrPaint(body) {
    const rows = jr.rows || [], today = LP.dkey(), wk = Date.now() - 7 * 864e5, first = rows.length ? rows[rows.length - 1].t : null, local = LP.authMode !== 'firebase';
    body.innerHTML = `<div class="stack" style="max-width:none">
      <section class="card"><div class="card-head"><h3>${ic('clock', 18)} Journal des modifications</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-act="jr-refresh">${ic('refresh', 15)} Actualiser</button><button class="btn soft sm" data-act="jr-csv" ${rows.length ? '' : 'disabled'}>${ic('download', 15)} Exporter CSV</button></div></div>
        ${jr.err ? `<div class="notice warn">${ic('alert')}<div>Lecture impossible : ${esc(jr.err)}. Vérifie que les règles Firebase (chemin « audit ») sont publiées.</div></div>` : ''}
        <div class="kpis"><div class="kpi"><b>${rows.length}</b><span>actions enregistrées</span></div><div class="kpi"><b>${rows.filter(e => LP.dkey(new Date(e.t)) === today).length}</b><span>aujourd'hui</span></div><div class="kpi"><b>${rows.filter(e => e.t >= wk).length}</b><span>sur 7 jours</span></div><div class="kpi"><b style="font-size:1.1rem">${rows.length ? esc(LP.timeAgo(rows[0].t)) : '—'}</b><span>dernière action</span></div></div>
        ${jrChart()}
        <div class="notice" style="margin-top:12px">${ic('shield')}<div>${first ? `Journal actif depuis le <b>${new Date(first).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</b>. Les actions faites avant cette version n'ont pas été enregistrées. ` : 'Le journal commence avec cette version : les actions passées n\'ont pas été enregistrées. '}${local ? 'Mode test : le journal est stocké sur <b>cet appareil</b> uniquement.' : 'Chaque entrée est en <b>ajout seul</b> : les règles interdisent de la modifier ou de l\'effacer.'}${LP.audit.pending() ? ` <b>${LP.audit.pending()} entrée(s) en attente d'envoi</b> (réseau).` : ''}</div></div>
      </section>
      <section class="card"><div class="chips" id="jr-chips" style="margin-bottom:12px">${jrChips()}</div>
        <input class="input" id="jr-q" data-input="jr-q" placeholder="Rechercher dans le journal (notion, auteur, action…)" value="${esc(jr.q)}" style="margin-bottom:14px">
        <div id="jr-list">${jrListHtml()}</div></section></div>`;
  }
  const jrHost = () => $('#ad-body .jr-host');
  T.audit = async body => {
    if (!jr.rows && !jr.loading) {
      jr.loading = true; body.innerHTML = '<div class="sk" style="height:240px"></div>';
      try { jr.rows = await LP.audit.list(); jr.err = ''; } catch (e) { jr.rows = []; jr.err = e.message || 'erreur'; }
      jr.loading = false;
    }
    const b = jrHost() || body; if (b.isConnected) jrPaint(b);
  };
  A['jr-refresh'] = async () => { jr.rows = null; const b = jrHost(); if (b) T.audit(b); };
  A['jr-cat'] = el => { jr.cat = el.dataset.v; jr.shown = 40; const c = $('#jr-chips'), l = $('#jr-list'); if (c) c.innerHTML = jrChips(); if (l) l.innerHTML = jrListHtml(); };
  A['jr-q'] = el => { jr.q = el.value; jr.shown = 40; const l = $('#jr-list'); if (l) l.innerHTML = jrListHtml(); };
  A['jr-more'] = () => { jr.shown += 40; const l = $('#jr-list'); if (l) l.innerHTML = jrListHtml(); };
  A['jr-csv'] = () => LP.download('lexiprof-journal-' + LP.dkey() + '.csv', LP.audit.csv(jrFiltered()), 'text/csv;charset=utf-8');
  A['jr-restore'] = async el => {
    if (!guard()) return; const e = (jr.rows || []).find(x => String(x.t) === el.dataset.t); if (!e || !e.meta || !e.meta.def) return;
    const d = Object.assign({}, e.meta.def); if (LP.defs.some(x => LP.norm(x.term) === LP.norm(d.term))) return LP.toast('Une notion de ce nom existe déjà', 'err');
    if (LP.byId.has(d.id)) d.id = LP.defs.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
    const snap = LP.defs.slice();
    try { LP.setDefs(LP.defs.concat(d)); await LP.saveDefs(); await LP.audit.log('def.restore', '« ' + d.term + ' » restaurée depuis le journal', { id: d.id, term: d.term, matiere: d.matiere }); LP.toast('Notion restaurée', 'ok'); jr.rows = null; const b = jrHost(); if (b) T.audit(b); }
    catch (err) { LP.setDefs(snap); LP.toast('Échec : ' + err.message, 'err'); }
  };

  /* ================= STATISTIQUES ================= */
  const st = { period: 30, events: null, loading: false, err: '' };
  const dayKey = o => { const d = new Date(); d.setDate(d.getDate() - o); return LP.dkey(d); };
  function line(vals, labels, h = 150) {
    const w = 560, p = 24, mx = Math.max(1, ...vals), n = vals.length, x = i => p + (n <= 1 ? 0 : i * (w - 2 * p) / (n - 1)), y = v => h - 22 - (v / mx) * (h - 44);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Courbe"><line class="gl" x1="${p}" x2="${w - p}" y1="${y(0)}" y2="${y(0)}"/><line class="gl" x1="${p}" x2="${w - p}" y1="${y(mx)}" y2="${y(mx)}"/><text x="2" y="${y(mx) + 3}">${mx}</text><text x="2" y="${y(0) + 3}">0</text>
      <polygon class="ar" points="${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}"/><polyline class="ln" points="${pts}"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.4" fill="var(--accent)"><title>${labels[i]} : ${v}</title></circle>`).join('')}<text x="${p}" y="${h - 4}">${labels[0]}</text><text x="${w - p}" y="${h - 4}" text-anchor="end">${labels[labels.length - 1]}</text></svg>`;
  }
  function bars(vals, labels, h = 150) {
    const w = 560, p = 24, mx = Math.max(1, ...vals), n = vals.length, bw = (w - 2 * p) / n;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Histogramme"><line class="gl" x1="${p}" x2="${w - p}" y1="${h - 22}" y2="${h - 22}"/>${vals.map((v, i) => { const bh = (v / mx) * (h - 44); return `<rect class="bar" x="${p + i * bw + 3}" y="${h - 22 - bh}" width="${Math.max(2, bw - 6)}" height="${bh}" rx="3"><title>${labels[i]} : ${v}</title></rect>`; }).join('')}<text x="${p}" y="${h - 6}">${labels[0]}</text><text x="${w - p}" y="${h - 6}" text-anchor="end">${labels[n - 1]}</text><text x="2" y="12">${mx}</text></svg>`;
  }
  const dist = (evs, from, to) => { const s = new Set(); evs.forEach(e => { if (e.d >= from && e.d <= to) s.add(e.a); }); return s; };
  const delta = (a, b) => b === 0 ? (a === 0 ? '' : 'nouveau') : (a >= b ? '+' : '') + Math.round((a - b) / b * 100) + ' %';
  function compute(p) {
    const evs = (st.events || []).filter(e => e && e.d && e.a), from = dayKey(p - 1), to = dayKey(0), pFrom = dayKey(2 * p - 1), pTo = dayKey(p);
    const cur = evs.filter(e => e.d >= from && e.d <= to), prev = evs.filter(e => e.d >= pFrom && e.d <= pTo);
    const days = []; for (let i = p - 1; i >= 0; i--) days.push(dayKey(i));
    const act = days.map(d => new Set(cur.filter(e => e.d === d).map(e => e.a)).size);
    const q = cur.filter(e => e.t === 'quiz'), pq = prev.filter(e => e.t === 'quiz');
    const n = q.reduce((a, e) => a + (e.n || 0), 0), c = q.reduce((a, e) => a + (e.c || 0), 0);
    // rétention 7 j : parmi ceux vus entre J-14 et J-8, part revue entre J-7 et aujourd'hui
    const base = dist(evs, dayKey(13), dayKey(7)), back = dist(evs, dayKey(6), dayKey(0)); let kept = 0; base.forEach(a => back.has(a) && kept++);
    return { evs, days, act, users: dist(cur, from, to).size, pUsers: dist(prev, pFrom, pTo).size, quizzes: q.length, pQuizzes: pq.length, answers: n, correct: c, reviews: cur.filter(e => e.t === 'review').length, pReviews: prev.filter(e => e.t === 'review').length, views: cur.filter(e => e.t === 'view').length, imports: cur.filter(e => e.t === 'import').length, dau: dist(evs, dayKey(0), dayKey(0)).size, wau: dist(evs, dayKey(6), dayKey(0)).size, mau: dist(evs, dayKey(29), dayKey(0)).size, ret: { base: base.size, kept } };
  }
  LP.adminStats = { compute, set: e => { st.events = e; } };
  T.stats = async body => {
    const a = admin();
    if (!a.props || !a.reps) await LP.adminLoad();
    if (st.events == null && !st.loading) {
      st.loading = true; body.innerHTML = '<div class="sk" style="height:240px"></div>';
      try { st.events = await LP.api.get('events'); st.err = ''; } catch (e) { st.events = []; st.err = e.message; }
      try { st.ov = await LP.admin.overview(); } catch (e) { st.ov = null; }
      try { st.int = (await LP.api.get('interest')).length; } catch (e) { st.int = null; }
      st.loading = false;
    }
    if (!$('#ad-body .st-host')) return;
    const p = st.period, d = compute(p), defs = LP.defs, since = Date.now() - p * LP.DAY;
    const addedDate = defs.filter(x => x.createdAt && !isNaN(Date.parse(x.createdAt))), noDate = defs.length - addedDate.length;
    const added = addedDate.filter(x => Date.parse(x.createdAt) >= since).length;
    const wk = []; for (let i = 11; i >= 0; i--) { const lo = Date.now() - (i + 1) * 7 * LP.DAY, hi = Date.now() - i * 7 * LP.DAY; wk.push(addedDate.filter(x => { const t = Date.parse(x.createdAt); return t >= lo && t < hi; }).length); }
    const props = a.props || [], reps = a.reps || [], pInP = props.filter(x => Date.parse(x.createdAt) >= since), pend = props.filter(x => !x.status || x.status === 'pending');
    const empty = !d.evs.length;
    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px"><div class="seg">${[7, 30, 90].map(v => `<button class="${p === v ? 'on' : ''}" data-act="st-period" data-v="${v}">${v} jours</button>`).join('')}</div><button class="btn soft sm" data-act="st-reload">${ic('refresh', 15)} Actualiser</button></div>
      <h3 style="margin:0 0 10px">Contenu <span class="muted" style="font-weight:400;font-size:.8125rem">· données réelles de la base</span></h3>
      <div class="kpis"><div class="kpi"><b>${defs.length}</b><span>notions</span></div><div class="kpi"><b>${added}</b><span>ajoutées sur ${p} j</span>${noDate ? `<small class="muted">${noDate} sans date de création</small>` : ''}</div><div class="kpi"><b>${pend.length}</b><span>propositions en attente</span><small class="muted">${pInP.length} reçues sur ${p} j</small></div><div class="kpi"><b>${reps.filter(r => r.status !== 'done').length}</b><span>signalements ouverts</span><small class="muted">${reps.length} au total</small></div></div>
      <div class="grid" style="margin-top:14px"><section class="card c6"><div class="card-head"><h3>Notions ajoutées · 12 semaines</h3></div>${addedDate.length ? bars(wk, wk.map((_, i) => i === 11 ? 'cette sem.' : 'il y a ' + (11 - i) + ' sem.')) : '<p class="muted">Aucune notion datée : les dates apparaîtront pour les prochains ajouts.</p>'}</section>
      <section class="card c6"><div class="card-head"><h3>Par matière</h3></div>${LP.SUBJECTS.map(m => { const n = defs.filter(x => x.matiere === m).length; return `<div class="mrow"><div class="t"><span>${LP.subj(m)}</span><span>${n} (${defs.length ? Math.round(n / defs.length * 100) : 0} %)</span></div><div class="pbar" data-m="${m}"><i style="--w:${defs.length ? Math.round(n / defs.length * 100) : 0}%"></i></div></div>`; }).join('')}</section></div>
      <h3 style="margin:22px 0 4px">Usage <span class="muted" style="font-weight:400;font-size:.8125rem">· statistiques anonymes</span></h3>
      <p class="muted" style="font-size:.8125rem;margin-bottom:10px">Échantillon : visiteurs ayant <b>accepté</b> les statistiques anonymes (identifiant aléatoire par appareil, sans nom ni email). Les chiffres sous-estiment l'usage réel. ${st.err ? `<span style="color:var(--bad)">Lecture impossible : ${esc(st.err)}</span>` : ''}</p>
      ${empty ? `<div class="empty"><div class="bub">${ic('chart', 28)}</div><h3>Pas encore de données d'usage</h3><p>Aucun événement enregistré. Ils apparaîtront dès que des visiteurs auront activé les statistiques anonymes (Confidentialité).</p></div>` : `
      <div class="kpis"><div class="kpi"><b>${d.users}</b><span>appareils actifs (${p} j)</span><small class="muted">${d.pUsers ? delta(d.users, d.pUsers) + ' vs période préc.' : 'période préc. : aucune donnée'}</small></div>
      <div class="kpi"><b>${d.quizzes}</b><span>quiz terminés</span><small class="muted">${d.pQuizzes ? delta(d.quizzes, d.pQuizzes) + ' vs préc.' : ''}</small></div>
      <div class="kpi"><b>${d.answers ? Math.round(d.correct / d.answers * 100) + ' %' : '—'}</b><span>réussite aux quiz</span><small class="muted">${d.correct}/${d.answers} réponses</small></div>
      <div class="kpi"><b>${d.reviews}</b><span>cartes révisées</span><small class="muted">${d.pReviews ? delta(d.reviews, d.pReviews) + ' vs préc.' : ''}</small></div></div>
      <div class="kpis" style="margin-top:12px"><div class="kpi"><b>${d.dau}</b><span>actifs aujourd'hui</span></div><div class="kpi"><b>${d.wau}</b><span>actifs sur 7 j</span></div><div class="kpi"><b>${d.mau}</b><span>actifs sur 30 j</span></div><div class="kpi"><b>${d.ret.base ? Math.round(d.ret.kept / d.ret.base * 100) + ' %' : '—'}</b><span>rétention à 7 j</span><small class="muted">${d.ret.base ? d.ret.kept + ' sur ' + d.ret.base + ' appareils' : 'pas assez de données'}</small></div></div>
      <section class="card" style="margin-top:14px"><div class="card-head"><h3>Appareils actifs par jour</h3></div>${line(d.act, d.days.map(x => fdate(Date.parse(x + 'T12:00:00'))))}</section>
      <p class="muted" style="font-size:.8125rem;margin-top:8px">Fiches consultées : ${d.views} · Imports : ${d.imports} · ${d.evs.length} événements lus (20 000 derniers maximum).</p>`}
      <h3 style="margin:22px 0 10px">Comptes et offres <span class="muted" style="font-weight:400;font-size:.8125rem">· données réelles du serveur</span></h3>
      ${st.int != null ? `<div class="kpis" style="margin-bottom:12px"><div class="kpi"><b>${st.int}</b><span>élèves intéressés par Premium (clic « Je veux Premium »)</span></div></div>` : ''}
      ${st.ov ? (() => { const o = st.ov, ks = Object.keys(o.signups).slice(-p), vals = ks.map(k => o.signups[k]), tot = vals.reduce((a, b) => a + b, 0); return `<div class="kpis"><div class="kpi"><b>${o.users}</b><span>comptes créés</span></div><div class="kpi"><b>${tot}</b><span>inscriptions sur ${p} j</span></div><div class="kpi"><b>${o.active7}</b><span>comptes actifs 7 j</span><small class="muted">${o.users ? Math.round(o.active7 / o.users * 100) + ' % des comptes' : ''}</small></div><div class="kpi"><b>${o.plans.premium}</b><span>premium / ${o.users} comptes</span><small class="muted">${o.plansLaunched ? '' : 'offres non lancées'}</small></div></div>${o.users ? `<section class="card" style="margin-top:14px"><div class="card-head"><h3>Inscriptions par jour</h3></div>${bars(vals, ks.map(k => fdate(Date.parse(k + 'T12:00:00'))))}</section>` : '<p class="muted" style="margin-top:10px">Aucun compte pour le moment.</p>'}`; })() : `<div class="notice">${ic('alert')}<div>Données de comptes indisponibles (serveur injoignable ou accès refusé).</div></div>`}`;
  };
  A['st-period'] = el => { st.period = Number(el.dataset.v); T.stats($('#ad-body .st-host')); };
  A['st-reload'] = () => { st.events = null; T.stats($('#ad-body .st-host')); };

  /* ================= QUALITÉ ================= */
  T.quality = body => {
    const q = LP.auditDefs(), pct = q.total ? Math.round(q.withSource / q.total * 100) : 0;
    body.innerHTML = `<div class="kpis"><div class="kpi"><b>${q.total}</b><span>notions</span></div><div class="kpi"><b>${q.quizable}</b><span>exploitables en quiz</span></div><div class="kpi"><b>${q.issues.length}</b><span>problèmes détectés</span></div><div class="kpi"><b>${pct} %</b><span>avec source renseignée</span><small class="muted">${q.withSource} sur ${q.total}</small></div></div>
      <div class="notice" style="margin:14px 0">${ic('shield')}<div><b>Provenance des quiz :</b> questions et réponses sont générées à la volée à partir des notions de la base de données (copie hors ligne puis jeu d'exemples intégré si le serveur est injoignable). Les mauvaises réponses sont tirées des autres notions en excluant termes, synonymes et définitions identiques ou très proches. Le champ « source » est déclaratif : <b>l'application ne vérifie pas</b> les définitions et ne les présente pas comme officielles.</div></div>
      <section class="card"><div class="card-head"><h3>${ic('alert', 18)} Anomalies</h3></div>${q.issues.length ? `<div class="list">${q.issues.map(i => `<button class="li" data-act="open-def" data-id="${i.id}"><div><b>${esc(i.term)}</b><small>${esc(i.t)}</small></div></button>`).join('')}</div>` : '<p class="muted">Aucune anomalie détectée.</p>'}</section>`;
  };

})();
