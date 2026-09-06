/* ============================================================
   LEXIPROF v9 — APP.JS
   Fichier unique partagé par les 4 pages (index/app/admin/propose).
   Chaque fonction se protège en vérifiant que les éléments DOM
   dont elle a besoin existent avant d'agir.
   ============================================================ */

/* ============================================================
   DONNÉES DE SECOURS (si JSONBin est injoignable)
   ============================================================ */
const defaultData = [
  { id: 1, term: "Management", matiere: "Management", def: "Ensemble des techniques permettant de diriger, organiser et coordonner les ressources d'une organisation afin d'atteindre ses objectifs.", example: "Un manager organise le travail de son équipe, répartit les tâches et suit les résultats.", remember: "Le management consiste notamment à organiser, décider, coordonner et motiver." },
  { id: 2, term: "Leadership", matiere: "Management", def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs.", example: "Un responsable qui motive son équipe autour d'un projet fait preuve de leadership.", remember: "Leadership = influencer, guider et motiver." },
  { id: 3, term: "Organigramme", matiere: "Management", def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation.", example: "L'organigramme d'une entreprise permet de voir qui dépend de quel responsable.", remember: "Il permet de visualiser les relations hiérarchiques." },
  { id: 4, term: "Contrat de travail", matiere: "Droit", def: "Convention par laquelle une personne, le salarié, s'engage à travailler pour le compte et sous la direction d'un employeur en échange d'une rémunération.", example: "Un CDI signé entre une entreprise et un salarié constitue un contrat de travail.", remember: "Travail + rémunération + lien de subordination." },
  { id: 5, term: "Personne morale", matiere: "Droit", def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres.", example: "Une société ou une association peut être une personne morale.", remember: "Une personne morale possède une existence juridique propre." },
  { id: 6, term: "PIB", matiere: "Économie", def: "Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.", example: "Le PIB permet notamment de mesurer la production économique d'un pays.", remember: "PIB = valeur des biens et services produits sur un territoire." },
  { id: 7, term: "Inflation", matiere: "Économie", def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie.", example: "Lorsque les prix augmentent durablement, le pouvoir d'achat de la monnaie diminue.", remember: "Inflation = hausse générale et durable des prix." },
  { id: 8, term: "Recrutement", matiere: "RH", def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats afin de pourvoir un poste vacant.", example: "Une entreprise publie une offre d'emploi puis sélectionne les candidats.", remember: "Recruter = rechercher, sélectionner puis intégrer un candidat." },
  { id: 9, term: "GPEC", matiere: "RH", def: "Gestion Prévisionnelle des Emplois et des Compétences. Démarche permettant d'anticiper les besoins futurs d'une organisation en emplois et en compétences.", example: "Une entreprise peut prévoir des formations pour préparer ses salariés à de nouvelles compétences.", remember: "GPEC = anticiper les besoins futurs en emplois et compétences." }
];

/* ============================================================
   ÉTAT GLOBAL
   ============================================================ */
let definitions = [];
let currentFilter = "all";
let searchQuery = "";
let favorites = [];
let currentFlashcardIndex = 0;
let flashcardList = [];
let deferredInstallPrompt = null;
let editingDefinitionId = null;
let searchHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
let currentRandomId = null;
let isDropdownOpen = false;
let isFocusMode = false;
let displayedCount = 0;
let proposalsCache = [];
const BATCH_SIZE = 10;

/* ============================================================
   UTILITAIRES
   ============================================================ */
function nextId() {
  if (!definitions.length) return 1;
  return Math.max(...definitions.map(d => Number(d.id) || 0)) + 1;
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeDefinition(d) {
  return {
    ...d,
    id: Number(d.id) || nextId(),
    term: String(d.term || "").trim(),
    matiere: String(d.matiere || "Management").trim(),
    def: String(d.def || d.definition || "").trim(),
    example: String(d.example || "").trim(),
    remember: String(d.remember || "").trim()
  };
}

function highlight(text, q) {
  const safe = escapeHTML(text);
  if (!q) return safe;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

/* ============================================================
   RECHERCHE FLOUE (tolérance aux fautes de frappe)
   ============================================================ */
function normalizeText(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fuzzyIncludes(haystack, needle) {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!n) return true;
  if (h.includes(n)) return true;
  const words = h.split(/[^a-z0-9]+/).filter(Boolean);
  const threshold = n.length <= 4 ? 1 : (n.length <= 8 ? 2 : 3);
  for (const w of words) {
    if (Math.abs(w.length - n.length) > threshold) continue;
    if (levenshtein(w, n) <= threshold) return true;
  }
  return false;
}

/* ============================================================
   CHARGEMENT (page dictionnaire)
   ============================================================ */
async function loadAndRenderApp() {
  setLoading(true);
  try {
    await loadRemote();
    favorites = loadFavoritesLocal();
  } catch (e) {
    console.error(e);
  }
  render();
  hideLoader();
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.classList.add("hidden");
}

function setLoading(on) {
  const container = document.getElementById("cardsContainer");
  const skeleton = document.getElementById("skeletonContainer");
  if (!container || !skeleton) return;
  if (on) {
    skeleton.style.display = "block";
    container.style.display = "none";
  } else {
    skeleton.style.display = "none";
    container.style.display = "flex";
  }
}

/* ============================================================
   FILTRAGE + PAGINATION
   ============================================================ */
function getFilteredDefinitions() {
  const q = searchQuery.trim();
  let filtered = [...definitions];

  if (currentFilter === "favorites") {
    filtered = filtered.filter(d => favorites.includes(Number(d.id)));
  } else if (currentFilter !== "all") {
    filtered = filtered.filter(d => d.matiere === currentFilter);
  }

  if (q) {
    filtered = filtered.filter(d => fuzzyIncludes(d.term, q) || fuzzyIncludes(d.def, q));
  }

  filtered.sort((a, b) => a.term.localeCompare(b.term, "fr"));
  return filtered;
}

function render() {
  const container = document.getElementById("cardsContainer");
  const info = document.getElementById("resultsInfo");
  if (!container) return;

  const filtered = getFilteredDefinitions();

  if (info) {
    if (searchQuery || currentFilter !== "all") {
      info.textContent = `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`;
    } else {
      info.textContent = `${definitions.length} définition${definitions.length !== 1 ? "s" : ""}`;
    }
  }

  updateCounter();

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>Aucun résultat</h3>
        <p>Essaie un autre terme ou change le filtre.</p>
      </div>
    `;
    displayedCount = 0;
    setLoading(false);
    return;
  }

  displayedCount = Math.min(BATCH_SIZE, filtered.length);
  renderBatch(filtered, 0, displayedCount);
  setupScrollObserver(filtered);
  setLoading(false);
}

function renderBatch(filtered, start, end) {
  const container = document.getElementById("cardsContainer");
  if (!container) return;
  if (start === 0) {
    container.innerHTML = filtered.slice(start, end).map((d, i) => createCardHTML(d, i)).join("");
  } else {
    const html = filtered.slice(start, end).map((d, i) => createCardHTML(d, start + i)).join("");
    container.insertAdjacentHTML("beforeend", html);
  }
}

function setupScrollObserver(filtered) {
  const sentinel = document.getElementById("scrollSentinel");
  if (!sentinel) return;
  if (window._scrollObserver) window._scrollObserver.disconnect();
  window._scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && displayedCount < filtered.length) {
        const nextEnd = Math.min(displayedCount + BATCH_SIZE, filtered.length);
        renderBatch(filtered, displayedCount, nextEnd);
        displayedCount = nextEnd;
      }
    });
  }, { rootMargin: "100px" });
  window._scrollObserver.observe(sentinel);
}

/* ============================================================
   CARTE
   ============================================================ */
function createCardHTML(d, index) {
  const isFav = favorites.includes(Number(d.id));
  return `
    <article class="card" data-id="${d.id}" data-matiere="${escapeHTML(d.matiere)}"
      style="animation-delay:${Math.min(index * 30, 300)}ms">
      <div class="card-top">
        <div class="card-term">${highlight(d.term, searchQuery)}</div>
        <span class="matiere-badge badge-${escapeHTML(d.matiere)}">${escapeHTML(d.matiere)}</span>
      </div>
      <div class="card-def">${highlight(d.def, searchQuery)}</div>
      <div class="card-actions-row">
        <button class="open-card-btn" onclick="toggleCard(${d.id}, this)">📖 Ouvrir la fiche</button>
        <button class="card-action-btn" onclick="copyDefinition(${d.id})" title="Copier">📋</button>
        <button class="card-action-btn" onclick="shareDefinition(${d.id})" title="Partager">🔗</button>
        <button class="card-action-btn fav-btn ${isFav ? "active" : ""}" onclick="toggleFavorite(${d.id})" title="Favori">
          <span class="heart-icon">${isFav ? "❤️" : "🤍"}</span>
        </button>
      </div>
      <div class="card-extra" id="card-${d.id}">
        ${d.example ? `<div class="extra-block"><h4>💡 Exemple concret</h4><p>${escapeHTML(d.example)}</p></div>` : ""}
        ${d.remember ? `<div class="extra-block"><h4>📝 À retenir</h4><p>${escapeHTML(d.remember)}</p></div>` : ""}
      </div>
    </article>
  `;
}

function toggleCard(id, btn) {
  const extra = document.getElementById(`card-${id}`);
  if (!extra) return;
  const open = extra.classList.contains("open");
  if (open) {
    extra.classList.remove("open");
    btn.innerHTML = "📖 Ouvrir la fiche";
  } else {
    extra.classList.add("open");
    btn.innerHTML = "📕 Fermer la fiche";
  }
}

async function copyDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;
  const text = `${d.term} (${d.matiere})\n${d.def}${d.example ? `\n💡 Exemple : ${d.example}` : ""}${d.remember ? `\n📝 À retenir : ${d.remember}` : ""}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 Définition copiée !");
  } catch (e) {
    showToast("⚠️ Impossible de copier");
  }
}

async function shareDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;
  const url = `${location.origin}${location.pathname}#def=${d.id}`;
  const text = `${d.term} — ${d.matiere}`;
  if (navigator.share) {
    try { await navigator.share({ title: `LexiProf — ${d.term}`, text, url }); } catch (e) {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 Lien copié !");
    } catch (e) {
      showToast("⚠️ Impossible de partager");
    }
  }
}

function checkHash() {
  const hash = location.hash;
  if (!hash.startsWith("#def=")) return;
  const id = Number(hash.replace("#def=", ""));
  if (!id) return;
  setTimeout(() => {
    const d = definitions.find(x => Number(x.id) === id);
    if (d) revealDefinitionCard(id, d.term);
  }, 600);
}

/* ============================================================
   RECHERCHE
   ============================================================ */
function onSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  searchQuery = input.value;
  updateSearchClear();
  addToSearchHistory(searchQuery);
  displayedCount = 0;
  render();
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.value = "";
  searchQuery = "";
  updateSearchClear();
  displayedCount = 0;
  render();
  input.focus();
}

function updateSearchClear() {
  const btn = document.getElementById("searchClear");
  if (!btn) return;
  btn.classList.toggle("visible", Boolean(searchQuery));
}

function addToSearchHistory(query) {
  if (!query || query.length < 2) return;
  searchHistory = searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
  searchHistory.unshift(query);
  if (searchHistory.length > 5) searchHistory.pop();
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  renderSearchHistory();
}

function renderSearchHistory() {
  const container = document.getElementById("searchHistory");
  if (!container) return;
  if (!searchHistory.length) {
    container.classList.remove("visible");
    return;
  }
  container.classList.add("visible");
  container.innerHTML = searchHistory.map(q => `
    <button onclick='setSearchQuery(${JSON.stringify(q)})'>${escapeHTML(q)}</button>
  `).join("");
}

function setSearchQuery(q) {
  const input = document.getElementById("searchInput");
  if (input) input.value = q;
  searchQuery = q;
  updateSearchClear();
  displayedCount = 0;
  render();
}

/* ============================================================
   FILTRES DROPDOWN
   ============================================================ */
function toggleFilterDropdown() {
  const menu = document.getElementById("filterDropdownMenu");
  const btn = document.getElementById("filterDropdownBtn");
  if (!menu) return;
  isDropdownOpen = !isDropdownOpen;
  menu.classList.toggle("open", isDropdownOpen);
  btn.classList.toggle("open", isDropdownOpen);
}

function setFilterFromDropdown(filter, btn) {
  currentFilter = filter;

  document.querySelectorAll(".filter-dropdown-item").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const label = document.getElementById("filterDropdownLabel");
  const dot = document.getElementById("filterDropdownDot");
  if (label) {
    const texts = { all: "Toutes les matières", Management: "Management", Droit: "Droit", Économie: "Économie", RH: "RH", favorites: "Mes favoris" };
    label.textContent = texts[filter] || filter;
  }
  if (dot) {
    const colors = { all: "var(--text)", Management: "var(--mgt)", Droit: "var(--drt)", Économie: "var(--eco)", RH: "var(--rh)", favorites: "var(--accent)" };
    dot.style.background = colors[filter] || "var(--text)";
  }

  isDropdownOpen = false;
  document.getElementById("filterDropdownMenu")?.classList.remove("open");
  document.getElementById("filterDropdownBtn")?.classList.remove("open");

  displayedCount = 0;
  render();
}

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".filter-dropdown-wrap");
  if (wrap && !wrap.contains(e.target) && isDropdownOpen) {
    isDropdownOpen = false;
    document.getElementById("filterDropdownMenu")?.classList.remove("open");
    document.getElementById("filterDropdownBtn")?.classList.remove("open");
  }
});

/* ============================================================
   FAVORIS (locaux)
   ============================================================ */
function toggleFavorite(id) {
  const result = toggleFavoriteLocal(id);
  favorites = loadFavoritesLocal();
  showToast(result.favorited ? "❤️ Ajouté aux favoris" : "🤍 Retiré des favoris");
  render();
}

function updateCounter() {
  const counter = document.getElementById("defCounter");
  if (!counter) return;
  counter.textContent = `${definitions.length} définition${definitions.length !== 1 ? "s" : ""} disponible${definitions.length !== 1 ? "s" : ""}`;
}

/* ============================================================
   MODE SOMBRE
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") document.body.classList.add("dark");
  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const dark = document.body.classList.contains("dark");
  btn.innerHTML = dark ? "☀️" : "🌙";
  btn.title = dark ? "Mode clair" : "Mode sombre";
}

/* ============================================================
   MODE FOCUS — lecteur immersif plein écran
   ============================================================ */
let focusList = [];
let focusIndex = 0;

function toggleFocusMode() {
  focusList = getFilteredDefinitions();
  if (!focusList.length) { showToast("⚠️ Aucune définition à afficher."); return; }
  focusIndex = 0;
  const overlay = document.getElementById("focusOverlay");
  if (!overlay) return;
  overlay.classList.add("open");
  renderFocusCard(false);
}

function closeFocusMode() {
  document.getElementById("focusOverlay")?.classList.remove("open");
}

function renderFocusCard(animate = true) {
  const d = focusList[focusIndex];
  if (!d) return;
  const card = document.getElementById("focusCard");
  if (!card) return;

  const paint = () => {
    document.getElementById("focusMatiere").textContent = d.matiere;
    document.getElementById("focusMatiere").className = `focus-matiere badge-${d.matiere}`;
    document.getElementById("focusTerm").textContent = d.term;
    document.getElementById("focusDef").textContent = d.def;

    const extraWrap = document.getElementById("focusExtra");
    extraWrap.innerHTML = `
      ${d.example ? `<div class="extra-block"><h4>💡 Exemple concret</h4><p>${escapeHTML(d.example)}</p></div>` : ""}
      ${d.remember ? `<div class="extra-block"><h4>📝 À retenir</h4><p>${escapeHTML(d.remember)}</p></div>` : ""}
    `;

    document.getElementById("focusCounter").textContent = `${focusIndex + 1} / ${focusList.length}`;

    const isFav = favorites.includes(Number(d.id));
    const favBtn = document.getElementById("focusFavBtn");
    favBtn.classList.toggle("active", isFav);
    favBtn.querySelector(".heart-icon").textContent = isFav ? "❤️" : "🤍";
  };

  if (!animate) { paint(); return; }

  card.classList.add("focus-card-out");
  setTimeout(() => {
    paint();
    card.classList.remove("focus-card-out");
    card.classList.add("focus-card-in");
    setTimeout(() => card.classList.remove("focus-card-in"), 350);
  }, 180);
}

function focusNext() {
  if (!focusList.length) return;
  focusIndex = (focusIndex + 1) % focusList.length;
  renderFocusCard(true);
}

function focusPrev() {
  if (!focusList.length) return;
  focusIndex = (focusIndex - 1 + focusList.length) % focusList.length;
  renderFocusCard(true);
}

function focusToggleFavorite() {
  const d = focusList[focusIndex];
  if (!d) return;
  toggleFavorite(d.id);
  const isFav = favorites.includes(Number(d.id));
  const favBtn = document.getElementById("focusFavBtn");
  favBtn.classList.toggle("active", isFav);
  favBtn.querySelector(".heart-icon").textContent = isFav ? "❤️" : "🤍";
}

/* ============================================================
   AUTH COSMÉTIQUE (index.html — pas encore fonctionnel)
   ============================================================ */
function openAuthModal() {
  document.getElementById("authOverlay")?.classList.add("open");
}

function closeAuthModal() {
  document.getElementById("authOverlay")?.classList.remove("open");
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById("authTabLogin");
  const registerTab = document.getElementById("authTabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (tab === "login") {
    loginTab?.classList.add("active");
    registerTab?.classList.remove("active");
    loginForm?.classList.add("active");
    registerForm?.classList.remove("active");
  } else {
    loginTab?.classList.remove("active");
    registerTab?.classList.add("active");
    loginForm?.classList.remove("active");
    registerForm?.classList.add("active");
  }
}

function handleCosmeticAuth() {
  closeAuthModal();
  showToast("👋 Les comptes arrivent bientôt !");
}

/* ============================================================
   ADMIN — VERROUILLAGE (mot de passe local)
   ============================================================ */
function initAdminPage() {
  if (sessionStorage.getItem("lexiprof_admin_unlocked") === "1") {
    unlockAdminUI();
  }
}

function checkAdminPasswordPage() {
  const input = document.getElementById("pwdInput");
  const error = document.getElementById("pwdError");
  if (!input) return;
  if (input.value === getAdminPassword()) {
    sessionStorage.setItem("lexiprof_admin_unlocked", "1");
    unlockAdminUI();
  } else {
    if (error) error.textContent = "Mot de passe incorrect.";
    input.classList.add("error");
    input.value = "";
    setTimeout(() => input.classList.remove("error"), 400);
  }
}

function unlockAdminUI() {
  const gate = document.getElementById("pwdGate");
  const content = document.getElementById("adminContent");
  if (gate) gate.style.display = "none";
  if (content) content.style.display = "block";
  initAdminData();
}

function lockAdmin() {
  sessionStorage.removeItem("lexiprof_admin_unlocked");
  const content = document.getElementById("adminContent");
  const gate = document.getElementById("pwdGate");
  if (content) content.style.display = "none";
  if (gate) gate.style.display = "block";
  const input = document.getElementById("pwdInput");
  if (input) input.value = "";
}

async function initAdminData() {
  try {
    clearCache("defs");
    await loadRemote();
  } catch (e) { console.error(e); }
  renderAdminList();
  await loadProposalsList();
}

/* ============================================================
   ADMIN — LISTE DES DÉFINITIONS
   ============================================================ */
function renderAdminList() {
  const list = document.getElementById("adminList");
  const count = document.getElementById("adminCount");
  if (!list) return;
  if (count) count.textContent = definitions.length;

  const sorted = [...definitions].sort((a, b) => a.term.localeCompare(b.term, "fr"));

  if (!sorted.length) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0;">Aucune définition.</p>`;
    return;
  }

  list.innerHTML = sorted.map(d => `
    <div class="admin-item">
      <div>
        <div class="admin-item-term">${escapeHTML(d.term)}</div>
        <div class="admin-item-meta">${escapeHTML(d.matiere)}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="editDefinition(${d.id})" title="Modifier">✎</button>
        <button class="btn-del" onclick="deleteDefinition(${d.id})" title="Supprimer">✕</button>
      </div>
    </div>
  `).join("");
}

function handleFormAction() {
  if (editingDefinitionId) saveEditedDefinition();
  else addDefinition();
}

function cancelEdit() {
  editingDefinitionId = null;
  clearDefinitionForm();
  const btnFormAction = document.getElementById("btnFormAction");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const formTitle = document.getElementById("formTitle");
  if (btnFormAction) btnFormAction.textContent = "+ Ajouter la définition";
  if (btnCancelEdit) btnCancelEdit.style.display = "none";
  if (formTitle) formTitle.textContent = "Ajouter une définition";
}

async function addDefinition() {
  const term = document.getElementById("formTerm")?.value.trim();
  const matiere = document.getElementById("formMatiere")?.value;
  const def = document.getElementById("formDef")?.value.trim();

  if (!term || !def) { showToast("⚠️ Remplis le terme et la définition !"); return; }

  const duplicate = definitions.find(d => d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere);
  if (duplicate) { showToast("⚠️ Ce terme existe déjà."); return; }

  const example = document.getElementById("formExample")?.value.trim() || "";
  const remember = document.getElementById("formRemember")?.value.trim() || "";

  const newDef = normalizeDefinition({ id: nextId(), term, matiere, def, example, remember });
  definitions.push(newDef);

  try {
    showToast("⏳ Sauvegarde...");
    await saveDefinitionsRemote();
    renderAdminList();
    clearDefinitionForm();
    showToast("✅ Définition ajoutée !");
  } catch (error) {
    definitions = definitions.filter(d => d.id !== newDef.id);
    showToast("⚠️ " + (error.message || "Erreur de sauvegarde."));
  }
}

function clearDefinitionForm() {
  ["formTerm", "formDef", "formExample", "formRemember"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const matiere = document.getElementById("formMatiere");
  if (matiere) matiere.value = "Management";
}

function editDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  const term = document.getElementById("formTerm");
  const matiere = document.getElementById("formMatiere");
  const def = document.getElementById("formDef");
  const example = document.getElementById("formExample");
  const remember = document.getElementById("formRemember");
  if (term) term.value = d.term;
  if (matiere) matiere.value = d.matiere;
  if (def) def.value = d.def;
  if (example) example.value = d.example || "";
  if (remember) remember.value = d.remember || "";

  editingDefinitionId = Number(id);

  const btnFormAction = document.getElementById("btnFormAction");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const formTitle = document.getElementById("formTitle");
  if (btnFormAction) btnFormAction.textContent = "💾 Enregistrer les modifications";
  if (btnCancelEdit) btnCancelEdit.style.display = "block";
  if (formTitle) formTitle.textContent = "Modifier la définition";

  showToast("✏️ Modification en cours");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveEditedDefinition() {
  const id = editingDefinitionId;
  if (!id) { await addDefinition(); return; }

  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  const backup = { ...d };
  d.term = document.getElementById("formTerm")?.value.trim();
  d.matiere = document.getElementById("formMatiere")?.value;
  d.def = document.getElementById("formDef")?.value.trim();
  d.example = document.getElementById("formExample")?.value.trim() || "";
  d.remember = document.getElementById("formRemember")?.value.trim() || "";

  try {
    await saveDefinitionsRemote();
    editingDefinitionId = null;
    clearDefinitionForm();
    const btnFormAction = document.getElementById("btnFormAction");
    const btnCancelEdit = document.getElementById("btnCancelEdit");
    const formTitle = document.getElementById("formTitle");
    if (btnFormAction) btnFormAction.textContent = "+ Ajouter la définition";
    if (btnCancelEdit) btnCancelEdit.style.display = "none";
    if (formTitle) formTitle.textContent = "Ajouter une définition";
    renderAdminList();
    showToast("✅ Définition modifiée !");
  } catch (e) {
    Object.assign(d, backup);
    showToast("⚠️ " + (e.message || "Erreur de sauvegarde."));
  }
}

async function deleteDefinition(id) {
  if (!confirm("Supprimer cette définition ?")) return;

  const backup = [...definitions];
  definitions = definitions.filter(d => Number(d.id) !== Number(id));

  try {
    await saveDefinitionsRemote();
    renderAdminList();
    showToast("🗑 Définition supprimée.");
  } catch (error) {
    definitions = backup;
    showToast("⚠️ Erreur de sauvegarde.");
  }
}

async function deleteAllDefinitions() {
  if (!definitions.length) { showToast("⚠️ Aucune définition à supprimer."); return; }

  const confirmation = prompt(
    `⚠️ Ceci va supprimer DÉFINITIVEMENT les ${definitions.length} définitions du site.\nTape SUPPRIMER (en majuscules) pour confirmer.`
  );
  if (confirmation !== "SUPPRIMER") {
    showToast("❌ Suppression annulée.");
    return;
  }

  const backup = [...definitions];
  definitions = [];

  try {
    await saveDefinitionsRemote();
    renderAdminList();
    showToast("🗑 Toutes les définitions ont été supprimées.");
  } catch (e) {
    definitions = backup;
    showToast("⚠️ Erreur de sauvegarde : " + (e.message || "réessaie."));
  }
}

/* ============================================================
   ADMIN — MOT DE PASSE
   ============================================================ */
function toggleChangePwd() {
  document.getElementById("changePwdForm")?.classList.toggle("open");
}

function changePassword() {
  const p1 = document.getElementById("newPwd1")?.value;
  const p2 = document.getElementById("newPwd2")?.value;

  if (!p1 || p1.length < 4) { showToast("⚠️ Minimum 4 caractères."); return; }
  if (p1 !== p2) { showToast("⚠️ Les mots de passe ne correspondent pas."); return; }

  setAdminPassword(p1);
  document.getElementById("newPwd1").value = "";
  document.getElementById("newPwd2").value = "";
  document.getElementById("changePwdForm")?.classList.remove("open");
  showToast("🔑 Mot de passe mis à jour !");
}

/* ============================================================
   ADMIN — IMPORT / EXPORT JSON
   ============================================================ */
function importJson() {
  const input = document.getElementById("jsonImport");
  if (!input || !input.files || !input.files[0]) { showToast("⚠️ Sélectionne un fichier JSON."); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const parsed = JSON.parse(e.target.result);
      await processImport(parsed);
    } catch (error) {
      showToast("❌ JSON invalide.");
    }
  };
  reader.readAsText(input.files[0]);
  input.value = "";
}

function handleJSONImport() {
  const textarea = document.getElementById("jsonPaste");
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) { showToast("⚠️ Colle d'abord ton JSON."); return; }
  try {
    const parsed = JSON.parse(text);
    processImport(parsed).then(() => { textarea.value = ""; });
  } catch (error) {
    showToast("❌ JSON invalide ou mauvais format.");
  }
}

async function processImport(parsed) {
  const imported = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.definitions) ? parsed.definitions : []);
  if (!imported.length) { showToast("⚠️ Aucune définition trouvée."); return; }

  const backup = [...definitions];
  let maxId = definitions.length ? Math.max(...definitions.map(d => Number(d.id) || 0)) : 0;
  imported.forEach((d) => {
    maxId += 1;
    definitions.push(normalizeDefinition({ ...d, id: maxId }));
  });

  try {
    await saveDefinitionsRemote();
    renderAdminList();
    showToast(`✅ ${imported.length} définition(s) importée(s)`);
  } catch (e) {
    definitions = backup;
    showToast("⚠️ " + (e.message || "Erreur d'import."));
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(definitions, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lexiprof-definitions.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("📦 JSON exporté !");
}

/* ============================================================
   ADMIN — PROPOSITIONS EN ATTENTE
   ============================================================ */
async function loadProposalsList() {
  try {
    proposalsCache = await fetchProposalsRemote();
  } catch (e) {
    proposalsCache = [];
    console.warn("Propositions indisponibles:", e.message);
  }
  renderProposalsList();
}

function renderProposalsList() {
  const list = document.getElementById("proposalsList");
  const badge = document.getElementById("proposalsCount");
  if (!list) return;

  const pending = proposalsCache.filter(p => p.status === "pending");

  if (badge) {
    if (pending.length) {
      badge.style.display = "inline-flex";
      badge.textContent = pending.length;
    } else {
      badge.style.display = "none";
    }
  }

  if (!pending.length) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0;">Aucune proposition en attente.</p>`;
    return;
  }

  list.innerHTML = pending.map(p => `
    <div class="admin-item" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <div>
          <div class="admin-item-term">${escapeHTML(p.term)}</div>
          <div class="admin-item-meta">${escapeHTML(p.matiere)}${p.pseudo ? " · " + escapeHTML(p.pseudo) : ""}</div>
        </div>
        <div class="admin-item-actions">
          <button class="btn-approve" onclick="approveProposal(${p.id})" title="Approuver">✓</button>
          <button class="btn-reject" onclick="rejectProposal(${p.id})" title="Refuser">✕</button>
        </div>
      </div>
      <p class="proposal-item-def">${escapeHTML(p.def)}</p>
    </div>
  `).join("");
}

async function approveProposal(id) {
  const p = proposalsCache.find(x => Number(x.id) === Number(id));
  if (!p) return;

  const newDef = normalizeDefinition({
    id: nextId(), term: p.term, matiere: p.matiere, def: p.def, example: p.example || "", remember: p.remember || ""
  });
  definitions.push(newDef);

  const backupProposals = [...proposalsCache];
  try {
    await saveDefinitionsRemote();
    proposalsCache = proposalsCache.filter(x => Number(x.id) !== Number(id));
    await saveProposalsRemote(proposalsCache);
    renderAdminList();
    renderProposalsList();
    showToast("✅ Définition ajoutée !");
  } catch (e) {
    definitions = definitions.filter(d => d.id !== newDef.id);
    proposalsCache = backupProposals;
    showToast("⚠️ " + (e.message || "Erreur."));
  }
}

async function rejectProposal(id) {
  const backup = [...proposalsCache];
  proposalsCache = proposalsCache.filter(x => Number(x.id) !== Number(id));
  try {
    await saveProposalsRemote(proposalsCache);
    renderProposalsList();
    showToast("🗑 Proposition refusée.");
  } catch (e) {
    proposalsCache = backup;
    showToast("⚠️ Erreur de sauvegarde.");
  }
}

/* ============================================================
   PAGE PROPOSER (propose.html)
   ============================================================ */
async function handleProposalSubmit() {
  const honeypot = document.getElementById("pWebsite")?.value;
  if (honeypot) {
    showProposalSuccess();
    return;
  }

  const term = document.getElementById("pTerm")?.value.trim();
  const matiere = document.getElementById("pMatiere")?.value;
  const def = document.getElementById("pDef")?.value.trim();

  if (!term || !def) { showToast("⚠️ Remplis au moins le terme et la définition."); return; }

  const proposal = {
    term, matiere, def,
    example: document.getElementById("pExample")?.value.trim() || "",
    remember: document.getElementById("pRemember")?.value.trim() || "",
    pseudo: document.getElementById("pPseudo")?.value.trim() || "",
    email: document.getElementById("pEmail")?.value.trim() || ""
  };

  try {
    showToast("⏳ Envoi...");
    await submitProposalRemote(proposal);
    showProposalSuccess();
  } catch (e) {
    showToast("⚠️ " + (e.message || "Erreur d'envoi."));
  }
}

function showProposalSuccess() {
  const formSection = document.getElementById("proposeFormSection");
  const successSection = document.getElementById("proposeSuccessSection");
  if (formSection) formSection.style.display = "none";
  if (successSection) successSection.style.display = "block";
}

function resetProposalForm() {
  ["pTerm", "pDef", "pExample", "pRemember", "pPseudo", "pEmail", "pWebsite"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const matiere = document.getElementById("pMatiere");
  if (matiere) matiere.value = "Management";
  const successSection = document.getElementById("proposeSuccessSection");
  const formSection = document.getElementById("proposeFormSection");
  if (successSection) successSection.style.display = "none";
  if (formSection) formSection.style.display = "block";
}

/* ============================================================
   FLASHCARDS
   ============================================================ */
function openFlashcards() {
  flashcardList = getFilteredDefinitions();
  if (!flashcardList.length) { showToast("⚠️ Aucune définition disponible."); return; }
  currentFlashcardIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  const d = flashcardList[currentFlashcardIndex];
  if (!d) return;
  const overlay = document.getElementById("flashcardOverlay");
  if (!overlay) return;

  const meta = document.getElementById("flashcardMeta");
  const term = document.getElementById("flashcardTerm");
  const def = document.getElementById("flashcardDef");
  const counter = document.getElementById("flashcardCounter");
  const reveal = document.getElementById("flashcardReveal");
  if (meta) meta.textContent = d.matiere;
  if (term) term.textContent = d.term;
  if (def) { def.textContent = d.def; def.style.display = "none"; }
  if (counter) counter.textContent = `${currentFlashcardIndex + 1} / ${flashcardList.length}`;
  if (reveal) { reveal.style.display = "block"; reveal.textContent = "Cliquez pour révéler"; }

  overlay.classList.add("open");
}

function revealFlashcard() {
  const def = document.getElementById("flashcardDef");
  const reveal = document.getElementById("flashcardReveal");
  if (!def || !reveal) return;
  const hidden = def.style.display === "none";
  def.style.display = hidden ? "block" : "none";
  reveal.textContent = hidden ? "Cliquez pour masquer" : "Cliquez pour révéler";
}

function nextFlashcard() {
  if (!flashcardList.length) return;
  currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardList.length;
  renderFlashcard();
}

function prevFlashcard() {
  if (!flashcardList.length) return;
  currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcardList.length) % flashcardList.length;
  renderFlashcard();
}

function closeFlashcard(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById("flashcardOverlay")?.classList.remove("open");
}

/* ============================================================
   DÉFINITION ALÉATOIRE
   ============================================================ */
function showRandomDefinition() {
  if (!definitions.length) { showToast("⚠️ Aucune définition."); return; }
  const modal = document.getElementById("randomModal");
  if (!modal) return;

  const d = definitions[Math.floor(Math.random() * definitions.length)];
  currentRandomId = d.id;

  const matiere = document.getElementById("randomMatiere");
  const term = document.getElementById("randomTerm");
  const def = document.getElementById("randomDef");
  if (matiere) matiere.textContent = d.matiere;
  if (term) term.textContent = d.term;
  if (def) def.textContent = d.def;

  modal.classList.add("open");
}

function openRandomDefinition() {
  closeRandomModal();
  if (!currentRandomId) return;
  const d = definitions.find(x => Number(x.id) === Number(currentRandomId));
  if (!d) return;
  revealDefinitionCard(d.id, d.term);
}

function revealDefinitionCard(id, term) {
  let card = document.querySelector(`.card[data-id="${id}"]`);
  if (!card) {
    currentFilter = "all";
    searchQuery = term;
    const input = document.getElementById("searchInput");
    if (input) input.value = term;
    updateSearchClear();
    displayedCount = 0;
    render();
    card = document.querySelector(`.card[data-id="${id}"]`);
  }
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    const btn = card.querySelector(".open-card-btn");
    if (btn) toggleCard(id, btn);
  }
}

function closeRandomModal() {
  document.getElementById("randomModal")?.classList.remove("open");
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ============================================================
   RACCOURCIS CLAVIER
   ============================================================ */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    const tag = document.activeElement.tagName;
    const focusOpen = document.getElementById("focusOverlay")?.classList.contains("open");

    if (focusOpen) {
      if (e.key === "ArrowRight") { e.preventDefault(); focusNext(); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); focusPrev(); return; }
      if (e.key === "Escape") { closeFocusMode(); return; }
      return;
    }

    if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
      e.preventDefault();
      document.getElementById("searchInput")?.focus();
    }
    if (e.key.toLowerCase() === "r" && tag !== "INPUT" && tag !== "TEXTAREA") {
      e.preventDefault();
      showRandomDefinition();
    }
    if (e.key === "Escape") {
      closeFlashcard();
      closeRandomModal();
      closeAuthModal();
      if (isDropdownOpen) {
        isDropdownOpen = false;
        document.getElementById("filterDropdownMenu")?.classList.remove("open");
        document.getElementById("filterDropdownBtn")?.classList.remove("open");
      }
    }
  });
}

/* ============================================================
   SCROLL EFFECTS
   ============================================================ */
function initScrollEffects() {
  const scrollTopBtn = document.getElementById("scrollTop");
  const progress = document.getElementById("readingProgress");
  if (!scrollTopBtn && !progress) return;

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;
    if (scrollTopBtn) scrollTopBtn.classList.toggle("visible", scroll > 400);
    if (progress) {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = height > 0 ? (scroll / height) * 100 : 0;
      progress.style.width = `${percentage}%`;
    }
  }, { passive: true });
}

/* ============================================================
   INSTALLATION PWA
   ============================================================ */
function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById("installAppBtn")?.classList.add("visible");
  });
  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) installBtn.addEventListener("click", installApp);
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast("ℹ️ Utilise le menu Partager de ton navigateur pour ajouter LexiProf.");
    return;
  }
  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  if (result.outcome === "accepted") showToast("✅ LexiProf ajouté à l'écran d'accueil !");
  deferredInstallPrompt = null;
  document.getElementById("installAppBtn")?.classList.remove("visible");
}

/* ============================================================
   BIENVENUE
   ============================================================ */
function closeWelcome() {
  document.getElementById("welcomeBanner")?.classList.remove("show");
  localStorage.setItem(WELCOME_SEEN_KEY, "true");
}

function initWelcome() {
  const banner = document.getElementById("welcomeBanner");
  if (!banner) return;
  if (localStorage.getItem(WELCOME_SEEN_KEY)) return;
  setTimeout(() => banner.classList.add("show"), 800);
  setTimeout(() => banner.classList.remove("show"), 6000);
}

/* ============================================================
   HERO ANIMÉ
   ============================================================ */
function initHeroAnimation() {
  const heroTitle = document.getElementById("heroTitle");
  if (!heroTitle) return;
  const text = "Dictionnaire STMG";
  heroTitle.innerHTML = "";
  text.split("").forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.animationDelay = `${i * 0.05}s`;
    span.className = "hero-letter";
    heroTitle.appendChild(span);
  });
}

/* ============================================================
   EASTER EGG KONAMI
   ============================================================ */
function initKonamiCode() {
  const konamiSequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiIndex = 0;
  let konamiActive = false;

  document.addEventListener("keydown", e => {
    if (konamiActive && e.key === "Escape") { deactivateKonami(); return; }
    if (e.key === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) { activateKonami(); konamiIndex = 0; }
    } else {
      konamiIndex = 0;
    }
  });

  function activateKonami() {
    konamiActive = true;
    document.body.classList.add("retro-mode");
    showToast("🎮 MODE RETRO ACTIVÉ ! Appuie sur ESC pour quitter");
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  }

  function deactivateKonami() {
    konamiActive = false;
    document.body.classList.remove("retro-mode");
    showToast("🎮 Mode retro désactivé");
  }
}

/* ============================================================
   EVENT LISTENERS COMMUNS
   ============================================================ */
function initEventListeners() {
  document.getElementById("btnFlashcard")?.addEventListener("click", openFlashcards);
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  document.getElementById("btnFocusMode")?.addEventListener("click", toggleFocusMode);

  const randomModal = document.getElementById("randomModal");
  if (randomModal) {
    randomModal.addEventListener("click", e => { if (e.target === randomModal) closeRandomModal(); });
  }
}

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeroAnimation();
  initKonamiCode();
  initKeyboardShortcuts();
  initScrollEffects();
  initInstallPrompt();
  initWelcome();
  initEventListeners();
  renderSearchHistory();

  if (document.getElementById("cardsContainer")) {
    loadAndRenderApp();
    checkHash();
  } else {
    hideLoader();
  }

  if (document.getElementById("pwdGate")) {
    initAdminPage();
  }
});

console.log("📚 LexiProf v9 — app.js chargé");
