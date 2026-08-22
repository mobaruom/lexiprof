/* ============================================================
   LEXIPROF v8 — CONFIG
   Cloudflare Worker API | Plus de clés exposées
   ============================================================ */

// URL de ton Worker Cloudflare (à remplacer après déploiement)
const API_BASE_URL = 'https://ton-worker.workers.dev';

// Clés localStorage
const TOKEN_KEY = 'lexiprof_token';
const USER_KEY = 'lexiprof_user';
const PWD_KEY = 'lexiprof_admin_pwd';
const DEFAULT_PW = 'admin123';

// Fallback local pour mode offline
const FALLBACK_KEY = 'lexiprof_fallback';

// Configuration cache
const CACHE_CONFIG = {
  definitions_ttl: 3600000,    // 1h en ms
  search_ttl: 300000,          // 5min en ms
  user_ttl: 3600000            // 1h en ms
};
