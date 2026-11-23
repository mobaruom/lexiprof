/* ============================================================
   LexiProf — audit.js : journal des modifications faites par l'administrateur
   Chaque action sensible (notions, imports, propositions, signalements, connexion…) est enregistrée
   AVEC la date et l'auteur. Firebase : chemin « audit », en ajout seul (les règles interdisent de modifier ou
   d'effacer une entrée). Mode local : localStorage de cet appareil.
   Limite honnête : seules les actions faites APRÈS l'installation de cette version sont enregistrées.
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  const LOCAL = 'lexiprof_audit', PENDING = 'lexiprof_audit_pending', MAX_LOCAL = 1000;
  const cut = (s, n) => String(s == null ? '' : s).slice(0, n);
  const rd = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // Catégories et types : libellé, icône, couleur (variable CSS)
  const TYPES = {
    'def.create': ['Notion créée', 'plus', 'ok', 'notions'], 'def.update': ['Notion modifiée', 'edit', 'accent', 'notions'], 'def.delete': ['Notion supprimée', 'trash', 'bad', 'notions'],
    'def.bulk-delete': ['Suppression groupée', 'trash', 'bad', 'notions'], 'def.bulk-move': ['Changement de matière groupé', 'edit', 'accent', 'notions'], 'def.restore': ['Notion restaurée', 'refresh', 'ok', 'notions'],
    'import': ['Import de notions', 'upload', 'violet', 'import'], 'export': ['Export des notions', 'download', 'muted', 'import'],
    'prop.accept': ['Proposition publiée', 'check', 'ok', 'propositions'], 'prop.reject': ['Proposition refusée', 'x', 'bad', 'propositions'],
    'rep.done': ['Signalement traité', 'check', 'ok', 'signalements'], 'rep.delete': ['Signalement supprimé', 'trash', 'bad', 'signalements'],
    'admin.login': ['Connexion admin', 'shield', 'muted', 'securite'], 'admin.lock': ['Verrouillage', 'lock', 'muted', 'securite'], 'admin.pw': ['Mot de passe modifié', 'shield', 'warn', 'securite']
  };
  const CATS = [['all', 'Tout'], ['notions', 'Notions'], ['import', 'Import / export'], ['propositions', 'Propositions'], ['signalements', 'Signalements'], ['securite', 'Sécurité']];

  const sanitizeMeta = m => { try { const s = JSON.stringify(m || {}); return s.length > 3500 ? { tronque: true } : m || {}; } catch (e) { return {}; } };
  const cloud = () => LP.authMode === 'firebase';

  async function push(entry) { await LP.api.post('audit', entry); }
  async function flush() {
    const q = rd(PENDING); if (!q.length || !cloud()) return;
    const left = [];
    for (const e of q) { try { await push(e); } catch (err) { left.push(e); } }
    wr(PENDING, left);
  }

  LP.audit = {
    TYPES, CATS,
    // Enregistre une action. Ne bloque jamais l'action elle-même : en cas d'échec réseau, l'entrée est remise en file d'attente.
    async log(type, label, meta) {
      const e = { t: Date.now(), type: cut(type, 40), label: cut(label, 220), who: cut((LP.admin && LP.admin.who && LP.admin.who()) || 'admin', 80), meta: sanitizeMeta(meta) };
      if (!cloud()) { const l = rd(LOCAL); l.push(e); wr(LOCAL, l.slice(-MAX_LOCAL)); return e; }
      try { await flush(); await push(e); } catch (err) { const q = rd(PENDING); q.push(e); wr(PENDING, q.slice(-200)); }
      return e;
    },
    async list() {
      let rows;
      if (!cloud()) rows = rd(LOCAL);
      else { await flush(); rows = (await LP.api.get('audit')).map(x => { const o = Object.assign({}, x); delete o._key; return o; }).concat(rd(PENDING)); }
      return rows.filter(e => e && e.t && e.type).sort((a, b) => b.t - a.t);
    },
    pending: () => rd(PENDING).length,
    // Comparaison avant/après (uniquement les champs réellement changés)
    diff(before, after, fields) {
      const out = [];
      (fields || ['term', 'matiere', 'def', 'example', 'remember', 'source', 'aliases']).forEach(f => {
        const a = Array.isArray(before[f]) ? before[f].join(', ') : String(before[f] == null ? '' : before[f]), b = Array.isArray(after[f]) ? after[f].join(', ') : String(after[f] == null ? '' : after[f]);
        if (a !== b) out.push({ f, from: cut(a, 200), to: cut(b, 200) });
      });
      return out;
    },
    csv(rows) {
      const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      return '﻿date;heure;action;détail;auteur\n' + rows.map(e => { const d = new Date(e.t); return [d.toLocaleDateString('fr-FR'), d.toLocaleTimeString('fr-FR'), (TYPES[e.type] || [e.type])[0], e.label, e.who].map(q).join(';'); }).join('\n');
    }
  };
})();
