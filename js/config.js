/* ============================================================
   LEXIPROF — CONFIG
   Version 100% statique (GitHub Pages), sans backend.
   Base de données : Firebase Realtime Database, règles publiques
   (.read/.write: true) — aucune clé à gérer côté client.
   ============================================================ */

const FIREBASE_DB_URL = "https://lexiprof-44e50-default-rtdb.firebaseio.com";

// Mot de passe admin local (protection visuelle uniquement, pas une vraie sécurité)
const PWD_KEY = "lexiprof_admin_pwd";
const DEFAULT_PW = "admin123";

// Fallback local si JSONBin est injoignable
const FALLBACK_KEY = "lexiprof_fallback";

// Clés localStorage (préférences locales, rien de sensible)
const FAVORITES_KEY = "lexiprof_favorites";
const THEME_KEY = "lexiprof_theme";
const SEARCH_HISTORY_KEY = "lexiprof_search_history";
const WELCOME_SEEN_KEY = "lexiprof_welcome_seen";

// Cache local des définitions (pour limiter les requêtes JSONBin)
const CACHE_CONFIG = {
  definitions_ttl: 3600000, // 1h
  search_ttl: 300000        // 5min
};
