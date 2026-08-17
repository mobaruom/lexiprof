/* =========================================================
   LEXIPROF — APP.JS COMPLET
========================================================= */

/* =========================================================
   DONNÉES DE BASE
========================================================= */

const defaultData = [
  {
    id: 1,
    term: "Management",
    matiere: "Management",
    def: "Ensemble des techniques permettant de diriger, organiser et coordonner les ressources d'une organisation afin d'atteindre ses objectifs.",
    example: "Un manager organise le travail de son équipe, répartit les tâches et suit les résultats.",
    remember: "Le management consiste notamment à organiser, décider, coordonner et motiver.",
    qcm: {
      question: "Quel est l'objectif principal du management ?",
      answers: [
        { text: "Atteindre les objectifs de l'organisation", correct: true },
        { text: "Supprimer tous les salariés", correct: false },
        { text: "Éviter toute prise de décision", correct: false }
      ]
    }
  },
  {
    id: 2,
    term: "Leadership",
    matiere: "Management",
    def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs.",
    example: "Un responsable qui motive son équipe autour d'un projet fait preuve de leadership.",
    remember: "Leadership = influencer, guider et motiver."
  },
  {
    id: 3,
    term: "Organigramme",
    matiere: "Management",
    def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation.",
    example: "L'organigramme d'une entreprise permet de voir qui dépend de quel responsable.",
    remember: "Il permet de visualiser les relations hiérarchiques."
  },
  {
    id: 4,
    term: "Contrat de travail",
    matiere: "Droit",
    def: "Convention par laquelle une personne, le salarié, s'engage à travailler pour le compte et sous la direction d'un employeur en échange d'une rémunération.",
    example: "Un CDI signé entre une entreprise et un salarié constitue un contrat de travail.",
    remember: "Travail + rémunération + lien de subordination."
  },
  {
    id: 5,
    term: "Personne morale",
    matiere: "Droit",
    def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres.",
    example: "Une société ou une association peut être une personne morale.",
    remember: "Une personne morale possède une existence juridique propre."
  },
  {
    id: 6,
    term: "PIB",
    matiere: "Économie",
    def: "Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.",
    example: "Le PIB permet notamment de mesurer la production économique d'un pays.",
    remember: "PIB = valeur des biens et services produits sur un territoire."
  },
  {
    id: 7,
    term: "Inflation",
    matiere: "Économie",
    def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie.",
    example: "Lorsque les prix augmentent durablement, le pouvoir d'achat de la monnaie diminue.",
    remember: "Inflation = hausse générale et durable des prix."
  },
  {
    id: 8,
    term: "Recrutement",
    matiere: "RH",
    def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats afin de pourvoir un poste vacant.",
    example: "Une entreprise publie une offre d'emploi puis sélectionne les candidats.",
    remember: "Recruter = rechercher, sélectionner puis intégrer un candidat."
  },
  {
    id: 9,
    term: "GPEC",
    matiere: "RH",
    def: "Gestion Prévisionnelle des Emplois et des Compétences. Démarche permettant d'anticiper les besoins futurs d'une organisation en emplois et en compétences.",
    example: "Une entreprise peut prévoir des formations pour préparer ses salariés à de nouvelles compétences.",
    remember: "GPEC = anticiper les besoins futurs en emplois et compétences."
  }
];


/* =========================================================
   ÉTAT
========================================================= */

let definitions = [];
let currentFilter = "all";
let searchQuery = "";
let favorites = JSON.parse(localStorage.getItem("lexiprof_favorites") || "[]");
let currentFlashcardIndex = 0;
let flashcardList = [];
let deferredInstallPrompt = null;
let editingDefinitionId = null;
let searchHistory = JSON.parse(localStorage.getItem("lexiprof_search_history") || "[]");


/* =========================================================
   UTILITAIRES
========================================================= */

function nextId() {
  if (!definitions.length) return 1;
  return Math.max(...definitions.map(d => Number(d.id) || 0)) + 1;
}

function getPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
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
    id: Number(d.id) || nextId(),
    term: String(d.term || "").trim(),
    matiere: String(d.matiere || "Management").trim(),
    def: String(d.def || d.definition || "").trim(),
    example: String(d.example || "").trim(),
    remember: String(d.remember || "").trim(),
    qcm: normalizeQCM(d.qcm)
  };
}

function normalizeQCM(qcm) {
  if (!qcm) return null;
  const question = qcm.question || qcm.questionText || "";
  let answers = qcm.answers || qcm.choices || [];
  if (!Array.isArray(answers)) answers = [];

  answers = answers.map((a, index) => {
    if (typeof a === "string") {
      return { text: a, correct: index === Number(qcm.answer) };
    }
    return {
      text: String(a.text || a.choice || "").trim(),
      correct: Boolean(a.correct) || index === Number(qcm.answer)
    };
  }).filter(a => a.text);

  if (!question && !answers.length) return null;
  return { question: String(question).trim(), answers };
}

function highlight(text, q) {
  const safeText = escapeHTML(text);
  if (!q) return safeText;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeText.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}


/* =========================================================
   CHARGEMENT
========================================================= */

async function load() {
  setLoading(true);
  await loadRemote();
  render();
  setTimeout(() => {
    const loader = document.querySelector(".global-loader");
    if (loader) loader.classList.add("hidden");
  }, 300);
}

function setLoading(on) {
  const container = document.getElementById("cardsContainer");
  if (!container) return;
  if (on) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⏳</div>
        <h3>Chargement...</h3>
        <p>Récupération des définitions.</p>
      </div>
    `;
  }
}


/* =========================================================
   FILTRAGE
========================================================= */

function getFilteredDefinitions() {
  const q = searchQuery.toLowerCase().trim();
  let filtered = [...definitions];

  if (currentFilter === "favorites") {
    filtered = filtered.filter(d => favorites.includes(Number(d.id)));
  } else if (currentFilter !== "all") {
    filtered = filtered.filter(d => d.matiere === currentFilter);
  }

  if (q) {
    filtered = filtered.filter(d => {
      const term = d.term.toLowerCase();
      const def = d.def.toLowerCase();
      return term.includes(q) || def.includes(q);
    });
  }

  filtered.sort((a, b) => a.term.localeCompare(b.term, "fr"));
  return filtered;
}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function render() {
  const container = document.getElementById("cardsContainer");
  if (!container) return;

  const info = document.getElementById("resultsInfo");
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
    return;
  }

  container.innerHTML = filtered.map((d, index) => createCardHTML(d, index)).join("");
}


/* =========================================================
   CARTE
========================================================= */

function createCardHTML(d, index) {
  const isFavorite = favorites.includes(Number(d.id));
  return `
    <article class="card" data-id="${d.id}" style="animation-delay:${Math.min(index * 35, 350)}ms">
      <div class="card-top">
        <div class="card-term">${highlight(d.term, searchQuery)}</div>
        <span class="matiere-badge badge-${escapeHTML(d.matiere)}">${escapeHTML(d.matiere)}</span>
      </div>
      <div class="card-def">${highlight(d.def, searchQuery)}</div>
      <div style="display:flex;gap:7px;margin-top:14px;">
        <button class="open-card-btn" onclick="toggleCard(${d.id}, this)" style="flex:1">📖 Ouvrir la fiche</button>
        <button class="btn-icon favorite-card-btn" onclick="toggleFavorite(${d.id})" title="Favori" style="flex:0 0 42px;width:42px;height:42px;">
          ${isFavorite ? "★" : "☆"}
        </button>
      </div>
      <div class="card-extra" id="card-${d.id}">
        ${d.example ? `<div class="extra-block"><h4>💡 Exemple concret</h4><p>${escapeHTML(d.example)}</p></div>` : ""}
        ${d.remember ? `<div class="extra-block"><h4>📝 À retenir</h4><p>${escapeHTML(d.remember)}</p></div>` : ""}
        ${d.qcm ? createQCMHTML(d) : ""}
      </div>
    </article>
  `;
}

function toggleCard(id, button) {
  const extra = document.getElementById(`card-${id}`);
  if (!extra) return;
  const isOpen = extra.classList.contains("open");
  if (isOpen) {
    extra.classList.remove("open");
    button.innerHTML = "📖 Ouvrir la fiche";
  } else {
    extra.classList.add("open");
    button.innerHTML = "📕 Fermer la fiche";
  }
}


/* =========================================================
   QCM
========================================================= */

function createQCMHTML(d) {
  if (!d.qcm) return "";
  const answers = Array.isArray(d.qcm.answers) ? d.qcm.answers : [];
  if (!answers.length) return "";
  return `
    <div class="extra-block">
      <h4>❓ Mini QCM</h4>
      <p>${escapeHTML(d.qcm.question)}</p>
      <div class="qcm-container">
        ${answers.map((a, i) => `
          <button class="qcm-btn" onclick="answerQCM(this, ${Boolean(a.correct)}, ${d.id})">
            ${escapeHTML(a.text)}
          </button>
        `).join("")}
      </div>
      <div class="qcm-feedback" id="qcm-feedback-${d.id}"></div>
    </div>
  `;
}

function answerQCM(button, correct, id) {
  const card = button.closest(".extra-block");
  if (!card) return;
  const buttons = card.querySelectorAll(".qcm-btn");
  buttons.forEach(btn => btn.disabled = true);

  const feedback = document.getElementById(`qcm-feedback-${id}`);
  if (correct) {
    button.classList.add("correct");
    if (feedback) {
      feedback.textContent = "✅ Bonne réponse !";
      feedback.className = "qcm-feedback correct";
    }
    showToast("✅ Bonne réponse !");
  } else {
    button.classList.add("wrong");
    if (feedback) {
      feedback.textContent = "❌ Mauvaise réponse.";
      feedback.className = "qcm-feedback wrong";
    }
    showToast("❌ Mauvaise réponse");
  }
}


/* =========================================================
   RECHERCHE
========================================================= */

function onSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  searchQuery = input.value;
  updateSearchClear();
  addToSearchHistory(searchQuery);
  render();
}

function clearSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.value = "";
  searchQuery = "";
  updateSearchClear();
  render();
  input.focus();
}

function updateSearchClear() {
  const button = document.querySelector(".search-clear");
  if (!button) return;
  button.classList.toggle("visible", Boolean(searchQuery));
}

function addToSearchHistory(query) {
  if (!query || query.length < 2) return;
  searchHistory = searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
  searchHistory.unshift(query);
  if (searchHistory.length > 5) searchHistory.pop();
  localStorage.setItem("lexiprof_search_history", JSON.stringify(searchHistory));
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
    <button onclick="setSearchQuery('${escapeHTML(q)}')">${escapeHTML(q)}</button>
  `).join("");
}

function setSearchQuery(q) {
  const input = document.getElementById("searchInput");
  if (input) input.value = q;
  searchQuery = q;
  updateSearchClear();
  render();
}


/* =========================================================
   FILTRES
========================================================= */

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  render();
}


/* =========================================================
   FAVORIS
========================================================= */

function toggleFavorite(id) {
  id = Number(id);
  if (favorites.includes(id)) {
    favorites = favorites.filter(x => x !== id);
    showToast("☆ Retiré des favoris");
  } else {
    favorites.push(id);
    showToast("★ Ajouté aux favoris");
  }
  localStorage.setItem("lexiprof_favorites", JSON.stringify(favorites));
  render();
}

function showFavorites() {
  currentFilter = "favorites";
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  const favoriteButton = document.querySelector('[data-filter="favorites"]');
  if (favoriteButton) favoriteButton.classList.add("active");
  render();
}

function updateCounter() {
  const counter = document.querySelector(".definition-counter");
  if (!counter) return;
  counter.textContent = `${definitions.length} définition${definitions.length !== 1 ? "s" : ""} disponible${definitions.length !== 1 ? "s" : ""}`;
}


/* =========================================================
   MODE SOMBRE
========================================================= */

function initTheme() {
  const saved = localStorage.getItem("lexiprof_theme");
  if (saved === "dark") document.body.classList.add("dark");
  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("lexiprof_theme", dark ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  const button = document.getElementById("themeToggle");
  if (!button) return;
  const dark = document.body.classList.contains("dark");
  button.innerHTML = dark ? "☀️" : "🌙";
  button.title = dark ? "Mode clair" : "Mode sombre";
}
/* =========================================================
   AUTHENTIFICATION ADMIN
========================================================= */

function openAdmin() {
  const input = document.getElementById("pwdInput");
  const error = document.getElementById("pwdError");
  const overlay = document.getElementById("pwdOverlay");
  if (!overlay) return;

  if (input) {
    input.value = "";
    input.classList.remove("error");
  }
  if (error) error.textContent = "";
  overlay.classList.add("open");
  setTimeout(() => { if (input) input.focus(); }, 150);
}

function closePwdModal() {
  const overlay = document.getElementById("pwdOverlay");
  if (overlay) overlay.classList.remove("open");
}

function checkPassword() {
  const input = document.getElementById("pwdInput");
  const error = document.getElementById("pwdError");
  if (!input) return;

  if (input.value === getPassword()) {
    closePwdModal();
    openAdminPanel();
  } else {
    if (error) error.textContent = "Mot de passe incorrect.";
    input.classList.add("error");
    input.value = "";
    setTimeout(() => input.classList.remove("error"), 400);
  }
}


/* =========================================================
   ADMIN PANEL
========================================================= */

function openAdminPanel() {
  renderAdminList();
  const changePwd = document.getElementById("changePwdForm");
  if (changePwd) changePwd.classList.remove("open");

  const overlay = document.getElementById("overlay");
  if (overlay) overlay.classList.add("open");
}

function closeAdmin() {
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.classList.remove("open");
}

function handleOverlayClick(e) {
  const overlay = document.getElementById("overlay");
  if (overlay && e.target === overlay) closeAdmin();
}


/* =========================================================
   LISTE ADMIN
========================================================= */

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


/* =========================================================
   FORMULAIRE : AJOUT / MODIFICATION
========================================================= */

function handleFormAction() {
  if (editingDefinitionId) {
    saveEditedDefinition();
  } else {
    addDefinition();
  }
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

  if (!term || !def) {
    showToast("⚠️ Remplis le terme et la définition !");
    return;
  }

  const duplicate = definitions.find(d => d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere);
  if (duplicate) {
    showToast("⚠️ Ce terme existe déjà.");
    return;
  }

  const example = document.getElementById("formExample")?.value.trim() || "";
  const remember = document.getElementById("formRemember")?.value.trim() || "";

  definitions.push({
    id: nextId(),
    term,
    matiere,
    def,
    example,
    remember,
    qcm: null
  });

  showToast("⏳ Sauvegarde...");
  try {
    await saveRemote();
    render();
    renderAdminList();
    clearDefinitionForm();
    showToast("✅ Définition ajoutée !");
  } catch (error) {
    console.error(error);
    showToast("⚠️ Erreur de sauvegarde.");
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

  const admin = document.querySelector(".admin-panel");
  if (admin) admin.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveEditedDefinition() {
  const id = editingDefinitionId;
  if (!id) {
    await addDefinition();
    return;
  }

  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  d.term = document.getElementById("formTerm")?.value.trim();
  d.matiere = document.getElementById("formMatiere")?.value;
  d.def = document.getElementById("formDef")?.value.trim();
  d.example = document.getElementById("formExample")?.value.trim() || "";
  d.remember = document.getElementById("formRemember")?.value.trim() || "";

  await saveRemote();

  editingDefinitionId = null;
  clearDefinitionForm();

  const btnFormAction = document.getElementById("btnFormAction");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const formTitle = document.getElementById("formTitle");

  if (btnFormAction) btnFormAction.textContent = "+ Ajouter la définition";
  if (btnCancelEdit) btnCancelEdit.style.display = "none";
  if (formTitle) formTitle.textContent = "Ajouter une définition";

  render();
  renderAdminList();
  showToast("✅ Définition modifiée !");
}


/* =========================================================
   SUPPRESSION
========================================================= */

async function deleteDefinition(id) {
  if (!confirm("Supprimer cette définition ?")) return;

  definitions = definitions.filter(d => Number(d.id) !== Number(id));
  favorites = favorites.filter(x => Number(x) !== Number(id));
  localStorage.setItem("lexiprof_favorites", JSON.stringify(favorites));

  try {
    await saveRemote();
    render();
    renderAdminList();
    showToast("🗑 Définition supprimée.");
  } catch (error) {
    console.error(error);
    showToast("⚠️ Erreur de sauvegarde.");
  }
}


/* =========================================================
   MOT DE PASSE
========================================================= */

function toggleChangePwd() {
  const form = document.getElementById("changePwdForm");
  if (form) form.classList.toggle("open");
}

function changePassword() {
  const p1 = document.getElementById("newPwd1")?.value;
  const p2 = document.getElementById("newPwd2")?.value;

  if (!p1 || p1.length < 4) {
    showToast("⚠️ Minimum 4 caractères.");
    return;
  }
  if (p1 !== p2) {
    showToast("⚠️ Les mots de passe ne correspondent pas.");
    return;
  }

  localStorage.setItem(PWD_KEY, p1);
  document.getElementById("newPwd1").value = "";
  document.getElementById("newPwd2").value = "";
  document.getElementById("changePwdForm")?.classList.remove("open");
  showToast("🔑 Mot de passe mis à jour !");
}


/* =========================================================
   IMPORT / EXPORT JSON
========================================================= */

function importJson() {
  const input = document.getElementById("jsonImport");
  if (!input || !input.files || !input.files[0]) {
    showToast("⚠️ Sélectionne un fichier JSON.");
    return;
  }
  handleJSONImportFile(input.files[0]);
  input.value = "";
}

function handleJSONImportFile(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const parsed = JSON.parse(e.target.result);
      await processImport(parsed);
    } catch (error) {
      console.error(error);
      showToast("❌ JSON invalide.");
    }
  };
  reader.readAsText(file);
}

function handleJSONImport() {
  const textarea = document.getElementById("jsonPaste");
  if (!textarea) return;
  const text = textarea.value.trim();
  if (!text) {
    showToast("⚠️ Colle d'abord ton JSON.");
    return;
  }
  try {
    const parsed = JSON.parse(text);
    processImport(parsed).then(() => {
      textarea.value = "";
    });
  } catch (error) {
    console.error(error);
    showToast("❌ JSON invalide ou mauvais format.");
  }
}

async function processImport(parsed) {
  const imported = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.definitions) ? parsed.definitions : []);
  if (!imported.length) throw new Error("Aucune définition trouvée.");

  let added = 0;
  imported.forEach(raw => {
    const d = normalizeDefinition(raw);
    if (!d.term || !d.def) return;

    const exists = definitions.some(existing =>
      existing.term.toLowerCase() === d.term.toLowerCase() &&
      existing.matiere === d.matiere
    );
    if (exists) return;

    d.id = nextId();
    definitions.push(d);
    added++;
  });

  await saveRemote();
  render();
  renderAdminList();
  showToast(`✅ ${added} définition${added !== 1 ? "s" : ""} importée${added !== 1 ? "s" : ""}`);
}

function exportJson() {
  const data = JSON.stringify(definitions, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lexiprof-definitions.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("📦 JSON exporté !");
}
/* =========================================================
   FLASHCARDS
========================================================= */

function openFlashcards() {
  flashcardList = getFilteredDefinitions();
  if (!flashcardList.length) {
    showToast("⚠️ Aucune définition disponible.");
    return;
  }
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
  if (def) {
    def.textContent = d.def;
    def.style.display = "none";
  }
  if (counter) counter.textContent = `${currentFlashcardIndex + 1} / ${flashcardList.length}`;
  if (reveal) {
    reveal.style.display = "block";
    reveal.textContent = "Cliquez pour révéler";
  }

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
  const overlay = document.getElementById("flashcardOverlay");
  if (overlay) overlay.classList.remove("open");
}


/* =========================================================
   DÉFINITION ALÉATOIRE
========================================================= */

let currentRandomId = null;

function showRandomDefinition() {
  if (!definitions.length) {
    showToast("⚠️ Aucune définition.");
    return;
  }

  const d = definitions[Math.floor(Math.random() * definitions.length)];
  currentRandomId = d.id;

  const modal = document.getElementById("randomModal");
  if (!modal) return;

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
  if (currentRandomId) {
    const card = document.querySelector(`.card[data-id="${currentRandomId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      const btn = card.querySelector(".open-card-btn");
      if (btn) toggleCard(currentRandomId, btn);
    }
  }
}

function closeRandomModal() {
  const modal = document.getElementById("randomModal");
  if (modal) modal.classList.remove("open");
}


/* =========================================================
   TOAST
========================================================= */

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
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* =========================================================
   RACCOURCIS CLAVIER
========================================================= */

function initKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      document.getElementById("searchInput")?.focus();
    }

    if (e.key.toLowerCase() === "r" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      showRandomDefinition();
    }

    if (e.key === "Escape") {
      closePwdModal();
      closeAdmin();
      closeFlashcard();
      closeRandomModal();
    }
  });
}


/* =========================================================
   SCROLL EFFECTS
========================================================= */

function initScrollEffects() {
  const scrollTop = document.getElementById("scrollTop");
  const progress = document.getElementById("readingProgress");

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;

    if (scrollTop) {
      scrollTop.classList.toggle("visible", scroll > 400);
    }

    if (progress) {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = height > 0 ? (scroll / height) * 100 : 0;
      progress.style.width = `${percentage}%`;
    }
  }, { passive: true });
}


/* =========================================================
   INSTALLATION PWA
========================================================= */

function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstallPrompt = e;

    const button = document.getElementById("installAppBtn");
    if (button) button.classList.add("visible");
  });

  const installBtn = document.getElementById("installAppBtn");
  if (installBtn) {
    installBtn.addEventListener("click", installApp);
  }
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast("ℹ️ Utilise le menu Partager de ton navigateur pour ajouter LexiProf.");
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === "accepted") {
    showToast("✅ LexiProf ajouté à l'écran d'accueil !");
  }

  deferredInstallPrompt = null;
  const button = document.getElementById("installAppBtn");
  if (button) button.classList.remove("visible");
}


/* =========================================================
   BIENVENUE
========================================================= */

function closeWelcome() {
  const banner = document.getElementById("welcomeBanner");
  if (banner) banner.classList.remove("show");
  localStorage.setItem("lexiprof_welcome_seen", "true");
}

function initWelcome() {
  if (localStorage.getItem("lexiprof_welcome_seen")) return;
  const banner = document.getElementById("welcomeBanner");
  if (banner) {
    setTimeout(() => banner.classList.add("show"), 800);
    setTimeout(() => banner.classList.remove("show"), 6000);
  }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initEventListeners() {
  // Bouton flashcard header
  const btnFlashcard = document.getElementById("btnFlashcard");
  if (btnFlashcard) btnFlashcard.addEventListener("click", openFlashcards);

  // Bouton thème
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  // Bouton aléatoire
  const randomBtn = document.getElementById("randomDefBtn");
  if (randomBtn) randomBtn.addEventListener("click", showRandomDefinition);

  // Bouton scroll aux cartes
  const scrollCardsBtn = document.getElementById("scrollCardsBtn");
  if (scrollCardsBtn) {
    scrollCardsBtn.addEventListener("click", () => {
      document.getElementById("cardsContainer")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Fermeture random modal par clic extérieur
  const randomModal = document.getElementById("randomModal");
  if (randomModal) {
    randomModal.addEventListener("click", e => {
      if (e.target === randomModal) closeRandomModal();
    });
  }
}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  load();
  initKeyboardShortcuts();
  initScrollEffects();
  initInstallPrompt();
  initWelcome();
  initEventListeners();
  renderSearchHistory();
});


/* =========================================================
   FIN
========================================================= */

console.log("📚 LexiProf — app.js chargé");
