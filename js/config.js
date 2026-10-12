/* ============================================================
   LEXIPROF — CONFIG
   Version 100% statique (GitHub Pages), sans backend.
   Base de données : Firebase Realtime Database, règles publiques
   ============================================================ */

const FIREBASE_DB_URL = "https://lexiprof-44e50-default-rtdb.firebaseio.com";

// Mot de passe admin local
const PWD_KEY = "lexiprof_admin_pwd";
const DEFAULT_PW = "mbelka23";

// Fallback local
const FALLBACK_KEY = "lexiprof_fallback";

// Clés localStorage
const FAVORITES_KEY = "lexiprof_favorites";
const PROGRESS_KEY = "lexiprof_mastered";
const THEME_KEY = "lexiprof_theme";
const SEARCH_HISTORY_KEY = "lexiprof_search_history";
const WELCOME_SEEN_KEY = "lexiprof_welcome_seen";
const SEARCH_MISSES_KEY = "lexiprof_search_misses";
const LAST_EXPORT_KEY = "lexiprof_last_export";

// 🆕 Clés ajoutées
const ID_COUNTER_KEY = "lexiprof_id_counter";        // compteur d'ID stable
const DAILY_DEF_KEY = "lexiprof_daily_def";          // définition du jour
const LAST_SEEN_KEY = "lexiprof_last_seen";          // badge "Nouveau"

// 🆕 Cache
const CACHE_CONFIG = {
  definitions_ttl: 3600000,  // 1h
  search_ttl: 300000         // 5min
};

// 🆕 Seuil "Nouveau" : 14 jours
const NEW_BADGE_DAYS = 14;
