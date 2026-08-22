/* ============================================================
   LEXIPROF v8 — STORAGE.JS
   API Cloudflare Worker | Cache local | Fallback offline
   ============================================================ */

// ============================================================
// API HELPERS
// ============================================================
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getHeaders(),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPut(endpoint, body) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// CACHE LOCAL
// ============================================================
function getCache(key) {
  try {
    const item = localStorage.getItem(`cache:${key}`);
    if (!item) return null;
    const { data, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    return data;
  } catch { return null; }
}

function setCache(key, data, ttl) {
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({
      data,
      expiry: Date.now() + ttl
    }));
  } catch (e) { console.warn('Cache error:', e); }
}

function clearCache(pattern) {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cache:'));
  for (const k of keys) {
    if (!pattern || k.includes(pattern)) localStorage.removeItem(k);
  }
}

// ============================================================
// CHARGEMENT DÉFINITIONS
// ============================================================
async function loadRemote() {
  const cacheKey = `defs:${currentFilter}:${searchQuery}`;
  const cached = getCache(cacheKey);
  
  if (cached) {
    definitions = cached;
    console.log('✅ Cache local:', definitions.length, 'définitions');
    return true;
  }
  
  try {
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.set('matiere', currentFilter);
    if (searchQuery) params.set('q', searchQuery);
    
    const data = await apiGet(`/api/definitions?${params}`);
    definitions = data.map(normalizeDefinition);
    
    // Cache
    const ttl = searchQuery ? CACHE_CONFIG.search_ttl : CACHE_CONFIG.definitions_ttl;
    setCache(cacheKey, definitions, ttl);
    
    // Fallback
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
    } catch (e) {}
    
    console.log('✅ API Worker:', definitions.length, 'définitions');
    return true;
    
  } catch (error) {
    console.warn('⚠️ API indisponible:', error.message);
    
    // Fallback local
    try {
      const stored = localStorage.getItem(FALLBACK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          definitions = parsed.map(normalizeDefinition);
          console.log('✅ Fallback local:', definitions.length, 'définitions');
          return true;
        }
      }
    } catch (e) {
      localStorage.removeItem(FALLBACK_KEY);
    }
    
    // Dernier recours
    definitions = defaultData.map(normalizeDefinition);
    console.log('✅ Données par défaut:', definitions.length, 'définitions');
    return false;
  }
}

// ============================================================
// SAUVEGARDE
// ============================================================
async function saveRemote() {
  // Pas de sauvegarde globale — chaque action est une requête API
  // Les favoris sont gérés par l'API
  clearCache('defs');
}

// ============================================================
// AUTH
// ============================================================
async function register(email, password, displayName) {
  const data = await apiPost('/api/auth/register', {
    email,
    password,
    display_name: displayName
  });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

async function login(email, password) {
  const data = await apiPost('/api/auth/login', { email, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearCache('');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch { return null; }
}

function isLoggedIn() {
  return !!getToken();
}

// ============================================================
// FAVORIS (API)
// ============================================================
async function loadFavorites() {
  if (!isLoggedIn()) {
    // Fallback localStorage pour users non connectés
    return JSON.parse(localStorage.getItem('lexiprof_favorites') || '[]');
  }
  try {
    const data = await apiGet('/api/favorites');
    const favIds = data.map(d => Number(d.id));
    localStorage.setItem('lexiprof_favorites', JSON.stringify(favIds));
    return favIds;
  } catch {
    return JSON.parse(localStorage.getItem('lexiprof_favorites') || '[]');
  }
}

async function toggleFavoriteAPI(definitionId) {
  if (!isLoggedIn()) {
    // Mode offline — localStorage uniquement
    const favs = JSON.parse(localStorage.getItem('lexiprof_favorites') || '[]');
    const id = Number(definitionId);
    if (favs.includes(id)) {
      const newFavs = favs.filter(x => x !== id);
      localStorage.setItem('lexiprof_favorites', JSON.stringify(newFavs));
      return { favorited: false };
    } else {
      favs.push(id);
      localStorage.setItem('lexiprof_favorites', JSON.stringify(favs));
      return { favorited: true };
    }
  }
  
  try {
    const result = await apiPost('/api/favorites', { definition_id: definitionId });
    // Sync local
    const data = await apiGet('/api/favorites');
    const favIds = data.map(d => Number(d.id));
    localStorage.setItem('lexiprof_favorites', JSON.stringify(favIds));
    return result;
  } catch {
    // Fallback local
    const favs = JSON.parse(localStorage.getItem('lexiprof_favorites') || '[]');
    const id = Number(definitionId);
    if (favs.includes(id)) {
      const newFavs = favs.filter(x => x !== id);
      localStorage.setItem('lexiprof_favorites', JSON.stringify(newFavs));
      return { favorited: false };
    } else {
      favs.push(id);
      localStorage.setItem('lexiprof_favorites', JSON.stringify(favs));
      return { favorited: true };
    }
  }
}
