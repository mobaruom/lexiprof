// ============================================================
// 🆕 COMPTEUR D'ID STABLE (ne redescend jamais)
// ============================================================
function getNextStableId() {
  let counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);
  counter += 1;
  localStorage.setItem(ID_COUNTER_KEY, String(counter));
  return counter;
}

function syncIdCounter() {
  // Si les définitions distantes ont des IDs plus grands, on synchronise
  const maxId = definitions.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0);
  const counter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || "0", 10);
  if (maxId > counter) {
    localStorage.setItem(ID_COUNTER_KEY, String(maxId));
  }
}

// ============================================================
// 🆕 RAFRAÎCHISSEMENT EN ARRIÈRE-PLAN
// ============================================================
async function refreshDefinitionsInBackground(onDone) {
  try {
    const data = await apiGet("definitions");
    const fresh = data.map(normalizeDefinition);
    // On ne remplace que si le contenu a changé
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
// 🆕 PROPOSITIONS ATOMIQUES (évite l'écrasement entre élèves)
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
  // Firebase : POST crée une clé unique, pas d'écrasement
  const res = await fetch(`${FIREBASE_DB_URL}/proposals.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return entry;
}

async function fetchProposalsRemote() {
  const res = await fetch(`${FIREBASE_DB_URL}/proposals.json`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data) return [];
  // Firebase renvoie un objet { pushKey: {...} }
  return Object.entries(data).map(([key, val]) => ({ ...val, _pushKey: key }));
}

async function deleteProposalRemote(proposal) {
  if (!proposal._pushKey) throw new Error("Pas de clé Firebase");
  const res = await fetch(`${FIREBASE_DB_URL}/proposals/${proposal._pushKey}.json`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return true;
}

// ============================================================
// 🆕 SIGNALEMENTS ATOMIQUES
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
  const res = await fetch(`${FIREBASE_DB_URL}/reports.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return entry;
}

async function fetchReportsRemote() {
  const res = await fetch(`${FIREBASE_DB_URL}/reports.json`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([key, val]) => ({ ...val, _pushKey: key }));
}

async function updateReportRemote(report) {
  if (!report._pushKey) throw new Error("Pas de clé Firebase");
  const res = await fetch(`${FIREBASE_DB_URL}/reports/${report._pushKey}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: report.status })
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return true;
}

// ============================================================
// 🆕 RECHERCHES SANS RÉSULTAT
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
  // On garde les 50 plus fréquents
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
// 🆕 QUASI-DOUBLONS (Taylorisme / Le taylorisme)
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
// 🆕 DÉFINITION DU JOUR
// ============================================================
function getDailyDefinition() {
  if (!definitions.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const stored = JSON.parse(localStorage.getItem(DAILY_DEF_KEY) || "null");
  if (stored && stored.date === today) {
    const found = definitions.find(d => Number(d.id) === Number(stored.id));
    if (found) return found;
  }
  const random = definitions[Math.floor(Math.random() * definitions.length)];
  localStorage.setItem(DAILY_DEF_KEY, JSON.stringify({ date: today, id: random.id }));
  return random;
}

// ============================================================
// 🆕 RAPPEL D'EXPORT
// ============================================================
function getDaysSinceLastExport() {
  const last = localStorage.getItem(LAST_EXPORT_KEY);
  if (!last) return null;
  const diff = Date.now() - new Date(last).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ============================================================
// 🆕 LIENS AUTOMATIQUES ENTRE TERMES
// ============================================================
function linkifyTerms(text, currentId) {
  let html = escapeHTML(text);
  // On trie les termes par longueur décroissante pour éviter les collisions
  const terms = definitions
    .filter(d => Number(d.id) !== Number(currentId) && d.term.length >= 3)
    .sort((a, b) => b.term.length - a.term.length);
  const linked = new Set();
  terms.forEach(d => {
    if (linked.has(d.term.toLowerCase())) return;
    const regex = new RegExp(`\\b(${d.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi");
    if (regex.test(html)) {
      html = html.replace(regex, `<a href="#" class="term-link" onclick="jumpToTerm('${escapeHTML(d.term)}');return false;">$1</a>`);
      linked.add(d.term.toLowerCase());
    }
  });
  return html;
}

function jumpToTerm(term) {
  const input = document.getElementById("searchInput");
  if (input) input.value = term;
  searchQuery = term;
  updateSearchClear();
  displayedCount = 0;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
