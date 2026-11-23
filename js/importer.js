/* ============================================================
   LexiProf 2.0 — importer.js : analyse et validation d'imports (pur, testable)
   Format : JSON (tableau ou {definitions:[…]}) ou CSV/TSV avec en-têtes.
   Champs : term*, matiere*, def*, example, remember, source, aliases (séparés par « | »)
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const LIMITS = { rows: 2000, bytes: 2 * 1024 * 1024, term: 120, def: 2000, example: 1000, remember: 500, source: 500 };
  const HEAD = {
    term: ['term', 'terme', 'notion', 'mot', 'titre'], matiere: ['matiere', 'matière', 'subject', 'discipline'],
    def: ['def', 'definition', 'définition', 'description'], example: ['example', 'exemple'],
    remember: ['remember', 'a retenir', 'à retenir', 'retenir'], source: ['source', 'lien', 'url'], aliases: ['aliases', 'alias', 'synonymes', 'synonyme']
  };
  const KEY = {}; Object.entries(HEAD).forEach(([k, l]) => l.forEach(n => (KEY[norm(n)] = k)));

  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const first = text.split(/\r?\n/, 1)[0] || '';
    const cnt = c => (first.match(new RegExp(c === '\t' ? '\\t' : '\\' + c, 'g')) || []).length;
    // « | » sert déjà à séparer les alias : il n'est retenu qu'en dernier recours.
    const delim = [';', '\t', ','].map(c => [c, cnt(c)]).sort((a, b) => b[1] - a[1])[0];
    const D = delim[1] ? delim[0] : (cnt('|') ? '|' : ';');
    const rows = []; let row = [], cur = '', q = false, i = 0;
    for (; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"' && cur === '') q = true;
      else if (c === D) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; }
      else cur += c;
    }
    if (q) throw new Error('Guillemet non fermé : le fichier CSV est mal formé.');
    row.push(cur); if (row.some(x => x.trim() !== '')) rows.push(row);
    return rows;
  }

  // Retourne { format, rows: [{line, raw}], warnings }
  LP.importer = {
    LIMITS,
    // Décode un fichier : UTF-8 strict, sinon Windows-1252 (CSV Excel Windows). Refuse clairement les .xlsx/.xls.
    decode(buf, name) {
      const u = new Uint8Array(buf);
      const zip = u[0] === 0x50 && u[1] === 0x4B && u[2] === 3 && u[3] === 4, ole = u[0] === 0xD0 && u[1] === 0xCF && u[2] === 0x11;
      if (/\.xlsx?$/i.test(name || '') || zip || ole) throw new Error('Fichier Excel détecté : ouvre-le dans Excel puis « Enregistrer sous » → « CSV UTF-8 », et réimporte ce CSV.');
      try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(u), encoding: 'UTF-8' }; }
      catch (e) { return { text: new TextDecoder('windows-1252').decode(u), encoding: 'Windows-1252' }; }
    },
    parse(text, name) {
      text = String(text || '');
      if (!text.trim()) throw new Error('Le contenu est vide.');
      if (text.length > LIMITS.bytes) throw new Error('Fichier trop volumineux (2 Mo maximum).');
      const t = text.replace(/^﻿/, '').trim();
      let rows, format;
      if (/^[\[{]/.test(t)) {
        let j; try { j = JSON.parse(t); } catch (e) { throw new Error('JSON invalide : ' + e.message); }
        if (!Array.isArray(j)) j = j && (j.definitions || j.items || j.data);
        if (!Array.isArray(j)) throw new Error('Le JSON doit être un tableau de définitions ou { "definitions": [ … ] }.');
        format = 'JSON'; rows = j.map((o, i) => ({ line: i + 1, raw: o && typeof o === 'object' ? mapKeys(o) : null }));
      } else {
        const tab = parseCSV(t);
        if (!tab.length) throw new Error('Aucune ligne détectée.');
        const keys = tab[0].map(h => KEY[norm(h)] || null);
        if (keys.includes('term') && keys.includes('def')) {
          format = 'CSV'; rows = tab.slice(1).map((r, i) => { const o = {}; keys.forEach((k, c) => { if (k) o[k] = r[c] == null ? '' : r[c]; }); return { line: i + 2, raw: o }; });
        } else { // collage libre : « terme ; matière ; définition » ou « terme : définition »
          format = 'Texte';
          rows = t.split(/\r?\n/).map((l, i) => ({ l, i })).filter(x => x.l.trim()).map(({ l, i }) => {
            const p = l.split(/\s*[;\t|]\s*/);
            if (p.length >= 3) return { line: i + 1, raw: { term: p[0], matiere: p[1], def: p.slice(2).join(' ; ') } };
            const m = l.match(/^(.{2,120}?)\s*[:：–—-]\s+(.+)$/);
            return { line: i + 1, raw: m ? { term: m[1], def: m[2] } : null, bad: m ? null : 'Ligne illisible (attendu « terme : définition » ou « terme ; matière ; définition »).' };
          });
        }
      }
      if (!rows.length) throw new Error('Aucune définition trouvée.');
      if (rows.length > LIMITS.rows) throw new Error('Trop de lignes (' + rows.length + ', maximum ' + LIMITS.rows + ').');
      return { format, rows, source: name || '' };
    },
    // Valide chaque ligne. opts: { defaultMatiere, existing: [defs], policy: 'skip'|'update' }
    validate(rows, opts) {
      opts = opts || {}; const subjects = LP.SUBJECTS || ['Management', 'Droit', 'Économie', 'RH'];
      const sub = {}; subjects.forEach(s => (sub[norm(s)] = s));
      Object.assign(sub, { economie: 'Économie', 'ressources humaines': 'RH', rh: 'RH', gestion: 'Management' });
      const exist = new Map((opts.existing || []).map(d => [norm(d.term), d])), seen = new Map(), out = [];
      rows.forEach(r => {
        const it = { line: r.line, raw: r.raw, status: 'ok', reason: '', def: null };
        if (r.bad) { it.status = 'reject'; it.reason = r.bad; return out.push(it); }
        if (!r.raw) { it.status = 'reject'; it.reason = 'Ligne vide ou format invalide.'; return out.push(it); }
        const s = k => (r.raw[k] == null ? '' : typeof r.raw[k] === 'string' ? r.raw[k] : Array.isArray(r.raw[k]) ? r.raw[k].join('|') : String(r.raw[k])).replace(/\s+/g, ' ').trim();
        const term = s('term'), def = s('def'), mRaw = s('matiere');
        if (!term) { it.status = 'reject'; it.reason = 'Terme manquant.'; return out.push(it); }
        if (term.length > LIMITS.term) { it.status = 'reject'; it.reason = 'Terme trop long (' + LIMITS.term + ' max).'; return out.push(it); }
        if (!def) { it.status = 'reject'; it.reason = 'Définition manquante.'; return out.push(it); }
        if (def.length < 15) { it.status = 'reject'; it.reason = 'Définition trop courte (15 caractères min).'; return out.push(it); }
        if (def.length > LIMITS.def) { it.status = 'reject'; it.reason = 'Définition trop longue (' + LIMITS.def + ' max).'; return out.push(it); }
        const matiere = mRaw ? sub[norm(mRaw)] : opts.defaultMatiere;
        if (!matiere) { it.status = 'reject'; it.reason = mRaw ? 'Matière inconnue : « ' + mRaw + ' » (' + subjects.join(', ') + ').' : 'Matière manquante.'; return out.push(it); }
        const source = s('source');
        if (source && !/^https?:\/\//i.test(source) && /^[a-z][a-z0-9+.-]*:/i.test(source)) { it.status = 'reject'; it.reason = 'Source : seuls les liens http(s) sont acceptés.'; return out.push(it); }
        const trunc = (v, n) => v.slice(0, n);
        it.def = {
          term, matiere, def, example: trunc(s('example'), LIMITS.example), remember: trunc(s('remember'), LIMITS.remember), source: trunc(source, LIMITS.source),
          aliases: s('aliases').split(/\s*[|]\s*/).map(x => x.trim()).filter(Boolean).slice(0, 10)
        };
        const k = norm(term);
        if (seen.has(k)) { it.status = 'dup-file'; it.reason = 'Doublon dans le fichier (ligne ' + seen.get(k) + ').'; return out.push(it); }
        seen.set(k, r.line);
        if (exist.has(k)) { it.status = opts.policy === 'update' ? 'update' : 'dup'; it.reason = opts.policy === 'update' ? 'Existe déjà : sera mise à jour.' : 'Existe déjà : ignorée.'; it.existingId = exist.get(k).id; }
        out.push(it);
      });
      return out;
    },
    summarize(items) {
      const c = { ok: 0, update: 0, dup: 0, 'dup-file': 0, reject: 0 }; items.forEach(i => c[i.status]++);
      return { imported: c.ok, updated: c.update, ignored: c.dup + c['dup-file'], rejected: c.reject, total: items.length };
    },
    // Produit le nouveau tableau complet SANS toucher à l'existant (copie). Les ajouts reçoivent des id consécutifs.
    apply(existing, items) {
      const out = existing.map(d => Object.assign({}, d)); let next = out.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0) + 1; const now = new Date().toISOString();
      items.forEach(i => {
        if (i.status === 'ok') out.push(Object.assign({ id: next++, createdAt: now }, i.def));
        else if (i.status === 'update') { const k = out.findIndex(d => d.id === i.existingId); if (k >= 0) out[k] = Object.assign({}, out[k], i.def, { id: out[k].id }); }
      });
      return out;
    },
    template: () => '﻿term;matiere;def;example;remember;source;aliases\nSARL;Droit;"Société commerciale dont les associés ne répondent des dettes qu’à hauteur de leurs apports.";"Une boulangerie créée à deux associés.";"Responsabilité limitée aux apports.";https://www.service-public.fr;Société à responsabilité limitée\n',
    rejectsCSV: items => '﻿ligne;motif\n' + items.filter(i => i.status === 'reject' || i.status === 'dup-file').map(i => i.line + ';"' + i.reason.replace(/"/g, '""') + '"').join('\n')
  };
  function mapKeys(o) { const r = {}; Object.keys(o).forEach(k => { const m = KEY[norm(k)]; if (m) r[m] = o[k]; }); return r; }
})();
