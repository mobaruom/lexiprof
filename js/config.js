/* ============================================================
   LexiProf — réglages (le SEUL fichier à modifier pour brancher tes services)
   ============================================================ */
window.LP_CONFIG = {
  backend: 'firebase',                                              // 'firebase' (actuel) ou 'php' (plus tard, voir php-backend/)
  db: 'https://lexiprof-44e50-default-rtdb.firebaseio.com',         // Realtime Database
  // Pour activer les VRAIS comptes (synchro entre appareils, admin sécurisé) :
  // Console Firebase → Paramètres du projet → « Clé API Web », puis Authentication → activer « Adresse e-mail / Mot de passe ».
  apiKey: ''
};
