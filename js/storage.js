/* ============================================================
   LEXIPROF — STORAGE.JS
   Appels directs à Firebase Realtime Database (pas de backend,
   pas de clé — règles publiques), cache local, favoris locaux,
   mot de passe admin local, propositions.
   ============================================================ */

// ============================================================
// APPELS FIREBASE REALTIME DATABASE
// ============================================================
async function apiGet(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body.error || ""; } catch (e) {}
    throw new Error(`HTTP ${res.status}${detail ? " — " + detail : ""}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.definitions)) return data.definitions;
  if (data && typeof data === "object") {
    return Object.entries(data).map(([key, val]) => ({ ...val, _pushKey: key }));
  }
  return [];
}

async function apiPut(path, arr) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arr)
  });
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body.error || ""; } catch (e) {}
    throw new Error(`HTTP ${res.status}${detail ? " — " + detail : ""}`);
  }
  return res.json();
}

async function apiPost(path, obj) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  });
  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body.error || ""; } catch (e) {}
    throw new Error(`HTTP ${res.status}${detail ? " — " + detail : ""}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

async function apiPatch(path, obj) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
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
    const data = await apiGet("definitions");
    definitions = data.map(normalizeDefinition);
    setCache(cacheKey, definitions, CACHE_CONFIG.definitions_ttl);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
    return true;
  } catch (error) {
    console.warn("⚠️ Firebase indisponible:", error.message);
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
  await apiPut("definitions", definitions);
  clearCache("defs");
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
}

// ============================================================
// COMPTEUR D'ID STABLE
// ============================================================
function getNextStableId() {
  let counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);
  counter += 1;
  localStorage.setItem(ID_COUNTER_KEY, String(counter));
  return counter;
}

function syncIdCounter() {
  const maxId = definitions.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0);
  const counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);
  if (maxId > counter) {
    localStorage.setItem(ID_COUNTER_KEY, String(maxId));
  }
}

// ============================================================
// RAFRAÎCHISSEMENT EN ARRIÈRE-PLAN
// ============================================================
async function refreshDefinitionsInBackground(onDone) {
  try {
    const data = await apiGet("definitions");
    const fresh = data.map(normalizeDefinition);
    if (JSON.stringify(fresh) !== JSON.stringify(definitions)) {
      definitions = fresh;
      setCache("defs:all", definitions, CACHE_CONFIG.definitions_ttl);
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(definitions));
      syncIdCounter();
      if (typeof onDone === "function") onDone();
    }
  } catch (e) {
    console.warn("Refresh arrière-plan échoué:", e.message);
  }
}

// ============================================================
// PROPOSITIONS ATOMIQUES
// ============================================================
async function submitProposalAtomic(proposal) {
  const entry = {
    id: getNextStableId(),
    term: String(proposal.term || "").trim().slice(0, 120),
    matiere: String(proposal.matiere || "Management").trim(),
    def: String(proposal.def || "").trim().slice(0, 2000),
    example: String(proposal.example || "").trim().slice(0, 1000),
    remember: String(proposal.remember || "").trim().slice(0, 500),
    source: String(proposal.source || "").trim().slice(0, 500),
    pseudo: String(proposal.pseudo || "").trim().slice(0, 60),
    email: String(proposal.email || "").trim().slice(0, 120),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  await apiPost("proposals", entry);
  recordSentProposal(entry);
  return entry;
}

async function fetchProposalsRemote() {
  return apiGet("proposals");
}

async function deleteProposalRemote(proposal) {
  if (!proposal._pushKey) throw new Error("Pas de clé Firebase");
  return apiDelete(`proposals/${proposal._pushKey}`);
}

async function saveProposalsRemote(fullArray) {
  return apiPut("proposals", fullArray);
}

// ============================================================
// SIGNALEMENTS ATOMIQUES
// ============================================================
async function submitReportAtomic(report) {
  const entry = {
    id: getNextStableId(),
    definitionId: Number(report.definitionId) || 0,
    term: String(report.term || "").trim().slice(0, 120),
    message: String(report.message || "").trim().slice(0, 1000),
    reason: String(report.reason || "").trim().slice(0, 60),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  await apiPost("reports", entry);
  return entry;
}

async function fetchReportsRemote() {
  return apiGet("reports");
}

async function updateReportRemote(report) {
  if (!report._pushKey) throw new Error("Pas de clé Firebase");
  return apiPatch(`reports/${report._pushKey}`, { status: report.status });
}

async function saveReportsRemote(fullArray) {
  return apiPut("reports", fullArray);
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

function loadMasteredLocal() {
  try {
    const ids = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
    return Array.isArray(ids) ? ids.map(Number).filter(Number.isFinite) : [];
  } catch { return []; }
}

function toggleMasteredLocal(id) {
  id = Number(id);
  const ids = loadMasteredLocal();
  const index = ids.indexOf(id);
  if (index > -1) ids.splice(index, 1); else ids.push(id);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  return { mastered: index === -1 };
}

// ============================================================
// MOT DE PASSE ADMIN (local)
// ============================================================
function getAdminPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}

function setAdminPassword(pwd) {
  localStorage.setItem(PWD_KEY, pwd);
}

// ============================================================
// RECHERCHES SANS RÉSULTAT
// ============================================================
function loadSearchMisses() {
  try {
    const data = JSON.parse(localStorage.getItem(SEARCH_MISSES_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch { return {}; }
}

function recordSearchMiss(query) {
  const q = String(query || "").trim().toLowerCase();
  if (q.length < 2) return;
  const misses = loadSearchMisses();
  misses[q] = (misses[q] || 0) + 1;
  const sorted = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 50);
  localStorage.setItem(SEARCH_MISSES_KEY, JSON.stringify(Object.fromEntries(sorted)));
}

function getTopSearchMisses(limit = 10) {
  const misses = loadSearchMisses();
  return Object.entries(misses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

// ============================================================
// QUASI-DOUBLONS
// ============================================================
function normalizeForDuplicate(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(le |la |les |l'|un |une |des )/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function findQuasiDuplicates() {
  const map = new Map();
  const duplicates = [];
  definitions.forEach(d => {
    const key = normalizeForDuplicate(d.term) + "|" + normalizeText(d.matiere);
    if (map.has(key)) {
      duplicates.push([map.get(key), d]);
    } else {
      map.set(key, d);
    }
  });
  return duplicates;
}

// ============================================================
// DÉFINITION DU JOUR
// ============================================================
function getDailyDefinition() {
  if (!definitions.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const stored = JSON.parse(localStorage.getItem(DAILY_DEF_KEY) || "null");
    if (stored && stored.date === today) {
      const found = definitions.find(d => Number(d.id) === Number(stored.id));
      if (found) return found;
    }
  } catch (e) {}
  const random = definitions[Math.floor(Math.random() * definitions.length)];
  localStorage.setItem(DAILY_DEF_KEY, JSON.stringify({ date: today, id: random.id }));
  return random;
}

// ============================================================
// RAPPEL D'EXPORT
// ============================================================
function getDaysSinceLastExport() {
  const last = localStorage.getItem(LAST_EXPORT_KEY);
  if (!last) return null;
  const diff = Date.now() - new Date(last).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ============================================================
// LIENS AUTOMATIQUES ENTRE TERMES
// ============================================================
function linkifyTerms(text, currentId) {
  let html = escapeHTML(text);
  if (!definitions.length) return html;
  const terms = definitions
    .filter(d => Number(d.id) !== Number(currentId) && d.term.length >= 3)
    .sort((a, b) => b.term.length - a.term.length);
  const linked = new Set();
  terms.forEach(d => {
    const key = d.term.toLowerCase();
    if (linked.has(key)) return;
    const escaped = d.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b(${escaped})\\b`, "gi");
    if (regex.test(html)) {
      html = html.replace(regex, `<a href="#" class="term-link" onclick="jumpToTerm('${escapeHTML(d.term).replace(/'/g, "\\'")}');return false;">$1</a>`);
      linked.add(key);
    }
  });
  return html;
}

// ============================================================
// LOT A — EXPORT RGPD (#98)
// ============================================================
function exportUserDataRGPD() {
  const session = getSession();
  const prefs = getUserPrefs();
  const favorites = loadFavoritesLocal();
  const mastered = loadMasteredLocal();
  const searchHistory = loadSearchHistory();
  const searchMisses = loadSearchMisses();
  const proposals = loadSentProposals();

  const payload = {
    _meta: {
      app: "LexiProf",
      exported_at: new Date().toISOString(),
      version: "1.0-LOT-A",
      rgpd_article: "Article 20 — Droit à la portabilité des données"
    },
    account: session ? {
      id: session.id,
      email: session.email,
      displayName: session.displayName,
      createdAt: session.createdAt
    } : null,
    preferences: prefs,
    favorites,
    mastered,
    searchHistory,
    searchMisses,
    proposalsSent: proposals
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lexiprof-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📦 Tes données ont été exportées.");
}

// ============================================================
// LOT A — PROPOSITIONS ENVOYÉES (#46 préparation)
// ============================================================
function loadSentProposals() {
  try {
    const data = JSON.parse(localStorage.getItem(PROPOSALS_SENT_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function recordSentProposal(proposal) {
  const session = getSession();
  const list = loadSentProposals();
  list.unshift({
    id: "prop_" + Date.now().toString(36),
    userId: session ? session.id : null,
    term: proposal.term,
    matiere: proposal.matiere,
    def: proposal.def,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  if (list.length > 50) list.pop();
  localStorage.setItem(PROPOSALS_SENT_KEY, JSON.stringify(list));
}
