/* ============================================================
   LexiProf 2.0 — privacy.js : consentement, statistiques anonymes, page Confidentialité
   - Essentiel (toujours actif, sans consentement) : progression/préférences/compte sur l'appareil,
     envoi volontaire de propositions et signalements.
   - Optionnel (désactivé tant que l'utilisateur n'a pas choisi) :
       analytics = statistiques d'usage anonymes envoyées au serveur (identifiant aléatoire d'appareil)
       fonts     = polices Google (requête vers fonts.googleapis.com : l'adresse IP est transmise à Google)
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, $ = LP.$, esc = LP.esc, ic = LP.ic;
  const KEY = 'lexiprof_consent', ANON = 'lexiprof_anon', CAP = 'lexiprof_evcap';
  const get = () => { const c = LP.lsGet(KEY, null); return c && c.v === 1 ? c : { v: 1, analytics: false, fonts: false, at: null, decided: false }; };
  LP.consent = {
    get,
    decided: () => !!get().decided,
    has: k => get()[k] === true,
    set(p) {
      const prev = get(), c = Object.assign({}, prev, p, { v: 1, decided: true, at: new Date().toISOString() });
      LP.lsSet(KEY, c);
      if (prev.analytics && !c.analytics) { try { localStorage.removeItem(ANON); localStorage.removeItem(CAP); localStorage.removeItem('lexiprof_lastopen'); } catch (e) {} }
      applyFonts(); LP.emit('consent'); return c;
    },
    reset() { try { localStorage.removeItem(KEY); localStorage.removeItem(ANON); } catch (e) {} applyFonts(); LP.emit('consent'); }
  };

  /* ---- polices Google : chargées uniquement avec consentement ---- */
  function applyFonts() {
    const id = 'gfonts', el = document.getElementById(id), on = LP.consent.has('fonts');
    if (on && !el) {
      const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif&display=swap';
      document.head.appendChild(l);
    } else if (!on && el) el.remove();
  }

  /* ---- statistiques anonymes ---- */
  const anon = () => { let a = localStorage.getItem(ANON); if (!a) { a = 'a' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); try { localStorage.setItem(ANON, a); } catch (e) {} } return a; };
  LP.track = (type, extra) => {
    if (!LP.consent.has('analytics')) return;                       // aucun envoi sans consentement
    const day = LP.dkey(), cap = LP.lsGet(CAP, {});
    if (cap.d !== day) { cap.d = day; cap.n = 0; }
    if (cap.n >= 150) return; cap.n++; LP.lsSet(CAP, cap);
    const ev = { t: String(type).slice(0, 16), d: day, a: anon(), ts: Date.now() };
    if (extra && typeof extra === 'object') { if (extra.n != null) ev.n = Math.min(999, Number(extra.n) || 0); if (extra.c != null) ev.c = Math.min(999, Number(extra.c) || 0); }
    LP.api.post('events', ev).catch(() => {});
  };
  LP.trackOpen = () => { if (!LP.consent.has('analytics')) return; const d = LP.dkey(); if (localStorage.getItem('lexiprof_lastopen') === d) return; try { localStorage.setItem('lexiprof_lastopen', d); } catch (e) {} LP.track('open'); };

  /* ---- bannière ---- */
  function banner() {
    if (LP.consent.decided() || $('#consent')) return;
    const b = document.createElement('div'); b.id = 'consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Vie privée');
    b.innerHTML = `<div><b>Ta vie privée</b><p>LexiProf garde ta progression <b>sur ton appareil</b>. Deux options facultatives, désactivées tant que tu n'as pas choisi : des <b>statistiques anonymes</b> pour améliorer l'appli, et les <b>polices Google</b> (Google voit ton adresse IP). <a href="#/privacy">Détails</a></p></div>
      <div class="cb"><button class="btn soft" data-act="consent-no">Tout refuser</button><button class="btn soft" data-act="consent-opt">Choisir</button><button class="btn soft" data-act="consent-yes">Tout accepter</button></div>`;
    document.body.appendChild(b);
  }
  const close = () => { const b = $('#consent'); if (b) b.remove(); };
  const A = LP.actions;
  A['consent-yes'] = () => { LP.consent.set({ analytics: true, fonts: true }); close(); LP.trackOpen(); LP.toast('Préférences enregistrées', 'ok'); };
  A['consent-no'] = () => { LP.consent.set({ analytics: false, fonts: false }); close(); LP.toast('Aucune donnée facultative ne sera collectée', 'ok'); };
  A['consent-opt'] = () => { location.hash = '#/privacy'; };
  A['pv-toggle'] = el => { const k = el.dataset.k; LP.consent.set({ [k]: el.checked }); if (k === 'analytics' && el.checked) LP.trackOpen(); close(); LP.toast(el.checked ? 'Activé' : 'Désactivé', 'ok', 1600); LP.views.privacy($('#view')); };
  A['pv-export'] = () => { LP.download('lexiprof-mes-donnees-' + LP.dkey() + '.json', Object.assign(LP.exportAll(), { consent: get(), compte: (s => s ? { email: s.email, displayName: s.displayName } : null)(LP.auth.session()) })); LP.toast('Export téléchargé', 'ok'); };
  A['pv-wipe'] = async () => {
    if (!(await LP.confirm('Effacer toutes mes données locales ?', 'Progression, favoris, préférences, historique et choix de confidentialité seront supprimés de cet appareil. Les propositions déjà envoyées au serveur ne sont pas concernées.', { ok: 'Tout effacer', danger: true }))) return;
    LP.resetProgress(); LP.wipeLocal(); LP.consent.reset(); LP.toast('Données locales effacées', 'ok'); LP.applyPrefs(); banner(); LP.views.privacy($('#view'));
  };
  A['pv-reset-choice'] = () => { LP.consent.reset(); banner(); LP.views.privacy($('#view')); };

  /* ---- page Confidentialité ---- */
  LP.views.privacy = root => {
    const c = get();
    root.innerHTML = `
    <div class="page-head"><div><h1>Confidentialité</h1><p>Ce que LexiProf stocke, où, pourquoi, et comment le contrôler.</p></div></div>
    <div class="stack">
      <section class="card"><div class="card-head"><h3>${ic('shield', 18)} Tes choix</h3></div>
        <p class="muted-p" style="margin-bottom:8px">Refuser est aussi simple qu’accepter, et tu peux changer d’avis à tout moment. L’appli fonctionne pareil dans les deux cas.</p>
        <div class="setting"><div><b>Statistiques anonymes</b><small>Envoie le type d’action (ex. « quiz terminé »), la date et un identifiant aléatoire. Jamais de nom, d’email ni de contenu.</small></div><label class="switch"><input type="checkbox" data-change="pv-toggle" data-k="analytics" ${c.analytics ? 'checked' : ''} aria-label="Statistiques anonymes"><span></span></label></div>
        <div class="setting"><div><b>Polices Google</b><small>Charge « Inter » et « Instrument Serif » depuis Google. Sans cela, des polices système sont utilisées.</small></div><label class="switch"><input type="checkbox" data-change="pv-toggle" data-k="fonts" ${c.fonts ? 'checked' : ''} aria-label="Polices Google"><span></span></label></div>
        <p class="muted" style="font-size:12.5px;margin-top:8px">${c.decided ? 'Choix enregistré' + (c.at && !isNaN(new Date(c.at)) ? ' le ' + esc(new Date(c.at).toLocaleString('fr-FR')) : '') + '.' : 'Aucun choix enregistré : les options facultatives sont désactivées.'} Aucun cookie publicitaire, aucun traceur tiers.</p></section>
      <section class="card"><div class="card-head"><h3>${ic('download', 18)} Tes droits</h3></div>
        <div class="setting"><div><b>Consulter / exporter</b><small>Toutes tes données locales en JSON</small></div><button class="btn soft sm" data-act="pv-export">${ic('download', 15)} JSON</button></div>
        <div class="setting"><div><b>Rapport PDF lisible</b><small>Ta progression et la liste des données stockées</small></div><button class="btn primary sm" data-act="pf-pdf">${ic('download', 15)} PDF</button></div>
        <div class="setting"><div><b>Effacer mes données locales</b><small>Progression, préférences, historique, choix</small></div><button class="btn danger sm" data-act="pv-wipe">Effacer</button></div>
        <div class="setting"><div><b>Revoir mon choix</b><small>Réaffiche le bandeau de consentement</small></div><button class="btn soft sm" data-act="pv-reset-choice">Réinitialiser</button></div>
        <p class="muted" style="font-size:12.5px;margin-top:8px">Pour faire supprimer une proposition ou un signalement déjà envoyé au serveur, écris à l’équipe en indiquant le terme concerné.</p></section>
    </div>`;
  };
  applyFonts();
  window.addEventListener('DOMContentLoaded', () => {});
  LP.consentBanner = banner;
})();
