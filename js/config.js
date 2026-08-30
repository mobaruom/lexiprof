/* ============================================================
   LEXIPROF — CONFIG
   Version 100% statique (GitHub Pages), sans backend.
   La clé JSONBin est volontairement en clair ici — choix
   assumé de simplicité. Elle donne accès à TOUT le compte
   JSONBin : si ce dépôt est public, n'importe qui peut la lire.
   ============================================================ */

const API_BASE_URL = "https://api.jsonbin.io/v3";
const JSONBIN_MASTER_KEY = "$2a$10$tx0/pK3Ectrq62JFXLCB2.ryWt0rEN01imbo4H6g2ZhoBYsKiJtyi";

// ID de ton bin JSONBin existant (definitions)
const JSONBIN_BIN_ID = "69f31bf4aaba882197556e92";

// ID du bin des propositions
const JSONBIN_PROPOSALS_BIN_ID = "6a9440b9da38895dfe232e15";

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
