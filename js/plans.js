/* ============================================================
   LexiProf 2.0 — plans.js : architecture freemium (PRÉPARATION — aucun paiement)
   - launched=false : toutes les fonctionnalités sont accessibles à tous (phase de développement).
   - Les prix sont volontairement vides : à définir au lancement.
   - IMPORTANT : ce module ne fait qu'exposer des droits côté navigateur (confort d'interface).
     Une restriction premium réelle doit être appliquée côté serveur (règles Firebase ou Cloud Functions, plan lu dans profiles/{uid}/plan, modifiable par l'admin uniquement). Voir README → « Freemium ».
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  LP.plans = {
    launched: false,                 // décision de lancement explicite : passer à true uniquement avec un paiement configuré
    provider: null,                  // ex. 'stripe' — non intégré
    currency: 'EUR',
    tiers: {
      free: {
        name: 'Gratuit', price: null,
        limits: { newPerDay: 20, sessionCards: 30, importRows: 0, exportsPerMonth: 5 },
        features: ['library', 'review', 'quiz', 'streak', 'badges', 'themes', 'favorites', 'propose', 'backup']
      },
      premium: {
        name: 'Premium', price: null,
        limits: { newPerDay: 100, sessionCards: 100, importRows: 2000, exportsPerMonth: Infinity },
        features: ['advancedStats', 'smartSessions', 'pdfStudyPack', 'extraThemes', 'multiDeviceSync']
      }
    },
    // Fonctionnalités candidates Premium et justification produit
    catalog: [
      ['advancedStats', 'Statistiques approfondies', 'Courbes de rétention par matière, prévisions de charge. Coût serveur nul : valeur de suivi.'],
      ['smartSessions', 'Sessions intelligentes', 'Sessions ciblées sur les points faibles et avant examen.'],
      ['pdfStudyPack', 'Fiches PDF imprimables', 'Génération de fiches de révision par matière.'],
      ['multiDeviceSync', 'Synchronisation multi-appareils', 'Nécessite des comptes serveur (non disponible aujourd’hui).'],
      ['extraThemes', 'Thèmes avancés', 'Palettes supplémentaires.']
    ],
    // Plan de l'utilisateur : tant que rien n'est lancé/configuré, personne n'est « premium ».
    current() { return 'free'; },
    // Aperçu Premium : essai local de 7 jours, une seule fois (confort d'interface, PAS une sécurité : le vrai verrouillage sera côté serveur au lancement).
    trial: {
      K: 'lexiprof_trial', DAYS: 7,
      get() { try { return JSON.parse(localStorage.getItem(this.K)) || null; } catch (e) { return null; } },
      used() { return !!this.get(); },
      active() { const t = this.get(); return !!t && Date.now() < t.end; },
      daysLeft() { const t = this.get(); return t ? Math.max(0, Math.ceil((t.end - Date.now()) / 864e5)) : 0; },
      start() { if (this.get()) return false; try { localStorage.setItem(this.K, JSON.stringify({ start: Date.now(), end: Date.now() + this.DAYS * 864e5 })); } catch (e) { return false; } return true; }
    },
    // Intérêt exprimé pour Premium : un compteur anonyme (identifiant aléatoire local), envoyé uniquement au clic.
    interest: {
      K: 'lexiprof_interest',
      has() { try { return !!localStorage.getItem(this.K); } catch (e) { return false; } },
      async register(source) {
        if (this.has()) return;
        const id = 'i' + Math.random().toString(36).slice(2, 12);
        try { localStorage.setItem(this.K, JSON.stringify({ id, t: Date.now(), s: source })); } catch (e) {}
        try { await LP.api.post('interest', { a: id, t: Date.now(), s: String(source || 'plans').slice(0, 20) }); } catch (e) { /* hors ligne : le clic reste noté localement */ }
      }
    },
    // Fonction réellement accessible ? (phase de test : seuls l'essai ou Premium débloquent l'aperçu du coach)
    unlocked(feature) { return this.current() === 'premium' || this.trial.active() || (this.launched && this.can(feature)); },
    can(feature) {
      if (!this.launched) return true;                         // phase de développement : tout est ouvert
      const t = this.tiers[this.current()];
      return t.features.includes(feature) || (this.current() === 'premium');
    },
    limit(name) { return this.launched ? this.tiers[this.current()].limits[name] : Infinity; }
  };
  LP.can = f => LP.plans.can(f);
})();
