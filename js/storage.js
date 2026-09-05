/* ============================================================
   LEXIPROF — STORAGE.JS
   Appels directs à JSONBin (pas de backend), cache local,
   favoris locaux, mot de passe admin local, propositions.
   ============================================================ */

// ============================================================
// APPELS JSONBIN
// ============================================================
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Master-Key": JSONBIN_MASTER_KEY
  };
}

async function apiGet(binId) {
  const res = await fetch(`${API_BASE_URL}/b/${binId}/latest`, { headers: getHeaders() });
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body.message || ""; } catch (e) {}
    throw new Error(`HTTP ${res.status}${detail ? " — " + detail : ""}`);
  }
  const data = await res.json();
  const rec = data.record;
  if (Array.isArray(rec)) return rec;
  if (rec && Array.isArray(rec.definitions)) return rec.definitions;
  return [];
}

async function apiPut(binId, arr) {
  const res = await fetch(`${API_BASE_URL}/b/${binId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(arr)
  });
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body.message || ""; } catch (e) {}
    throw new Error(`HTTP ${res.status}${detail ? " — " + detail : ""}`);
  }
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
    localStorage.setItem(`cache:${key}`, JSON.stringify({ data, expiry: Date.now() + ttl }));
  } catch (e) { console.warn("Cache error:", e); }
}

function clearCache(pattern) {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("cache:"));
  for (const k of keys) {
    if (!pattern || k.includes(pattern)) localStorage.removeItem(k);
  }
}

// ============================================================
// DÉFINITIONS
// ============================================================
async function loadRemote() {
  const cacheKey = "defs:all";
  const cached = getCache(cacheKey);
  if (cached) {
    definitions = cached;
    return true;
  }

  try {
    const data = await apiGet(JSONBIN_BIN_ID);
    definitions = data.map(normalizeDefinition);
    setCache(cacheKey, definitions, CACHE_CONFIG.definitions_ttl);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
    return true;
  } catch (error) {
    console.warn("⚠️ JSONBin indisponible:", error.message);
    try {
      const stored = localStorage.getItem(FALLBACK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          definitions = parsed.map(normalizeDefinition);
          return true;
        }
      }
    } catch (e) { localStorage.removeItem(FALLBACK_KEY); }
    definitions = defaultData.map(normalizeDefinition);
    return false;
  }
}

async function saveDefinitionsRemote() {
  await apiPut(JSONBIN_BIN_ID, definitions);
  clearCache("defs");
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
}

// ============================================================
// PROPOSITIONS
// ============================================================
async function submitProposalRemote(proposal) {
  let current = [];
  try { current = await apiGet(JSONBIN_PROPOSALS_BIN_ID); } catch (e) { current = []; }
  const nextPid = current.length ? Math.max(...current.map(p => Number(p.id) || 0)) + 1 : 1;
  const entry = {
    id: nextPid,
    term: String(proposal.term || "").trim().slice(0, 120),
    matiere: String(proposal.matiere || "Management").trim(),
    def: String(proposal.def || "").trim().slice(0, 2000),
    example: String(proposal.example || "").trim().slice(0, 1000),
    remember: String(proposal.remember || "").trim().slice(0, 500),
    pseudo: String(proposal.pseudo || "").trim().slice(0, 60),
    email: String(proposal.email || "").trim().slice(0, 120),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  current.push(entry);
  await apiPut(JSONBIN_PROPOSALS_BIN_ID, current);
  return entry;
}

async function fetchProposalsRemote() {
  return apiGet(JSONBIN_PROPOSALS_BIN_ID);
}

async function saveProposalsRemote(fullArray) {
  return apiPut(JSONBIN_PROPOSALS_BIN_ID, fullArray);
}

// ============================================================
// FAVORIS (100% locaux)
// ============================================================
function loadFavoritesLocal() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); }
  catch { return []; }
}

function toggleFavoriteLocal(id) {
  id = Number(id);
  const favs = loadFavoritesLocal();
  const idx = favs.indexOf(id);
  let favorited;
  if (idx > -1) { favs.splice(idx, 1); favorited = false; }
  else { favs.push(id); favorited = true; }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return { favorited };
}

// ============================================================
// MOT DE PASSE ADMIN (local, protection visuelle uniquement)
// ============================================================
function getAdminPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}

function setAdminPassword(pwd) {
  localStorage.setItem(PWD_KEY, pwd);
}
